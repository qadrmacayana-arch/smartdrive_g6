import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon, IonRefresher, IonRefresherContent } from '@ionic/angular';
import { VehicleService } from '../../../core/services/vehicle.service';
import { Vehicle } from '../../../core/models/vehicle.model';
import { AuthService } from '../../../core/services/auth.service';
import { MobileFeedbackService } from '../../../core/services/mobile-feedback.service';
import { PickupPreferencesService } from '../../../core/services/pickup-preferences.service';

interface CategoryDef {
  key: string;
  label: string;
  subTypes: string[];
}

interface PickGroup {
  label: string;
  types: string[];
}

const CATEGORIES: CategoryDef[] = [
  { key: 'All', label: 'All Vehicles', subTypes: [] },
  { key: 'Cars', label: 'Cars', subTypes: ['Electric', 'Luxury Sedan', 'SUV'] },
  { key: 'Motorcycles', label: 'Motorcycles', subTypes: ['Traditional Commuter Scooters', 'Maxi-Scooters', 'Underbones'] },
  { key: 'Recreational', label: 'Recreational Vehicles', subTypes: ['Motorhomes', 'Conversion Vans', 'Travel Trailers'] },
];

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonContent, IonIcon, IonRefresher, IonRefresherContent],
  templateUrl: './landing.page.html',
  styleUrl: './landing.page.scss',
})
export class LandingPage implements OnInit {
  readonly currentUser = this.auth.currentUser;
  readonly categories = CATEGORIES;
  readonly vehicles = signal<Vehicle[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly search = signal('');
  readonly pickupLocation = signal('');
  readonly pickupDate = signal('');
  readonly mainCategory = signal('All');
  readonly subFilter = signal('All');
  readonly favorites = signal<string[]>([]);

  readonly activeSubTypes = computed(() => this.categories.find((category) => category.key === this.mainCategory())?.subTypes ?? []);
  readonly pickGroups: PickGroup[] = [
    { label: 'Cars', types: ['Electric', 'Luxury Sedan', 'SUV'] },
    { label: 'Motorcycles', types: ['Traditional Commuter Scooters', 'Maxi-Scooters', 'Underbones'] },
    { label: 'Recreational Vehicles', types: ['Motorhomes', 'Conversion Vans', 'Travel Trailers'] },
  ];
  readonly filteredVehicles = computed(() => {
    const query = this.search().trim().toLowerCase();
    return this.vehicles().filter((vehicle) => {
      if (vehicle.status === 'archived') return false;
      if (this.mainCategory() !== 'All' && vehicle.main_category !== this.mainCategory()) return false;
      if (this.subFilter() !== 'All' && vehicle.type !== this.subFilter()) return false;
      return !query || vehicle.name.toLowerCase().includes(query) || vehicle.type.toLowerCase().includes(query);
    });
  });
  readonly topPickGroups = computed(() => this.pickGroups.map((group) => ({
    ...group,
    vehicles: this.vehicles()
      .filter((vehicle) => vehicle.status !== 'archived' && group.types.includes(vehicle.type))
      .slice(0, 3),
  })).filter((group) => group.vehicles.length > 0));

  constructor(
    private readonly vehicleService: VehicleService,
    private readonly router: Router,
    private readonly auth: AuthService,
    private readonly route: ActivatedRoute,
    private readonly mobileFeedback: MobileFeedbackService,
    private readonly pickupPreferences: PickupPreferencesService,
  ) {}

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const savedPickup = this.pickupPreferences.get();
    this.pickupLocation.set(params.get('location') ?? savedPickup.location);
    this.pickupDate.set(params.get('date') ?? savedPickup.date);
    this.savePickupPreferences();
    this.favorites.set(this.vehicleService.getFavorites());
    this.loadVehicles();
  }

  async loadVehicles(event?: CustomEvent): Promise<void> {
    this.loading.set(this.vehicles().length === 0);
    this.errorMessage.set(null);
    if (event) this.mobileFeedback.lightImpact();
    try {
      this.vehicles.set(await this.vehicleService.getAvailable());
      if (event) this.mobileFeedback.success();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to load the fleet right now.');
    } finally {
      this.loading.set(false);
      (event?.target as HTMLIonRefresherElement | undefined)?.complete();
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

  clearFilters(): void {
    this.search.set('');
    this.selectMainCategory('All');
  }

  private savePickupPreferences(): void {
    this.pickupPreferences.save(this.pickupLocation(), this.pickupDate());
  }

  openVehicle(vehicle: Vehicle): void {
    this.mobileFeedback.lightImpact();
    this.router.navigate(['/vehicle', vehicle.id], {
      queryParams: {
        location: this.pickupLocation() || null,
        date: this.pickupDate() || null,
      },
    });
  }

  bookVehicle(vehicle: Vehicle, event: Event): void {
    event.stopPropagation();
    if (vehicle.status !== 'available') return;
    this.mobileFeedback.mediumImpact();

    this.router.navigate(['/booking', vehicle.id, 'dates'], {
      queryParams: {
        location: this.pickupLocation() || null,
        date: this.pickupDate() || null,
      },
    });
  }

  toggleFavorite(vehicle: Vehicle, event: Event): void {
    event.stopPropagation();
    this.mobileFeedback.selection();
    const isFavorite = this.vehicleService.toggleFavorite(vehicle.id);
    this.favorites.update((items) => isFavorite ? [...items, String(vehicle.id)] : items.filter((id) => id !== String(vehicle.id)));
  }

  isFavorite(vehicle: Vehicle): boolean {
    return this.favorites().includes(String(vehicle.id));
  }

}
