export interface Profile {
  id: string;
  email: string;
  full_name: string;
  birthday: string | null;
  address: string | null;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  phone: string | null;
  member_type: string;
  registration_date: string;
  is_active: boolean;
}

export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  memberType: string;
  registrationDate: string;
  isAdmin: boolean;
  birthday?: string | null;
  address?: string | null;
  gender?: string | null;
  phone?: string | null;
}
