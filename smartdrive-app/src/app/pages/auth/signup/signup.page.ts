import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonDatetime,
  IonDatetimeButton,
  IonModal,
  IonSpinner,
} from '@ionic/angular';
import { AuthService } from '../../../core/services/auth.service';

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
    IonLabel,
    IonInput,
    IonButton,
    IonIcon,
    IonSelect,
    IonSelectOption,
    IonDatetime,
    IonDatetimeButton,
    IonModal,
    IonSpinner,
  ],
  templateUrl: './signup.page.html',
  styleUrl: './signup.page.scss',
})
export class SignupPage {
  readonly form = this.fb.group(
    {
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      birthday: ['', [Validators.required]],
      address: ['', [Validators.required, Validators.minLength(5)]],
      gender: ['prefer_not_to_say', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatchValidator },
  );

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      if (this.form.hasError('mismatch')) {
        this.errorMessage.set('Passwords do not match.');
      }
      return;
    }

    const value = this.form.getRawValue();
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.submitting.set(true);

    try {
      const { hasSession } = await this.auth.signup({
        fullName: value.fullName!.trim(),
        email: value.email!.trim(),
        password: value.password!,
        birthday: value.birthday!,
        address: value.address!.trim(),
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
      this.errorMessage.set(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }
}
