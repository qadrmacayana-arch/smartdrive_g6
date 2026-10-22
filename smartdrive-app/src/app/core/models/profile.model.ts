export interface Profile {
  id: string;
  email: string;
  full_name: string;
  first_name?: string | null;
  middle_name?: string | null;
  surname?: string | null;
  suffix?: string | null;
  birthday: string | null;
  address: string | null;
  region?: string | null;
  region_name?: string | null;
  province?: string | null;
  province_name?: string | null;
  city?: string | null;
  city_name?: string | null;
  barangay?: string | null;
  barangay_name?: string | null;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  phone: string | null;
  member_type: string;
  login_source?: 'web' | 'app' | 'unknown' | null;
  registration_date: string;
  is_active: boolean;
}

export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  memberType: string;
  registrationDate: string;
  isAdmin: boolean;
  isGoogleAccount?: boolean;
  birthday?: string | null;
  address?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  surname?: string | null;
  suffix?: string | null;
  region?: string | null;
  regionName?: string | null;
  province?: string | null;
  provinceName?: string | null;
  city?: string | null;
  cityName?: string | null;
  barangay?: string | null;
  barangayName?: string | null;
  gender?: string | null;
  phone?: string | null;
}
