import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonItem,
  IonInput,
  IonIcon,
  IonButton,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonCheckbox,
} from '@ionic/angular';
import { AuthService } from '../../../core/services/auth.service';
import { BookingDraft } from '../../../core/models/booking.model';
import { BookingService, PWD_SENIOR_CASHBACK_RATE } from '../../../core/services/booking.service';
import { calculateAgeOnDate } from '../../../core/utils/age';

@Component({
  selector: 'app-booking-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonItem,
    IonInput,
    IonIcon,
    IonButton,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonCheckbox,
  ],
  templateUrl: './booking-details.page.html',
  styleUrl: './booking-details.page.scss',
})
export class BookingDetailsPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly bookingService = inject(BookingService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly draft = this.bookingService.draft;
  readonly isPwdSenior = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly maxBirthDate = this.getTodayDate();

  readonly form = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required]],
    address: ['', [Validators.maxLength(500)]],
    driverBirthDate: ['', [Validators.required]],
    conditionsAccepted: [false, [Validators.requiredTrue]],
  });

  readonly subtotal = computed(() => (this.draft()?.vehicle.price ?? 0) * (this.draft()?.rentalDays ?? 0));
  readonly insurance = 500;
  readonly cashback = computed(() => (this.isPwdSenior() ? this.subtotal() * PWD_SENIOR_CASHBACK_RATE : 0));
  readonly total = computed(() => this.subtotal() + this.insurance);

  ngOnInit(): void {
    if (!this.draft()) {
      const vehicleId = this.route.snapshot.paramMap.get('vehicleId');
      this.router.navigate(['/booking', vehicleId, 'dates']);
      return;
    }

    const user = this.auth.currentUser();
    if (user) {
      this.form.patchValue({
        name: user.fullName,
        email: user.email,
        phone: user.phone ?? '',
        address: user.address ?? '',
        driverBirthDate: user.birthday ?? '',
      });
    }
    const customer = this.draft()?.customer;
    if (customer) {
      this.form.patchValue({
        driverBirthDate: customer.driverBirthDate ?? user?.birthday ?? '',
        address: customer.address ?? user?.address ?? '',
        conditionsAccepted: customer.conditionsAccepted,
      });
      this.isPwdSenior.set(Boolean(customer.isPwdSenior));
    }
  }

  continue(): void {
    this.errorMessage.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set(
        'Complete the required contact and driver age details, and accept the booking conditions.',
      );
      return;
    }
    const value = this.form.getRawValue();
    const driverBirthDate = value.driverBirthDate!;
    const driverAgeOnToday = calculateAgeOnDate(driverBirthDate, this.maxBirthDate);
    const driverAge = calculateAgeOnDate(driverBirthDate, this.draft()!.pickupDate);
    if (driverAgeOnToday === null || driverAge === null || driverAge < 18 || driverAge > 100) {
      this.errorMessage.set('The primary driver must be between 18 and 100 years old on the pickup date. Enter a valid date of birth.');
      return;
    }
    const customer: BookingDraft['customer'] = {
      name: value.name!.trim(),
      email: value.email!.trim(),
      phone: value.phone!.trim(),
      address: value.address?.trim() || null,
      isPwdSenior: this.isPwdSenior(),
      driverAge,
      driverBirthDate,
      conditionsAccepted: value.conditionsAccepted!,
    };

    const validationError = this.bookingService.validateCustomerBookingRequirements(customer);
    if (validationError) {
      this.errorMessage.set(validationError);
      return;
    }

    this.bookingService.updateCustomer(customer);

    const vehicleId = this.draft()!.vehicle.id;
    this.router.navigate(['/booking', vehicleId, 'payment']);
  }

  onBenefitEligibilityChange(value: string): void {
    this.isPwdSenior.set(value === 'yes');
  }

  driverAgeOnPickup(): number | null {
    const birthday = this.form.controls.driverBirthDate.value;
    const pickupDate = this.draft()?.pickupDate;
    return birthday && pickupDate ? calculateAgeOnDate(birthday, pickupDate) : null;
  }

  private getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
