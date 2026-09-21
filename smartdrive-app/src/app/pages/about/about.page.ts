import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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

interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}

const WHY_CHOOSE: FeatureItem[] = [
  { icon: 'shield-checkmark-outline', title: 'Fully Insured', description: 'Every vehicle comes with comprehensive insurance coverage for complete peace of mind.' },
  { icon: 'chatbubble-ellipses-outline', title: '24/7 Support', description: 'Our dedicated support team is available around the clock for questions or emergencies.' },
  { icon: 'car-sport-outline', title: 'Premium Fleet', description: 'Meticulously maintained vehicles from economy to premium, for every budget.' },
  { icon: 'flash-outline', title: 'Easy Booking', description: 'Pick your vehicle, select your dates, and hit the road in just minutes.' },
  { icon: 'pricetag-outline', title: 'Transparent Pricing', description: 'No hidden fees. What you see is what you pay, every time.' },
  { icon: 'location-outline', title: 'Nationwide Coverage', description: 'Locations across major Philippine cities, wherever your journey takes you.' },
];

const STATS = [
  { value: '500+', label: 'Vehicles in Fleet' },
  { value: '50K+', label: 'Happy Customers' },
  { value: '6+', label: 'Major Cities' },
  { value: '4.9★', label: 'Customer Rating' },
];

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonIcon, IonButton],
  templateUrl: './about.page.html',
  styleUrl: './about.page.scss',
})
export class AboutPage {
  readonly whyChoose = WHY_CHOOSE;
  readonly stats = STATS;

  constructor(private readonly router: Router) {}

  browseFleet(): void {
    this.router.navigateByUrl('/tabs/home');
  }
}
