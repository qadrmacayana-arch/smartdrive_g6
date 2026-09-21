import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
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
export class SettingsPage implements OnInit {
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
