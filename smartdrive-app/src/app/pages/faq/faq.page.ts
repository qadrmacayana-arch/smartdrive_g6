import { Component, signal } from '@angular/core';
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
} from '@ionic/angular';

interface FaqItem {
  q: string;
  a: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    q: 'How do I book a vehicle?',
    a: 'To book, go to Home, choose a vehicle and your dates, then follow the checkout steps to confirm your booking.',
  },
  {
    q: 'What payment methods can I use?',
    a: 'We accept major credit cards, GCash, Maya, and SR Points from your wallet. Payment options are shown at checkout.',
  },
  {
    q: 'Can I cancel my booking?',
    a: 'Cancellations are accepted up to 24 hours before pickup from the Bookings tab; fees may apply depending on the booking terms.',
  },
  {
    q: 'How do I view my booking history?',
    a: 'Open the Bookings tab to see past and upcoming reservations.',
  },
  {
    q: 'How do I contact support?',
    a: 'Reach us at contact@smartdrive.com or (+63) 917 123 4567, available 24/7.',
  },
];

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonIcon, IonButton],
  templateUrl: './faq.page.html',
  styleUrl: './faq.page.scss',
})
export class FaqPage {
  readonly items = FAQ_ITEMS;
  readonly openIndex = signal<number | null>(0);

  toggle(index: number): void {
    this.openIndex.set(this.openIndex() === index ? null : index);
  }
}
