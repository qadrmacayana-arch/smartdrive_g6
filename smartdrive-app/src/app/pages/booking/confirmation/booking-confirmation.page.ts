import { Component, OnInit, signal } from '@angular/core';
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

@Component({
  selector: 'app-booking-confirmation',
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, IonButton, IonSpinner],
  templateUrl: './booking-confirmation.page.html',
  styleUrl: './booking-confirmation.page.scss',
})
export class BookingConfirmationPage implements OnInit {
  readonly booking = signal<Booking | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly sharing = signal(false);
  readonly shareMessage = signal<string | null>(null);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly bookingService: BookingService,
  ) {}

  async ngOnInit(): Promise<void> {
    const reference = this.route.snapshot.paramMap.get('reference');
    if (!reference) return;

    try {
      const booking = await this.bookingService.getByReference(reference);
      if (!booking) {
        this.errorMessage.set('We could not find that booking.');
      } else {
        this.booking.set(booking);
      }
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to load this booking.');
    } finally {
      this.loading.set(false);
    }
  }

  async share(): Promise<void> {
    const booking = this.booking();
    if (!booking) return;

    const paymentComplete = booking.payment_status === 'completed';
    const text = `SmartDrive™ ${paymentComplete ? 'Booking Confirmed' : 'Reservation Saved'}\nReference: ${booking.reference_number}\nVehicle: ${booking.vehicle_name}\nPick-up: ${booking.pickup_date}\nReturn: ${booking.return_date}\nPayment status: ${booking.payment_status}\n${paymentComplete ? 'Total paid' : 'Total due'}: ₱${booking.total_price.toLocaleString()}`;

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
