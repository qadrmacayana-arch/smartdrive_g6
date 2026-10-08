import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { NotificationCenterService } from '../../core/services/notification-center.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
    IonTitle,
    IonToolbar,
  ],
  templateUrl: './notifications.page.html',
  styleUrl: './notifications.page.scss',
})
export class NotificationsPage implements OnInit {
  readonly currentUser = this.auth.currentUser;

  constructor(
    private readonly auth: AuthService,
    readonly notificationCenter: NotificationCenterService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    void this.loadNotifications();
  }

  async loadNotifications(event?: CustomEvent): Promise<void> {
    const userId = this.currentUser()?.id ?? 'guest';
    await this.notificationCenter.load(userId);
    this.notificationCenter.markAllRead(userId);
    (event?.target as HTMLIonRefresherElement | undefined)?.complete();
  }

  openNotification(route: string): void {
    void this.router.navigateByUrl(route);
  }

  kindLabel(kind: string): string {
    if (kind === 'vehicle') return 'New vehicle';
    if (kind === 'promo') return 'Promo code';
    return 'Deal';
  }
}
