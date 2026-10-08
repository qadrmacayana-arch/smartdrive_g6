import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
} from '@ionic/angular';
import { VehicleService } from '../../../core/services/vehicle.service';
import { BookingService } from '../../../core/services/booking.service';
import { BookingDateEstimate, PredictiveInsightsService } from '../../../core/services/predictive-insights.service';
import { Vehicle } from '../../../core/models/vehicle.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-booking-dates',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
  ],
  templateUrl: './booking-dates.page.html',
  styleUrl: './booking-dates.page.scss',
})
export class BookingDatesPage implements OnInit {
  readonly vehicle = signal<Vehicle | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly bookingEstimate = signal<BookingDateEstimate | null>(null);
  readonly bookingEstimateLoading = signal(false);
  readonly bookingEstimateError = signal<string | null>(null);
  private bookingEstimateRequest = 0;

  readonly pickupDate = signal('');
  readonly returnDate = signal('');
  readonly pickupLocation = signal('Manila');
  readonly selectingDate = signal<'pickup' | 'return'>('pickup');
  readonly calendarMonth = signal(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  readonly todayMonth = new Date().getMonth();
  readonly todayYear = new Date().getFullYear();
  readonly calendarDays = computed(() => {
    const month = this.calendarMonth();
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const cells: Array<Date | null> = Array.from({ length: firstDay.getDay() }, () => null);

    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(new Date(month.getFullYear(), month.getMonth(), day));
    }

    while (cells.length < 42) cells.push(null);
    return cells;
  });

  readonly rentalDays = computed(() => {
    const pickupDate = this.pickupDate();
    const returnDate = this.returnDate();
    if (!pickupDate || !returnDate) return 0;

    const start = this.toUtcDate(pickupDate);
    const end = this.toUtcDate(returnDate);
    return Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
  });

  readonly totalPrice = computed(() => (this.vehicle()?.price ?? 0) * this.rentalDays());
  readonly displayedMonth = computed(() =>
    this.calendarMonth().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  );

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly vehicleService: VehicleService,
    private readonly bookingService: BookingService,
    private readonly insights: PredictiveInsightsService,
    private readonly auth: AuthService,
  ) {}

  private addDays(date: Date, days: number): string {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
    return this.formatDate(d);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toUtcDate(value: string): number {
    const [year, month, day] = value.split('-').map(Number);
    return Date.UTC(year, month - 1, day);
  }

  async ngOnInit(): Promise<void> {
    const vehicleId = Number(this.route.snapshot.paramMap.get('vehicleId'));
    const queryParams = this.route.snapshot.queryParamMap;
    const requestedDate = queryParams.get('date');
    const requestedLocation = queryParams.get('location');
    if (requestedDate) {
      const date = new Date(`${requestedDate}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (!Number.isNaN(date.getTime()) && this.formatDate(date) === requestedDate && date >= today) {
        this.pickupDate.set(requestedDate);
        this.returnDate.set(this.addDays(date, 1));
        this.calendarMonth.set(new Date(date.getFullYear(), date.getMonth(), 1));
      }
    }
    if (requestedLocation) this.pickupLocation.set(requestedLocation);

    try {
      const vehicle = await this.vehicleService.getById(vehicleId);
      if (!vehicle) {
        this.errorMessage.set('This vehicle could not be found.');
      } else {
        const user = this.auth.currentUser();
        if (user && await this.bookingService.hasOngoingBooking(user.id, vehicle.id)) {
          this.errorMessage.set('You already have an ongoing booking for this vehicle. Complete or return your current rental before booking it again.');
          this.vehicle.set(vehicle);
          return;
        }
        this.vehicle.set(vehicle);
        void this.loadBookingEstimate();
      }
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to load this vehicle.');
    } finally {
      this.loading.set(false);
    }
  }

  changeMonth(offset: number): void {
    const month = this.calendarMonth();
    const nextMonth = new Date(month.getFullYear(), month.getMonth() + offset, 1);
    const today = new Date();
    const earliestMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    if (nextMonth >= earliestMonth) this.calendarMonth.set(nextMonth);
  }

  selectDate(date: Date): void {
    const value = this.formatDate(date);
    if (value < this.today()) return;

    if (this.selectingDate() === 'pickup') {
      this.pickupDate.set(value);
      if (this.returnDate() && this.returnDate() <= value) this.returnDate.set('');
      this.selectingDate.set('return');
      void this.loadBookingEstimate();
      return;
    }

    const pickup = this.pickupDate();
    if (!pickup || value <= pickup) return;
    this.returnDate.set(value);
    void this.loadBookingEstimate();
  }

  selectDateField(field: 'pickup' | 'return'): void {
    this.selectingDate.set(field);
  }

  isDateDisabled(date: Date): boolean {
    const value = this.formatDate(date);
    if (value < this.today()) return true;
    return this.selectingDate() === 'return' && (!this.pickupDate() || value <= this.pickupDate());
  }

  isDateSelected(date: Date): boolean {
    const value = this.formatDate(date);
    return value === this.pickupDate() || value === this.returnDate();
  }

  isDateInRange(date: Date): boolean {
    const value = this.formatDate(date);
    return Boolean(this.pickupDate() && this.returnDate() && value > this.pickupDate() && value < this.returnDate());
  }

  formatSelectedDate(value: string): string {
    if (!value) return 'Select date';
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  private today(): string {
    return this.formatDate(new Date());
  }

  private async loadBookingEstimate(): Promise<void> {
    const request = ++this.bookingEstimateRequest;
    const vehicle = this.vehicle();
    const pickup = this.pickupDate();
    const returnDate = this.returnDate();
    this.bookingEstimate.set(null);
    this.bookingEstimateError.set(null);
    if (!vehicle || !pickup || !returnDate || returnDate <= pickup) {
      this.bookingEstimateLoading.set(false);
      return;
    }

    this.bookingEstimateLoading.set(true);
    try {
      const estimate = await this.insights.getBookingDateEstimate(vehicle.id, pickup, returnDate);
      if (request === this.bookingEstimateRequest) this.bookingEstimate.set(estimate);
    } catch (error) {
      if (request === this.bookingEstimateRequest) {
        this.bookingEstimateError.set(error instanceof Error ? error.message : 'Date estimate could not be loaded.');
      }
    } finally {
      if (request === this.bookingEstimateRequest) this.bookingEstimateLoading.set(false);
    }
  }

  continue(): void {
    const vehicle = this.vehicle();
    const pickup = this.pickupDate();
    const returnDate = this.returnDate();
    if (!vehicle || !pickup || !returnDate || returnDate <= pickup) return;

    this.bookingService.startDraft(
      { id: vehicle.id, name: vehicle.name, price: vehicle.price, srPoints: vehicle.sr_points, image: vehicle.image },
      pickup,
      returnDate,
      this.pickupLocation(),
    );

    this.router.navigate(['/booking', vehicle.id, 'details']);
  }

  goToFleet(): void {
    this.router.navigate(['/tabs/rent-a-car']);
  }
}
