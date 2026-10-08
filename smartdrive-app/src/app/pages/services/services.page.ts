import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonBackButton, IonButtons, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/angular';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, RouterLink, IonBackButton, IonButtons, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar],
  templateUrl: './services.page.html',
  styleUrl: './services.page.scss',
})
export class ServicesPage {
  readonly services = [
    {
      icon: 'car-sport-outline',
      title: 'Self-Drive Rental',
      description: 'Drive yourself with our premium fleet of vehicles.',
      price: 1500,
      features: ['Wide selection of vehicles', 'Unlimited mileage', 'Full insurance coverage', '24/7 roadside assistance', 'Flexible rental periods'],
      link: '/tabs/rent-a-car',
    },
    {
      icon: 'person-outline',
      title: 'Chauffeur Service',
      description: 'Relax while our professional drivers take you anywhere.',
      price: 2500,
      features: ['Professional drivers', 'Premium vehicles', 'Personalized routes', 'Hourly or daily rates', 'Comfort and convenience'],
      link: '/about',
    },
  ];
}
