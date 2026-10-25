import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { jsPDF } from 'jspdf';
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
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);
  private readonly auth = inject(AuthService);
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

    this.sharing.set(true);
    this.shareMessage.set(null);
    try {
      const pdf = this.createReceiptPdf(booking);
      const blob = pdf.output('blob');
      const fileName = `SmartDrive-receipt-${booking.reference_number.replace(/[^a-zA-Z0-9_-]/g, '-')}.pdf`;

      if (Capacitor.isNativePlatform()) {
        const dataUri = pdf.output('datauristring');
        const { uri } = await Filesystem.writeFile({
          path: `receipts/${fileName}`,
          data: dataUri.slice(dataUri.indexOf(',') + 1),
          directory: Directory.Cache,
          recursive: true,
        });
        await Share.share({
          title: 'SmartDrive™ Booking Receipt',
          text: booking.reference_number,
          files: [uri],
          dialogTitle: 'Share booking receipt PDF',
        });
        this.shareMessage.set('Booking receipt PDF is ready to share.');
      } else {
        const file = new File([blob], fileName, { type: 'application/pdf' });
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            title: 'SmartDrive™ Booking Receipt',
            text: booking.reference_number,
            files: [file],
          });
          this.shareMessage.set('Booking receipt PDF is ready to share.');
        } else {
          this.downloadReceiptPdf(blob, fileName);
          this.shareMessage.set('Booking receipt PDF downloaded.');
        }
      }
    } catch (error) {
      if (error instanceof Error && (
        error.name === 'AbortError' || /cancelled|canceled/i.test(error.message)
      )) {
        this.shareMessage.set('Sharing was cancelled.');
      } else {
        console.error('Unable to share booking receipt.', error);
        try {
          const pdf = this.createReceiptPdf(booking);
          const fileName = `SmartDrive-receipt-${booking.reference_number.replace(/[^a-zA-Z0-9_-]/g, '-')}.pdf`;
          this.downloadReceiptPdf(pdf.output('blob'), fileName);
          this.shareMessage.set('Sharing was unavailable. Booking receipt PDF downloaded instead.');
        } catch (fallbackError) {
          console.error('Unable to create or download the booking receipt PDF.', fallbackError);
          this.shareMessage.set('Unable to create or share the receipt PDF. Please try again.');
        }
      }
    } finally {
      this.sharing.set(false);
    }
  }

  private createReceiptPdf(booking: Booking): jsPDF {
    const pdf = new jsPDF({ format: 'a4', unit: 'mm' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 18;
    let y = 48;

    pdf.setFillColor(22, 76, 60);
    pdf.rect(0, 0, pageWidth, 37, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(17);
    pdf.text('SmartDrive Booking Receipt', margin, 17);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(booking.payment_status === 'completed' ? 'BOOKING CONFIRMED' : 'RESERVATION SAVED', margin, 26);
    pdf.text(`Reference: ${booking.reference_number}`, pageWidth - margin, 26, { align: 'right' });
    pdf.setTextColor(35, 45, 42);

    const addSection = (title: string): void => {
      if (y > 265) {
        pdf.addPage();
        y = 20;
      }
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(22, 76, 60);
      pdf.text(title, margin, y);
      y += 7;
    };
    const addRow = (label: string, value: string): void => {
      if (y > 275) {
        pdf.addPage();
        y = 20;
      }
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(95, 105, 101);
      pdf.text(label, margin, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(35, 45, 42);
      const lines = pdf.splitTextToSize(value || 'Not provided', pageWidth - margin * 2 - 48);
      pdf.text(lines, margin + 48, y);
      y += Math.max(6, lines.length * 4.5);
    };

    addSection('CUSTOMER');
    addRow('Name', booking.customer_name);
    addRow('Email', booking.customer_email);
    addRow('Phone', booking.customer_phone || 'Not provided');
    addRow('Address', this.customerAddress());

    addSection('RENTAL');
    addRow('Vehicle', booking.vehicle_name);
    if (booking.vehicle_plate_number) {
      addRow('Demo plate number', booking.vehicle_plate_number);
    }
    addRow('Pick-up', booking.pickup_date);
    addRow('Return', booking.return_date);
    addRow('Pick-up location', booking.pickup_location || 'Not provided');
    addRow('Primary driver age', String(booking.driver_age ?? 'Not provided'));
    if (booking.is_pwd_senior) {
      addRow(
        'PWD/Senior cashback',
        booking.pwd_senior_cashback_status === 'credited'
          ? `PHP ${Number(booking.pwd_senior_cashback_amount ?? 0).toLocaleString()} credited to SR Wallet`
          : booking.pwd_senior_cashback_status === 'declined'
            ? 'Not approved after pickup verification'
            : `Up to PHP ${Number(booking.pwd_senior_cashback_amount ?? 0).toLocaleString()} after valid ID verification at pickup`,
      );
    } else if (booking.is_pwd_discount) {
      addRow('Legacy PWD discount claim', 'Claim recorded on this booking');
    }
    addRow('Booking conditions accepted', booking.booking_conditions_accepted ? 'Yes' : 'No');

    addSection('PAYMENT');
    addRow('Payment method', this.paymentMethodLabel(booking.payment_method));
    addRow('Processed via', this.paymentProviderLabel(booking.payment_method));
    addRow('Payment status', booking.payment_status);
    if (booking.paymongo_checkout_session_id) {
      addRow('PayMongo checkout session ID', booking.paymongo_checkout_session_id);
    }
    if (booking.paymongo_payment_id) {
      addRow('PayMongo payment ID', booking.paymongo_payment_id);
    }
    addRow('Rental subtotal', `PHP ${Number(booking.subtotal).toLocaleString()}`);
    addRow('Insurance', `PHP ${Number(booking.insurance).toLocaleString()}`);
    addRow('Discount', `${booking.discount_label || 'N/A'} · PHP ${Number(booking.discount).toLocaleString()}`);
    addRow(booking.payment_status === 'completed' ? 'TOTAL PAID' : 'TOTAL DUE', `PHP ${Number(booking.total_price).toLocaleString()}`);

    pdf.setFontSize(8);
    pdf.setTextColor(120, 130, 126);
    pdf.text('Keep this receipt for your records. Bring the original driver license and supporting documents listed in the booking conditions. Bring a valid Philippine PWD or Senior Citizen ID for cashback verification if claimed.', margin, Math.min(y + 7, 285));
    return pdf;
  }

  private downloadReceiptPdf(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  goHome(): void {
    this.router.navigateByUrl('/tabs/home');
  }

  viewBookings(): void {
    this.router.navigateByUrl('/tabs/bookings');
  }
}