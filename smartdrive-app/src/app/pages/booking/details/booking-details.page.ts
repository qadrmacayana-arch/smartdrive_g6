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
import { BookingService } from '../../../core/services/booking.service';
import { SupabaseService } from '../../../core/services/supabase.service';
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
  private readonly supabase = inject(SupabaseService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly draft = this.bookingService.draft;
  readonly isPwdSenior = signal(false);
  readonly pwdFileName = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly profileLicenseStatus = signal<'not_provided' | 'pending' | 'verified' | 'rejected'>('not_provided');
  readonly maxBirthDate = this.getTodayDate();

  readonly form = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required]],
    address: ['', [Validators.maxLength(500)]],
    driverBirthDate: ['', [Validators.required]],
    renterType: ['', [Validators.required]],
    driverLicenseType: ['', [Validators.required]],
    driverLicenseCountry: [''],
    foreignLicenseSupport: [''],
    philippinesArrivalDate: [''],
    licenseConfirmed: [false, [Validators.requiredTrue]],
    documentsReady: [false, [Validators.requiredTrue]],
    conditionsAccepted: [false, [Validators.requiredTrue]],
  });

  readonly subtotal = computed(() => (this.draft()?.vehicle.price ?? 0) * (this.draft()?.rentalDays ?? 0));
  readonly insurance = 500;
  readonly discount = computed(() => (this.isPwdSenior() ? this.subtotal() * 0.2 : 0));
  readonly total = computed(() => this.subtotal() + this.insurance - this.discount());

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
        renterType: customer.renterType,
        driverLicenseType: customer.driverLicenseType,
        driverLicenseCountry: customer.driverLicenseCountry ?? '',
        foreignLicenseSupport: customer.foreignLicenseSupport ?? '',
        philippinesArrivalDate: customer.philippinesArrivalDate ?? '',
        licenseConfirmed: true,
        documentsReady: customer.documentsReady,
        conditionsAccepted: customer.conditionsAccepted,
      });
    }
    if (user && !user.id.startsWith('local-')) void this.loadDriverLicenseProfile(user.id);
  }

  private async loadDriverLicenseProfile(userId: string): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('renter_type,driver_license_type,driver_license_country,license_verification_status')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      console.error('Unable to load saved driver license details.', error);
      this.errorMessage.set(`Saved driver license details could not be loaded: ${error.message}`);
      return;
    }
    if (!data) return;
    const currentRenterType = this.form.controls.renterType.value;
    const savedRenterType = data.renter_type ?? '';
    const useSavedLicenseDetails = !currentRenterType || currentRenterType === savedRenterType;
    this.form.patchValue({
      renterType: currentRenterType || savedRenterType,
      driverLicenseType: this.form.controls.driverLicenseType.value || (useSavedLicenseDetails ? data.driver_license_type : '') || '',
      driverLicenseCountry: this.form.controls.driverLicenseCountry.value || (useSavedLicenseDetails ? data.driver_license_country : '') || '',
    });
    this.profileLicenseStatus.set(data.license_verification_status ?? 'not_provided');
  }

  continue(): void {
    this.errorMessage.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set(
        'Complete the required details, confirm your valid driver’s license and documents, and accept the booking conditions.',
      );
      return;
    }
    if (this.isPwdSenior() && !this.pwdFileName()) {
      this.errorMessage.set('Please upload your PWD/Senior ID to proceed with the discount.');
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
    const isForeignTourist = value.renterType === 'foreign-tourist';
    const customer: BookingDraft['customer'] = {
      name: value.name!.trim(),
      email: value.email!.trim(),
      phone: value.phone!.trim(),
      address: value.address?.trim() || null,
      isPwdSenior: this.isPwdSenior(),
      driverAge,
      driverBirthDate,
      renterType: value.renterType as 'local' | 'foreign-tourist',
      driverLicenseType: value.driverLicenseType!,
      driverLicenseCountry: isForeignTourist ? value.driverLicenseCountry?.trim() || null : null,
      foreignLicenseSupport: isForeignTourist
        ? value.driverLicenseType === 'foreign-other'
          ? (value.foreignLicenseSupport as 'idp' | 'embassy-translation')
          : 'not-required'
        : null,
      philippinesArrivalDate: isForeignTourist ? value.philippinesArrivalDate! : null,
      documentsReady: value.documentsReady!,
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

  onPwdSeniorChange(value: string): void {
    const selected = value === 'yes';
    this.isPwdSenior.set(selected);
    if (!selected) this.pwdFileName.set(null);
  }

  onPwdFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.pwdFileName.set(input.files?.[0]?.name ?? null);
  }

  onRenterTypeChange(): void {
    this.form.patchValue({
      driverLicenseType: '',
      driverLicenseCountry: '',
      foreignLicenseSupport: '',
      philippinesArrivalDate: '',
    });
  }

  onDriverLicenseTypeChange(): void {
    const support = this.form.controls.renterType.value === 'foreign-tourist'
      && this.form.controls.driverLicenseType.value === 'foreign-english'
      ? 'not-required'
      : '';
    this.form.controls.foreignLicenseSupport.setValue(support);
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
