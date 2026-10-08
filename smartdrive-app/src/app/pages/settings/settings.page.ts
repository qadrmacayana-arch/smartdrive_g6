import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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
  IonSelect,
  IonSelectOption,
  IonButton,
  IonIcon,
  IonSpinner,
  IonDatetime,
  IonDatetimeButton,
  IonModal,
  IonToggle,
  AlertController,
} from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { SupabaseService } from '../../core/services/supabase.service';
import {
  PhilippineBarangay,
  PhilippineCityMunicipality,
  PhilippineLocationService,
  PhilippineProvince,
  PhilippineRegion,
} from '../../core/services/philippine-location.service';
import { Profile } from '../../core/models/profile.model';
import { NotificationCenterService } from '../../core/services/notification-center.service';

function profileGender(value: string | null | undefined): Profile['gender'] {
  if (value === 'male' || value === 'female' || value === 'other') return value;
  return 'prefer_not_to_say';
}

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('newPassword')?.value;
  const confirm = control.get('confirmPassword')?.value;
  if (!password && !confirm) return null;
  return password === confirm ? null : { mismatch: true };
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonIcon,
    IonSpinner,
    IonDatetime,
    IonDatetimeButton,
    IonModal,
    IonToggle,
  ],
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.scss',
})
export class SettingsPage implements OnInit, OnDestroy {
  readonly ncrRegionCode = '130000000';
  readonly currentUser = this.auth.currentUser;
  readonly regions = signal<PhilippineRegion[]>([]);
  readonly provinces = signal<PhilippineProvince[]>([]);
  readonly cities = signal<PhilippineCityMunicipality[]>([]);
  readonly barangays = signal<PhilippineBarangay[]>([]);
  readonly locationsLoading = signal(true);
  readonly provincesLoading = signal(false);
  readonly citiesLoading = signal(false);
  readonly barangaysLoading = signal(false);
  readonly locationError = signal<string | null>(null);
  readonly avatarPreviewUrl = signal<string | null>(null);
  readonly uploadingAvatar = signal(false);
  readonly avatarMessage = signal<string | null>(null);
  readonly avatarError = signal(false);
  private selectedAvatar: File | null = null;
  private avatarPreviewObjectUrl: string | null = null;
  readonly profileForm = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    middleName: [''],
    surname: ['', [Validators.required, Validators.minLength(2)]],
    suffix: [''],
    birthday: [''],
    address: [''],
    region: ['', [Validators.required]],
    province: [''],
    city: ['', [Validators.required]],
    barangay: ['', [Validators.required]],
    gender: ['prefer_not_to_say' as Profile['gender']],
    phone: ['', [Validators.required, Validators.pattern(/^(?:\+63|0)\d{10}$/)]],
  });

  readonly passwordForm = this.fb.group(
    {
      newPassword: [''],
      confirmPassword: [''],
    },
    { validators: passwordsMatchValidator },
  );

  readonly savingProfile = signal(false);
  readonly savingPassword = signal(false);
  readonly message = signal<string | null>(null);
  readonly isError = signal(false);
  readonly notificationsEnabled = signal(false);
  readonly notificationStatus = signal<string | null>(null);

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly supabase: SupabaseService,
    private readonly router: Router,
    private readonly alertCtrl: AlertController,
    private readonly locationService: PhilippineLocationService,
    private readonly notificationCenter: NotificationCenterService,
  ) {}

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (!user) return;
    this.notificationsEnabled.set(
      this.notificationCenter.notificationsEnabled(user.id),
    );
    void this.refreshNotificationPermission(user.id);
    const nameParts = this.nameParts(user.fullName);
    this.profileForm.patchValue({
      firstName: user.firstName || nameParts.firstName,
      middleName: user.middleName || nameParts.middleName,
      surname: user.surname || nameParts.surname,
      suffix: user.suffix || nameParts.suffix,
      birthday: user.birthday ?? '',
      address: user.address ?? '',
      gender: profileGender(user.gender),
      phone: user.phone ?? '',
    });
    void this.loadLocations();
  }

  private async refreshNotificationPermission(userId: string): Promise<void> {
    try {
      const permissionGranted = await this.notificationCenter.checkPermission();
      this.notificationsEnabled.set(
        permissionGranted && this.notificationCenter.notificationsEnabled(userId),
      );
      if (this.notificationCenter.notificationsEnabled(userId) && !permissionGranted) {
        this.notificationStatus.set('Notifications are blocked by device/browser settings.');
      }
    } catch (error) {
      console.error('Unable to check notification permission.', error);
      this.notificationStatus.set('Could not check notification permission.');
    }
  }

  async setNotifications(event: CustomEvent<{ checked: boolean }>): Promise<void> {
    const user = this.currentUser();
    if (!user) {
      this.notificationStatus.set('Sign in again to update notification settings.');
      return;
    }

    const enabled = event.detail.checked;
    const wasEnabled = this.notificationsEnabled();
    this.notificationStatus.set(null);
    try {
      await this.notificationCenter.setEnabled(user.id, enabled);
      this.notificationsEnabled.set(enabled);
      this.notificationStatus.set(
        enabled ? 'Notifications are on for this device.' : 'Notifications are turned off.',
      );
    } catch (error) {
      this.notificationsEnabled.set(wasEnabled);
      this.notificationStatus.set(error instanceof Error ? error.message : 'Unable to update notifications.');
    }
  }

  ngOnDestroy(): void {
    this.revokeAvatarPreview();
  }

  onAvatarSelected(event: Event): void {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement)) return;
    const file = input.files?.[0];
    if (!file) return;

    this.avatarMessage.set(null);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.clearSelectedAvatar();
      this.avatarError.set(true);
      this.avatarMessage.set('Choose a JPG, PNG, or WebP image.');
      input.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.clearSelectedAvatar();
      this.avatarError.set(true);
      this.avatarMessage.set('Choose an image smaller than 5 MB.');
      input.value = '';
      return;
    }

    this.revokeAvatarPreview();
    this.selectedAvatar = file;
    this.avatarPreviewObjectUrl = URL.createObjectURL(file);
    this.avatarPreviewUrl.set(this.avatarPreviewObjectUrl);
  }

  async uploadAvatar(): Promise<void> {
    if (!this.selectedAvatar || this.uploadingAvatar()) return;

    this.uploadingAvatar.set(true);
    this.avatarMessage.set(null);
    try {
      await this.auth.updateAvatar(this.selectedAvatar);
      this.selectedAvatar = null;
      this.revokeAvatarPreview();
      this.avatarError.set(false);
      this.avatarMessage.set('Profile photo updated.');
    } catch (error) {
      this.avatarError.set(true);
      this.avatarMessage.set(error instanceof Error ? error.message : 'Unable to upload your profile photo.');
    } finally {
      this.uploadingAvatar.set(false);
    }
  }

  private revokeAvatarPreview(): void {
    if (this.avatarPreviewObjectUrl) URL.revokeObjectURL(this.avatarPreviewObjectUrl);
    this.avatarPreviewObjectUrl = null;
    this.avatarPreviewUrl.set(null);
  }

  private clearSelectedAvatar(): void {
    this.selectedAvatar = null;
    this.revokeAvatarPreview();
  }

  private nameParts(fullName: string): { firstName: string; middleName: string; surname: string; suffix: string } {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    const suffixes = ['Jr.', 'Sr.', 'II', 'III'];
    const suffix = suffixes.includes(parts[parts.length - 1] ?? '') ? parts.pop()! : '';
    return {
      firstName: parts[0] ?? '',
      middleName: parts.length > 2 ? parts.slice(1, -1).join(' ') : '',
      surname: parts.length > 1 ? parts[parts.length - 1] : '',
      suffix,
    };
  }

  async loadLocations(): Promise<void> {
    const user = this.currentUser();
    this.locationsLoading.set(true);
    this.locationError.set(null);
    try {
      const data = await this.locationService.getLocations();
      this.regions.set(data.regions);

      const region = data.regions.find((item) =>
        item.code === user?.region
        || item.name === user?.regionName
        || item.name === user?.region
        || item.regionName === user?.regionName,
      );
      if (!region) return;

      this.profileForm.controls.region.setValue(region.code);
      await this.updateRegion(true);
    } catch (error) {
      this.locationError.set(error instanceof Error ? error.message : 'Philippine location data could not be loaded.');
    } finally {
      this.locationsLoading.set(false);
    }
  }

  async updateRegion(preserveProfile = false): Promise<void> {
    const regionCode = this.profileForm.controls.region.value ?? '';
    const region = this.regions().find((item) => item.code === regionCode);
    this.locationError.set(null);
    this.provinces.set([]);
    this.cities.set([]);
    this.barangays.set([]);
    if (!preserveProfile) {
      this.profileForm.patchValue({ province: '', city: '', barangay: '' });
    }
    this.profileForm.controls.province.setValidators(regionCode === this.ncrRegionCode ? [] : [Validators.required]);
    this.profileForm.controls.province.updateValueAndValidity({ emitEvent: false });
    if (!region) return;

    this.provincesLoading.set(regionCode !== this.ncrRegionCode);
    this.citiesLoading.set(regionCode === this.ncrRegionCode);
    try {
      const data = await this.locationService.getLocations();
      if (this.profileForm.controls.region.value !== regionCode) return;
      if (regionCode === this.ncrRegionCode) {
        const cities = data.cities.filter((city) => city.regionCode === regionCode);
        this.cities.set(cities);
        if (preserveProfile) {
          const user = this.currentUser();
          const city = cities.find((item) =>
            item.code === user?.city || item.name === user?.cityName || item.name === user?.city,
          );
          if (city) {
            this.profileForm.controls.city.setValue(city.code);
            await this.updateCity(true);
          }
        }
      } else {
        const provinces = data.provinces.filter((province) => province.regionCode === regionCode);
        this.provinces.set(provinces);
        if (preserveProfile) {
          const user = this.currentUser();
          const province = provinces.find((item) =>
            item.code === user?.province || item.name === user?.provinceName || item.name === user?.province,
          );
          if (province) {
            this.profileForm.controls.province.setValue(province.code);
            await this.updateProvince(true);
          }
        }
      }
    } catch (error) {
      this.locationError.set(error instanceof Error ? error.message : 'Region locations could not be loaded.');
    } finally {
      this.provincesLoading.set(false);
      this.citiesLoading.set(false);
    }
  }

  async updateProvince(preserveProfile = false): Promise<void> {
    const provinceCode = this.profileForm.controls.province.value ?? '';
    this.cities.set([]);
    this.barangays.set([]);
    if (!preserveProfile) this.profileForm.patchValue({ city: '', barangay: '' });
    this.locationError.set(null);
    if (!provinceCode) return;

    this.citiesLoading.set(true);
    try {
      const data = await this.locationService.getLocations();
      if (this.profileForm.controls.province.value !== provinceCode) return;
      const cities = data.cities.filter((city) => city.provinceCode === provinceCode);
      this.cities.set(cities);
      if (preserveProfile) {
        const user = this.currentUser();
        const city = cities.find((item) =>
          item.code === user?.city || item.name === user?.cityName || item.name === user?.city,
        );
        if (city) {
          this.profileForm.controls.city.setValue(city.code);
          await this.updateCity(true);
        }
      }
    } catch (error) {
      this.locationError.set(error instanceof Error ? error.message : 'City and municipality data could not be loaded.');
    } finally {
      this.citiesLoading.set(false);
    }
  }

  async updateCity(preserveProfile = false): Promise<void> {
    const cityCode = this.profileForm.controls.city.value ?? '';
    if (!preserveProfile) this.profileForm.controls.barangay.setValue('');
    this.barangays.set([]);
    this.locationError.set(null);
    if (!cityCode) return;

    this.barangaysLoading.set(true);
    try {
      const barangays = await this.locationService.getBarangays(cityCode);
      if (this.profileForm.controls.city.value !== cityCode) return;
      this.barangays.set(barangays);
      if (preserveProfile) {
        const user = this.currentUser();
        const barangay = barangays.find((item) =>
          item.code === user?.barangay || item.name === user?.barangayName || item.name === user?.barangay,
        );
        if (barangay) this.profileForm.controls.barangay.setValue(barangay.code);
      }
    } catch (error) {
      this.locationError.set(error instanceof Error ? error.message : 'Barangay data could not be loaded.');
    } finally {
      this.barangaysLoading.set(false);
    }
  }

  async saveProfile(): Promise<void> {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.isError.set(true);
      this.message.set('Complete the required name, phone, and location fields before saving.');
      return;
    }

    const value = this.profileForm.getRawValue();
    const region = this.regions().find((item) => item.code === value.region);
    const province = this.provinces().find((item) => item.code === value.province);
    const city = this.cities().find((item) => item.code === value.city);
    const barangay = this.barangays().find((item) => item.code === value.barangay);
    if (!region || !city || !barangay || (region.code !== this.ncrRegionCode && !province)) {
      this.locationError.set('Choose a valid region, province (outside NCR), city or municipality, and barangay.');
      return;
    }

    this.savingProfile.set(true);
    this.message.set(null);
    this.isError.set(false);
    this.locationError.set(null);
    try {
      await this.auth.updateProfile({
        full_name: [value.firstName, value.middleName, value.surname, value.suffix]
          .filter((part) => Boolean(part?.trim()))
          .join(' '),
        first_name: value.firstName!.trim(),
        middle_name: value.middleName?.trim() || null,
        surname: value.surname!.trim(),
        suffix: value.suffix || null,
        birthday: value.birthday || null,
        address: value.address?.trim() || null,
        region: region.code,
        region_name: region.name,
        province: province?.code ?? null,
        province_name: province?.name ?? null,
        city: city.code,
        city_name: city.name,
        barangay: barangay.code,
        barangay_name: barangay.name,
        gender: value.gender ?? 'prefer_not_to_say',
        phone: value.phone!.trim(),
      });
      this.isError.set(false);
      this.message.set('Profile updated successfully.');
    } catch (error) {
      this.isError.set(true);
      this.message.set(error instanceof Error ? error.message : 'Unable to update your profile.');
    } finally {
      this.savingProfile.set(false);
    }
  }

  async savePassword(): Promise<void> {
    if (this.passwordForm.invalid || !this.passwordForm.value.newPassword) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.savingPassword.set(true);
    this.message.set(null);
    try {
      await this.auth.updatePassword(this.passwordForm.value.newPassword!);
      this.isError.set(false);
      this.message.set('Password updated successfully.');
      this.passwordForm.reset();
    } catch (error) {
      this.isError.set(true);
      this.message.set(error instanceof Error ? error.message : 'Unable to update your password.');
    } finally {
      this.savingPassword.set(false);
    }
  }

  async deleteAccount(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Delete your account?',
      message: 'This permanently deletes your SmartDrive™ account and cannot be undone.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            const { error } = await this.supabase.client.rpc('delete_my_account');
            if (!error) {
              await this.auth.logout();
              this.router.navigateByUrl('/login');
            }
          },
        },
      ],
    });
    await alert.present();
  }
}
