import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface PublicSiteSettings {
  supportEmail: string;
  supportPhone: string;
}

const DEFAULT_PUBLIC_SETTINGS: PublicSiteSettings = {
  supportEmail: 'smartdriveteam@smartdrive.com',
  supportPhone: '',
};

@Injectable({ providedIn: 'root' })
export class SiteSettingsService {
  constructor(private readonly supabase: SupabaseService) {}

  async getPublicSettings(): Promise<PublicSiteSettings> {
    const { data, error } = await this.supabase.client
      .from('site_settings')
      .select('setting_key,setting_value')
      .in('setting_key', ['support_email', 'support_phone']);
    if (error) throw new Error(error.message);

    const values = new Map((data ?? []).map((setting) => [setting.setting_key, setting.setting_value]));
    return {
      supportEmail: values.get('support_email')?.trim() || DEFAULT_PUBLIC_SETTINGS.supportEmail,
      supportPhone: values.get('support_phone')?.trim() || DEFAULT_PUBLIC_SETTINGS.supportPhone,
    };
  }
}
