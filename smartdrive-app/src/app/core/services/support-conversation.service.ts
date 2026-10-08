import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export type ConversationStatus = 'open' | 'ended' | 'expired';

export interface SupportConversation {
  id: string;
  conversation_number: string;
  user_id: string;
  status: ConversationStatus;
  created_at: string;
  last_activity_at: string;
  ended_at: string | null;
}

export interface SupportMessage {
  id: number;
  conversation_id: string;
  sender: 'user' | 'assistant';
  message: string;
  created_at: string;
}

export interface SupportTicket {
  id: number;
  conversation_id: string;
  user_id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  created_at: string;
  updated_at: string;
}

export interface SupportAdminNote {
  id: number;
  conversation_id: string;
  admin_user_id: string;
  note: string;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class SupportConversationService {
  constructor(private readonly supabase: SupabaseService) {}

  async startOrResume(): Promise<SupportConversation> {
    const { data, error } = await this.supabase.client.rpc('start_or_resume_support_conversation');
    if (error?.code === 'PGRST202') {
      throw new Error(
        'Support chat is not set up in Supabase yet. Run smartdrive-app/supabase/support-conversations.sql in the Supabase SQL Editor, then try again.',
      );
    }
    if (error) throw new Error(`Could not start your support conversation: ${error.message}`);
    const conversation = Array.isArray(data) ? data[0] : data;
    if (!conversation) throw new Error('Could not start your support conversation.');
    return conversation as SupportConversation;
  }

  async end(conversationId: string): Promise<SupportConversation> {
    const { data, error } = await this.supabase.client.rpc('end_support_conversation', {
      target_conversation_id: conversationId,
    });
    if (error) throw new Error(`Could not end your support conversation: ${error.message}`);
    const conversation = Array.isArray(data) ? data[0] : data;
    if (!conversation) throw new Error('Could not end your support conversation.');
    return conversation as SupportConversation;
  }

  async listConversations(): Promise<SupportConversation[]> {
    const { data, error } = await this.supabase.client
      .from('support_conversations')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(`Could not load your support history: ${error.message}`);
    return (data ?? []) as SupportConversation[];
  }

  async listMessages(conversationId: string): Promise<SupportMessage[]> {
    const { data, error } = await this.supabase.client
      .from('support_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) throw new Error(`Could not load this conversation: ${error.message}`);
    return (data ?? []) as SupportMessage[];
  }

  async addMessage(conversationId: string, sender: SupportMessage['sender'], message: string): Promise<SupportMessage> {
    const { data, error } = await this.supabase.client
      .from('support_messages')
      .insert({ conversation_id: conversationId, sender, message })
      .select('*')
      .single();
    if (error) throw new Error(`Could not save your message: ${error.message}`);
    return data as SupportMessage;
  }

  async createTicket(conversationId: string, userId: string, subject: string, description: string): Promise<SupportTicket> {
    const { data, error } = await this.supabase.client
      .from('support_tickets')
      .insert({
        conversation_id: conversationId,
        user_id: userId,
        subject: subject.trim(),
        description: description.trim(),
      })
      .select('*')
      .single();
    if (error) throw new Error(`Could not submit your support ticket: ${error.message}`);
    return data as SupportTicket;
  }

  async listTickets(): Promise<SupportTicket[]> {
    const { data, error } = await this.supabase.client
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(`Could not load support tickets: ${error.message}`);
    return (data ?? []) as SupportTicket[];
  }

  async listMyTickets(): Promise<SupportTicket[]> {
    const { data, error } = await this.supabase.client
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(`Could not load your reported problems: ${error.message}`);
    return (data ?? []) as SupportTicket[];
  }

  async updateTicketStatus(ticketId: number, status: SupportTicket['status']): Promise<void> {
    const { error } = await this.supabase.client
      .from('support_tickets')
      .update({ status })
      .eq('id', ticketId);
    if (error) throw new Error(`Could not update ticket status: ${error.message}`);
  }

  async addAdminNote(conversationId: string, adminUserId: string, note: string): Promise<SupportAdminNote> {
    const { data, error } = await this.supabase.client
      .from('support_admin_notes')
      .insert({ conversation_id: conversationId, admin_user_id: adminUserId, note: note.trim() })
      .select('*')
      .single();
    if (error) throw new Error(`Could not save the internal note: ${error.message}`);
    return data as SupportAdminNote;
  }

  async listAdminNotes(conversationId: string): Promise<SupportAdminNote[]> {
    const { data, error } = await this.supabase.client
      .from('support_admin_notes')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) throw new Error(`Could not load internal notes: ${error.message}`);
    return (data ?? []) as SupportAdminNote[];
  }
}
