import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonContent],
  templateUrl: './admin-login.page.html',
  styleUrl: './admin-login.page.scss',
})
export class AdminLoginPage implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);

  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    void this.redirectIfAdmin();
  }

  private async redirectIfAdmin(): Promise<void> {
    try {
      await this.auth.refreshSession();
      if (this.auth.currentUser()?.isAdmin) await this.router.navigateByUrl('/admin');
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to verify your admin session.');
    }
  }

  async submit(): Promise<void> {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.submitting.set(true);
    try {
      const { email, password } = this.form.getRawValue();
      const { error } = await this.supabase.client.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw new Error(error.message);

      await this.auth.refreshSession();
      if (!this.auth.currentUser()?.isAdmin) {
        await this.auth.logout();
        this.errorMessage.set('This account is not authorized to use the administrator portal.');
        return;
      }

      await this.router.navigateByUrl('/admin');
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to sign in to the admin portal.');
    } finally {
      this.submitting.set(false);
    }
  }
}
