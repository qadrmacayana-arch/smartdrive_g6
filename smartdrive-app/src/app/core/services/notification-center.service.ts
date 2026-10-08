import { Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { PluginListenerHandle } from '@capacitor/core';
import { SupabaseService } from './supabase.service';

export interface CustomerNotification {
  id: string;
  kind: 'promo' | 'deal' | 'vehicle';
  title: string;
  message: string;
  createdAt: string;
  route: string;
  code?: string;
}

interface PromoRow {
  id: number;
  code: string;
  description: string | null;
  discount_percent: number;
  valid_from: string | null;
  valid_until: string | null;
  created_at: string | null;
  updated_at: string | null;
  is_active: boolean;
  current_uses: number;
  max_uses: number | null;
}

interface VehicleRow {
  id: number;
  name: string;
  type: string;
  price: number;
  created_at: string | null;
}

const NEW_VEHICLE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

const CURRENT_DEALS = [
  {
    id: 'deal-weekend',
    title: 'Weekend SUV Special',
    message: 'Rent an SUV for three days and get the third day at 50% off.',
  },
  {
    id: 'deal-weekly',
    title: 'Weekly rental discount',
    message: 'Rent for seven days or more and receive 20% off.',
  },
  {
    id: 'deal-holiday',
    title: 'Extended weekend getaway',
    message: 'Save 25% on eligible four-day weekend bookings.',
  },
];

@Injectable({ providedIn: 'root' })
export class NotificationCenterService {
  readonly notifications = signal<CustomerNotification[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly unreadCount = signal(0);
  readonly permissionGranted = signal(false);
  private loadedUserId: string | null = null;
  private previouslyLoadedIds: Set<string> | null = null;
  private realtimeChannel: ReturnType<SupabaseService['client']['channel']> | null = null;
  private notificationActionListener: PluginListenerHandle | null = null;
  private registeringNotificationActionListener = false;

  constructor(private readonly supabase: SupabaseService) {}

  private preferenceKey(userId: string): string {
    return `smartdrive_notifications_enabled:${userId}`;
  }

  notificationsEnabled(userId: string): boolean {
    return localStorage.getItem(this.preferenceKey(userId)) === 'true';
  }

  async requestPermission(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      const current = await LocalNotifications.checkPermissions();
      const result = current.display === 'granted'
        ? current
        : await LocalNotifications.requestPermissions();
      const granted = result.display === 'granted';
      if (granted && Capacitor.getPlatform() === 'android') {
        await LocalNotifications.createChannel({
          id: 'smartdrive-updates',
          name: 'SmartDrive updates',
          description: 'New vehicles, promos, and booking deals.',
          importance: 4,
        });
      }
      this.permissionGranted.set(granted);
      return granted;
    }

    if (!('Notification' in window)) {
      this.permissionGranted.set(false);
      return false;
    }
    const permission = Notification.permission === 'granted'
      ? Notification.permission
      : await Notification.requestPermission();
    const granted = permission === 'granted';
    this.permissionGranted.set(granted);
    return granted;
  }

  async checkPermission(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      const status = await LocalNotifications.checkPermissions();
      const granted = status.display === 'granted';
      this.permissionGranted.set(granted);
      return granted;
    }

    const granted = 'Notification' in window && Notification.permission === 'granted';
    this.permissionGranted.set(granted);
    return granted;
  }

  async setEnabled(userId: string, enabled: boolean): Promise<void> {
    if (enabled) {
      const granted = await this.requestPermission();
      if (!granted) {
        throw new Error('Notification permission was not granted. Allow notifications in your device or browser settings, then try again.');
      }
    }
    localStorage.setItem(this.preferenceKey(userId), String(enabled));
  }

  async load(userId: string, notifyNew = false): Promise<void> {
    if (!userId) {
      this.notifications.set([]);
      this.unreadCount.set(0);
      this.loadedUserId = null;
      this.previouslyLoadedIds = null;
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      const [promosResult, vehiclesResult] = await Promise.all([
        this.supabase.client
          .from('discount_codes')
          .select('id,code,description,discount_percent,valid_from,valid_until,created_at,updated_at,is_active,current_uses,max_uses')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(20),
        this.supabase.client
          .from('vehicles')
          .select('id,name,type,price,created_at')
          .neq('status', 'archived')
          .order('created_at', { ascending: false })
          .limit(30),
      ]);
      if (promosResult.error) throw new Error(`Could not load current promo codes: ${promosResult.error.message}`);
      if (vehiclesResult.error) throw new Error(`Could not load new vehicles: ${vehiclesResult.error.message}`);

      const now = Date.now();
      const promos = ((promosResult.data ?? []) as PromoRow[])
        .filter((promo) =>
          (!promo.valid_from || Date.parse(promo.valid_from) <= now)
          && (!promo.valid_until || Date.parse(promo.valid_until) >= now)
          && (promo.max_uses == null || promo.current_uses < promo.max_uses),
        )
        .map((promo): CustomerNotification => ({
          id: `promo-${promo.id}-${promo.updated_at || promo.created_at || 'current'}`,
          kind: 'promo',
          title: `${Number(promo.discount_percent)}% off with ${promo.code}`,
          message: promo.description?.trim() || `Use promo code ${promo.code} on an eligible booking.`,
          createdAt: promo.updated_at || promo.created_at || new Date().toISOString(),
          route: '/offers',
          code: promo.code,
        }));

      const newVehicles = ((vehiclesResult.data ?? []) as VehicleRow[])
        .filter((vehicle) => {
          const createdAt = Date.parse(vehicle.created_at ?? '');
          return Number.isFinite(createdAt) && now - createdAt <= NEW_VEHICLE_WINDOW_MS;
        })
        .map((vehicle): CustomerNotification => ({
          id: `vehicle-${vehicle.id}`,
          kind: 'vehicle',
          title: `New ride added: ${vehicle.name}`,
          message: `${vehicle.type} now available from ₱${Number(vehicle.price).toLocaleString()} per day.`,
          createdAt: vehicle.created_at!,
          route: `/vehicle/${vehicle.id}`,
        }));

      const deals = CURRENT_DEALS.map((deal): CustomerNotification => ({
        ...deal,
        kind: 'deal',
        createdAt: new Date().toISOString(),
        route: '/offers',
      }));
      const items = [...promos, ...deals, ...newVehicles]
        .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
      const priorIds = this.loadedUserId === userId ? this.previouslyLoadedIds : null;
      this.notifications.set(items);
      this.loadedUserId = userId;
      this.previouslyLoadedIds = new Set(items.map((item) => item.id));
      this.updateUnreadCount(userId, items);

      if (notifyNew && priorIds && this.notificationsEnabled(userId)) {
        const added = items.filter((item) => !priorIds.has(item.id));
        await Promise.all(added.slice(0, 3).map((item) => this.showDeviceNotification(item)));
      }
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to load notifications.');
    } finally {
      this.loading.set(false);
    }
  }

  startRealtimeUpdates(userId: string | null): void {
    this.stopRealtimeUpdates();
    if (!userId) return;
    this.registerNotificationActionListener();

    this.realtimeChannel = this.supabase.client
      .channel('customer-notification-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, () => {
        void this.load(userId, true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'discount_codes' }, () => {
        void this.load(userId, true);
      })
      .subscribe((status, error) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('Live notification updates are unavailable.', error);
        }
      });
  }

  stopRealtimeUpdates(): void {
    if (!this.realtimeChannel) return;
    void this.supabase.client.removeChannel(this.realtimeChannel);
    this.realtimeChannel = null;
  }

  markAllRead(userId: string): void {
    const ids = this.notifications().map((item) => item.id);
    localStorage.setItem(`smartdrive_notifications_read:${userId}`, JSON.stringify(ids));
    this.unreadCount.set(0);
  }

  isRead(userId: string, notificationId: string): boolean {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(`smartdrive_notifications_read:${userId}`) || '[]');
      return Array.isArray(stored) && stored.includes(notificationId);
    } catch {
      localStorage.removeItem(`smartdrive_notifications_read:${userId}`);
      return false;
    }
  }

  private updateUnreadCount(userId: string, notifications: CustomerNotification[]): void {
    this.unreadCount.set(notifications.filter((item) => !this.isRead(userId, item.id)).length);
  }

  private async showDeviceNotification(item: CustomerNotification): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        await LocalNotifications.schedule({
          notifications: [{
            id: this.notificationId(item.id),
            title: item.title,
            body: item.message,
            schedule: { at: new Date(Date.now() + 1000) },
            channelId: 'smartdrive-updates',
            foreground: true,
            isExactNotification: false,
            extra: { route: item.route },
          }],
        });
      } else if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(item.title, {
          body: item.message,
          icon: '/assets/icon/favicon.png',
        });
        notification.onclick = () => {
          window.location.assign(item.route);
          notification.close();
        };
      }
    } catch (error) {
      console.error('Unable to display a new SmartDrive notification.', error);
    }
  }

  private registerNotificationActionListener(): void {
    if (
      !Capacitor.isNativePlatform()
      || this.notificationActionListener
      || this.registeringNotificationActionListener
    ) return;
    this.registeringNotificationActionListener = true;
    void LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
      const route = action.notification.extra?.['route'];
      if (typeof route === 'string' && route.startsWith('/')) {
        window.location.assign(route);
      }
    }).then((listener) => {
      this.notificationActionListener = listener;
      this.registeringNotificationActionListener = false;
    }).catch((error: unknown) => {
      this.registeringNotificationActionListener = false;
      console.error('Unable to handle taps on SmartDrive notifications.', error);
    });
  }

  private notificationId(value: string): number {
    let hash = 0;
    for (const character of value) hash = (hash * 31 + character.charCodeAt(0)) | 0;
    return Math.abs(hash);
  }
}
