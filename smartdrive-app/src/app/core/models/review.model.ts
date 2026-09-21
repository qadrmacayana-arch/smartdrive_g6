export interface Review {
  id?: number;
  user_id: string | null;
  booking_id: number | null;
  customer_email: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  created_at?: string;
}
