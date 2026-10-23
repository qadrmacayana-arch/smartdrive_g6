import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonItem,
  IonInput,
  IonButton,
  IonIcon,
  IonSpinner,
} from '@ionic/angular';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
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
    IonButton,
    IonIcon,
    IonSpinner,
  ],
  templateUrl: './reset-password.page.html',
  styleUrl: '../forgot-password/forgot-password.page.scss',
})
export class ResetPasswordPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly form = this.fb.group({
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(16),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,16}$/),
      ],
    ],
    confirmPassword: ['', Validators.required],
  });
  readonly submitting = signal(false);
  readonly message = signal<string | null>(null);
  readonly isError = signal(false);
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  constructor() {
    const url = new URL(window.location.href);
    const recoveryError = url.searchParams.get('error_description')
      ?? new URLSearchParams(url.hash.slice(1)).get('error_description');
    if (recoveryError) {
      this.isError.set(true);
      this.message.set(recoveryError.replace(/\+/g, ' '));
    }
  }

  togglePassword(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') this.showPassword.update((value) => !value);
    else this.showConfirmPassword.update((value) => !value);
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { password, confirmPassword } = this.form.getRawValue();
    if (password !== confirmPassword) {
      this.isError.set(true);
      this.message.set('The passwords do not match.');
      return;
    }

    this.submitting.set(true);
    this.message.set(null);
    try {
      await this.auth.updatePassword(password!);
      await this.auth.logout();
      await this.router.navigateByUrl('/login?passwordReset=1');
    } catch (error) {
      this.isError.set(true);
      this.message.set(error instanceof Error ? error.message : 'Unable to reset your password.');
    } finally {
      this.submitting.set(false);
    }
  }
}
