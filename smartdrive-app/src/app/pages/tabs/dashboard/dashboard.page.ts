import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/angular';
import { Booking } from '../../../core/models/booking.model';
import { AuthService } from '../../../core/services/auth.service';
import { BookingService } from '../../../core/services/booking.service';
import { WalletService } from '../../../core/services/wallet.service';
import { WalletBalance } from '../../../core/models/wallet.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, IonContent, IonIcon, IonRefresher, IonRefresherContent],
  templateUrl: './dashboard.page.html',
})
export class DashboardPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly bookingService = inject(BookingService);
  private readonly walletService = inject(WalletService);
  readonly currentUser = this.auth.currentUser;
  readonly bookings = signal<Booking[]>([]);
  readonly wallet = signal<WalletBalance | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly activeBookings = computed(() =>
    this.bookings().filter((booking) => ['confirmed', 'ongoing'].includes(booking.booking_status)),
  );
  readonly completedBookings = computed(() =>
    this.bookings().filter((booking) => booking.booking_status === 'completed'),
  );
  readonly primaryActiveBooking = computed(() =>
    [...this.activeBookings()].sort((first, second) =>
      first.pickup_date.localeCompare(second.pickup_date),
    )[0] ?? null,
  );
  readonly totalPaid = computed(() =>
    this.bookings()
      .filter((booking) => booking.payment_status === 'completed')
      .reduce((total, booking) => total + Number(booking.total_price || 0), 0),
  );

  ngOnInit(): void {
    void this.loadDashboard();
  }

  async loadDashboard(event?: CustomEvent): Promise<void> {
    const user = this.currentUser();
    if (!user) {
      this.loading.set(false);
      (event?.target as HTMLIonRefresherElement | undefined)?.complete();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      const [bookings, wallet] = await Promise.all([
        this.bookingService.listMyBookings(user.email),
        this.walletService.getOrCreateBalance(user.id, user.email),
      ]);
      this.bookings.set(bookings);
      this.wallet.set(wallet);
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to load your dashboard.');
    } finally {
      this.loading.set(false);
      (event?.target as HTMLIonRefresherElement | undefined)?.complete();
    }
  }
}
