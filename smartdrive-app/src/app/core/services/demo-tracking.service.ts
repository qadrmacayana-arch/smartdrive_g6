import { Injectable } from '@angular/core';

const DEMO_TRACKING_KEY = 'smartdriveDemoTracking';
const DEMO_ROUTE = [
  { latitude: 14.5995, longitude: 120.9842, area: 'Rizal Park, Manila (demo)' },
  { latitude: 14.5547, longitude: 121.0244, area: 'Legazpi Village, Makati (demo)' },
  { latitude: 14.5764, longitude: 121.0851, area: 'Pasig City (demo)' },
  { latitude: 14.676, longitude: 121.0437, area: 'Cubao, Quezon City (demo)' },
  { latitude: 14.565, longitude: 120.993, area: 'Malate, Manila (demo)' },
];

export interface DemoTrackedLocation {
  key: string;
  name: string;
  latitude: number;
  longitude: number;
  area: string;
  recorded_at: string;
  activity: string;
  is_demo: true;
}

@Injectable({ providedIn: 'root' })
export class DemoTrackingService {
  recordTransaction(userId: string, activity: string): void {
    if (!userId || userId.startsWith('local-')) return;

    const locations = this.readLocations();
    const previous = locations.find((location) => location.key === userId);
    const routeIndex = previous ? (DEMO_ROUTE.findIndex(
      (point) => point.latitude === previous.latitude && point.longitude === previous.longitude,
    ) + 1) % DEMO_ROUTE.length : this.routeIndexFor(userId);
    const point = DEMO_ROUTE[routeIndex];
    const location: DemoTrackedLocation = {
      key: userId,
      name: `${this.displayName()} (Demo)`,
      latitude: point.latitude,
      longitude: point.longitude,
      area: point.area,
      recorded_at: new Date().toISOString(),
      activity,
      is_demo: true,
    };

    const updated = [location, ...locations.filter((item) => item.key !== userId)].slice(0, 100);
    try {
      localStorage.setItem(DEMO_TRACKING_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('The transaction succeeded, but its demo tracking point could not be saved locally.', error);
    }
  }

  getLocations(): DemoTrackedLocation[] {
    return this.readLocations();
  }

  private readLocations(): DemoTrackedLocation[] {
    const stored = localStorage.getItem(DEMO_TRACKING_KEY);
    if (!stored) return [];

    try {
      const parsed: unknown = JSON.parse(stored);
      if (!Array.isArray(parsed)) throw new Error('Saved demo tracking data is not a list.');
      return parsed.filter((item): item is DemoTrackedLocation =>
        item !== null &&
        typeof item === 'object' &&
        typeof item.key === 'string' &&
        typeof item.latitude === 'number' &&
        typeof item.longitude === 'number' &&
        item.is_demo === true,
      );
    } catch (error) {
      console.error('Saved demo tracking data could not be read.', error);
      return [];
    }
  }

  private displayName(): string {
    const storedUser = localStorage.getItem('smartdriveUser');
    if (storedUser) {
      try {
        const user: unknown = JSON.parse(storedUser);
        if (user && typeof user === 'object' && 'fullName' in user && typeof user.fullName === 'string') {
          return user.fullName;
        }
      } catch (error) {
        console.error('The locally saved user name could not be read for demo tracking.', error);
      }
    }
    return 'SmartDrive member';
  }

  private routeIndexFor(userId: string): number {
    let hash = 0;
    for (const character of userId) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
    return hash % DEMO_ROUTE.length;
  }
}
