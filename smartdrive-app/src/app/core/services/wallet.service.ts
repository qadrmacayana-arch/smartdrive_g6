import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { WalletBalance, WalletTransaction } from '../models/wallet.model';
import { DemoTrackingService } from './demo-tracking.service';

@Injectable({ providedIn: 'root' })
export class WalletService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly demoTracking: DemoTrackingService,
  ) {}

  async getOrCreateBalance(userId: string, email: string): Promise<WalletBalance> {
    const { data, error } = await this.supabase.client
      .from('wallet_balances')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data) return data as WalletBalance;

    const fresh: WalletBalance = { user_id: userId, email, balance: 0, total_earned: 0, total_spent: 0 };
    const { data: created, error: insertError } = await this.supabase.client
      .from('wallet_balances')
      .insert([fresh])
      .select()
      .single();
    if (insertError) throw new Error(insertError.message);
    return created as WalletBalance;
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

  private async recordTransaction(
    userId: string,
    email: string,
    type: WalletTransaction['type'],
    description: string,
    amount: number,
    paymentMethod: string | null,
    reference: string | null,
  ): Promise<WalletBalance> {
    const current = await this.getOrCreateBalance(userId, email);
    const balanceBefore = Number(current.balance);
    const balanceAfter = balanceBefore + amount;
    if (balanceAfter < 0) throw new Error('Insufficient SR Points balance.');

    const transaction: WalletTransaction = {
      user_id: userId,
      email,
      type,
      description,
      amount,
      payment_method: paymentMethod,
      reference,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      status: 'completed',
    };
    const { error: txError } = await this.supabase.client.from('wallet_transactions').insert([transaction]);
    if (txError) throw new Error(txError.message);

    const updates: Partial<WalletBalance> = {
      balance: balanceAfter,
      total_earned: Number(current.total_earned) + Math.max(amount, 0),
      total_spent: Number(current.total_spent) + Math.max(-amount, 0),
    };
    const { data: updated, error: updateError } = await this.supabase.client
      .from('wallet_balances')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();
    if (updateError) throw new Error(updateError.message);
    this.demoTracking.recordTransaction(userId, description);
    return updated as WalletBalance;
  }

  topUp(userId: string, email: string, amount: number, paymentMethod: string): Promise<WalletBalance> {
    return this.recordTransaction(userId, email, 'top_up', `Top-up via ${paymentMethod}`, Math.abs(amount), paymentMethod, null);
  }

  earnPoints(userId: string, email: string, points: number, description: string, reference: string): Promise<WalletBalance> {
    if (points <= 0) return this.getOrCreateBalance(userId, email);
    return this.recordTransaction(userId, email, 'reward', description, Math.abs(points), null, reference);
  }

  spendPoints(userId: string, email: string, amount: number, description: string, reference: string): Promise<WalletBalance> {
    return this.recordTransaction(userId, email, 'payment', description, -Math.abs(amount), 'srpoints', reference);
  }
}
