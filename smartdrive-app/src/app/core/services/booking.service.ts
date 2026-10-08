import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Booking, BookingDraft } from '../models/booking.model';
import { DemoTrackingService } from './demo-tracking.service';

const INSURANCE_FEE = 500;
const PWD_SENIOR_DISCOUNT_RATE = 0.2;
const NEW_MEMBER_DISCOUNT_RATE = 0.15;

export interface PricingBreakdown {
  subtotal: number;
  insurance: number;
  discount: number;
  discountLabel: string;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  /** Carries the in-progress booking across the dates -> details -> payment -> confirmation steps. */
  readonly draft = signal<BookingDraft | null>(this.readStoredDraft());

  constructor(
    private readonly supabase: SupabaseService,
    private readonly demoTracking: DemoTrackingService,
  ) {}

  startDraft(vehicle: BookingDraft['vehicle'], pickupDate: string, returnDate: string, pickupLocation: string): void {
    const rentalDays = this.daysBetween(pickupDate, returnDate);
    this.setDraft({ vehicle, pickupDate, returnDate, rentalDays, pickupLocation });
  }

  updateCustomer(customer: BookingDraft['customer']): void {
    const current = this.draft();
    if (!current) return;
    this.setDraft({ ...current, customer });
  }

  clearDraft(): void {
    this.draft.set(null);
    sessionStorage.removeItem('bookingData');
  }

  updateDraft(updater: (draft: BookingDraft) => BookingDraft): void {
    const current = this.draft();
    if (current) this.setDraft(updater(current));
  }

  private readStoredDraft(): BookingDraft | null {
    try {
      const stored = sessionStorage.getItem('bookingData');
      return stored ? (JSON.parse(stored) as BookingDraft) : null;
    } catch {
      sessionStorage.removeItem('bookingData');
      return null;
    }
  }

  private setDraft(draft: BookingDraft): void {
    this.draft.set(draft);
    sessionStorage.setItem('bookingData', JSON.stringify(draft));
  }

  daysBetween(pickupDate: string, returnDate: string): number {
    const start = new Date(pickupDate);
    const end = new Date(returnDate);
    const ms = end.getTime() - start.getTime();
    return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
  }

  async findPromoCode(code: string, subtotal?: number) {
    const { data: publicPromo, error } = await this.supabase.client
      .from('discount_codes')
      .select('*')
      .ilike('code', code.trim())
      .eq('is_active', true)
      .maybeSingle();
    if (error) throw new Error(error.message);

    const now = new Date();
    let promo = publicPromo;
    if (!promo) {
      const user = await this.supabase.client.auth.getUser();
      if (user.error) throw new Error(user.error.message);
      if (!user.data.user) throw new Error('Sign in to validate a claimed reward code.');

      const { data: claimedPromo, error: claimedError } = await this.supabase.client
        .from('claimed_reward_codes')
        .select('code,discount_percent,description')
        .eq('user_id', user.data.user.id)
        .ilike('code', code.trim())
        .maybeSingle();
      if (claimedError) throw new Error(claimedError.message);
      promo = claimedPromo;
    }
    if (!promo) throw new Error('That promo code was not found.');

    if ('valid_from' in promo && promo.valid_from && now < new Date(promo.valid_from)) {
      throw new Error('This promo code is not active yet.');
    }
    if ('valid_until' in promo && promo.valid_until && now > new Date(promo.valid_until)) {
      throw new Error('This promo code has expired.');
    }
    if ('max_uses' in promo && promo.max_uses != null && promo.current_uses >= promo.max_uses) {
      throw new Error('This promo code has reached its usage limit.');
    }
    if (subtotal != null && 'min_spend' in promo && subtotal < Number(promo.min_spend ?? 0)) {
      throw new Error(`This promo code requires a minimum spend of ₱${Number(promo.min_spend).toLocaleString()}.`);
    }

    return {
      code: promo.code as string,
      discountPercent: Number(promo.discount_percent),
      description: promo.description as string,
    };
  }

  /** Mirrors the legacy site's rule: apply whichever eligible discount is largest. */
  computePricing(
    dailyRate: number,
    rentalDays: number,
    options: { isPwdSenior: boolean; isNewMember: boolean; promoCode?: { code: string; discountPercent: number; description: string } | null },
  ): PricingBreakdown {
    const subtotal = dailyRate * rentalDays;
    const insurance = INSURANCE_FEE;

    let bestDiscount = 0;
    let discountLabel = 'N/A';

    if (options.promoCode) {
      const promoDiscount = subtotal * (options.promoCode.discountPercent / 100);
      if (promoDiscount > bestDiscount) {
        bestDiscount = promoDiscount;
        discountLabel = `${options.promoCode.description} (${options.promoCode.code})`;
      }
    }

    if (options.isPwdSenior) {
      const pwdDiscount = subtotal * PWD_SENIOR_DISCOUNT_RATE;
      if (pwdDiscount > bestDiscount) {
        bestDiscount = pwdDiscount;
        discountLabel = 'PWD/Senior Discount (20%)';
      }
    }

    if (options.isNewMember) {
      const newMemberDiscount = subtotal * NEW_MEMBER_DISCOUNT_RATE;
      if (newMemberDiscount > bestDiscount) {
        bestDiscount = newMemberDiscount;
        discountLabel = 'New Member Discount (15%)';
      }
    }

    const total = subtotal + insurance - bestDiscount;
    return { subtotal, insurance, discount: bestDiscount, discountLabel: bestDiscount > 0 ? discountLabel : 'N/A', total };
  }

  async isNewMember(email: string): Promise<boolean> {
    const { count, error } = await this.supabase.client
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('customer_email', email);
    if (error) return false;
    return (count ?? 0) === 0;
  }

  generateReferenceNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);
    return `SD-${year}-${random}`;
  }

  async hasOngoingBooking(userId: string, vehicleId: number): Promise<boolean> {
    const { data, error } = await this.supabase.client
      .from('bookings')
      .select('id')
      .eq('user_id', userId)
      .eq('vehicle_id', vehicleId)
      .eq('booking_status', 'ongoing')
      .limit(1);
    if (error) throw new Error(`Could not verify your current vehicle bookings: ${error.message}`);
    return (data?.length ?? 0) > 0;
  }

  async getOngoingVehicleIds(userId: string): Promise<number[]> {
    const { data, error } = await this.supabase.client
      .from('bookings')
      .select('vehicle_id')
      .eq('user_id', userId)
      .eq('booking_status', 'ongoing');
    if (error) throw new Error(`Could not load your current vehicle bookings: ${error.message}`);
    return [...new Set((data ?? []).map((booking) => Number(booking.vehicle_id)))];
  }

  async createBooking(
    userId: string | null,
    paymentMethod: string,
    paymentStatus: Booking['payment_status'] = 'completed',
  ): Promise<Booking> {
    const draft = this.draft();
    if (!draft?.customer || !draft.pricing) throw new Error('Booking details are incomplete.');
    const { data: sessionData, error: sessionError } = await this.supabase.client.auth.getSession();
    if (sessionError) throw new Error(`Your sign-in could not be verified: ${sessionError.message}`);
    if (!sessionData.session || !userId || sessionData.session.user.id !== userId) {
      throw new Error('Your account is not connected to a secure booking session. Please sign in with your online account before booking.');
    }
    if (await this.hasOngoingBooking(userId, draft.vehicle.id)) {
      throw new Error('You already have an ongoing booking for this vehicle. Complete or return your current rental before booking it again.');
    }

    const booking: Booking = {
      reference_number: this.generateReferenceNumber(),
      user_id: userId,
      customer_email: draft.customer.email,
      customer_name: draft.customer.name,
      customer_phone: draft.customer.phone,
      vehicle_id: draft.vehicle.id,
      vehicle_name: draft.vehicle.name,
      pickup_date: draft.pickupDate,
      return_date: draft.returnDate,
      pickup_location: draft.pickupLocation,
      daily_rate: draft.vehicle.price,
      rental_days: draft.rentalDays,
      subtotal: draft.pricing.subtotal,
      insurance: draft.pricing.insurance,
      discount: draft.pricing.discount,
      discount_label: draft.pricing.discountLabel,
      total_price: draft.pricing.total,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      booking_status: 'confirmed',
      is_pwd_senior: draft.customer.isPwdSenior,
    };

    const { data, error } = await this.supabase.client.from('bookings').insert([booking]).select().single();
    if (error) throw new Error(error.message);
    this.demoTracking.recordTransaction(userId, `Booking ${booking.reference_number}`);
    return data as Booking;
  }

  async listMyBookings(email: string): Promise<Booking[]> {
    const { data, error } = await this.supabase.client
      .from('bookings')
      .select('*')
      .eq('customer_email', email)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Booking[];
  }

  async listMyBookingsForUser(userId: string): Promise<Booking[]> {
    const { data, error } = await this.supabase.client
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Booking[];
  }

  async getByReference(reference: string): Promise<Booking | null> {
    const { data, error } = await this.supabase.client
      .from('bookings')
      .select('*')
      .eq('reference_number', reference)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as Booking | null;
  }

  async cancelBooking(id: number): Promise<void> {
    const { error } = await this.supabase.client.from('bookings').update({ booking_status: 'cancelled' }).eq('id', id);
    if (error) throw new Error(error.message);
  }
}
