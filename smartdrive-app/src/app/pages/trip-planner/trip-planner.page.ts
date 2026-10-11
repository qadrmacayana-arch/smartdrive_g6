import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { MobileFeedbackService } from '../../core/services/mobile-feedback.service';

interface TripStop {
  name: string;
  description: string;
}

interface TripDay {
  title: string;
  stops: TripStop[];
}

interface TripDestination {
  id: string;
  name: string;
  region: string;
  introduction: string;
  days: TripDay[];
}

const TRIP_DESTINATIONS: TripDestination[] = [
  {
    id: 'tagaytay',
    name: 'Tagaytay',
    region: 'Cavite',
    introduction: 'Cool-weather viewpoints, local favorites, and an easy change of pace.',
    days: [
      {
        title: 'Views & fresh air',
        stops: [
          { name: "People's Park in the Sky", description: 'Take in sweeping views from one of Tagaytay’s best-known high points.' },
          { name: 'Picnic Grove', description: 'Stretch your legs among the gardens and overlook the Taal landscape.' },
        ],
      },
      {
        title: 'Art & a little fun',
        stops: [
          { name: 'Museo Orlina', description: 'Explore contemporary glass sculpture and its art-filled galleries.' },
          { name: 'Sky Ranch Tagaytay', description: 'Wrap up the day with rides and views along the ridge.' },
        ],
      },
      {
        title: 'Market & garden stops',
        stops: [
          { name: 'Mahogany Market', description: 'Browse the local market and try a Tagaytay bulalo favorite.' },
          { name: "Sonya's Garden", description: 'Slow down over a garden meal in nearby Alfonso.' },
        ],
      },
    ],
  },
  {
    id: 'baguio',
    name: 'Baguio',
    region: 'Benguet',
    introduction: 'Pine-scented walks, creative corners, and classic city landmarks.',
    days: [
      {
        title: 'City stroll',
        stops: [
          { name: 'Burnham Park', description: 'Start with a relaxed walk or a paddle around the park.' },
          { name: 'Session Road', description: 'Explore the city’s central shops, cafés, and restaurants.' },
        ],
      },
      {
        title: 'Gardens & heritage',
        stops: [
          { name: 'Baguio Botanical Garden', description: 'Wander among native plants and cultural displays.' },
          { name: 'Wright Park', description: 'Take the scenic steps beside the park’s long reflecting pool.' },
        ],
      },
      {
        title: 'Art & local craft',
        stops: [
          { name: 'BenCab Museum', description: 'See contemporary and indigenous Filipino art in a hillside setting.' },
          { name: 'Tam-awan Village', description: 'Discover Cordillera-inspired art and traditional architecture.' },
        ],
      },
    ],
  },
  {
    id: 'la-union',
    name: 'La Union',
    region: 'La Union',
    introduction: 'Surf-town energy, coastal views, and laid-back northern Luzon stops.',
    days: [
      {
        title: 'Surf-town day',
        stops: [
          { name: 'Urbiztondo Beach, San Juan', description: 'Enjoy the shore and watch the surf at this popular coastal stretch.' },
          { name: 'San Juan town center', description: 'Take your pick of nearby cafés and casual local eats.' },
        ],
      },
      {
        title: 'Coast & countryside',
        stops: [
          { name: 'Bauang grape farms', description: 'Visit a local grape-growing area; check farm schedules before setting out.' },
          { name: 'Poro Point Lighthouse', description: 'Take in sea views from the headland near San Fernando.' },
        ],
      },
      {
        title: 'A day in nature',
        stops: [
          { name: 'Tangadan Falls', description: 'Make time for a guided nature visit near San Gabriel; check access conditions first.' },
          { name: 'San Juan seafront', description: 'Return to the coast for sunset and a relaxed end to the day.' },
        ],
      },
    ],
  },
  {
    id: 'cebu-city',
    name: 'Cebu City',
    region: 'Cebu',
    introduction: 'A mix of historic landmarks, city flavors, and hillside views.',
    days: [
      {
        title: 'Cebu’s historic heart',
        stops: [
          { name: 'Basilica Minore del Santo Niño', description: 'Visit one of Cebu’s most significant historic churches.' },
          { name: 'Fort San Pedro', description: 'Explore the compact Spanish-era fort by the waterfront.' },
        ],
      },
      {
        title: 'Heritage & local life',
        stops: [
          { name: 'Museo Sugbo', description: 'Learn about Cebu’s history inside a former provincial jail.' },
          { name: 'Yap-Sandiego Ancestral House', description: 'Step inside one of the city’s oldest preserved homes.' },
        ],
      },
      {
        title: 'Views above the city',
        stops: [
          { name: 'Temple of Leah', description: 'See the grand hilltop landmark and its sweeping views.' },
          { name: 'Tops Lookout', description: 'Finish above the city with a panoramic evening view.' },
        ],
      },
    ],
  },
];

@Component({
  selector: 'app-trip-planner',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonTitle,
    IonToolbar,
  ],
  templateUrl: './trip-planner.page.html',
  styleUrl: './trip-planner.page.scss',
})
export class TripPlannerPage {
  private readonly mobileFeedback = inject(MobileFeedbackService);
  readonly destinations = TRIP_DESTINATIONS;
  selectedDestinationId = TRIP_DESTINATIONS[0].id;
  numberOfDays = 1;
  startingPoint = '';
  planCreated = false;

  get selectedDestination(): TripDestination {
    return this.destinations.find((destination) => destination.id === this.selectedDestinationId)
      ?? this.destinations[0];
  }

  createPlan(): void {
    this.planCreated = true;
    this.mobileFeedback.success();
  }

  getMapsUrl(dayIndex: number): string {
    const days = this.selectedDestination.days.slice(0, this.numberOfDays);
    const day = days[dayIndex];
    const previousDay = days[dayIndex - 1];
    const origin = dayIndex === 0
      ? this.startingPoint.trim() || this.selectedDestination.name
      : previousDay.stops[previousDay.stops.length - 1].name;
    const destination = day.stops[day.stops.length - 1].name;
    const params = new URLSearchParams({
      api: '1',
      origin,
      destination,
      waypoints: day.stops.slice(0, -1).map((stop) => stop.name).join('|'),
      travelmode: 'driving',
    });

    return `https://www.google.com/maps/dir/?${params.toString()}`;
  }
}
