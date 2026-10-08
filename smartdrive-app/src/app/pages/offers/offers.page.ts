import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { BookingService } from '../../core/services/booking.service';
import { RewardDefinition, RewardKey, RewardService } from '../../core/services/reward.service';

@Component({
  selector: 'app-offers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonSpinner,
    IonTitle,
    IonToolbar,
  ],
  templateUrl: './offers.page.html',
  styleUrl: './offers.page.scss',
})
export class OffersPage implements OnInit {
  readonly currentUser = this.auth.currentUser;
  readonly promoCode = signal('');
  readonly promoMessage = signal<string | null>(null);
  readonly promoValid = signal(false);
  readonly rewards = signal<RewardDefinition[]>([]);
  readonly rewardsLoading = signal(true);
  readonly claimingReward = signal<RewardKey | null>(null);
  readonly promoValidating = signal(false);
  readonly rewardError = signal<string | null>(null);
  readonly offers = [
    ['New Members', '15% OFF Your First Ride', 'Enjoy 15% off your first booking.', 'WELCOME15'],
    ['Weekend Deal', 'Weekend SUV Special', 'Rent any SUV for three days and get the third day at 50% off.', 'Valid Fri-Sun'],
    ['Long-Term', 'Weekly Rental Discount', 'Rent for seven days or more and receive 20% off.', 'Min. 7 days'],
    ['Premium Members', 'Free Upgrade', 'Premium members receive a complimentary one-class upgrade.', 'Premium only'],
    ['Holiday Promo', 'Extended Weekend Getaway', 'Book a four-day weekend and save 25%.', 'Limited time'],
    ['Corporate', 'Business Travel Package', 'Book three or more vehicles and receive 15% off.', 'Business accounts'],
  ];

  constructor(
    private readonly auth: AuthService,
    private readonly bookingService: BookingService,
    private readonly rewardService: RewardService,
    private readonly toastCtrl: ToastController,
  ) {}

  ngOnInit(): void {
    void this.loadRewards();
  }

  async loadRewards(): Promise<void> {
    const user = this.currentUser();
    if (!user) {
      this.rewardsLoading.set(false);
      return;
    }

    this.rewardsLoading.set(true);
    this.rewardError.set(null);
    try {
      this.rewards.set(await this.rewardService.getRewards(user.id));
    } catch (error) {
      this.rewardError.set(error instanceof Error ? error.message : 'Unable to load your reward progress.');
    } finally {
      this.rewardsLoading.set(false);
    }
  }

  async claimReward(reward: RewardDefinition): Promise<void> {
    if (reward.code || reward.progress < reward.target || this.claimingReward()) return;
    this.claimingReward.set(reward.key);
    this.rewardError.set(null);
    try {
      const code = await this.rewardService.claimReward(reward.key);
      await this.loadRewards();
      const toast = await this.toastCtrl.create({
        message: `Reward claimed! Use ${code} at checkout.`,
        duration: 3500,
        color: 'success',
        position: 'top',
      });
      await toast.present();
    } catch (error) {
      this.rewardError.set(error instanceof Error ? error.message : 'Unable to claim this reward.');
    } finally {
      this.claimingReward.set(null);
    }
  }

  async validatePromo(): Promise<void> {
    const code = this.promoCode().trim().toUpperCase();
    if (!code) {
      this.promoValid.set(false);
      this.promoMessage.set('Enter a promo code to validate it.');
      return;
    }

    this.promoValidating.set(true);
    this.promoValid.set(false);
    try {
      const promo = await this.bookingService.findPromoCode(code);
      this.promoValid.set(true);
      this.promoMessage.set(`${promo.code} is valid: ${promo.description} (${promo.discountPercent}% off).`);
    } catch (error) {
      this.promoMessage.set(error instanceof Error ? error.message : 'Unable to validate that promo code.');
    } finally {
      this.promoValidating.set(false);
    }
  }
}
