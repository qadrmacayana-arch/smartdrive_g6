import { Component, effect, HostListener, OnDestroy, signal } from '@angular/core';
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
export class LoginPage implements OnDestroy {
  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false],
  });

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly oauthSubmitting = signal(false);
  private oauthStartedRoute: string | null = null;
  private oauthResumeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {
    effect(() => {
      if (!this.auth.initialized() || this.auth.currentUser() || !this.router.url.startsWith('/login')) return;
      if (this.route.snapshot.queryParamMap.has('googleError')) return;
      if (localStorage.getItem('smartdrive_google_oauth_intent') !== 'login') return;
      this.auth.clearGoogleOAuthIntent();
      this.errorMessage.set('Google sign-in was cancelled. You can try again or sign in with email.');
    });

    const rememberedEmail =
      localStorage.getItem('smartdrive_remembered_email') ||
      localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      this.form.patchValue({ email: rememberedEmail, rememberMe: true });
    }
    if (this.route.snapshot.queryParamMap.get('googleError') === '1') {
      this.errorMessage.set(
        sessionStorage.getItem('smartdrive_google_oauth_error')
          || 'Google sign-in failed before an app session was created. Check the Supabase Google provider and database logs.',
      );
      sessionStorage.removeItem('smartdrive_google_oauth_error');
    }
  }

  togglePassword(): void {
    this.showPassword.update((value) => !value);
  }

  ngOnDestroy(): void {
    if (this.oauthResumeTimer) clearTimeout(this.oauthResumeTimer);
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
      this.errorMessage.set('Google sign-in was cancelled. You can try again or sign in with email.');
    }, 1200);
  }

  async continueWithGoogle(): Promise<void> {
    this.errorMessage.set(null);
    this.oauthStartedRoute = this.router.url;
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
