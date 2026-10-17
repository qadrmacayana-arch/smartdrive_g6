import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { WalletBalance, WalletTransaction } from '../models/wallet.model';

@Injectable({ providedIn: 'root' })
export class WalletService {
  constructor(private readonly supabase: SupabaseService) {}

  async getOrCreateBalance(userId: string, email: string): Promise<WalletBalance> {
    const { data, error } = await this.supabase.client
      .from('wallet_balances')
      .select('*')
      .eq('user_id', userId)
      .order('id', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data) return data as WalletBalance;

    return { user_id: userId, email, balance: 0, total_earned: 0, total_spent: 0 };
  }

  async getTransactions(userId: string): Promise<WalletTransaction[]> {
    const { data, error } = await this.supabase.client
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as WalletTransaction[];
  }

  async spendPoints(amount: number, reference: string): Promise<WalletBalance> {
    const { data, error } = await this.supabase.client.rpc('spend_sr_points', {
      target_reference: reference,
      target_amount: amount,
    });
    if (error) {
      if (error.code === 'PGRST202') {
        throw new Error('SR Points payments are not configured in Supabase yet. Run smartdrive-app/supabase/booking-earned-points.sql, then try again.');
      }
      throw new Error(error.message);
    }
    if (!data || typeof data !== 'object') throw new Error('SR Points payment could not be confirmed.');
    return data as WalletBalance;
  }
}
