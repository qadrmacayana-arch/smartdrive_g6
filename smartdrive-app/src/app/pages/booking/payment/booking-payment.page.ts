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
  readonly cardholderName = signal('');
  readonly cardNumber = signal('');
  readonly cardExpiry = signal('');
  readonly cardCvv = signal('');
  readonly walletMobile = signal('');
  readonly promoInput = signal('');
  readonly promoError = signal<string | null>(null);
  readonly promoApplying = signal(false);

  readonly pricing = signal<PricingBreakdown | null>(null);
  readonly walletBalance = signal<WalletBalance | null>(null);
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  constructor(
    private readonly auth: AuthService,
    private readonly bookingService: BookingService,
    private readonly walletService: WalletService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
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

  get paymentDetailsError(): string | null {
    switch (this.paymentMethod()) {
      case 'credit-card': {
        if (!this.cardholderName().trim()) return 'Enter the demo cardholder name.';
        if (this.cardNumber().replace(/\D/g, '') !== '4242424242424242') {
          return 'For this demo, use the test card number 4242 4242 4242 4242.';
        }
        if (!this.isFutureExpiry(this.cardExpiry())) return 'Enter a valid future expiry date (MM/YY).';
        if (this.cardCvv() !== '123') return 'For this demo, use the test CVV 123.';
        return null;
      }
      case 'gcash':
      case 'maya':
        return this.walletMobile().replace(/\D/g, '') === '09170000000'
          ? null
          : `For this demo, use the test ${this.paymentMethod() === 'gcash' ? 'GCash' : 'Maya'} number 09170000000.`;
      case 'srpoints':
        return null;
    }
  }

  private isFutureExpiry(value: string): boolean {
    const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(value);
    if (!match) return false;

    const expiryMonth = Number(match[1]);
    const expiryYear = 2000 + Number(match[2]);
    const now = new Date();
    return expiryYear > now.getFullYear() ||
      (expiryYear === now.getFullYear() && expiryMonth >= now.getMonth() + 1);
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

    if (this.paymentDetailsError) {
      this.errorMessage.set(this.paymentDetailsError);
      return;
    }

    this.errorMessage.set(null);
    this.submitting.set(true);

    try {
      this.bookingService.updateDraft((d) => ({ ...d, pricing }));

      const usesSrPoints = this.paymentMethod() === 'srpoints';
      const booking = await this.bookingService.createBooking(
        user.id,
        this.paymentMethod(),
        usesSrPoints ? 'completed' : 'pending',
      );

      if (usesSrPoints) {
        await this.walletService.spendPoints(
          user.id,
          user.email,
          pricing.total,
          `Used for booking #${booking.reference_number}`,
          booking.reference_number,
        );
      }

      this.clearPaymentDetails();
      this.bookingService.clearDraft();
      this.router.navigate(['/booking/confirmation', booking.reference_number]);
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Payment could not be processed.');
    } finally {
      this.submitting.set(false);
    }
  }

  private clearPaymentDetails(): void {
    this.cardholderName.set('');
    this.cardNumber.set('');
    this.cardExpiry.set('');
    this.cardCvv.set('');
    this.walletMobile.set('');
  }
}
