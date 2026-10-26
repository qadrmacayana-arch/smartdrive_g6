import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
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
import { SupabaseService } from '../../../core/services/supabase.service';
import { RealtimeChannel } from '@supabase/supabase-js';

interface VehicleAvailabilityEvent {
  vehicle_id: number;
  pickup_date: string;
  return_date: string;
}

@Component({
  selector: 'app-booking-dates',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
  ],
  templateUrl: './booking-dates.page.html',
  styleUrl: './booking-dates.page.scss',
})
export class BookingDatesPage implements OnDestroy, OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly vehicleService = inject(VehicleService);
  private readonly bookingService = inject(BookingService);
  private readonly insights = inject(PredictiveInsightsService);
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseService);
  readonly vehicle = signal<Vehicle | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly bookingEstimate = signal<BookingDateEstimate | null>(null);
  readonly bookingEstimateLoading = signal(false);
  readonly bookingEstimateError = signal<string | null>(null);
  readonly availabilityNotice = signal<string | null>(null);
  readonly availabilityRealtimeError = signal(false);
  private bookingEstimateRequest = 0;
  private availabilityChannel: RealtimeChannel | null = null;

  readonly pickupDate = signal('');
  readonly returnDate = signal('');
  readonly selectingDate = signal<'pickup' | 'return'>('pickup');
  readonly calendarMonth = signal(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  readonly calendarMonthOptions = computed(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const horizonDate = this.selectingDate() === 'return' && this.pickupDate()
      ? this.addDaysAsDate(new Date(`${this.pickupDate()}T00:00:00`), 365)
      : this.addDaysAsDate(today, 365);
    const end = new Date(horizonDate.getFullYear(), horizonDate.getMonth(), 1);
    const options: Date[] = [];
    for (let month = new Date(start); month <= end; month.setMonth(month.getMonth() + 1)) {
      options.push(new Date(month));
    }
    return options;
  });
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

  private addDays(date: Date, days: number): string {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
    return this.formatDate(d);
  }

  private addDaysAsDate(date: Date, days: number): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
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
    if (requestedDate) {
      const date = new Date(`${requestedDate}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (!Number.isNaN(date.getTime()) && this.formatDate(date) === requestedDate && date >= today) {
        this.pickupDate.set(requestedDate);
        this.returnDate.set(this.addDays(date, 1));
        this.selectingDate.set('return');
        this.calendarMonth.set(new Date(date.getFullYear(), date.getMonth(), 1));
      }
    }
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
        this.watchAvailabilityChanges(vehicle.id);
        void this.loadBookingEstimate();
      }
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to load this vehicle.');
    } finally {
      this.loading.set(false);
    }
  }

  ngOnDestroy(): void {
    this.bookingEstimateRequest++;
    if (this.availabilityChannel) {
      void this.supabase.client.removeChannel(this.availabilityChannel);
      this.availabilityChannel = null;
    }
  }

  changeMonth(offset: number): void {
    const month = this.calendarMonth();
    const nextMonth = new Date(month.getFullYear(), month.getMonth() + offset, 1);
    const options = this.calendarMonthOptions();
    const earliestMonth = options[0];
    const latestMonth = options.at(-1);
    if (earliestMonth && latestMonth && nextMonth >= earliestMonth && nextMonth <= latestMonth) {
      this.calendarMonth.set(nextMonth);
    }
  }

  selectCalendarMonth(value: string): void {
    const [year, month] = value.split('-').map(Number);
    const selected = new Date(year, month - 1, 1);
    if (this.calendarMonthOptions().some((option) =>
      option.getFullYear() === selected.getFullYear() && option.getMonth() === selected.getMonth(),
    )) {
      this.calendarMonth.set(selected);
    }
  }

  calendarMonthValue(): string {
    const month = this.calendarMonth();
    return `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
  }

  selectDate(date: Date): void {
    this.availabilityNotice.set(null);
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
    const selected = field === 'pickup' ? this.pickupDate() : this.returnDate();
    if (selected) {
      const date = new Date(`${selected}T00:00:00`);
      this.calendarMonth.set(new Date(date.getFullYear(), date.getMonth(), 1));
      return;
    }
    const options = this.calendarMonthOptions();
    const currentMonth = this.calendarMonth();
    if (!options.some((month) =>
      month.getFullYear() === currentMonth.getFullYear() && month.getMonth() === currentMonth.getMonth(),
    )) {
      const latestMonth = options.at(-1);
      if (latestMonth) this.calendarMonth.set(latestMonth);
    }
  }

  isDateDisabled(date: Date): boolean {
    const value = this.formatDate(date);
    if (value < this.today()) return true;
    if (value > this.latestSelectableDate()) return true;
    return this.selectingDate() === 'return' && (!this.pickupDate() || value <= this.pickupDate());
  }

  isDateSelected(date: Date): boolean {
    const value = this.formatDate(date);
    return value === this.pickupDate() || value === this.returnDate();
  }

  isPickupDate(date: Date): boolean {
    return this.formatDate(date) === this.pickupDate();
  }

  isDropoffDate(date: Date): boolean {
    return this.formatDate(date) === this.returnDate();
  }

  calendarDayLabel(date: Date): string {
    const value = this.formatDate(date);
    const label = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    if (value === this.pickupDate()) return `${label}, pick-up date`;
    if (value === this.returnDate()) return `${label}, drop-off date`;
    return label;
  }

  isToday(date: Date): boolean {
    return this.formatDate(date) === this.today();
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

  private latestSelectableDate(): string {
    const anchor = this.selectingDate() === 'return' && this.pickupDate()
      ? new Date(`${this.pickupDate()}T00:00:00`)
      : new Date();
    return this.addDays(anchor, 365);
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

  refreshBookingEstimate(): void {
    void this.loadBookingEstimate();
  }

  private watchAvailabilityChanges(vehicleId: number): void {
    this.availabilityChannel = this.supabase.client
      .channel(`vehicle-availability-${vehicleId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vehicle_availability_events',
          filter: `vehicle_id=eq.${vehicleId}`,
        },
        (payload) => {
          void this.handleAvailabilityEvent(payload.new);
        },
      )
      .subscribe((status, error) => {
        if (status === 'SUBSCRIBED') {
          this.availabilityRealtimeError.set(false);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('Live vehicle availability updates are unavailable.', error);
          this.availabilityRealtimeError.set(true);
        }
      });
  }

  private async handleAvailabilityEvent(payload: unknown): Promise<void> {
    const event = this.parseAvailabilityEvent(payload);
    if (!event) {
      console.error('Received an invalid live vehicle availability event.', payload);
      this.availabilityRealtimeError.set(true);
      return;
    }

    const vehicle = this.vehicle();
    const pickup = this.pickupDate();
    const returnDate = this.returnDate();
    if (
      !vehicle
      || event.vehicle_id !== vehicle.id
      || !pickup
      || !returnDate
      || event.pickup_date >= returnDate
      || event.return_date <= pickup
    ) return;

    const previousEstimate = this.bookingEstimate();
    await this.loadBookingEstimate();
    if (
      this.vehicle()?.id !== vehicle.id
      || this.pickupDate() !== pickup
      || this.returnDate() !== returnDate
    ) return;

    const updatedEstimate = this.bookingEstimate();
    if (!updatedEstimate) {
      this.availabilityNotice.set('A reservation update was received, but availability could not be refreshed. Check again before continuing.');
      return;
    }
    if (previousEstimate?.availableQuantity === updatedEstimate.availableQuantity) return;

    this.availabilityNotice.set(
      updatedEstimate.hasConflict
        ? 'Another renter just reserved the vehicle for these dates. Choose a different date range.'
        : `Availability changed for these dates. ${updatedEstimate.availableQuantity} of ${updatedEstimate.totalQuantity} units remain.`,
    );
  }

  private parseAvailabilityEvent(payload: unknown): VehicleAvailabilityEvent | null {
    if (!payload || typeof payload !== 'object') return null;
    const record = payload as Record<string, unknown>;
    if (
      typeof record['vehicle_id'] !== 'number'
      || !Number.isSafeInteger(record['vehicle_id'])
      || typeof record['pickup_date'] !== 'string'
      || typeof record['return_date'] !== 'string'
      || !/^\d{4}-\d{2}-\d{2}$/.test(record['pickup_date'])
      || !/^\d{4}-\d{2}-\d{2}$/.test(record['return_date'])
      || record['return_date'] <= record['pickup_date']
    ) return null;
    return {
      vehicle_id: Number(record['vehicle_id']),
      pickup_date: record['pickup_date'],
      return_date: record['return_date'],
    };
  }

  continue(): void {
    const vehicle = this.vehicle();
    const pickup = this.pickupDate();
    const returnDate = this.returnDate();
    if (
      !vehicle
      || !pickup
      || !returnDate
      || returnDate <= pickup
      || this.bookingEstimateLoading()
      || this.bookingEstimateError()
      || !this.bookingEstimate()
      || this.bookingEstimate()?.hasConflict
    ) return;

    this.bookingService.startDraft(
      {
        id: vehicle.id,
        name: vehicle.name,
        price: vehicle.price,
        srPoints: vehicle.sr_points,
        image: vehicle.image,
      },
      pickup,
      returnDate,
      '',
    );

    this.router.navigate(['/booking', vehicle.id, 'details']);
  }

  goToFleet(): void {
    this.router.navigate(['/tabs/rent-a-car']);
  }
}
