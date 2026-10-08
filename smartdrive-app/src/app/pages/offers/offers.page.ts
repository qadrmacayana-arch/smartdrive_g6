import { Component, OnDestroy, OnInit, signal } from '@angular/core';
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
import { SupabaseService } from '../../core/services/supabase.service';

interface PromoOffer {
  id: number;
  code: string;
  description: string | null;
  discount_percent: number;
  max_uses: number | null;
  current_uses: number;
  min_spend: number | null;
  valid_from: string | null;
  valid_until: string | null;
  created_at: string | null;
}

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
export class OffersPage implements OnInit, OnDestroy {
  readonly currentUser = this.auth.currentUser;
  readonly offers = signal<PromoOffer[]>([]);
  readonly offersLoading = signal(true);
  readonly offersError = signal<string | null>(null);
  readonly promoCode = signal('');
  readonly promoMessage = signal<string | null>(null);
  readonly promoValid = signal(false);
  readonly rewards = signal<RewardDefinition[]>([]);
  readonly rewardsLoading = signal(true);
  readonly claimingReward = signal<RewardKey | null>(null);
  readonly promoValidating = signal(false);
  readonly rewardError = signal<string | null>(null);
  private promoChannel: ReturnType<SupabaseService['client']['channel']> | null = null;

  constructor(
    private readonly auth: AuthService,
    private readonly bookingService: BookingService,
    private readonly rewardService: RewardService,
    private readonly toastCtrl: ToastController,
    private readonly supabase: SupabaseService,
  ) {}

  ngOnInit(): void {
    void this.loadRewards();
    void this.loadOffers();
    this.promoChannel = this.supabase.client
      .channel('customer-offer-promos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'discount_codes' }, () => {
        void this.loadOffers();
      })
      .subscribe((status, error) => {
        if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') && error) {
          console.error('Live offer updates are unavailable.', error);
        }
      });
  }

  ionViewWillEnter(): void {
    if (!this.offersLoading()) void this.loadOffers();
  }

  ngOnDestroy(): void {
    if (this.promoChannel) void this.supabase.client.removeChannel(this.promoChannel);
  }

  async loadOffers(): Promise<void> {
    this.offersLoading.set(true);
    this.offersError.set(null);
    try {
      const { data, error } = await this.supabase.client
        .from('discount_codes')
        .select('id,code,description,discount_percent,max_uses,current_uses,min_spend,valid_from,valid_until,created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) {
        const details = error.code === '42501'
          ? ' Check that customer-notifications-and-booking-guard.sql has been run in Supabase.'
          : '';
        throw new Error(`Could not load current promo codes: ${error.message}.${details}`);
      }

      const now = Date.now();
      this.offers.set(((data ?? []) as PromoOffer[]).filter((promo) => {
        const startsAt = promo.valid_from ? Date.parse(promo.valid_from) : null;
        const endsAt = promo.valid_until ? Date.parse(promo.valid_until) : null;
        return (startsAt === null || (Number.isFinite(startsAt) && startsAt <= now))
          && (endsAt === null || (Number.isFinite(endsAt) && endsAt >= now))
          && (promo.max_uses == null || promo.current_uses < promo.max_uses);
      }));
    } catch (error) {
      this.offersError.set(error instanceof Error ? error.message : 'Unable to load current promo codes.');
    } finally {
      this.offersLoading.set(false);
    }
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
