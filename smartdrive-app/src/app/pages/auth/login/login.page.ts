import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  IonContent,
  IonItem,
  IonInput,
  IonButton,
  IonIcon,
  IonCheckbox,
  IonText,
  IonSpinner,
} from '@ionic/angular';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
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
    IonCheckbox,
    IonText,
    IonSpinner,
  ],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false],
  });

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly oauthSubmitting = signal(false);

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {
    const rememberedEmail =
      localStorage.getItem('smartdrive_remembered_email') ||
      localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      this.form.patchValue({ email: rememberedEmail, rememberMe: true });
    }
  }

  togglePassword(): void {
    this.showPassword.update((value) => !value);
  }

  async continueWithGoogle(): Promise<void> {
    this.errorMessage.set(null);
    this.oauthSubmitting.set(true);
    try {
      await this.auth.signInWithGoogle();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Google sign-in failed.');
      this.oauthSubmitting.set(false);
    }
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password, rememberMe } = this.form.getRawValue();
    this.errorMessage.set(null);
    this.submitting.set(true);

    try {
      await this.auth.login(email!.trim(), password!);

      if (rememberMe) {
        localStorage.setItem('smartdrive_remembered_email', email!.trim());
        localStorage.setItem('rememberedEmail', email!.trim());
      } else {
        localStorage.removeItem('smartdrive_remembered_email');
        localStorage.removeItem('rememberedEmail');
      }

      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      const destination = this.auth.currentUser()?.isAdmin
        ? '/admin'
        : returnUrl?.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : '/tabs/home';
      this.router.navigateByUrl(destination);
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to sign in.');
    } finally {
      this.submitting.set(false);
    }
  }
}
