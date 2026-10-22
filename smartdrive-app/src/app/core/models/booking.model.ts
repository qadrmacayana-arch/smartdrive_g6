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
  test_auto_confirmed?: boolean;
  booking_status: 'confirmed' | 'ongoing' | 'completed' | 'cancelled';
  is_pwd_senior: boolean;
  driver_age?: number | null;
  renter_type?: 'local' | 'foreign-tourist' | null;
  driver_license_type?: string | null;
  driver_license_number?: string | null;
  driver_license_country?: string | null;
  driver_license_expiry?: string | null;
  license_verification_status?: 'not_provided' | 'pending' | 'verified' | 'rejected';
  foreign_license_support?: 'not-required' | 'idp' | 'embassy-translation' | null;
  philippines_arrival_date?: string | null;
  driver_license_confirmed?: boolean;
  booking_documents_ready?: boolean;
  booking_conditions_accepted?: boolean;
  booking_conditions_accepted_at?: string | null;
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
    address?: string | null;
    isPwdSenior: boolean;
    driverAge: number;
    driverBirthDate?: string;
    renterType: 'local' | 'foreign-tourist';
    driverLicenseType: string;
    driverLicenseCountry: string | null;
    foreignLicenseSupport: 'not-required' | 'idp' | 'embassy-translation' | null;
    philippinesArrivalDate: string | null;
    documentsReady: boolean;
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
