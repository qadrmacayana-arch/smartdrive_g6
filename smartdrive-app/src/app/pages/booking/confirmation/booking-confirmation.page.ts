import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import {
  IonContent,
  IonIcon,
  IonButton,
  IonSpinner,
} from '@ionic/angular';
import { BookingService } from '../../../core/services/booking.service';
import { Booking } from '../../../core/models/booking.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-booking-confirmation',
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, IonButton, IonSpinner],
  templateUrl: './booking-confirmation.page.html',
  styleUrl: './booking-confirmation.page.scss',
})
export class BookingConfirmationPage implements OnInit, OnDestroy {
  private paymentPollTimer: ReturnType<typeof setTimeout> | null = null;
  private paymentReference: string | null = null;
  private paymentAttemptId: string | null = null;

  readonly booking = signal<Booking | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly checkingPayment = signal(false);
  readonly paymentReturn = signal(false);
  readonly testConfirmation = signal(false);
  readonly paymentStatusError = signal<string | null>(null);
  readonly paymentCancelled = signal(false);
  readonly sharing = signal(false);
  readonly shareMessage = signal<string | null>(null);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly bookingService: BookingService,
    private readonly auth: AuthService,
  ) {}

  readonly customerAddress = computed(() => {
    const booking = this.booking();
    if (booking?.customer_address !== undefined) {
      return booking.customer_address?.trim() || 'Not provided';
    }
    return this.auth.currentUser()?.address?.trim() || 'Not provided';
  });

  async ngOnInit(): Promise<void> {
    const reference = this.route.snapshot.paramMap.get('reference');
    if (!reference) return;
    const attemptId = this.route.snapshot.queryParamMap.get('attempt');
    this.paymentReference = reference;
    this.paymentAttemptId = attemptId;
    this.paymentCancelled.set(this.route.snapshot.queryParamMap.get('payment') === 'cancelled');
    this.paymentReturn.set(Boolean(attemptId && !this.paymentCancelled()));

    try {
      if (attemptId && !this.paymentCancelled()) {
        const result = await this.bookingService.confirmReturnedCheckout(reference, attemptId);
        this.testConfirmation.set(result.status === 'test-confirmed');
        if (result.booking) {
          this.booking.set(result.booking);
          this.bookingService.clearDraft();
        } else {
          this.checkingPayment.set(true);
          this.schedulePaymentStatusRefresh(reference, attemptId, 0);
        }
        if (
          this.route.snapshot.queryParamMap.get('returnToApp') === '1'
          && await this.tryOpenAndroidApp(reference, attemptId)
        ) return;
      } else if (this.paymentCancelled()) {
        this.errorMessage.set('Checkout was cancelled. No payment was confirmed and the booking is not confirmed. You can return to checkout to try again.');
      } else {
        const booking = await this.bookingService.getByReference(reference);
        if (!booking) throw new Error('This booking could not be found.');
        this.booking.set(booking);
        if (booking.payment_status === 'completed') this.bookingService.clearDraft();
      }
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to load this booking.');
    } finally {
      this.loading.set(false);
    }
  }

  private async tryOpenAndroidApp(reference: string, attemptId: string): Promise<boolean> {
    if (Capacitor.isNativePlatform() || !/Android/i.test(navigator.userAgent)) return false;

    const query = new URLSearchParams({ payment: 'success', attempt: attemptId });
    let settled = false;
    let timer: ReturnType<typeof setTimeout>;
    const finish = (opened: boolean, resolve: (value: boolean) => void): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      resolve(opened);
    };
    const onVisibilityChange = (): void => {
      if (document.hidden) finish(true, resolveHandoff);
    };
    let resolveHandoff!: (value: boolean) => void;
    const handoff = new Promise<boolean>((resolve) => {
      resolveHandoff = resolve;
      document.addEventListener('visibilitychange', onVisibilityChange);
      timer = setTimeout(() => finish(false, resolve), 1200);
    });

    window.location.href =
      `smartdrive://booking/confirmation/${encodeURIComponent(reference)}?${query.toString()}`;
    return handoff;
  }

  ngOnDestroy(): void {
    if (this.paymentPollTimer) clearTimeout(this.paymentPollTimer);
  }

  private schedulePaymentStatusRefresh(reference: string, attemptId: string, attempt: number): void {
    if (attempt >= 30) {
      this.checkingPayment.set(false);
      this.errorMessage.set(
        'We couldn’t confirm the payment status yet. This does not necessarily mean the payment failed. Please check again before trying to pay again.',
      );
      return;
    }
    this.paymentPollTimer = setTimeout(() => {
      void this.refreshPaymentStatus(reference, attemptId, attempt + 1);
    }, 3000);
  }

  private async refreshPaymentStatus(reference: string, attemptId: string, attempt: number): Promise<void> {
    try {
      const result = await this.bookingService.confirmReturnedCheckout(reference, attemptId);
      this.testConfirmation.set(result.status === 'test-confirmed');
      if (!result.booking) {
        this.schedulePaymentStatusRefresh(reference, attemptId, attempt);
        return;
      }
      this.booking.set(result.booking);
      this.paymentStatusError.set(null);
      this.checkingPayment.set(false);
      this.bookingService.clearDraft();
    } catch (error) {
      this.paymentStatusError.set(error instanceof Error ? error.message : 'Could not refresh payment status.');
      this.schedulePaymentStatusRefresh(reference, attemptId, attempt);
    }
  }

  retryPaymentCheck(): void {
    const reference = this.paymentReference;
    const attemptId = this.paymentAttemptId;
    if (!reference || !attemptId) {
      this.errorMessage.set('The payment reference is missing. Please open the confirmation link again.');
      return;
    }

    if (this.paymentPollTimer) clearTimeout(this.paymentPollTimer);
    this.paymentPollTimer = null;
    this.errorMessage.set(null);
    this.paymentStatusError.set(null);
    this.checkingPayment.set(true);
    void this.refreshPaymentStatus(reference, attemptId, 0);
  }

  retryCancelledCheckout(): void {
    const draft = this.bookingService.draft();
    if (!draft) {
      this.errorMessage.set('Your booking details are no longer available. Please start a new booking.');
      return;
    }
    this.router.navigate(['/booking', draft.vehicle.id, 'payment']);
  }

  paymentMethodLabel(method: string): string {
    return ({
      'credit-card': 'Credit / Debit Card',
      srpoints: 'SR Wallet',
      gcash: 'GCash',
      maya: 'Maya',
    } as Record<string, string>)[method] ?? method;
  }

  paymentProviderLabel(method: string): string {
    return method === 'srpoints' ? 'SmartDrive Wallet' : 'PayMongo';
  }

  async share(): Promise<void> {
    const booking = this.booking();
    if (!booking) return;

    const paymentComplete = booking.payment_status === 'completed';
    const address = this.customerAddress();
    const text = [
      `SmartDrive™ ${paymentComplete ? 'Booking Confirmed' : 'Reservation Saved'}`,
      `Reference: ${booking.reference_number}`,
      `Customer: ${booking.customer_name}`,
      `Email: ${booking.customer_email}`,
      `Phone: ${booking.customer_phone || 'Not provided'}`,
      `Address: ${address}`,
      `Vehicle: ${booking.vehicle_name}`,
      `Pick-up: ${booking.pickup_date}`,
      `Return: ${booking.return_date}`,
      `Pick-up location: ${booking.pickup_location || 'Not provided'}`,
      `Primary driver age: ${booking.driver_age ?? 'Not provided'}`,
      `Renter type: ${booking.renter_type || 'Not provided'}`,
      `License type: ${booking.driver_license_type || 'Not provided'}`,
      `License country: ${booking.driver_license_country || 'Not applicable'}`,
      `License confirmed: ${booking.driver_license_confirmed ? 'Yes' : 'No'}`,
      `Documents ready: ${booking.booking_documents_ready ? 'Yes' : 'No'}`,
      `Booking conditions accepted: ${booking.booking_conditions_accepted ? 'Yes' : 'No'}`,
      `Payment method: ${this.paymentMethodLabel(booking.payment_method)}`,
      `Payment processed via: ${this.paymentProviderLabel(booking.payment_method)}`,
      `Payment status: ${booking.payment_status}`,
      `Rental subtotal: ₱${Number(booking.subtotal).toLocaleString()}`,
      `Insurance: ₱${Number(booking.insurance).toLocaleString()}`,
      `Discount: ${booking.discount_label || 'N/A'} · ₱${Number(booking.discount).toLocaleString()}`,
      `${paymentComplete ? 'Total paid' : 'Total due'}: ₱${Number(booking.total_price).toLocaleString()}`,
    ].join('\n');

    this.sharing.set(true);
    this.shareMessage.set(null);
    try {
      if (Capacitor.isNativePlatform()) {
        await Share.share({ title: 'SmartDrive™ Booking Receipt', text, dialogTitle: 'Share booking receipt' });
      } else if (navigator.share) {
        await navigator.share({ title: 'SmartDrive™ Booking Receipt', text });
      } else {
        await this.copyOrDownloadReceipt(text);
      }
      this.shareMessage.set('Choose an app to share your booking receipt.');
    } catch (error) {
      if (error instanceof Error && (
        error.name === 'AbortError' || /cancelled|canceled/i.test(error.message)
      )) {
        this.shareMessage.set('Sharing was cancelled.');
      } else {
        console.error('Unable to share booking receipt.', error);
        try {
          await this.copyOrDownloadReceipt(text);
        } catch (fallbackError) {
          console.error('Unable to create a receipt fallback.', fallbackError);
          this.shareMessage.set('Unable to share or save the receipt. Please try again.');
        }
      }
    } finally {
      this.sharing.set(false);
    }
  }

  private async copyOrDownloadReceipt(text: string): Promise<void> {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        this.shareMessage.set('Receipt details copied to your clipboard.');
        return;
      } catch (error) {
        console.error('Unable to copy booking receipt.', error);
      }
    }

    const receipt = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(receipt);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SmartDrive-receipt-${this.booking()?.reference_number ?? 'booking'}.txt`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.shareMessage.set('Receipt saved as a text file.');
  }

  goHome(): void {
    this.router.navigateByUrl('/tabs/home');
  }

  viewBookings(): void {
    this.router.navigateByUrl('/tabs/bookings');
  }
}