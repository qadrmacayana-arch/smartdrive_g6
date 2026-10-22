import { Injectable } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
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
    const { data: authData, error: authError } = await this.supabase.client.auth.getUser();
    if (authError) {
      throw new Error(`Could not verify your account for contact messaging: ${authError.message}`);
    }
    const email = authData.user?.email?.trim().toLowerCase();
    if (!email) {
      throw new Error('Contact form submissions require an online SmartDrive account. Sign in with your cloud account or email smartdriveteam@smartdrive.com directly.');
    }
    if (message.email.trim().toLowerCase() !== email) {
      throw new Error('Your contact form account no longer matches your active sign-in. Sign out, sign in again, and retry.');
    }

    const fullName = message.full_name.trim()
      || String(authData.user.user_metadata?.['full_name'] ?? '').trim()
      || email.split('@')[0];
    if (fullName.length < 1 || fullName.length > 120) {
      throw new Error('Your account name must be between 1 and 120 characters to send a contact message.');
    }
    const subject = message.subject.trim();
    const body = message.message.trim();
    if (subject.length < 3 || subject.length > 120 || body.length < 5 || body.length > 2000) {
      throw new Error('Enter a subject (3–120 characters) and a message (5–2,000 characters).');
    }

    const { error } = await this.supabase.client.from('contact_messages').insert({
      full_name: fullName,
      email,
      subject,
      message: body,
    });
    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') {
        throw new Error('Contact messaging is not configured in Supabase yet. Run smartdrive-app/supabase/contact-messages.sql, then try again.');
      }
      if (error.code === '42501') {
        throw new Error('Supabase rejected the message under its contact-message access policy. Run smartdrive-app/supabase/contact-messages.sql in the Supabase SQL Editor, then sign in again and retry.');
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

  async countUnreadForAdmin(): Promise<number> {
    const { count, error } = await this.supabase.client
      .from('contact_messages')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false);
    if (error) throw new Error(`Could not load unread contact-message count: ${error.message}`);
    return count ?? 0;
  }

  watchForNewMessages(onMessage: (message: ContactMessage) => void): RealtimeChannel {
    return this.supabase.client
      .channel('admin-contact-message-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'contact_messages' },
        (payload) => onMessage(payload.new as ContactMessage),
      )
      .subscribe();
  }

  async markRead(id: number, isRead: boolean): Promise<void> {
    const { error } = await this.supabase.client
      .from('contact_messages')
      .update({ is_read: isRead })
      .eq('id', id);
    if (error) throw new Error(`Could not update contact message: ${error.message}`);
  }
}
