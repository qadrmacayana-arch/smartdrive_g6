import { Injectable, signal } from '@angular/core';
import { Session } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { AppUser, Profile } from '../models/profile.model';

export interface SignupPayload {
  fullName: string;
  email: string;
  password: string;
  birthday: string;
  address: string;
  gender: string;
  phone: string;
}

const ADMIN_EMAIL = 'admin@smartrentals.com';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly currentUser = signal<AppUser | null>(null);
  readonly initialized = signal(false);

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

  private applySession(session: Session | null): void {
    if (!session?.user) {
      this.currentUser.set(null);
      return;
    }
    const user = session.user;
    this.currentUser.set({
      id: user.id,
      email: user.email ?? '',
      fullName: user.user_metadata?.['full_name'] || user.email?.split('@')[0] || 'Member',
      memberType: user.user_metadata?.['memberType'] || 'Premium',
      registrationDate: user.created_at,
      isAdmin: Boolean(user.user_metadata?.['is_admin']) || user.email === ADMIN_EMAIL,
      birthday: user.user_metadata?.['birthday'] ?? null,
      address: user.user_metadata?.['address'] ?? null,
      gender: user.user_metadata?.['gender'] ?? null,
      phone: user.user_metadata?.['phone'] ?? null,
    });
  }

  async login(email: string, password: string): Promise<void> {
    const { data, error } = await this.supabase.client.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);

    this.supabase.client
      .from('profiles')
      .update({ login_source: 'app', last_login: new Date().toISOString() })
      .eq('id', data.user.id)
      .then(() => void 0);
  }

  async signup(payload: SignupPayload): Promise<{ hasSession: boolean }> {
    const { data, error } = await this.supabase.client.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: {
          full_name: payload.fullName,
          birthday: payload.birthday,
          address: payload.address,
          gender: payload.gender,
          phone: payload.phone,
          memberType: 'Premium',
          login_source: 'app',
        },
      },
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Account created, but the user profile could not be initialized.');

    if (data.session) {
      const profilePayload: Partial<Profile> & { id: string } = {
        id: data.user.id,
        email: payload.email,
        full_name: payload.fullName,
        birthday: payload.birthday,
        address: payload.address,
        gender: payload.gender as Profile['gender'],
        phone: payload.phone,
      };
      const { error: profileError } = await this.supabase.client
        .from('profiles')
        .upsert([profilePayload], { onConflict: 'id' });
      if (profileError) throw new Error(`User profile could not be saved: ${profileError.message}`);
    }

    return { hasSession: Boolean(data.session) };
  }

  async logout(): Promise<void> {
    await this.supabase.client.auth.signOut();
    this.currentUser.set(null);
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

    const { error: authError } = await this.supabase.client.auth.updateUser({
      data: {
        full_name: updates.full_name,
        address: updates.address,
        phone: updates.phone,
        gender: updates.gender,
      },
    });
    if (authError) throw new Error(authError.message);

    const { error } = await this.supabase.client
      .from('profiles')
      .update(updates)
      .eq('id', user.id);
    if (error) throw new Error(error.message);

    this.currentUser.set({
      ...user,
      fullName: updates.full_name ?? user.fullName,
      address: updates.address ?? user.address,
      phone: updates.phone ?? user.phone,
      gender: updates.gender ?? user.gender,
    });
  }
}
