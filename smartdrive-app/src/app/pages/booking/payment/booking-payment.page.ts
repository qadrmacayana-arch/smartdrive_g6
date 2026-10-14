import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonItem,
  IonInput,
  IonIcon,
  IonButton,
  IonRadioGroup,
  IonRadio,
  IonSpinner,
} from '@ionic/angular';
import { AuthService } from '../../../core/services/auth.service';
import { BookingService, PricingBreakdown } from '../../../core/services/booking.service';
import { WalletService } from '../../../core/services/wallet.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { WalletBalance } from '../../../core/models/wallet.model';

type PaymentMethod = 'credit-card' | 'gcash' | 'maya' | 'srpoints';

@Component({
  selector: 'app-booking-payment',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonItem,
    IonInput,
    IonIcon,
    IonButton,
    IonRadioGroup,
    IonRadio,
    IonSpinner,
  ],
  templateUrl: './booking-payment.page.html',
  styleUrl: './booking-payment.page.scss',
})
export class BookingPaymentPage implements OnInit {
  readonly draft = this.bookingService.draft;
  readonly paymentMethod = signal<PaymentMethod>('credit-card');
  readonly promoInput = signal('');
  readonly promoError = signal<string | null>(null);
  readonly promoApplying = signal(false);

  readonly pricing = signal<PricingBreakdown | null>(null);
  readonly walletBalance = signal<WalletBalance | null>(null);
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly paymentCancelled = signal(false);

  constructor(
    private readonly auth: AuthService,
    private readonly bookingService: BookingService,
    private readonly walletService: WalletService,
    private readonly supabase: SupabaseService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    this.paymentCancelled.set(this.route.snapshot.queryParamMap.get('payment') === 'cancelled');
    const draft = this.draft();
    if (!draft?.customer) {
      const vehicleId = this.route.snapshot.paramMap.get('vehicleId');
      this.router.navigate(['/booking', vehicleId, 'details']);
      return;
    }

    await this.recompute();

    const user = this.auth.currentUser();
    if (user) {
      this.walletBalance.set(await this.walletService.getOrCreateBalance(user.id, user.email));
    }
  }

  private async recompute(): Promise<void> {
    const draft = this.draft();
    if (!draft?.customer) return;

    const isNewMember = await this.bookingService.isNewMember(draft.customer.email);
    const pricing = this.bookingService.computePricing(draft.vehicle.price, draft.rentalDays, {
      isPwdSenior: draft.customer.isPwdSenior,
      isNewMember,
      promoCode: draft.promoCode,
    });
    this.pricing.set(pricing);
  }

  async applyPromo(): Promise<void> {
    const code = this.promoInput().trim();
    if (!code) return;

    this.promoError.set(null);
    this.promoApplying.set(true);
    try {
      const subtotal = this.pricing()?.subtotal ?? 0;
      const promo = await this.bookingService.findPromoCode(code, subtotal);
      this.bookingService.updateDraft((d) => ({ ...d, promoCode: promo }));
      await this.recompute();
    } catch (error) {
      this.promoError.set(error instanceof Error ? error.message : 'Unable to apply that code.');
    } finally {
      this.promoApplying.set(false);
    }
  }

  removePromo(): void {
    this.bookingService.updateDraft((d) => ({ ...d, promoCode: null }));
    this.promoInput.set('');
    this.recompute();
  }

  get insufficientPoints(): boolean {
    if (this.paymentMethod() !== 'srpoints') return false;
    const total = this.pricing()?.total ?? 0;
    return (this.walletBalance()?.balance ?? 0) < total;
  }

  onPaymentMethodChange(value: PaymentMethod): void {
    this.paymentMethod.set(value);
    this.errorMessage.set(null);
  }

  async confirmPayment(): Promise<void> {
    const draft = this.draft();
    const pricing = this.pricing();
    const user = this.auth.currentUser();
    if (!draft?.customer || !pricing || !user) return;

    if (this.insufficientPoints) {
      this.errorMessage.set('Insufficient SR Points balance. Choose another payment method.');
      return;
    }

    this.errorMessage.set(null);
    this.submitting.set(true);

    try {
      this.bookingService.updateDraft((d) => ({ ...d, pricing }));

      const usesSrPoints = this.paymentMethod() === 'srpoints';

      if (usesSrPoints) {
        // Internal Payment via Wallet Points
        const booking = await this.bookingService.createBooking(
          user.id,
          this.paymentMethod(),
          'completed',
        );

        await this.walletService.spendPoints(
          user.id,
          user.email,
          pricing.total,
          `Used for booking #${booking.reference_number}`,
          booking.reference_number,
        );

        this.bookingService.clearDraft();
        this.router.navigate(['/booking/confirmation', booking.reference_number]);
      } else {
        const customer = draft.customer;
        const { data, error } = await this.supabase.client.functions.invoke('create-checkout', {
          body: {
            vehicleId: draft.vehicle.id,
            pickupDate: draft.pickupDate,
            returnDate: draft.returnDate,
            pickupLocation: draft.pickupLocation,
            customerName: customer.name,
            customerEmail: customer.email,
            customerPhone: customer.phone,
            isPwdSenior: customer.isPwdSenior,
            paymentMethod: this.paymentMethod(),
            promoCode: draft.promoCode?.code ?? null,
          },
        });

        let responseError: string | null = null;
        let responseStatus: number | null = null;
        if (error && 'context' in error && error.context instanceof Response) {
          responseStatus = error.context.status;
          const body: unknown = await error.context.clone().json().catch(() => null);
          if (
            body
            && typeof body === 'object'
            && 'error' in body
            && typeof body.error === 'string'
          ) {
            responseError = body.error;
          }
        }

        if (error || typeof data?.checkoutUrl !== 'string') {
          const message = responseError
            || data?.error
            || error?.message
            || 'Failed to initialize PayMongo checkout session.';
          throw new Error(responseStatus ? `${message} (HTTP ${responseStatus})` : message);
        }

        window.location.href = data.checkoutUrl;
      }
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Payment could not be processed.'
      );
    } finally {
      this.submitting.set(false);
    }
  }

}