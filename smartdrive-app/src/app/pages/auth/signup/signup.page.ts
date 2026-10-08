import { Component, effect, HostListener, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
import { AuthService, type SignupPayload } from '../../../core/services/auth.service';
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

function birthdayFormatValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '');
  if (!value) return null;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return { birthdayFormat: true };
  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date.getFullYear() === year
    && date.getMonth() === month - 1
    && date.getDate() === day
    && date <= today
    ? null
    : { birthdayFormat: true };
}

function toIsoDate(value: string): string {
  const [month, day, year] = value.split('/');
  return `${year}-${month}-${day}`;
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
export class SignupPage implements OnInit, OnDestroy {
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
  readonly googleRegistration = signal(false);
  readonly googleEmail = signal('');
  readonly profilePhotoPreview = signal<string | null>(null);
  private selectedProfilePhoto: File | null = null;
  private profilePhotoObjectUrl: string | null = null;
  readonly form = this.fb.group(
    {
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      middleName: [''],
      surname: ['', [Validators.required, Validators.minLength(2)]],
      suffix: [''],
      birthday: ['', [Validators.required, birthdayFormatValidator]],
      address: ['', [Validators.required, Validators.minLength(3)]],
      region: ['', [Validators.required]],
      province: ['', [Validators.required]],
      city: ['', [Validators.required]],
      barangay: ['', [Validators.required]],
      gender: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^(?:\+63|0)\d{10}$/)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(16), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,16}$/)]],
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
  private oauthStartedRoute: string | null = null;
  private oauthResumeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly locationService: PhilippineLocationService,
  ) {
    effect(() => {
      if (!this.auth.initialized() || this.auth.currentUser() || !this.router.url.startsWith('/signup')) return;
      if (this.route.snapshot.queryParamMap.has('googleError')) return;
      if (localStorage.getItem('smartdrive_google_oauth_intent') !== 'registration') return;
      this.auth.clearGoogleOAuthIntent();
      this.errorMessage.set('Google sign-up was cancelled. You can try again or create an account with email.');
    });

    effect(() => {
      if (!this.googleRegistration() || !this.auth.initialized()) return;
      const user = this.auth.currentUser();
      if (!user?.email) {
        this.googleRegistration.set(false);
        this.errorMessage.set('Google sign-in did not complete. Please try again.');
        return;
      }
      this.googleEmail.set(user.email);
      this.form.controls.email.setValue(user.email);
      this.form.controls.email.disable();
      this.form.patchValue({
        firstName: user.firstName ?? '',
        middleName: user.middleName ?? '',
        surname: user.surname ?? '',
      });
      this.profilePhotoPreview.set(user.avatarUrl ?? null);
    });
  }

  ngOnInit(): void {
    this.googleRegistration.set(this.route.snapshot.queryParamMap.get('googleRegistration') === '1');
    if (this.googleRegistration()) {
      this.form.controls.password.clearValidators();
      this.form.controls.confirmPassword.clearValidators();
      this.form.controls.password.updateValueAndValidity();
      this.form.controls.confirmPassword.updateValueAndValidity();
    }
    if (this.route.snapshot.queryParamMap.get('googleError') === '1') {
      this.errorMessage.set(
        sessionStorage.getItem('smartdrive_google_oauth_error')
          || 'Google sign-in failed before an app session was created. Check the Supabase Google provider and database logs.',
      );
      sessionStorage.removeItem('smartdrive_google_oauth_error');
    }
    void this.loadLocations();
  }

  ngOnDestroy(): void {
    if (this.profilePhotoObjectUrl) URL.revokeObjectURL(this.profilePhotoObjectUrl);
    if (this.oauthResumeTimer) clearTimeout(this.oauthResumeTimer);
  }

  onProfilePhotoSelected(event: Event): void {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement)) return;
    const file = input.files?.[0] ?? null;
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      this.errorMessage.set('Choose a JPG, PNG, or WebP profile photo smaller than 5 MB.');
      this.selectedProfilePhoto = null;
      input.value = '';
      return;
    }
    this.errorMessage.set(null);
    if (this.profilePhotoObjectUrl) URL.revokeObjectURL(this.profilePhotoObjectUrl);
    this.selectedProfilePhoto = file;
    this.profilePhotoObjectUrl = URL.createObjectURL(file);
    this.profilePhotoPreview.set(this.profilePhotoObjectUrl);
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
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9\s]/.test(password)) {
      return 'Use uppercase, lowercase, a number, and a symbol.';
    }
    return 'Strong password.';
  }

  @HostListener('document:visibilitychange')
  onVisibilityChange(): void {
    this.resetOAuthAfterReturn();
  }

  @HostListener('window:focus')
  onWindowFocus(): void {
    this.resetOAuthAfterReturn();
  }

  private resetOAuthAfterReturn(): void {
    if (document.visibilityState === 'hidden' || !this.oauthSubmitting() || this.oauthResumeTimer) return;

    this.oauthResumeTimer = setTimeout(() => {
      this.oauthResumeTimer = null;
      if (!this.oauthSubmitting() || this.router.url !== this.oauthStartedRoute || this.auth.currentUser()) return;

      this.auth.clearGoogleOAuthIntent();
      this.oauthSubmitting.set(false);
      this.errorMessage.set('Google sign-up was cancelled. You can try again or create an account with email.');
    }, 1200);
  }

  async continueWithGoogle(): Promise<void> {
    this.errorMessage.set(null);
    this.oauthStartedRoute = this.router.url;
    this.oauthSubmitting.set(true);
    try {
      await this.auth.signInWithGoogle('registration');
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
        if (this.form.controls.birthday.invalid) invalidFields.push('Birthday (MM/DD/YYYY)');
        if (this.form.controls.address.invalid) invalidFields.push('Street / house number');
        if (this.form.controls.region.invalid) invalidFields.push('Region');
        if (this.form.controls.province.invalid) invalidFields.push('Province');
        if (this.form.controls.city.invalid) invalidFields.push('City / municipality');
        if (this.form.controls.barangay.invalid) invalidFields.push('Barangay');
        if (this.form.controls.gender.invalid) invalidFields.push('Gender');
        if (this.form.controls.email.invalid) invalidFields.push('Valid email address');
        if (this.form.controls.phone.invalid) invalidFields.push('Phone number');
        if (!this.googleRegistration() && this.form.controls.password.invalid) {
          invalidFields.push('Password (8–16 characters, uppercase, lowercase, a number, and a symbol)');
        }
        if (!this.googleRegistration() && this.form.controls.confirmPassword.invalid) {
          invalidFields.push('Confirm password');
        }
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
      const payload: SignupPayload = {
        fullName: [value.firstName, value.middleName, value.surname, value.suffix]
          .filter(Boolean)
          .join(' ')
          .trim(),
        firstName: value.firstName!.trim(),
        middleName: value.middleName?.trim() ?? '',
        surname: value.surname!.trim(),
        suffix: value.suffix ?? '',
        email: (this.googleRegistration() ? this.googleEmail() : value.email)!.trim(),
        password: value.password ?? '',
        birthday: toIsoDate(value.birthday!),
        address: value.address!.trim(),
        regionCode: selectedRegion.code,
        region: selectedRegion.name,
        provinceCode: selectedProvince?.code ?? '',
        province: selectedProvince?.name ?? '',
        cityCode: selectedCity.code,
        city: selectedCity.name,
        barangayCode: selectedBarangay.code,
        barangay: selectedBarangay.name,
        gender: value.gender!,
        phone: value.phone!.trim(),
      };
      const hasSession = this.googleRegistration()
        ? (await this.auth.completeGoogleSignup(payload), true)
        : (await this.auth.signup(payload)).hasSession;
      if (this.googleRegistration() && this.selectedProfilePhoto) {
        try {
          await this.auth.updateAvatar(this.selectedProfilePhoto);
        } catch (error) {
          this.errorMessage.set(error instanceof Error
            ? `Registration is complete, but the profile photo could not be saved: ${error.message}`
            : 'Registration is complete, but the profile photo could not be saved.');
        }
      }

      if (hasSession) {
        this.successMessage.set(this.googleRegistration()
          ? 'Google account registration completed! Redirecting...'
          : 'Account created successfully! Redirecting...');
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
