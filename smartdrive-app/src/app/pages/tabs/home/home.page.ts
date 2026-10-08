import { Component, OnInit, computed, effect, signal } from '@angular/core';
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
import { PickupPreferencesService } from '../../../core/services/pickup-preferences.service';
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
  readonly categories = CATEGORIES;
  readonly vehicles = signal<Vehicle[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly recommendedVehicles = signal<Vehicle[]>([]);
  readonly recommendationError = signal<string | null>(null);
  readonly hasBookingHistory = signal(false);
  private recommendationRequest = 0;
  readonly searchQuery = signal('');
  readonly mainCategory = signal('All');
  readonly subFilter = signal('All');
  readonly pickupDateMinimum = this.getToday();
  pickupLocation = '';
  pickupDate = '';

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

  constructor(
    private readonly vehicleService: VehicleService,
    private readonly bookingService: BookingService,
    private readonly insights: PredictiveInsightsService,
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly mobileFeedback: MobileFeedbackService,
    private readonly pickupPreferences: PickupPreferencesService,
  ) {
    effect(() => {
      this.currentUser();
      const vehicles = this.vehicles();
      if (vehicles.length) void this.loadRecommendations(vehicles);
    });
  }

  ngOnInit(): void {
    const savedPickup = this.pickupPreferences.get();
    this.pickupLocation = savedPickup.location;
    this.pickupDate = savedPickup.date;
    this.loadVehicles();
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

  searchFleet(): void {
    this.mobileFeedback.mediumImpact();
    this.savePickupPreferences();
    this.router.navigate(['/tabs/rent-a-car'], {
      queryParams: { location: this.pickupLocation || null, date: this.pickupDate || null },
    });
  }

  savePickupPreferences(): void {
    this.pickupPreferences.save(this.pickupLocation, this.pickupDate);
  }

  private getToday(): string {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
  }
}
