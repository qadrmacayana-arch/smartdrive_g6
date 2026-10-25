import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  IonContent,
  IonIcon,
  IonButton,
} from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { ContactMessageService } from '../../core/services/contact-message.service';
import { SiteSettingsService } from '../../core/services/site-settings.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonContent, IonIcon, IonButton],
  templateUrl: './about.page.html',
  styleUrl: './about.page.scss',
})
export class AboutPage {
  private readonly contactMessages = inject(ContactMessageService);
  private readonly siteSettings = inject(SiteSettingsService);
  readonly currentUser = this.auth.currentUser;
  readonly supportEmail = signal('smartdriveteam@smartdrive.com');
  readonly supportPhone = signal('');
  readonly activeTab = signal<'about' | 'history' | 'contact' | 'developers'>('about');
  readonly contactComposerOpen = signal(false);
  readonly contactSubject = signal('');
  readonly contactMessage = signal('');
  readonly contactSubmitting = signal(false);
  readonly contactError = signal<string | null>(null);
  readonly contactSuccess = signal<string | null>(null);

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly auth: AuthService,
  ) {
    void this.loadPublicContactSettings();
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const section = params.get('section');
      this.activeTab.set(
        section === 'history' || section === 'contact' || section === 'developers' ? section : 'about',
      );
    });
  }

  private async loadPublicContactSettings(): Promise<void> {
    try {
      const settings = await this.siteSettings.getPublicSettings();
      this.supportEmail.set(settings.supportEmail);
      this.supportPhone.set(settings.supportPhone);
    } catch (error) {
      console.error('Unable to load public contact settings.', error);
    }
  }

  browseFleet(): void {
    this.router.navigateByUrl('/tabs/rent-a-car');
  }

  selectTab(tab: 'about' | 'history' | 'contact' | 'developers'): void {
    this.contactError.set(null);
    this.contactSuccess.set(null);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { section: tab },
    });
  }

  async sendContactMessage(): Promise<void> {
    const user = this.currentUser();
    const subject = this.contactSubject().trim();
    const message = this.contactMessage().trim();
    if (!user || this.contactSubmitting()) return;
    if (subject.length < 3 || subject.length > 120 || message.length < 5 || message.length > 2000) {
      this.contactError.set('Enter a subject (3–120 characters) and a message (5–2,000 characters).');
      return;
    }

    this.contactSubmitting.set(true);
    this.contactError.set(null);
    this.contactSuccess.set(null);
    try {
      await this.contactMessages.submit({
        full_name: user.fullName,
        email: user.email,
        subject,
        message,
      });
      this.contactSubject.set('');
      this.contactMessage.set('');
      this.contactComposerOpen.set(false);
      this.contactSuccess.set('Your message has been sent to the SmartDrive team.');
    } catch (error) {
      this.contactError.set(error instanceof Error ? error.message : 'Unable to send your message.');
    } finally {
      this.contactSubmitting.set(false);
    }
  }
}
