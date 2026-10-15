import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { Vehicle } from '../../../core/models/vehicle.model';
import { MobileFeedbackService } from '../../../core/services/mobile-feedback.service';
import { VehicleService } from '../../../core/services/vehicle.service';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterLink, IonContent, IonIcon],
  templateUrl: './favorites.page.html',
  styleUrl: './favorites.page.scss',
})
export class FavoritesPage {
  readonly favoriteIds = signal<string[]>([]);
  readonly vehicles = signal<Vehicle[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly favoriteVehicles = computed(() =>
    this.vehicles().filter((vehicle) => this.favoriteIds().includes(String(vehicle.id))),
  );

  constructor(
    private readonly vehicleService: VehicleService,
    private readonly router: Router,
    private readonly mobileFeedback: MobileFeedbackService,
  ) {}

  async ionViewWillEnter(): Promise<void> {
    this.favoriteIds.set(this.vehicleService.getFavorites());
    this.errorMessage.set(null);

    if (!this.favoriteIds().length) {
      this.vehicles.set([]);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    try {
      this.vehicles.set(await this.vehicleService.getAvailable());
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to load your favorites right now.');
    } finally {
      this.loading.set(false);
    }
  }

  openVehicle(vehicle: Vehicle): void {
    this.mobileFeedback.lightImpact();
    void this.router.navigate(['/vehicle', vehicle.id]);
  }

  removeFavorite(vehicle: Vehicle, event: Event): void {
    event.stopPropagation();
    this.mobileFeedback.selection();
    this.vehicleService.toggleFavorite(vehicle.id);
    this.favoriteIds.update((ids) => ids.filter((id) => id !== String(vehicle.id)));
  }
}
