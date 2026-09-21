import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonSearchbar,
  IonChip,
  IonLabel,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
} from '@ionic/angular';
import { VehicleService } from '../../../core/services/vehicle.service';
import { AuthService } from '../../../core/services/auth.service';
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
    RouterLink,
    IonContent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonMenuButton,
    IonSearchbar,
    IonChip,
    IonLabel,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
    IonSkeletonText,
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage implements OnInit {
  readonly categories = CATEGORIES;
  readonly vehicles = signal<Vehicle[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
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

  constructor(
    private readonly vehicleService: VehicleService,
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadVehicles();
  }

  async loadVehicles(event?: CustomEvent): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      const vehicles = await this.vehicleService.getAvailable();
      this.vehicles.set(vehicles);
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
  }

  selectSubFilter(type: string): void {
    this.subFilter.set(type);
  }

  openVehicle(vehicle: Vehicle): void {
    this.router.navigate(['/vehicle', vehicle.id]);
  }
}
