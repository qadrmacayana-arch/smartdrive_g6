import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonBackButton, IonButtons, IonContent, IonHeader, IonIcon, IonInput, IonTitle, IonToolbar } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-offers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonBackButton, IonButtons, IonContent, IonHeader, IonIcon, IonInput, IonTitle, IonToolbar],
  templateUrl: './offers.page.html',
  styleUrl: './offers.page.scss',
})
export class OffersPage {
  readonly currentUser = this.auth.currentUser;
  readonly promoCode = signal('');
  readonly promoMessage = signal<string | null>(null);
  readonly promoValid = signal(false);
  readonly offers = [
    ['New Members', '15% OFF Your First Ride', 'Enjoy 15% off your first booking.', 'WELCOME15'],
    ['Weekend Deal', 'Weekend SUV Special', 'Rent any SUV for three days and get the third day at 50% off.', 'Valid Fri-Sun'],
    ['Long-Term', 'Weekly Rental Discount', 'Rent for seven days or more and receive 20% off.', 'Min. 7 days'],
    ['Premium Members', 'Free Upgrade', 'Premium members receive a complimentary one-class upgrade.', 'Premium only'],
    ['Holiday Promo', 'Extended Weekend Getaway', 'Book a four-day weekend and save 25%.', 'Limited time'],
    ['Corporate', 'Business Travel Package', 'Book three or more vehicles and receive 15% off.', 'Business accounts'],
  ];

  constructor(private readonly auth: AuthService) {}

  validatePromo(): void {
    const code = this.promoCode().trim().toUpperCase();
    const valid = ['FIRST15', 'WELCOME15', 'LOYAL10', 'LOYAL15', 'LOYAL20', 'REVIEW10', 'REFERRAL15'].includes(code);
    this.promoValid.set(valid);
    this.promoMessage.set(valid ? `${code} is valid and can be applied during checkout.` : 'That promo code is not recognized.');
  }
}
