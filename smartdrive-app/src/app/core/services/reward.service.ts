import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export type RewardKey = 'reviewer' | 'loyalty' | 'weekend-warrior';

export interface RewardDefinition {
  key: RewardKey;
  title: string;
  description: string;
  requirement: string;
  target: number;
  discountPercent: number;
  progress: number;
  progressLabel: string;
  code: string | null;
}

interface RewardClaim {
  reward_key: RewardKey;
  code: string;
}

interface BookingProgress {
  total_price: number;
  pickup_date: string;
  booking_status: string;
  payment_status: string;
}

@Injectable({ providedIn: 'root' })
export class RewardService {
  constructor(private readonly supabase: SupabaseService) {}

  async getRewards(userId: string): Promise<RewardDefinition[]> {
    const [bookingResult, reviewResult, claimResult] = await Promise.all([
      this.supabase.client
        .from('bookings')
        .select('total_price,pickup_date,booking_status,payment_status')
        .eq('user_id', userId),
      this.supabase.client
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
      this.supabase.client
        .from('claimed_reward_codes')
        .select('reward_key,code')
        .eq('user_id', userId),
    ]);

    if (bookingResult.error) throw new Error(`Could not load booking reward progress: ${bookingResult.error.message}`);
    if (reviewResult.error) throw new Error(`Could not load review reward progress: ${reviewResult.error.message}`);
    if (claimResult.error) {
      const missingClaimsTable =
        claimResult.error.code === 'PGRST205' ||
        claimResult.error.message.includes("Could not find the table 'public.claimed_reward_codes'");
      if (missingClaimsTable) {
        throw new Error(
          'Reward claims are not set up in this Supabase project yet. Run supabase/claimable-rewards.sql in the project SQL Editor, then reload this page.',
        );
      }
      throw new Error(`Could not load claimed rewards: ${claimResult.error.message}`);
    }

    const bookings = (bookingResult.data ?? []) as BookingProgress[];
    const eligibleBookings = bookings.filter(
      (booking) => booking.payment_status === 'completed' && booking.booking_status !== 'cancelled',
    );
    const lifetimeSpend = eligibleBookings.reduce((total, booking) => total + Number(booking.total_price || 0), 0);
    const weekendBookings = eligibleBookings.filter((booking) => {
      const pickup = new Date(`${booking.pickup_date}T00:00:00`);
      return [0, 5, 6].includes(pickup.getDay());
    }).length;
    const claims = (claimResult.data ?? []) as RewardClaim[];
    const claimedCode = (key: RewardKey): string | null =>
      claims.find((claim) => claim.reward_key === key)?.code ?? null;
    const reviews = reviewResult.count ?? 0;

    return [
      {
        key: 'reviewer',
        title: 'Leave a Review',
        description: 'Share feedback after a rental and get 10% off your next booking.',
        requirement: 'Submit one review',
        target: 1,
        discountPercent: 10,
        progress: Math.min(reviews, 1),
        progressLabel: `${Math.min(reviews, 1)} / 1 review`,
        code: claimedCode('reviewer'),
      },
      {
        key: 'loyalty',
        title: 'Loyalty Milestone',
        description: 'Spend ₱5,000 on paid rentals and unlock a 12% discount code.',
        requirement: 'Spend ₱5,000 on completed payments',
        target: 5000,
        discountPercent: 12,
        progress: Math.min(lifetimeSpend, 5000),
        progressLabel: `₱${Math.min(lifetimeSpend, 5000).toLocaleString()} / ₱5,000`,
        code: claimedCode('loyalty'),
      },
      {
        key: 'weekend-warrior',
        title: 'Weekend Warrior',
        description: 'Complete three paid weekend rentals and earn 15% off.',
        requirement: 'Complete 3 paid weekend rentals',
        target: 3,
        discountPercent: 15,
        progress: Math.min(weekendBookings, 3),
        progressLabel: `${Math.min(weekendBookings, 3)} / 3 rentals`,
        code: claimedCode('weekend-warrior'),
      },
    ];
  }

  async claimReward(key: RewardKey): Promise<string> {
    const { data, error } = await this.supabase.client.rpc('claim_reward', { reward_key_input: key });
    if (error) throw new Error(error.message);

    const result = data as { code?: unknown } | null;
    if (!result || typeof result.code !== 'string' || !result.code) {
      throw new Error('The reward could not be claimed. Please try again.');
    }
    return result.code;
  }
}
