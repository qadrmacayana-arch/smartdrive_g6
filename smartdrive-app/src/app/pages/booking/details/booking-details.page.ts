import { Component, OnInit, computed, signal } from '@angular/core';
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
import { BookingService } from '../../../core/services/booking.service';

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
  readonly draft = this.bookingService.draft;
  readonly isPwdSenior = signal(false);
  readonly pwdFileName = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required]],
    driverAge: [null as number | null, [Validators.required, Validators.min(18), Validators.max(100)]],
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

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly bookingService: BookingService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    if (!this.draft()) {
      const vehicleId = this.route.snapshot.paramMap.get('vehicleId');
      this.router.navigate(['/booking', vehicleId, 'dates']);
      return;
    }

    const user = this.auth.currentUser();
    if (user) {
      this.form.patchValue({ name: user.fullName, email: user.email, phone: user.phone ?? '' });
    }
    const customer = this.draft()?.customer;
    if (customer) {
      this.form.patchValue({
        driverAge: customer.driverAge,
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
    const driverAge = Number(value.driverAge);
    if (!Number.isInteger(driverAge) || driverAge < 18 || driverAge > 100) {
      this.errorMessage.set('Enter a valid age for the primary driver.');
      return;
    }
    const isForeignTourist = value.renterType === 'foreign-tourist';
    if (
      isForeignTourist
      && (!value.driverLicenseCountry?.trim() || !value.philippinesArrivalDate)
    ) {
      this.errorMessage.set('Enter the driver’s license country and Philippine arrival date for manual verification.');
      return;
    }
    if (
      isForeignTourist
      && value.driverLicenseType === 'foreign-other'
      && !['idp', 'embassy-translation'].includes(value.foreignLicenseSupport ?? '')
    ) {
      this.errorMessage.set('Select the IDP or official translation you will present with a non-Roman-alphabet license.');
      return;
    }

    this.bookingService.updateCustomer({
      name: value.name!.trim(),
      email: value.email!.trim(),
      phone: value.phone!.trim(),
      isPwdSenior: this.isPwdSenior(),
      driverAge,
      renterType: value.renterType as 'local' | 'foreign-tourist',
      driverLicenseType: value.driverLicenseType!,
      driverLicenseCountry: isForeignTourist ? value.driverLicenseCountry!.trim() : null,
      foreignLicenseSupport: isForeignTourist
        ? value.driverLicenseType === 'foreign-other'
          ? value.foreignLicenseSupport as 'idp' | 'embassy-translation'
          : 'not-required'
        : null,
      philippinesArrivalDate: isForeignTourist ? value.philippinesArrivalDate! : null,
      documentsReady: value.documentsReady!,
      conditionsAccepted: value.conditionsAccepted!,
    });

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
}
