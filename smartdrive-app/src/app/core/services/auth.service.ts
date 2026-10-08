import { Injectable, signal } from '@angular/core';
import { Session } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { AppUser, Profile } from '../models/profile.model';

export interface SignupPayload {
  fullName: string;
  firstName: string;
  middleName: string;
  surname: string;
  suffix: string;
  email: string;
  password: string;
  birthday: string;
  address: string;
  regionCode: string;
  region: string;
  provinceCode: string;
  province: string;
  cityCode: string;
  city: string;
  barangayCode: string;
  barangay: string;
  gender: string;
  phone: string;
}

const ADMIN_EMAIL = 'admin@smartrentals.com';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly currentUser = signal<AppUser | null>(null);
  readonly initialized = signal(false);

  needsGoogleProfileCompletion(): boolean {
    const user = this.currentUser();
    return Boolean(user?.isGoogleAccount && !(
      user.firstName
      && user.surname
      && user.birthday
      && user.address
      && user.region
      && user.city
      && user.barangay
      && user.gender
      && user.phone
    ));
  }

  constructor(private readonly supabase: SupabaseService) {
    this.supabase.client.auth.onAuthStateChange((_event, session) => {
      this.applySession(session);
      this.initialized.set(true);
    });
    this.supabase.client.auth.getSession().then(({ data }) => {
      this.applySession(data.session);
      this.initialized.set(true);
    });
  }

  private async hashPassword(password: string): Promise<string> {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
      return Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
    }

    private saveLegacyUser(payload: {
      id?: string;
      email: string;
      fullName: string;
      firstName?: string;
      middleName?: string;
      surname?: string;
      suffix?: string;
      birthday?: string;
      address?: string;
      region?: string;
      regionName?: string;
      province?: string;
      provinceName?: string;
      city?: string;
      cityName?: string;
      barangay?: string;
      barangayName?: string;
      gender?: string;
      phone?: string;
      registrationDate?: string;
      passwordHash?: string;
    }): void {
      const users = JSON.parse(localStorage.getItem('users') || '[]') as Array<Record<string, unknown>>;
      const existingIndex = users.findIndex((user) => user['email'] === payload.email);
      const user = {
        ...payload,
        name: payload.fullName,
        memberType: 'Premium',
        registrationDate: payload.registrationDate ?? new Date().toISOString(),
      };
      if (existingIndex >= 0) users[existingIndex] = { ...users[existingIndex], ...user };
      else users.push(user);
      localStorage.setItem('users', JSON.stringify(users));
  }

  private applySession(session: Session | null): void {
    if (!session?.user) {
      this.currentUser.set(null);
      return;
    }

    const user = session.user;
    const fullName = user.user_metadata?.['full_name']
      || user.user_metadata?.['name']
      || user.email?.split('@')[0]
      || 'Member';
    const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
    const memberType = user.user_metadata?.['memberType'] || 'Premium';
    const avatarUrl = this.getAvatarUrl(user.user_metadata);
    this.currentUser.set({
      id: user.id,
      email: user.email ?? '',
      fullName,
      avatarUrl,
      memberType,
      registrationDate: user.created_at,
      isAdmin: Boolean(user.user_metadata?.['is_admin']) || user.email === ADMIN_EMAIL,
      isGoogleAccount: user.app_metadata['provider'] === 'google'
        || Boolean(user.app_metadata['providers']?.includes('google')),
      birthday: user.user_metadata?.['birthday'] ?? null,
      address: user.user_metadata?.['address'] ?? null,
      firstName: user.user_metadata?.['first_name']
        ?? user.user_metadata?.['given_name']
        ?? nameParts[0]
        ?? null,
      middleName: user.user_metadata?.['middle_name'] ?? null,
      surname: user.user_metadata?.['surname']
        ?? user.user_metadata?.['family_name']
        ?? (nameParts.length > 1 ? nameParts.slice(1).join(' ') : null),
      suffix: user.user_metadata?.['suffix'] ?? null,
      region: user.user_metadata?.['region'] ?? null,
      regionName: user.user_metadata?.['region_name'] ?? user.user_metadata?.['region'] ?? null,
      province: user.user_metadata?.['province'] ?? null,
      provinceName: user.user_metadata?.['province_name'] ?? user.user_metadata?.['province'] ?? null,
      city: user.user_metadata?.['city'] ?? null,
      cityName: user.user_metadata?.['city_name'] ?? user.user_metadata?.['city'] ?? null,
      barangay: user.user_metadata?.['barangay'] ?? null,
      barangayName: user.user_metadata?.['barangay_name'] ?? user.user_metadata?.['barangay'] ?? null,
      gender: user.user_metadata?.['gender'] ?? null,
      phone: user.user_metadata?.['phone'] ?? null,
    });
    const legacyUser = {
      id: user.id,
      email: user.email ?? '',
      fullName,
      memberType,
      registrationDate: user.created_at,
      isAdmin: Boolean(user.user_metadata?.['is_admin']) || user.email === ADMIN_EMAIL,
      loginTime: new Date().toISOString(),
    };
    sessionStorage.setItem('user', JSON.stringify(legacyUser));
    localStorage.setItem('smartdriveUser', JSON.stringify(legacyUser));
  }

  private getAvatarUrl(metadata: Record<string, unknown>): string | null {
    for (const key of ['picture', 'avatar_url', 'photo_url']) {
      const value = metadata[key];
      if (typeof value === 'string' && value.trim()) return value;
    }
    return null;
  }

  async updateAvatar(file: File): Promise<void> {
    const user = this.currentUser();
    if (!user) throw new Error('You must be signed in to change your profile photo.');
    if (user.id.startsWith('local-')) {
      throw new Error('Profile photo uploads require a cloud account. Sign in with your SmartDrive account and try again.');
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      throw new Error('Choose a JPG, PNG, or WebP image.');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Choose an image smaller than 5 MB.');
    }

    const path = `${user.id}/profile`;
    const { error: uploadError } = await this.supabase.client.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type, cacheControl: '3600' });
    if (uploadError) throw new Error(`Could not upload profile photo: ${uploadError.message}`);

    const publicUrl = this.supabase.client.storage.from('avatars').getPublicUrl(path).data.publicUrl;
    const avatarUrl = `${publicUrl}?v=${Date.now()}`;
    const { error: metadataError } = await this.supabase.client.auth.updateUser({
      data: { avatar_url: avatarUrl, avatar_path: path },
    });
    if (metadataError) throw new Error(`Photo uploaded, but could not save it to your account: ${metadataError.message}`);

    const updatedUser = { ...user, avatarUrl };
    this.currentUser.set(updatedUser);
    sessionStorage.setItem('user', JSON.stringify(updatedUser));
    localStorage.setItem('smartdriveUser', JSON.stringify(updatedUser));
    const users = JSON.parse(localStorage.getItem('users') || '[]') as Array<Record<string, unknown>>;
    const userIndex = users.findIndex((legacyUser) => legacyUser['email'] === user.email);
    if (userIndex >= 0) {
      users[userIndex] = { ...users[userIndex], avatarUrl };
      localStorage.setItem('users', JSON.stringify(users));
    }
  }

  async login(email: string, password: string): Promise<void> {
    const { data, error } = await this.supabase.client.auth.signInWithPassword({ email, password });
    if (error) {
      const localUsers = JSON.parse(localStorage.getItem('users') || '[]') as Array<Record<string, string>>;
      const passwordHash = await this.hashPassword(password);
      const localUser = localUsers.find(
        (user) => user['email'] === email && (user['passwordHash'] === passwordHash || user['password'] === password),
      );
      if (localUser) {
        const appUser: AppUser = {
          id: localUser['id'] || `local-${email}`,
          email,
          fullName: localUser['fullName'] || localUser['name'] || email.split('@')[0],
          avatarUrl: localUser['avatarUrl'] || null,
          memberType: localUser['memberType'] || 'Premium',
          registrationDate: localUser['registrationDate'] || new Date().toISOString(),
          isAdmin: email === ADMIN_EMAIL,
          birthday: localUser['birthday'] || null,
          address: localUser['address'] || null,
          firstName: localUser['firstName'] || null,
          middleName: localUser['middleName'] || null,
          surname: localUser['surname'] || null,
          suffix: localUser['suffix'] || null,
          region: localUser['region'] || null,
          regionName: localUser['regionName'] || localUser['region'] || null,
          province: localUser['province'] || null,
          provinceName: localUser['provinceName'] || localUser['province'] || null,
          city: localUser['city'] || null,
          cityName: localUser['cityName'] || localUser['city'] || null,
          barangay: localUser['barangay'] || null,
          barangayName: localUser['barangayName'] || localUser['barangay'] || null,
          gender: localUser['gender'] || null,
          phone: localUser['phone'] || null,
        };
        this.currentUser.set(appUser);
        sessionStorage.setItem('user', JSON.stringify(appUser));
        localStorage.setItem('smartdriveUser', JSON.stringify(appUser));
        return;
      }
      const message = error.message.toLowerCase().includes('email not confirmed')
        ? 'Please confirm your email address before signing in.'
        : error.message.toLowerCase().includes('invalid login credentials')
          ? 'The email or password is incorrect.'
          : error.message;
      throw new Error(message);
    }

    this.supabase.client
      .from('profiles')
      .update({ login_source: 'app', last_login: new Date().toISOString() })
      .eq('id', data.user.id)
      .then(() => void 0);
  }

  async signInWithGoogle(intent: 'login' | 'registration' = 'login'): Promise<void> {
    const oauthIntentKey = 'smartdrive_google_oauth_intent';
    localStorage.setItem(oauthIntentKey, intent);
    localStorage.setItem(`${oauthIntentKey}_started_at`, String(Date.now()));
    const { error } = await this.supabase.client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) {
      localStorage.removeItem(oauthIntentKey);
      localStorage.removeItem(`${oauthIntentKey}_started_at`);
      throw new Error(error.message);
    }
  }

  async completeGoogleSignup(payload: SignupPayload): Promise<void> {
    const { data: userData, error: userError } = await this.supabase.client.auth.getUser();
    const user = userData.user;
    if (userError || !user) throw new Error('Your Google session has expired. Sign in with Google again to finish registration.');
    if (user.app_metadata['provider'] !== 'google' && !user.app_metadata['providers']?.includes('google')) {
      throw new Error('Google registration can only be completed from a Google sign-in session.');
    }
    if (user.email?.toLowerCase() !== payload.email.toLowerCase()) {
      throw new Error('The registration email does not match the signed-in Google account.');
    }

    const profileMetadata = {
      full_name: payload.fullName,
      first_name: payload.firstName,
      middle_name: payload.middleName,
      surname: payload.surname,
      suffix: payload.suffix,
      birthday: payload.birthday,
      address: payload.address,
      region: payload.regionCode,
      region_name: payload.region,
      province: payload.provinceCode,
      province_name: payload.province,
      city: payload.cityCode,
      city_name: payload.city,
      barangay: payload.barangayCode,
      barangay_name: payload.barangay,
      gender: payload.gender,
      phone: payload.phone,
      memberType: 'Premium',
      login_source: 'app',
    };
    const { error: updateError } = await this.supabase.client.auth.updateUser({
      data: profileMetadata,
    });
    if (updateError) throw new Error(`Could not finish Google registration: ${updateError.message}`);

    const profilePayload: Partial<Profile> & { id: string } = {
      id: user.id,
      email: user.email!,
      full_name: payload.fullName,
      first_name: payload.firstName,
      middle_name: payload.middleName || null,
      surname: payload.surname,
      suffix: payload.suffix || null,
      birthday: payload.birthday,
      address: payload.address,
      region: payload.regionCode,
      region_name: payload.region,
      province: payload.provinceCode || null,
      province_name: payload.province || null,
      city: payload.cityCode,
      city_name: payload.city,
      barangay: payload.barangayCode,
      barangay_name: payload.barangay,
      gender: payload.gender as Profile['gender'],
      phone: payload.phone,
      member_type: 'Premium',
      login_source: 'app',
    };
    const { error: profileError } = await this.supabase.client
      .from('profiles')
      .upsert([profilePayload], { onConflict: 'id' });
    if (profileError) throw new Error(`Google account created, but its profile could not be saved: ${profileError.message}`);

    this.saveLegacyUser({
      id: user.id,
      email: payload.email,
      fullName: payload.fullName,
      firstName: payload.firstName,
      middleName: payload.middleName,
      surname: payload.surname,
      suffix: payload.suffix,
      birthday: payload.birthday,
      address: payload.address,
      region: payload.regionCode,
      regionName: payload.region,
      province: payload.provinceCode,
      provinceName: payload.province,
      city: payload.cityCode,
      cityName: payload.city,
      barangay: payload.barangayCode,
      barangayName: payload.barangay,
      gender: payload.gender,
      phone: payload.phone,
      registrationDate: user.created_at,
      passwordHash: await this.hashPassword(payload.password),
    });
  }

  async signup(payload: SignupPayload): Promise<{ hasSession: boolean }> {
    const localUsers = JSON.parse(localStorage.getItem('users') || '[]') as Array<Record<string, unknown>>;
    if (localUsers.some((user) => String(user['email'] ?? '').toLowerCase() === payload.email.toLowerCase())) {
      throw new Error('An account with that email already exists.');
    }

    const { data, error } = await this.supabase.client.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: {
          full_name: payload.fullName,
          first_name: payload.firstName,
          middle_name: payload.middleName,
          surname: payload.surname,
          suffix: payload.suffix,
          birthday: payload.birthday,
          address: payload.address,
          region: payload.regionCode,
          region_name: payload.region,
          province: payload.provinceCode,
          province_name: payload.province,
          city: payload.cityCode,
          city_name: payload.city,
          barangay: payload.barangayCode,
          barangay_name: payload.barangay,
          gender: payload.gender,
          phone: payload.phone,
          memberType: 'Premium',
          login_source: 'app',
        },
      },
    });
    if (error) {
      if (error.message === 'Database error saving new user') {
        throw new Error(
          'Supabase could not create the profile record. Run supabase/fix-google-auth-profile-trigger.sql in the Supabase SQL Editor, then try again.',
        );
      }
      throw new Error(error.message);
    }
    if (!data.user) throw new Error('Account created, but the user profile could not be initialized.');
    if (data.user.identities?.length === 0) {
      throw new Error('An account with that email already exists. Try logging in or resetting your password.');
    }

    if (data.session) {
      const profilePayload: Partial<Profile> & { id: string } = {
        id: data.user.id,
        email: payload.email,
        full_name: payload.fullName,
        first_name: payload.firstName,
        middle_name: payload.middleName,
        surname: payload.surname,
        suffix: payload.suffix,
        birthday: payload.birthday,
        address: payload.address,
        region: payload.regionCode,
        region_name: payload.region,
        province: payload.provinceCode,
        province_name: payload.province,
        city: payload.cityCode,
        city_name: payload.city,
        barangay: payload.barangayCode,
        barangay_name: payload.barangay,
        gender: payload.gender as Profile['gender'],
        phone: payload.phone,
      };
      const { error: profileError } = await this.supabase.client
        .from('profiles')
        .upsert([profilePayload], { onConflict: 'id' });
      if (profileError) throw new Error(`User profile could not be saved: ${profileError.message}`);
    }

    this.saveLegacyUser({
      id: data.user.id,
      email: payload.email,
      fullName: payload.fullName,
      firstName: payload.firstName,
      middleName: payload.middleName,
      surname: payload.surname,
      suffix: payload.suffix,
      birthday: payload.birthday,
      address: payload.address,
      region: payload.regionCode,
      regionName: payload.region,
      province: payload.provinceCode,
      provinceName: payload.province,
      city: payload.cityCode,
      cityName: payload.city,
      barangay: payload.barangayCode,
      barangayName: payload.barangay,
      gender: payload.gender,
      phone: payload.phone,
      registrationDate: data.user.created_at,
      passwordHash: await this.hashPassword(payload.password),
    });

    return { hasSession: Boolean(data.session) };
  }

  async logout(): Promise<void> {
    await this.supabase.client.auth.signOut();
    this.currentUser.set(null);
    sessionStorage.removeItem('user');
    localStorage.removeItem('smartdriveUser');
  }

  async requestPasswordReset(email: string): Promise<void> {
    const { error } = await this.supabase.client.auth.resetPasswordForEmail(email);
    if (error) throw new Error(error.message);
  }

  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await this.supabase.client.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  }

  async updateProfile(updates: Partial<Profile>): Promise<void> {
    const user = this.currentUser();
    if (!user) throw new Error('You must be signed in.');

    if (user.id.startsWith('local-')) {
      this.saveLegacyUser({
        id: user.id,
        email: user.email,
        fullName: updates.full_name ?? user.fullName,
        firstName: updates.first_name ?? user.firstName ?? '',
        middleName: updates.middle_name ?? user.middleName ?? '',
        surname: updates.surname ?? user.surname ?? '',
        suffix: updates.suffix ?? user.suffix ?? '',
        birthday: updates.birthday ?? user.birthday ?? '',
        address: updates.address ?? user.address ?? '',
        region: updates.region ?? user.region ?? '',
        regionName: updates.region_name ?? user.regionName ?? '',
        province: updates.province ?? user.province ?? '',
        provinceName: updates.province_name ?? user.provinceName ?? '',
        city: updates.city ?? user.city ?? '',
        cityName: updates.city_name ?? user.cityName ?? '',
        barangay: updates.barangay ?? user.barangay ?? '',
        barangayName: updates.barangay_name ?? user.barangayName ?? '',
        gender: updates.gender ?? user.gender ?? '',
        phone: updates.phone ?? user.phone ?? '',
      });
    } else {
      const { error: authError } = await this.supabase.client.auth.updateUser({
        data: {
          full_name: updates.full_name,
          first_name: updates.first_name,
          middle_name: updates.middle_name,
          surname: updates.surname,
          suffix: updates.suffix,
          birthday: updates.birthday,
          address: updates.address,
          phone: updates.phone,
          gender: updates.gender,
          region: updates.region,
          region_name: updates.region_name,
          province: updates.province,
          province_name: updates.province_name,
          city: updates.city,
          city_name: updates.city_name,
          barangay: updates.barangay,
          barangay_name: updates.barangay_name,
        },
      });
      if (authError) throw new Error(authError.message);

      const { error } = await this.supabase.client
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      if (error) throw new Error(error.message);
    }

    const updatedUser: AppUser = {
      ...user,
      fullName: updates.full_name ?? user.fullName,
      address: updates.address ?? user.address,
      firstName: updates.first_name ?? user.firstName,
      middleName: updates.middle_name ?? user.middleName,
      surname: updates.surname ?? user.surname,
      suffix: updates.suffix ?? user.suffix,
      region: updates.region ?? user.region,
      regionName: updates.region_name ?? user.regionName,
      province: updates.province ?? user.province,
      provinceName: updates.province_name ?? user.provinceName,
      city: updates.city ?? user.city,
      cityName: updates.city_name ?? user.cityName,
      barangay: updates.barangay ?? user.barangay,
      barangayName: updates.barangay_name ?? user.barangayName,
      phone: updates.phone ?? user.phone,
      gender: updates.gender ?? user.gender,
    };
    this.currentUser.set(updatedUser);
    sessionStorage.setItem('user', JSON.stringify(updatedUser));
    localStorage.setItem('smartdriveUser', JSON.stringify(updatedUser));
  }
}
