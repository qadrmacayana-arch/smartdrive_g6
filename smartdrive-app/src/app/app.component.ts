import { Component, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, firstValueFrom, take } from 'rxjs';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import {
  IonApp,
  IonRouterOutlet,
  IonMenu,
  IonMenuToggle,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonButton,
  IonToggle,
  AlertController,
  MenuController,
} from '@ionic/angular';
import { AuthService } from './core/services/auth.service';
import { MobileFeedbackService } from './core/services/mobile-feedback.service';
import { NotificationCenterService } from './core/services/notification-center.service';
import { notificationsOutline, settingsOutline } from 'ionicons/icons';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    IonApp,
    IonRouterOutlet,
    IonMenu,
    IonMenuToggle,
    IonContent,
    IonList,
    IonItem,
    IonIcon,
    IonLabel,
    IonButton,
    IonToggle,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  readonly notificationIcon = notificationsOutline;
  readonly settingsIcon = settingsOutline;
  readonly isAndroid = Capacitor.getPlatform() === 'android';
  readonly currentUser = this.auth.currentUser;
  readonly avatarLoadFailedUrl = signal<string | null>(null);
  readonly isDarkMode = signal<boolean>(this.getStoredTheme() === 'dark');
  readonly mainMenuOpen = signal(false);
  private readonly currentRouteUrl = signal(this.router.url);
  private googleSessionTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly alertCtrl: AlertController,
    private readonly menuCtrl: MenuController,
    private readonly mobileFeedback: MobileFeedbackService,
    readonly notificationCenter: NotificationCenterService,
  ) {
    if (Capacitor.getPlatform() === 'android') void this.registerAndroidDeepLinks();

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.currentRouteUrl.set(event.urlAfterRedirects);
      }
    });

    effect(() => {
      const dark = this.isDarkMode();
      const theme = dark ? 'dark' : 'light';
      document.documentElement.dataset['theme'] = theme;
      document.documentElement.style.colorScheme = theme;
      localStorage.setItem('smartdrive-theme', theme);
      this.updateNativeStatusBar(theme);
    });
    effect(() => {
      if (!this.auth.initialized()) return;
      const userId = this.currentUser()?.id ?? 'guest';
      void this.notificationCenter.load(userId);
      this.notificationCenter.startRealtimeUpdates(userId);
    });
    effect(() => {
      if (!this.auth.initialized()) return;
      const oauthIntent = localStorage.getItem('smartdrive_google_oauth_intent');
      if (oauthIntent !== 'registration' && oauthIntent !== 'login') return;
      const currentUrl = new URL(window.location.href);
      const hashParams = new URLSearchParams(currentUrl.hash.replace(/^#/, ''));
      const oauthError = currentUrl.searchParams.get('error_description')
        ?? hashParams.get('error_description')
        ?? [
          currentUrl.searchParams.get('error'),
          currentUrl.searchParams.get('error_code'),
        ].filter(Boolean).join(': ');
      if (oauthError) {
        sessionStorage.setItem(
          'smartdrive_google_oauth_error',
          oauthError,
        );
        this.clearGoogleOAuthIntent();
        void this.router.navigateByUrl(
          oauthIntent === 'registration' ? '/signup?googleError=1' : '/login?googleError=1',
        );
        return;
      }
      const intentStartedAt = Number(localStorage.getItem('smartdrive_google_oauth_intent_started_at'));
      if (!Number.isFinite(intentStartedAt) || Date.now() - intentStartedAt > 10 * 60 * 1000) {
        this.clearGoogleOAuthIntent();
        return;
      }
      const user = this.currentUser();
      if (!user) {
        this.waitForGoogleSession(oauthIntent);
        return;
      }
      const loginDestination = localStorage.getItem('smartdrive_google_oauth_intent_return_to');
      this.clearGoogleOAuthIntent();
      if (user.isAdmin) {
        void this.auth.logout().then(() => this.router.navigateByUrl('/login?adminPortal=1'));
        return;
      }
      if (oauthIntent === 'registration' || this.auth.needsGoogleProfileCompletion()) {
        void this.router.navigateByUrl('/signup?googleRegistration=1');
      } else if (oauthIntent === 'login') {
        const destination = loginDestination?.startsWith('/') && !loginDestination.startsWith('//')
          ? loginDestination
          : '/tabs/home';
        void this.router.navigateByUrl(destination);
      }
    });
  }

  private async registerAndroidDeepLinks(): Promise<void> {
    const routingUrls = new Set<string>();
    const navigateToAppUrl = async (value: string): Promise<void> => {
      if (routingUrls.has(value)) return;
      try {
        const deepLink = new URL(value);
        if (deepLink.protocol === 'com.smartdrive.tm:' && deepLink.hostname === 'login-callback') {
          await this.handleGoogleOAuthReturn(deepLink);
          return;
        }
        if (deepLink.protocol !== 'smartdrive:' || deepLink.hostname !== 'booking') return;
        if (!/^\/confirmation\/SD-\d{4}-[A-F\d]{12}$/.test(deepLink.pathname)) return;
        if (!deepLink.searchParams.has('attempt')) return;
        routingUrls.add(value);
        if (!this.router.navigated) {
          await firstValueFrom(this.router.events.pipe(
            filter((event): event is NavigationEnd => event instanceof NavigationEnd),
            take(1),
          ));
        }
        await this.router.navigateByUrl(`/booking${deepLink.pathname}${deepLink.search}`);
      } catch (error) {
        console.error('Unable to handle SmartDrive payment return link.', error);
      } finally {
        routingUrls.delete(value);
      }
    };

    try {
      await App.addListener('appUrlOpen', ({ url }) => {
        void navigateToAppUrl(url);
      });
      const launch = await App.getLaunchUrl();
      if (launch?.url) void navigateToAppUrl(launch.url);
    } catch (error) {
      console.error('Unable to register SmartDrive Android payment return links.', error);
    }
  }

  private clearGoogleOAuthIntent(): void {
    if (this.googleSessionTimer) clearTimeout(this.googleSessionTimer);
    this.googleSessionTimer = null;
    localStorage.removeItem('smartdrive_google_oauth_intent');
    localStorage.removeItem('smartdrive_google_oauth_intent_started_at');
    localStorage.removeItem('smartdrive_google_oauth_intent_return_to');
  }

  private async handleGoogleOAuthReturn(callback: URL): Promise<void> {
    const intent = localStorage.getItem('smartdrive_google_oauth_intent');
    if (intent !== 'login' && intent !== 'registration') return;

    try {
      const error = callback.searchParams.get('error_description')
        ?? callback.searchParams.get('error')
        ?? callback.searchParams.get('error_code');
      if (error) throw new Error(error);

      const code = callback.searchParams.get('code');
      if (!code) throw new Error('Google did not return an authorization code.');
      await this.auth.completeGoogleOAuthCallback(code);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google sign-in failed.';
      sessionStorage.setItem('smartdrive_google_oauth_error', message);
      this.clearGoogleOAuthIntent();
      const destination = intent === 'registration'
        ? '/signup?googleError=1'
        : '/login?googleError=1';
      await this.router.navigateByUrl(destination);
    } finally {
      await Browser.close().catch((error: unknown) => {
        console.error('Unable to close the Google sign-in browser.', error);
      });
    }
  }

  private waitForGoogleSession(intent: 'login' | 'registration'): void {
    if (this.googleSessionTimer) return;
    this.googleSessionTimer = setTimeout(() => {
      this.googleSessionTimer = null;
      if (this.currentUser()) return;
      if (localStorage.getItem('smartdrive_google_oauth_intent') !== intent) return;
      this.clearGoogleOAuthIntent();
      const destination = intent === 'registration'
        ? '/signup?googleError=1'
        : '/login?googleError=1';
      void this.router.navigateByUrl(destination);
    }, 15000);
  }

  private getStoredTheme(): 'light' | 'dark' {
    const stored = localStorage.getItem('smartdrive-theme');
    return stored === 'dark' ? 'dark' : 'light';
  }

  private updateNativeStatusBar(theme: 'light' | 'dark'): void {
    if (Capacitor.getPlatform() !== 'android') return;

    void Promise.all([
      StatusBar.setOverlaysWebView({ overlay: false }),
      StatusBar.setBackgroundColor({ color: theme === 'dark' ? '#0f1220' : '#f7f5fc' }),
      StatusBar.setStyle({ style: theme === 'dark' ? Style.Dark : Style.Light }),
    ]).catch((error: unknown) => {
      console.error('Unable to configure the Android status bar.', error);
    });
  }

  onAvatarError(url: string): void {
    this.avatarLoadFailedUrl.set(url);
  }

  toggleTheme(event: CustomEvent): void {
    this.isDarkMode.set(Boolean(event.detail.checked));
  }

  showCustomerNavigation(): boolean {
    const url = this.currentRouteUrl();
    return !url.startsWith('/login')
      && !url.startsWith('/signup')
      && !url.startsWith('/forgot-password')
      && !url.startsWith('/reset-password')
      && !url.startsWith('/vehicle/')
      && !url.startsWith('/booking/');
  }

  showNotificationButton(): boolean {
    const url = this.currentRouteUrl();
    return Boolean(this.currentUser())
      && (
        url.startsWith('/tabs/home')
        || url.startsWith('/tabs/rent-a-car')
        || url.startsWith('/offers')
      );
  }

  openMainMenu(): void {
    this.mobileFeedback.lightImpact();
    this.menuCtrl.open('main-menu');
  }

  tapNavigation(): void {
    this.mobileFeedback.lightImpact();
  }

  async logout(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Log out?',
      message: "You'll need to sign in again to book vehicles.",
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Log Out',
          role: 'destructive',
          handler: async () => {
            await this.auth.logout();
            this.router.navigateByUrl('/login');
          },
        },
      ],
    });
    await alert.present();
  }
}
