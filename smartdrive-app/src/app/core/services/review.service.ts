import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Review } from '../models/review.model';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  constructor(private readonly supabase: SupabaseService) {}

  async listRecent(limit = 20): Promise<Review[]> {
    const { data, error } = await this.supabase.client
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data ?? []) as Review[];
  }

  async submit(review: Review): Promise<Review> {
    const { data, error } = await this.supabase.client.from('reviews').insert([review]).select().single();
    if (error) throw new Error(error.message);
    return data as Review;
  }
}
