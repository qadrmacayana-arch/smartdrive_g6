export interface WalletBalance {
  user_id: string;
  email: string;
  balance: number;
  total_earned: number;
  total_spent: number;
}

export interface WalletTransaction {
  id?: number;
  user_id: string | null;
  email: string;
  type: 'top_up' | 'payment' | 'reward' | 'refund' | 'adjustment';
  description: string;
  amount: number;
  payment_method?: string | null;
  reference?: string | null;
  balance_before: number;
  balance_after: number;
  status: 'pending' | 'completed' | 'failed';
  created_at?: string;
}
