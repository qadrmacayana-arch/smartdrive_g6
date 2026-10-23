export interface Booking {
  id?: number;
  reference_number: string;
  user_id: string | null;
  customer_email: string;
  customer_name: string;
  customer_phone: string | null;
  customer_address?: string | null;
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
  promo_code?: string | null;
  total_price: number;
  payment_method: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymongo_checkout_session_id?: string | null;
  paymongo_payment_id?: string | null;
  test_auto_confirmed?: boolean;
  booking_status: 'confirmed' | 'ongoing' | 'completed' | 'cancelled';
  is_pwd_discount?: boolean;
  is_pwd_senior?: boolean;
  pwd_senior_cashback_status?: 'not_applicable' | 'pending_verification' | 'credited' | 'declined';
  pwd_senior_cashback_amount?: number;
  driver_age?: number | null;
  booking_conditions_accepted?: boolean;
  booking_conditions_accepted_at?: string | null;
  rating?: number | null;
  notes?: string | null;
  created_at?: string;
}

export const BOOKING_SELECT_FIELDS =
  'id,reference_number,user_id,customer_email,customer_name,customer_phone,customer_address,vehicle_id,vehicle_name,pickup_date,return_date,pickup_location,daily_rate,rental_days,subtotal,insurance,discount,discount_label,promo_code,total_price,payment_method,payment_status,paymongo_checkout_session_id,paymongo_payment_id,test_auto_confirmed,booking_status,is_pwd_discount,is_pwd_senior,pwd_senior_cashback_status,pwd_senior_cashback_amount,driver_age,booking_conditions_accepted,booking_conditions_accepted_at,rating,notes,created_at';

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
    address?: string | null;
    isPwdSenior: boolean;
    driverAge: number;
    driverBirthDate?: string;
    conditionsAccepted: boolean;
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
