export interface Booking {
  id?: number;
  reference_number: string;
  user_id: string | null;
  customer_email: string;
  customer_name: string;
  customer_phone: string | null;
  vehicle_id: number;
  vehicle_name: string;
  pickup_date: string;
  return_date: string;
  pickup_location: string | null;
  daily_rate: number;
  rental_days: number;
  subtotal: number;
  insurance: number;
  discount: number;
  discount_label: string | null;
  total_price: number;
  payment_method: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  booking_status: 'confirmed' | 'ongoing' | 'completed' | 'cancelled';
  is_pwd_senior: boolean;
  rating?: number | null;
  notes?: string | null;
  created_at?: string;
}

/** In-progress booking state carried across the multi-step booking flow. */
export interface BookingDraft {
  vehicle: {
    id: number;
    name: string;
    price: number;
    srPoints: number;
    image: string | null;
  };
  pickupDate: string;
  returnDate: string;
  rentalDays: number;
  pickupLocation: string;
  customer?: {
    name: string;
    email: string;
    phone: string;
    isPwdSenior: boolean;
  };
  pricing?: {
    subtotal: number;
    insurance: number;
    discount: number;
    discountLabel: string;
    total: number;
  };
  promoCode?: { code: string; discountPercent: number; description: string } | null;
}
