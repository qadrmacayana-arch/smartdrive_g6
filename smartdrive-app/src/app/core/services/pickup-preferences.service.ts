import { Injectable } from '@angular/core';

export interface PickupPreferences {
  location: string;
  date: string;
}

const STORAGE_KEY = 'smartdrive-pickup-preferences';
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

@Injectable({ providedIn: 'root' })
export class PickupPreferencesService {
  get(): PickupPreferences {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
      if (typeof value !== 'object' || value === null) return { location: '', date: '' };

      const preferences = value as Partial<PickupPreferences>;
      const date = typeof preferences.date === 'string' && this.isValidDate(preferences.date)
        ? preferences.date
        : '';

      return {
        location: typeof preferences.location === 'string' ? preferences.location.slice(0, 100) : '',
        date: date && date >= this.today() ? date : '',
      };
    } catch (error) {
      console.error('Unable to read saved pickup preferences.', error);
      return { location: '', date: '' };
    }
  }

  save(location: string, date: string): void {
    const preferences: PickupPreferences = {
      location: location.trim().slice(0, 100),
      date: this.isValidDate(date) ? date : '',
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Unable to save pickup preferences.', error);
    }
  }

  private isValidDate(value: string): boolean {
    if (!DATE_PATTERN.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }

  private today(): string {
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
    return localDate.toISOString().slice(0, 10);
  }
}
