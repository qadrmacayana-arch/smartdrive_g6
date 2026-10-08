import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Vehicle } from '../models/vehicle.model';

@Injectable({ providedIn: 'root' })
export class VehicleService {
  constructor(private readonly supabase: SupabaseService) {}

  getFavorites(): string[] {
    try {
      const stored = JSON.parse(localStorage.getItem('favoriteCars') || '[]');
      return Array.isArray(stored) ? stored.map(String) : [];
    } catch {
      localStorage.removeItem('favoriteCars');
      return [];
    }
  }

  toggleFavorite(vehicleId: number): boolean {
    const id = String(vehicleId);
    const favorites = this.getFavorites();
    const index = favorites.indexOf(id);
    if (index >= 0) {
      favorites.splice(index, 1);
      localStorage.setItem('favoriteCars', JSON.stringify(favorites));
      return false;
    }
    favorites.push(id);
    localStorage.setItem('favoriteCars', JSON.stringify(favorites));
    return true;
  }

  async getAvailable(): Promise<Vehicle[]> {
    const { data, error } = await this.supabase.client
      .from('vehicles')
      .select('*')
      .neq('status', 'archived')
      .order('is_featured', { ascending: false })
      .order('name', { ascending: true });
    if (!error && data?.length) {
      localStorage.setItem('fleetData', JSON.stringify(data));
      return data as Vehicle[];
    }

    try {
      const stored = JSON.parse(localStorage.getItem('fleetData') || '[]');
      if (Array.isArray(stored) && stored.length) {
        return stored.filter((vehicle) => vehicle.status !== 'archived') as Vehicle[];
      }
    } catch {
      localStorage.removeItem('fleetData');
    }

    throw new Error(error?.message || 'The vehicle database returned no vehicles.');
  }

  async getById(id: number): Promise<Vehicle | null> {
    const { data, error } = await this.supabase.client
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (!error && data) return data as Vehicle;
    try {
      const stored = JSON.parse(localStorage.getItem('fleetData') || '[]');
      const vehicle = Array.isArray(stored) ? stored.find((item) => Number(item.id) === id || String(item.vehicle_id) === String(id)) : null;
      if (vehicle) return vehicle as Vehicle;
    } catch {
      localStorage.removeItem('fleetData');
    }
    if (error) throw new Error(error.message);
    return null;
  }
}
