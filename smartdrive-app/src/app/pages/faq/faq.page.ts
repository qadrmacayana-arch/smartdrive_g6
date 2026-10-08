import { Component, ElementRef, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { chatbubblesOutline, sendOutline } from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import {
  SupportConversation,
  SupportConversationService,
  SupportMessage,
  SupportTicket,
} from '../../core/services/support-conversation.service';

interface FaqItem {
  q: string;
  a: string;
  keywords: string[];
}

interface ChatMessage {
  role: 'bot' | 'user';
  text: string;
  createdAt?: string;
}

const WELCOME_MESSAGE = 'Hi! I’m the SmartDrive help assistant. Ask me about booking, payments, cancellations, your booking history, or contacting support.';
const FAQ_ITEMS: FaqItem[] = [
  {
    q: 'How do I book a vehicle?',
    a: 'To book, go to Home, choose a vehicle and your dates, then follow the checkout steps to confirm your booking.',
    keywords: ['book', 'booking', 'reserve', 'reservation', 'rent', 'vehicle', 'car', 'motorcycle', 'dates'],
  },
  {
    q: 'What payment methods can I use?',
    a: 'We accept major credit cards, GCash, Maya, and SR Points from your wallet. Payment options are shown at checkout.',
    keywords: ['payment', 'pay', 'gcash', 'maya', 'card', 'credit', 'wallet', 'points', 'sr points', 'price', 'cost'],
  },
  {
    q: 'Can I cancel my booking?',
    a: 'Cancellations are accepted up to 24 hours before pickup from the Bookings tab; fees may apply depending on the booking terms.',
    keywords: ['cancel', 'cancellation', 'refund', 'change', 'modify', 'reschedule'],
  },
  {
    q: 'How do I view my booking history?',
    a: 'Open the Bookings tab to see past and upcoming reservations.',
    keywords: ['history', 'past', 'upcoming', 'my booking', 'my bookings', 'reservation status', 'status'],
  },
  {
    q: 'How do I contact support?',
    a: 'Reach us at contact@smartdrive.com or (+63) 917 123 4567, available 24/7.',
    keywords: ['support', 'help', 'contact', 'email', 'phone', 'call', 'agent', 'staff', 'human'],
  },
];

const SUGGESTED_QUESTIONS = [
  'How do I book a vehicle?',
  'What payment methods can I use?',
  'Can I cancel my booking?',
];

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonIcon,
    IonButton,
    IonInput,
    IonSpinner,
    IonTextarea,
  ],
  templateUrl: './faq.page.html',
  styleUrl: './faq.page.scss',
})
export class FaqPage implements OnInit, OnDestroy {
  @ViewChild('chatMessages') private chatMessages?: ElementRef<HTMLDivElement>;

  readonly chatIcon = chatbubblesOutline;
  readonly sendIcon = sendOutline;
  readonly currentUser = this.auth.currentUser;
  readonly items = FAQ_ITEMS;
  readonly openIndex = signal<number | null>(0);
  readonly suggestedQuestions = SUGGESTED_QUESTIONS;
  readonly messages = signal<ChatMessage[]>([]);
  readonly conversations = signal<SupportConversation[]>([]);
  readonly tickets = signal<SupportTicket[]>([]);
  readonly conversation = signal<SupportConversation | null>(null);
  readonly viewedConversationId = signal<string | null>(null);
  readonly draft = signal('');
  readonly loadingConversation = signal(true);
  readonly sending = signal(false);
  readonly ending = signal(false);
  readonly submittingTicket = signal(false);
  readonly ticketFormOpen = signal(false);
  readonly supportError = signal<string | null>(null);
  readonly supportNotice = signal<string | null>(null);
  readonly ticketSubject = signal('');
  readonly ticketDescription = signal('');
  private idleTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly auth: AuthService,
    private readonly support: SupportConversationService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.openOrResumeConversation();
  }

  ngOnDestroy(): void {
    this.clearIdleTimer();
  }

  toggle(index: number): void {
    this.openIndex.set(this.openIndex() === index ? null : index);
  }

  async openOrResumeConversation(): Promise<void> {
    this.loadingConversation.set(true);
    this.supportError.set(null);
    try {
      const conversation = await this.support.startOrResume();
      this.conversation.set(conversation);
      this.viewedConversationId.set(conversation.id);
      await this.loadMessages(conversation);
      await this.refreshHistory();
      await this.refreshTickets();
      this.scheduleIdleExpiry(conversation.last_activity_at);
    } catch (error) {
      this.supportError.set(error instanceof Error ? error.message : 'Could not open your support conversation.');
    } finally {
      this.loadingConversation.set(false);
    }
  }

  async sendMessage(question = this.draft()): Promise<void> {
    const text = question.trim();
    if (!text || this.sending() || this.viewedConversationId() !== this.conversation()?.id) return;

    this.sending.set(true);
    this.supportError.set(null);
    this.supportNotice.set(null);
    try {
      let conversation = this.conversation();
      if (!conversation || conversation.status !== 'open' || this.isIdleExpired(conversation)) {
        await this.openOrResumeConversation();
        conversation = this.conversation();
      } else {
        conversation = await this.support.startOrResume();
        if (conversation.id !== this.conversation()?.id) {
          this.conversation.set(conversation);
          this.viewedConversationId.set(conversation.id);
          await this.loadMessages(conversation);
          await this.refreshHistory();
        }
      }
      if (!conversation) throw new Error(this.supportError() ?? 'Could not open a support conversation.');

      this.draft.set('');
      const userMessage = await this.support.addMessage(conversation.id, 'user', text);
      this.messages.update((items) => [...items, this.toChatMessage(userMessage)]);
      const reply = this.getReply(text);
      const assistantMessage = await this.support.addMessage(conversation.id, 'assistant', reply);
      this.messages.update((items) => [...items, this.toChatMessage(assistantMessage)]);
      conversation = { ...conversation, last_activity_at: assistantMessage.created_at };
      this.conversation.set(conversation);
      this.scheduleIdleExpiry(conversation.last_activity_at);
      await this.refreshHistory();
      await this.scrollToLatest();
    } catch (error) {
      this.supportError.set(error instanceof Error ? error.message : 'Your message could not be saved.');
    } finally {
      this.sending.set(false);
    }
  }

  async endConversation(): Promise<void> {
    const conversation = this.conversation();
    if (!conversation || conversation.status !== 'open' || this.ending()) return;

    this.ending.set(true);
    this.supportError.set(null);
    try {
      const ended = await this.support.end(conversation.id);
      this.conversation.set(ended);
      this.clearIdleTimer();
      this.supportNotice.set(`Conversation ${ended.conversation_number} has ended.`);
      await this.refreshHistory();
    } catch (error) {
      this.supportError.set(error instanceof Error ? error.message : 'Could not end this conversation.');
    } finally {
      this.ending.set(false);
    }
  }

  async viewConversation(conversation: SupportConversation): Promise<void> {
    this.supportError.set(null);
    try {
      const messages = await this.support.listMessages(conversation.id);
      this.viewedConversationId.set(conversation.id);
      this.messages.set(messages.map((message) => this.toChatMessage(message)));
    } catch (error) {
      this.supportError.set(error instanceof Error ? error.message : 'Could not load this conversation.');
    }
  }

  async returnToCurrentConversation(): Promise<void> {
    const conversation = this.conversation();
    if (conversation?.status === 'open') {
      await this.viewConversation(conversation);
      return;
    }
    await this.openOrResumeConversation();
  }

  async submitTicket(): Promise<void> {
    const userId = this.currentUser()?.id;
    const conversation = this.conversation();
    const subject = this.ticketSubject().trim();
    const description = this.ticketDescription().trim();
    if (!userId || !conversation || !subject || !description || this.submittingTicket()) return;

    this.submittingTicket.set(true);
    this.supportError.set(null);
    this.supportNotice.set(null);
    try {
      await this.support.createTicket(conversation.id, userId, subject, description);
      this.ticketSubject.set('');
      this.ticketDescription.set('');
      this.ticketFormOpen.set(false);
      this.supportNotice.set(`Problem reported for conversation ${conversation.conversation_number}.`);
      await this.refreshTickets();
    } catch (error) {
      this.supportError.set(error instanceof Error ? error.message : 'Could not submit your support ticket.');
    } finally {
      this.submittingTicket.set(false);
    }
  }

  isCurrentConversation(conversation: SupportConversation): boolean {
    return conversation.id === this.conversation()?.id;
  }

  private async loadMessages(conversation: SupportConversation): Promise<void> {
    const savedMessages = await this.support.listMessages(conversation.id);
    if (!savedMessages.length) {
      const welcome = await this.support.addMessage(conversation.id, 'assistant', WELCOME_MESSAGE);
      this.messages.set([this.toChatMessage(welcome)]);
    } else {
      this.messages.set(savedMessages.map((message) => this.toChatMessage(message)));
    }
    this.viewedConversationId.set(conversation.id);
  }

  private async refreshHistory(): Promise<void> {
    this.conversations.set(await this.support.listConversations());
  }

  private async refreshTickets(): Promise<void> {
    this.tickets.set(await this.support.listMyTickets());
  }

  private toChatMessage(message: SupportMessage): ChatMessage {
    return {
      role: message.sender === 'assistant' ? 'bot' : 'user',
      text: message.message,
      createdAt: message.created_at,
    };
  }

  private scheduleIdleExpiry(lastActivityAt: string): void {
    this.clearIdleTimer();
    const expiresIn = Date.parse(lastActivityAt) + 60 * 60 * 1000 - Date.now();
    if (expiresIn <= 0) {
      void this.openOrResumeConversation();
      return;
    }
    this.idleTimer = setTimeout(() => void this.openOrResumeConversation(), expiresIn);
  }

  private clearIdleTimer(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = null;
  }

  private isIdleExpired(conversation: SupportConversation): boolean {
    return Date.now() - Date.parse(conversation.last_activity_at) >= 60 * 60 * 1000;
  }

  private async scrollToLatest(): Promise<void> {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const chatElement = this.chatMessages?.nativeElement;
    chatElement?.scrollTo({ top: chatElement.scrollHeight, behavior: 'smooth' });
  }

  private getReply(question: string): string {
    const normalizedQuestion = question.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ');
    const tokens = new Set(normalizedQuestion.split(/\s+/).filter((token) => token.length > 2));

    if (/^(hi|hello|hey|good morning|good afternoon|good evening)\b/.test(normalizedQuestion.trim())) {
      return 'Hello! What can I help you with today? You can ask me about bookings, payments, cancellations, or your account.';
    }
    if (/\b(thank|thanks|thank you)\b/.test(normalizedQuestion)) {
      return 'You’re welcome! Let me know if you have another SmartDrive question.';
    }

    let bestMatch: FaqItem | undefined;
    let bestScore = 0;
    for (const item of this.items) {
      const score = item.keywords.reduce((total, keyword) => {
        const normalizedKeyword = keyword.toLowerCase();
        return total + (normalizedQuestion.includes(normalizedKeyword) || tokens.has(normalizedKeyword) ? normalizedKeyword.split(' ').length + 1 : 0);
      }, 0);
      if (score > bestScore) {
        bestMatch = item;
        bestScore = score;
      }
    }

    if (bestMatch) return bestMatch.a;
    return 'I don’t have a reliable answer for that yet. Try asking about booking a vehicle, payment methods, cancellations, booking history, or contact our support team at contact@smartdrive.com.';
  }
}
