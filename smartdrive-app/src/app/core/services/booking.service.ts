import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Booking, BookingDraft } from '../models/booking.model';

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
  readonly draft = signal<BookingDraft | null>(null);

  constructor(private readonly supabase: SupabaseService) {}

  startDraft(vehicle: BookingDraft['vehicle'], pickupDate: string, returnDate: string, pickupLocation: string): void {
    const rentalDays = this.daysBetween(pickupDate, returnDate);
    this.draft.set({ vehicle, pickupDate, returnDate, rentalDays, pickupLocation });
  }

  updateCustomer(customer: BookingDraft['customer']): void {
    const current = this.draft();
    if (!current) return;
    this.draft.set({ ...current, customer });
  }

  clearDraft(): void {
    this.draft.set(null);
  }

  daysBetween(pickupDate: string, returnDate: string): number {
    const start = new Date(pickupDate);
    const end = new Date(returnDate);
    const ms = end.getTime() - start.getTime();
    return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
  }

  async findPromoCode(code: string, subtotal: number) {
    const { data, error } = await this.supabase.client
      .from('discount_codes')
      .select('*')
      .ilike('code', code.trim())
      .eq('is_active', true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error('That promo code was not found.');

    const now = new Date();
    if (data.valid_from && now < new Date(data.valid_from)) throw new Error('This promo code is not active yet.');
    if (data.valid_until && now > new Date(data.valid_until)) throw new Error('This promo code has expired.');
    if (data.max_uses != null && data.current_uses >= data.max_uses) throw new Error('This promo code has reached its usage limit.');
    if (subtotal < Number(data.min_spend ?? 0)) {
      throw new Error(`This promo code requires a minimum spend of ₱${Number(data.min_spend).toLocaleString()}.`);
    }

    return {
      code: data.code as string,
      discountPercent: Number(data.discount_percent),
      description: data.description as string,
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

  async createBooking(userId: string | null, paymentMethod: string): Promise<Booking> {
    const draft = this.draft();
    if (!draft?.customer || !draft.pricing) throw new Error('Booking details are incomplete.');

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
      payment_status: 'completed',
      booking_status: 'confirmed',
      is_pwd_senior: draft.customer.isPwdSenior,
    };

    const { data, error } = await this.supabase.client.from('bookings').insert([booking]).select().single();
    if (error) throw new Error(error.message);
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
