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
  }

  continue(): void {
    this.errorMessage.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.isPwdSenior() && !this.pwdFileName()) {
      this.errorMessage.set('Please upload your PWD/Senior ID to proceed with the discount.');
      return;
    }

    const value = this.form.getRawValue();
    this.bookingService.updateCustomer({
      name: value.name!.trim(),
      email: value.email!.trim(),
      phone: value.phone!.trim(),
      isPwdSenior: this.isPwdSenior(),
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
}
