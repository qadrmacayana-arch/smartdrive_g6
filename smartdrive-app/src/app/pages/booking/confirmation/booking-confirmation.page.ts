import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonButton,
} from '@ionic/angular';
import { BookingService } from '../../../core/services/booking.service';
import { Booking } from '../../../core/models/booking.model';

@Component({
  selector: 'app-booking-confirmation',
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, IonButton],
  templateUrl: './booking-confirmation.page.html',
  styleUrl: './booking-confirmation.page.scss',
})
export class BookingConfirmationPage implements OnInit {
  readonly booking = signal<Booking | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

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

    if (navigator.share) {
      try {
        await navigator.share({ title: 'SmartDrive™ Booking', text });
      } catch {
        // user cancelled the share sheet
      }
    } else {
      await navigator.clipboard.writeText(text);
    }
  }

  goHome(): void {
    this.router.navigateByUrl('/tabs/home');
  }

  viewBookings(): void {
    this.router.navigateByUrl('/tabs/bookings');
  }
}
