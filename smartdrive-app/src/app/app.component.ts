import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Capacitor } from '@capacitor/core';
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
  AlertController,
  MenuController,
} from '@ionic/angular';
import { AuthService } from './core/services/auth.service';

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
    IonMenuButton,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  readonly currentUser = this.auth.currentUser;
  readonly avatarLoadFailedUrl = signal<string | null>(null);
  readonly isAndroid = Capacitor.getPlatform() === 'android';
  readonly mainMenuOpen = signal(false);
  private readonly currentRouteUrl = signal(this.router.url);

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly alertCtrl: AlertController,
    private readonly menuCtrl: MenuController,
  ) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.currentRouteUrl.set(event.urlAfterRedirects);
      }
    });
  }

  onAvatarError(url: string): void {
    this.avatarLoadFailedUrl.set(url);
  }

  showCustomerNavigation(): boolean {
    const url = this.currentRouteUrl();
    return !url.startsWith('/admin')
      && !url.startsWith('/login')
      && !url.startsWith('/signup')
      && !url.startsWith('/forgot-password')
      && !url.startsWith('/vehicle/')
      && !url.startsWith('/booking/');
  }

  openMainMenu(): void {
    void this.menuCtrl.open('main-menu');
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
