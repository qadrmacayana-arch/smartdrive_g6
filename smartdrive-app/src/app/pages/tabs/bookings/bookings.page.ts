import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonMenuButton,
  IonRefresher,
  IonRefresherContent,
  IonIcon,
  IonSkeletonText,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  AlertController,
} from '@ionic/angular';
import { AuthService } from '../../../core/services/auth.service';
import { BookingService } from '../../../core/services/booking.service';
import { Booking } from '../../../core/models/booking.model';

type StatusFilter = 'all' | 'active' | 'past';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonMenuButton,
    IonRefresher,
    IonRefresherContent,
    IonIcon,
    IonSkeletonText,
    IonSegment,
    IonSegmentButton,
    IonLabel,
  ],
  templateUrl: './bookings.page.html',
  styleUrls: ['./bookings.page.scss'],
})
export class BookingsPage implements OnInit {
  readonly currentUser = this.auth.currentUser;
  readonly bookings = signal<Booking[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly filter = signal<StatusFilter>('all');

  constructor(
    private readonly auth: AuthService,
    private readonly bookingService: BookingService,
    private readonly router: Router,
    private readonly alertCtrl: AlertController,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  get filteredBookings(): Booking[] {
    const status = this.filter();
    if (status === 'all') return this.bookings();
    if (status === 'active') return this.bookings().filter((b) => ['confirmed', 'ongoing'].includes(b.booking_status));
    return this.bookings().filter((b) => ['completed', 'cancelled'].includes(b.booking_status));
  }

  async load(event?: CustomEvent): Promise<void> {
    const email = this.auth.currentUser()?.email;
    if (!email) return;

    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      const bookings = await this.bookingService.listMyBookings(email);
      this.bookings.set(bookings);
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to load your bookings.');
    } finally {
      this.loading.set(false);
      (event?.target as HTMLIonRefresherElement | undefined)?.complete();
    }
  }

  viewConfirmation(booking: Booking): void {
    this.router.navigate(['/booking/confirmation', booking.reference_number]);
  }

  async cancel(booking: Booking, ev: Event): Promise<void> {
    ev.stopPropagation();
    const alert = await this.alertCtrl.create({
      header: 'Cancel booking?',
      message: `This will cancel your booking for ${booking.vehicle_name}.`,
      buttons: [
        { text: 'Keep booking', role: 'cancel' },
        {
          text: 'Cancel booking',
          role: 'destructive',
          handler: async () => {
            if (!booking.id) return;
            await this.bookingService.cancelBooking(booking.id);
            await this.load();
          },
        },
      ],
    });
    await alert.present();
  }
}
