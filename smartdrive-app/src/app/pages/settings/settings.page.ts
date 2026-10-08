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
  AlertController,
} from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { SupabaseService } from '../../core/services/supabase.service';

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
  ],
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.scss',
})
export class SettingsPage implements OnInit, OnDestroy {
  readonly currentUser = this.auth.currentUser;
  readonly avatarPreviewUrl = signal<string | null>(null);
  readonly uploadingAvatar = signal(false);
  readonly avatarMessage = signal<string | null>(null);
  readonly avatarError = signal(false);
  private selectedAvatar: File | null = null;
  private avatarPreviewObjectUrl: string | null = null;
  readonly profileForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    birthday: [''],
    address: [''],
    gender: ['prefer_not_to_say'],
    phone: ['', [Validators.required]],
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

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly supabase: SupabaseService,
    private readonly router: Router,
    private readonly alertCtrl: AlertController,
  ) {}

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (!user) return;
    this.profileForm.patchValue({
      fullName: user.fullName,
      birthday: user.birthday ?? '',
      address: user.address ?? '',
      gender: user.gender ?? 'prefer_not_to_say',
      phone: user.phone ?? '',
    });
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

  async saveProfile(): Promise<void> {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const value = this.profileForm.getRawValue();
    this.savingProfile.set(true);
    this.message.set(null);
    try {
      await this.auth.updateProfile({
        full_name: value.fullName!.trim(),
        birthday: value.birthday || null,
        address: value.address?.trim() || null,
        gender: value.gender as any,
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
