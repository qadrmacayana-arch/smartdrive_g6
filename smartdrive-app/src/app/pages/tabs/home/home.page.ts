import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/angular';
import { VehicleService } from '../../../core/services/vehicle.service';
import { AuthService } from '../../../core/services/auth.service';
import { BookingService } from '../../../core/services/booking.service';
import { MobileFeedbackService } from '../../../core/services/mobile-feedback.service';
import { PredictiveInsightsService } from '../../../core/services/predictive-insights.service';
import { Vehicle } from '../../../core/models/vehicle.model';

interface CategoryDef {
  key: string;
  label: string;
  subTypes: string[];
}

const CATEGORIES: CategoryDef[] = [
  { key: 'All', label: 'All Vehicles', subTypes: [] },
  { key: 'Cars', label: 'Cars', subTypes: ['Electric', 'Luxury Sedan', 'SUV'] },
  {
    key: 'Motorcycles',
    label: 'Motorcycles',
    subTypes: ['Traditional Commuter Scooters', 'Maxi-Scooters', 'Underbones'],
  },
  {
    key: 'Recreational',
    label: 'Recreational Vehicles',
    subTypes: ['Motorhomes', 'Conversion Vans', 'Travel Trailers'],
  },
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonContent,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage implements OnInit {
  private readonly vehicleService = inject(VehicleService);
  private readonly bookingService = inject(BookingService);
  private readonly insights = inject(PredictiveInsightsService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly mobileFeedback = inject(MobileFeedbackService);
  readonly categories = CATEGORIES;
  readonly promotions = [
    {
      eyebrow: 'YOUR NEXT ESCAPE STARTS HERE',
      title: 'A better view is just a drive away.',
      description: 'Pick a ride and make the long weekend yours.',
      image: 'assets/images/smartdrive-promo-coast.svg',
      imageAlt: 'Illustration of a car driving along a coastal road at sunset',
      link: '/trip-planner',
      action: 'Plan a trip',
    },
    {
      eyebrow: 'A LITTLE SOMETHING FOR YOUR FIRST RIDE',
      title: 'Take 15% off your first rental.',
      description: 'Use promo code FIRST15 at checkout.',
      image: 'assets/images/smartdrive-promo-city.svg',
      imageAlt: 'Illustration of a car on a city street at dusk',
      link: '/offers',
      action: 'Explore offers',
    },
    {
      eyebrow: 'FIND YOUR KIND OF DRIVE',
      title: 'The right ride changes everything.',
      description: 'Browse cars, motorcycles, and more in one place.',
      image: 'assets/images/smartdrive-promo-mountains.svg',
      imageAlt: 'Illustration of a vehicle winding through mountain scenery',
      link: '/tabs/rent-a-car',
      action: 'Explore the fleet',
    },
  ];
  readonly activePromotionIndex = signal(0);
  readonly carouselRotationEnabled = signal(true);
  readonly vehicles = signal<Vehicle[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly recommendedVehicles = signal<Vehicle[]>([]);
  readonly recommendationError = signal<string | null>(null);
  readonly hasBookingHistory = signal(false);
  private recommendationRequest = 0;
  private carouselTimer: ReturnType<typeof setInterval> | null = null;
  readonly searchQuery = signal('');
  readonly mainCategory = signal('All');
  readonly subFilter = signal('All');

  readonly currentUser = this.auth.currentUser;

  readonly activeSubTypes = computed(() => this.categories.find((c) => c.key === this.mainCategory())?.subTypes ?? []);

  readonly filteredVehicles = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const mainCategory = this.mainCategory();
    const subFilter = this.subFilter();

    return this.vehicles().filter((vehicle) => {
      if (vehicle.status === 'archived') return false;
      if (mainCategory !== 'All' && vehicle.main_category !== mainCategory) return false;
      if (subFilter !== 'All' && vehicle.type !== subFilter) return false;
      if (query && !vehicle.name.toLowerCase().includes(query) && !vehicle.type.toLowerCase().includes(query)) {
        return false;
      }
      return true;
    });
  });

  readonly featuredVehicles = computed(() => this.vehicles().filter((v) => v.is_featured).slice(0, 6));

  constructor() {
    effect(() => {
      this.currentUser();
      const vehicles = this.vehicles();
      if (vehicles.length) void this.loadRecommendations(vehicles);
    });
  }

  ngOnInit(): void {
    this.loadVehicles();
  }

  ionViewWillEnter(): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.carouselRotationEnabled.set(false);
      return;
    }
    this.carouselRotationEnabled.set(true);
    this.startPromotionRotation();
  }

  ionViewWillLeave(): void {
    this.stopPromotionRotation();
  }

  selectPromotion(index: number): void {
    this.activePromotionIndex.set(index);
    this.mobileFeedback.selection();
    if (this.carouselRotationEnabled()) this.startPromotionRotation();
  }

  togglePromotionRotation(): void {
    const shouldPlay = !this.carouselRotationEnabled();
    this.carouselRotationEnabled.set(shouldPlay);
    if (shouldPlay) {
      this.startPromotionRotation();
    } else {
      this.stopPromotionRotation();
    }
  }

  private startPromotionRotation(): void {
    this.stopPromotionRotation();
    if (this.promotions.length < 2) return;
    this.carouselTimer = window.setInterval(() => {
      this.activePromotionIndex.update((index) => (index + 1) % this.promotions.length);
    }, 6000);
  }

  private stopPromotionRotation(): void {
    if (this.carouselTimer === null) return;
    window.clearInterval(this.carouselTimer);
    this.carouselTimer = null;
  }

  async loadVehicles(event?: CustomEvent): Promise<void> {
    this.loading.set(this.vehicles().length === 0);
    this.errorMessage.set(null);
    if (event) this.mobileFeedback.lightImpact();
    try {
      const vehicles = await this.vehicleService.getAvailable();
      this.vehicles.set(vehicles);
      if (event) this.mobileFeedback.success();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to load the fleet right now.');
    } finally {
      this.loading.set(false);
      (event?.target as HTMLIonRefresherElement | undefined)?.complete();
    }
  }

  isNewVehicle(vehicle: Vehicle): boolean {
    const createdAt = Date.parse(vehicle.created_at ?? '');
    return Number.isFinite(createdAt)
      && createdAt <= Date.now()
      && Date.now() - createdAt <= 30 * 24 * 60 * 60 * 1000;
  }

  private async loadRecommendations(vehicles: Vehicle[]): Promise<void> {
    const request = ++this.recommendationRequest;
    const user = this.currentUser();
    this.recommendationError.set(null);
    this.recommendedVehicles.set([]);
    this.hasBookingHistory.set(false);
    if (!user || user.id.startsWith('local-')) return;

    try {
      const bookings = await this.bookingService.listMyBookingsForUser(user.id);
      if (request !== this.recommendationRequest) return;
      this.hasBookingHistory.set(bookings.some((booking) =>
        booking.booking_status !== 'cancelled'
        && booking.payment_status !== 'failed'
        && booking.payment_status !== 'refunded',
      ));
      this.recommendedVehicles.set(this.insights.getPersonalizedRecommendations(vehicles, bookings));
    } catch (error) {
      if (request !== this.recommendationRequest) return;
      this.recommendationError.set(error instanceof Error ? error.message : 'Personalized recommendations could not be loaded.');
    }
  }

  selectMainCategory(key: string): void {
    this.mainCategory.set(key);
    this.subFilter.set('All');
    this.mobileFeedback.selection();
  }

  selectSubFilter(type: string): void {
    this.subFilter.set(type);
  }

  openVehicle(vehicle: Vehicle): void {
    this.mobileFeedback.lightImpact();
    this.router.navigate(['/vehicle', vehicle.id]);
  }

}
