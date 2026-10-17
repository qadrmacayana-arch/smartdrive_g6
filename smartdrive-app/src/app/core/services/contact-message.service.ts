import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface ContactMessage {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface NewContactMessage {
  full_name: string;
  email: string;
  subject: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ContactMessageService {
  constructor(private readonly supabase: SupabaseService) {}

  async submit(message: NewContactMessage): Promise<void> {
    const { error } = await this.supabase.client.from('contact_messages').insert({
      full_name: message.full_name.trim(),
      email: message.email.trim().toLowerCase(),
      subject: message.subject.trim(),
      message: message.message.trim(),
    });
    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') {
        throw new Error('Contact messaging is not configured in Supabase yet. Run smartdrive-app/supabase/contact-messages.sql, then try again.');
      }
      throw new Error(`Could not send your message: ${error.message}`);
    }
  }

  async listForAdmin(): Promise<ContactMessage[]> {
    const { data, error } = await this.supabase.client
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(`Could not load contact messages: ${error.message}`);
    return (data ?? []) as ContactMessage[];
  }

  async markRead(id: number, isRead: boolean): Promise<void> {
    const { error } = await this.supabase.client
      .from('contact_messages')
      .update({ is_read: isRead })
      .eq('id', id);
    if (error) throw new Error(`Could not update contact message: ${error.message}`);
  }
}
