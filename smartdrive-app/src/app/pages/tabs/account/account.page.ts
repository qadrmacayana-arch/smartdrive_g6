import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { AuthService } from '../../../core/services/auth.service';
import { BookingService } from '../../../core/services/booking.service';
import { Booking } from '../../../core/models/booking.model';
import { WalletService } from '../../../core/services/wallet.service';
import { WalletBalance } from '../../../core/models/wallet.model';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonContent,
    IonIcon,
  ],
  templateUrl: './account.page.html',
  styleUrl: './account.page.scss',
})
export class AccountPage implements OnInit {
  readonly currentUser = this.auth.currentUser;
  readonly bookings = signal<Booking[]>([]);
  readonly wallet = signal<WalletBalance | null>(null);
  readonly loading = signal(true);

  constructor(
    private readonly auth: AuthService,
    private readonly bookingService: BookingService,
    private readonly walletService: WalletService,
  ) {}

  ngOnInit(): void {
    void this.loadDashboard();
  }

  async loadDashboard(): Promise<void> {
    const user = this.currentUser();
    if (!user) {
      this.loading.set(false);
      return;
    }
    try {
      const [bookings, wallet] = await Promise.all([
        this.bookingService.listMyBookings(user.email),
        this.walletService.getOrCreateBalance(user.id, user.email),
      ]);
      this.bookings.set(bookings);
      this.wallet.set(wallet);
    } finally {
      this.loading.set(false);
    }
  }

  get activeBookings(): Booking[] {
    return this.bookings().filter((booking) => ['confirmed', 'ongoing'].includes(booking.booking_status));
  }

  get totalSpent(): number {
    return this.bookings().reduce((total, booking) => total + Number(booking.total_price || 0), 0);
  }

  get hoursDriven(): number {
    return this.bookings().reduce((total, booking) => total + Number(booking.rental_days || 0) * 24, 0);
  }

  get latestBooking(): Booking | null {
    return this.bookings()[0] ?? null;
  }

}
