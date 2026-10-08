import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonButton,
} from '@ionic/angular';
import { VehicleService } from '../../core/services/vehicle.service';
import { AuthService } from '../../core/services/auth.service';
import { BookingService } from '../../core/services/booking.service';
import { Vehicle } from '../../core/models/vehicle.model';

@Component({
  selector: 'app-vehicle-detail',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonIcon,
    IonButton,
  ],
  templateUrl: './vehicle-detail.page.html',
  styleUrl: './vehicle-detail.page.scss',
})
export class VehicleDetailPage implements OnInit {
  readonly vehicle = signal<Vehicle | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly bookingCheckLoading = signal(false);
  readonly alreadyRented = signal(false);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly vehicleService: VehicleService,
    private readonly auth: AuthService,
    private readonly bookingService: BookingService,
  ) {}

  async ngOnInit(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    try {
      const vehicle = await this.vehicleService.getById(id);
      if (!vehicle) {
        this.errorMessage.set('This vehicle could not be found.');
      } else {
        this.vehicle.set(vehicle);
        const user = this.auth.currentUser();
        if (user) {
          this.alreadyRented.set(await this.bookingService.hasOngoingBooking(user.id, vehicle.id));
        }
      }
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to load this vehicle.');
    } finally {
      this.loading.set(false);
    }
  }

  async bookNow(): Promise<void> {
    const vehicle = this.vehicle();
    if (!vehicle) return;

    const user = this.auth.currentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.bookingCheckLoading.set(true);
    try {
      this.alreadyRented.set(await this.bookingService.hasOngoingBooking(user.id, vehicle.id));
      if (this.alreadyRented()) return;
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Could not verify your current bookings.');
      return;
    } finally {
      this.bookingCheckLoading.set(false);
    }

    this.router.navigate(['/booking', vehicle.id, 'dates'], {
      queryParams: {
        location: this.route.snapshot.queryParamMap.get('location'),
        date: this.route.snapshot.queryParamMap.get('date'),
      },
    });
  }

  getVehicleDescription(vehicle: Vehicle): string {
    return vehicle.description?.trim() || `Enjoy a comfortable ${vehicle.type.toLowerCase()} experience with the ${vehicle.name}. This vehicle seats ${vehicle.seats} ${vehicle.seats === 1 ? 'passenger' : 'passengers'} and is ready for your next trip.`;
  }

  getVehicleFeatures(vehicle: Vehicle): string[] {
    const features = Array.isArray(vehicle.features)
      ? vehicle.features.filter((feature): feature is string => typeof feature === 'string' && feature.trim().length > 0)
      : [];

    if (features.length) return features;

    return [
      `${vehicle.seats}-seat interior`,
      `${vehicle.transmission} transmission`,
      `${vehicle.fuel} power`,
      'Air conditioning',
      'Clean and well maintained',
      'Flexible rental support',
    ];
  }
}
