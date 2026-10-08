import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonDatetime,
  IonDatetimeButton,
  IonModal,
  IonIcon,
} from '@ionic/angular';
import { VehicleService } from '../../../core/services/vehicle.service';
import { BookingService } from '../../../core/services/booking.service';
import { Vehicle } from '../../../core/models/vehicle.model';

@Component({
  selector: 'app-booking-dates',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonDatetime,
    IonDatetimeButton,
    IonModal,
    IonIcon,
  ],
  templateUrl: './booking-dates.page.html',
  styleUrl: './booking-dates.page.scss',
})
export class BookingDatesPage implements OnInit {
  readonly vehicle = signal<Vehicle | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly minDate = new Date().toISOString();
  readonly pickupDate = signal(this.addDays(new Date(), 1));
  readonly returnDate = signal(this.addDays(new Date(), 3));
  readonly pickupLocation = signal('Manila');

  readonly rentalDays = computed(() => {
    const start = new Date(this.pickupDate());
    const end = new Date(this.returnDate());
    const ms = end.getTime() - start.getTime();
    return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
  });

  readonly totalPrice = computed(() => (this.vehicle()?.price ?? 0) * this.rentalDays());

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly vehicleService: VehicleService,
    private readonly bookingService: BookingService,
  ) {}

  private addDays(date: Date, days: number): string {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d.toISOString();
  }

  async ngOnInit(): Promise<void> {
    const vehicleId = Number(this.route.snapshot.paramMap.get('vehicleId'));
    const queryParams = this.route.snapshot.queryParamMap;
    const requestedDate = queryParams.get('date');
    const requestedLocation = queryParams.get('location');
    if (requestedDate) {
      const date = new Date(`${requestedDate}T00:00:00`);
      if (!Number.isNaN(date.getTime()) && date >= new Date(new Date().toDateString())) {
        this.pickupDate.set(requestedDate);
        this.returnDate.set(this.addDays(date, 1));
      }
    }
    if (requestedLocation) this.pickupLocation.set(requestedLocation);

    try {
      const vehicle = await this.vehicleService.getById(vehicleId);
      if (!vehicle) {
        this.errorMessage.set('This vehicle could not be found.');
      } else {
        this.vehicle.set(vehicle);
      }
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to load this vehicle.');
    } finally {
      this.loading.set(false);
    }
  }

  onReturnChange(value: string): void {
    this.returnDate.set(value);
    if (new Date(value) <= new Date(this.pickupDate())) {
      this.returnDate.set(this.addDays(new Date(this.pickupDate()), 1));
    }
  }

  continue(): void {
    const vehicle = this.vehicle();
    if (!vehicle) return;

    this.bookingService.startDraft(
      { id: vehicle.id, name: vehicle.name, price: vehicle.price, srPoints: vehicle.sr_points, image: vehicle.image },
      this.pickupDate().slice(0, 10),
      this.returnDate().slice(0, 10),
      this.pickupLocation(),
    );

    this.router.navigate(['/booking', vehicle.id, 'details']);
  }
}
