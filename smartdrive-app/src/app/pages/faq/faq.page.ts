import { Component, ElementRef, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonButton,
  IonInput,
} from '@ionic/angular';

interface FaqItem {
  q: string;
  a: string;
  keywords: string[];
}

interface ChatMessage {
  role: 'bot' | 'user';
  text: string;
}

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
  imports: [CommonModule, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonIcon, IonButton, IonInput],
  templateUrl: './faq.page.html',
  styleUrl: './faq.page.scss',
})
export class FaqPage {
  @ViewChild('chatMessages') private chatMessages?: ElementRef<HTMLDivElement>;

  readonly items = FAQ_ITEMS;
  readonly openIndex = signal<number | null>(0);
  readonly suggestedQuestions = SUGGESTED_QUESTIONS;
  readonly messages = signal<ChatMessage[]>([
    {
      role: 'bot',
      text: 'Hi! I’m the SmartDrive help assistant. Ask me about booking, payments, cancellations, your booking history, or contacting support.',
    },
  ]);
  readonly draft = signal('');

  toggle(index: number): void {
    this.openIndex.set(this.openIndex() === index ? null : index);
  }

  async sendMessage(question = this.draft()): Promise<void> {
    const text = question.trim();
    if (!text) return;

    this.messages.update((messages) => [...messages, { role: 'user', text }]);
    this.draft.set('');
    this.messages.update((messages) => [...messages, { role: 'bot', text: this.getReply(text) }]);
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
