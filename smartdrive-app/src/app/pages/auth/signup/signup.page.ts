import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent,
  IonItem,
  IonInput,
  IonButton,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonModal,
  IonSpinner,
  IonCheckbox,
  IonText,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
} from '@ionic/angular';
import { AuthService } from '../../../core/services/auth.service';
import {
  PhilippineBarangay,
  PhilippineCityMunicipality,
  PhilippineLocationService,
  PhilippineProvince,
  PhilippineRegion,
} from '../../../core/services/philippine-location.service';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password && confirmPassword && password !== confirmPassword ? { mismatch: true } : null;
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    IonContent,
    IonItem,
    IonInput,
    IonButton,
    IonIcon,
    IonSelect,
    IonSelectOption,
    IonModal,
    IonSpinner,
    IonCheckbox,
    IonText,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
  ],
  templateUrl: './signup.page.html',
  styleUrl: './signup.page.scss',
})
export class SignupPage implements OnInit {
  readonly ncrRegionCode = '130000000';
  readonly regions = signal<PhilippineRegion[]>([]);
  readonly provinces = signal<PhilippineProvince[]>([]);
  readonly cities = signal<PhilippineCityMunicipality[]>([]);
  readonly barangays = signal<PhilippineBarangay[]>([]);
  readonly locationsLoading = signal(true);
  readonly provincesLoading = signal(false);
  readonly citiesLoading = signal(false);
  readonly barangaysLoading = signal(false);
  readonly locationError = signal<string | null>(null);
  readonly legalOpen = signal<'terms' | 'privacy' | null>(null);
  readonly form = this.fb.group(
    {
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      middleName: [''],
      surname: ['', [Validators.required, Validators.minLength(2)]],
      suffix: [''],
      birthday: ['', [Validators.required]],
      address: ['', [Validators.required, Validators.minLength(3)]],
      region: ['', [Validators.required]],
      province: ['', [Validators.required]],
      city: ['', [Validators.required]],
      barangay: ['', [Validators.required]],
      gender: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^(?:\+63|0)\d{10}$/)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(16), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)]],
      confirmPassword: ['', [Validators.required, Validators.maxLength(16)]],
      agreeToTerms: [false, [Validators.requiredTrue]],
    },
    { validators: passwordsMatchValidator },
  );

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly oauthSubmitting = signal(false);

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly locationService: PhilippineLocationService,
  ) {}

  ngOnInit(): void {
    void this.loadLocations();
  }

  async loadLocations(): Promise<void> {
    this.locationsLoading.set(true);
    this.locationError.set(null);
    try {
      const data = await this.locationService.getLocations();
      this.regions.set(data.regions);
    } catch (error) {
      this.locationError.set(error instanceof Error ? error.message : 'Philippine location data could not be loaded.');
    } finally {
      this.locationsLoading.set(false);
    }
  }

  togglePassword(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') this.showPassword.update((value) => !value);
    else this.showConfirmPassword.update((value) => !value);
  }

  private showSignupError(message: string): void {
    this.errorMessage.set(message);
    requestAnimationFrame(() => {
      void document.querySelector<HTMLIonContentElement>('ion-content.auth-page')?.scrollToTop(300);
    });
  }

  async updateRegion(): Promise<void> {
    const region = this.form.controls.region.value ?? '';
    this.form.patchValue({ province: '', city: '', barangay: '' });
    this.provinces.set([]);
    this.cities.set([]);
    this.barangays.set([]);
    this.locationError.set(null);
    this.form.controls.province.setValidators(region === this.ncrRegionCode ? [] : [Validators.required]);
    this.form.controls.province.updateValueAndValidity({ emitEvent: false });

    if (!region) return;
    this.provincesLoading.set(true);
    this.citiesLoading.set(region === this.ncrRegionCode);
    try {
      const data = await this.locationService.getLocations();
      if (this.form.controls.region.value !== region) return;
      if (region === this.ncrRegionCode) {
        this.cities.set(data.cities.filter((city) => city.regionCode === region));
      } else {
        this.provinces.set(data.provinces.filter((province) => province.regionCode === region));
      }
    } catch (error) {
      this.locationError.set(error instanceof Error ? error.message : 'Region locations could not be loaded.');
    } finally {
      this.provincesLoading.set(false);
      this.citiesLoading.set(false);
    }
  }

  async updateProvince(): Promise<void> {
    const province = this.form.controls.province.value ?? '';
    this.form.patchValue({ city: '', barangay: '' });
    this.cities.set([]);
    this.barangays.set([]);
    this.locationError.set(null);
    if (!province) return;

    this.citiesLoading.set(true);
    try {
      const data = await this.locationService.getLocations();
      if (this.form.controls.province.value !== province) return;
      this.cities.set(data.cities.filter((city) => city.provinceCode === province));
    } catch (error) {
      this.locationError.set(error instanceof Error ? error.message : 'City and municipality data could not be loaded.');
    } finally {
      this.citiesLoading.set(false);
    }
  }

  async updateCity(): Promise<void> {
    const city = this.form.controls.city.value ?? '';
    this.form.patchValue({ barangay: '' });
    this.barangays.set([]);
    this.locationError.set(null);
    this.barangaysLoading.set(true);
    try {
      const barangays = await this.locationService.getBarangays(city);
      if (this.form.controls.city.value !== city) return;
      this.barangays.set(barangays);
    } catch (error) {
      this.locationError.set(error instanceof Error ? error.message : 'Barangay data could not be loaded.');
    } finally {
      this.barangaysLoading.set(false);
    }
  }

  closeLegal(): void {
    this.legalOpen.set(null);
  }

  passwordStrength(): string {
    const password = this.form.controls.password.value ?? '';
    if (password.length < 8) return 'Use at least 8 characters.';
    if (password.length > 16) return 'Use no more than 16 characters.';
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
      return 'Add uppercase, lowercase, and a number.';
    }
    return 'Strong password.';
  }

  async continueWithGoogle(): Promise<void> {
    this.errorMessage.set(null);
    this.oauthSubmitting.set(true);
    try {
      await this.auth.signInWithGoogle();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Google sign-up failed.');
      this.oauthSubmitting.set(false);
    }
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      if (this.form.hasError('mismatch')) {
        this.showSignupError('Passwords do not match.');
      } else {
        const invalidFields: string[] = [];
        if (this.form.controls.firstName.invalid) invalidFields.push('First name');
        if (this.form.controls.surname.invalid) invalidFields.push('Surname');
        if (this.form.controls.birthday.invalid) invalidFields.push('Birthday');
        if (this.form.controls.address.invalid) invalidFields.push('Street / house number');
        if (this.form.controls.region.invalid) invalidFields.push('Region');
        if (this.form.controls.province.invalid) invalidFields.push('Province');
        if (this.form.controls.city.invalid) invalidFields.push('City / municipality');
        if (this.form.controls.barangay.invalid) invalidFields.push('Barangay');
        if (this.form.controls.gender.invalid) invalidFields.push('Gender');
        if (this.form.controls.email.invalid) invalidFields.push('Valid email address');
        if (this.form.controls.phone.invalid) invalidFields.push('Phone number');
        if (this.form.controls.password.invalid) {
          invalidFields.push('Password (8–16 characters, uppercase, lowercase, and a number)');
        }
        if (this.form.controls.confirmPassword.invalid) invalidFields.push('Confirm password');
        if (this.form.controls.agreeToTerms.invalid) invalidFields.push('Agree to the Terms and Privacy Policy');
        this.showSignupError(`Please check: ${invalidFields.join('; ')}.`);
      }
      return;
    }

    const value = this.form.getRawValue();
    const selectedRegion = this.regions().find((region) => region.code === value.region);
    const selectedProvince = this.provinces().find((province) => province.code === value.province);
    const selectedCity = this.cities().find((city) => city.code === value.city);
    const selectedBarangay = this.barangays().find((barangay) => barangay.code === value.barangay);
    const provinceRequired = value.region !== this.ncrRegionCode;
    if (!selectedRegion || (provinceRequired && !selectedProvince) || !selectedCity || !selectedBarangay) {
      this.locationError.set('Select a valid region, city or municipality, and barangay. A province is also required outside NCR.');
      return;
    }
    this.errorMessage.set(null);
    this.locationError.set(null);
    this.successMessage.set(null);
    this.submitting.set(true);

    try {
      const { hasSession } = await this.auth.signup({
        fullName: [value.firstName, value.middleName, value.surname, value.suffix]
          .filter(Boolean)
          .join(' ')
          .trim(),
        firstName: value.firstName!.trim(),
        middleName: value.middleName?.trim() ?? '',
        surname: value.surname!.trim(),
        suffix: value.suffix ?? '',
        email: value.email!.trim(),
        password: value.password!,
        birthday: value.birthday!,
        address: [value.address, selectedBarangay.name, selectedCity.name, selectedProvince?.name, selectedRegion.name]
          .filter(Boolean)
          .join(', ')
          .trim(),
        region: selectedRegion.name,
        province: selectedProvince?.name ?? '',
        city: selectedCity.name,
        barangay: selectedBarangay.name,
        gender: value.gender!,
        phone: value.phone!.trim(),
      });

      if (hasSession) {
        this.successMessage.set('Account created successfully! Redirecting...');
        setTimeout(() => this.router.navigateByUrl('/tabs/home'), 1200);
      } else {
        this.successMessage.set('Account created! Check your email to confirm, then log in.');
        setTimeout(() => this.router.navigateByUrl('/login'), 1800);
      }
    } catch (error) {
      this.showSignupError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }
}
