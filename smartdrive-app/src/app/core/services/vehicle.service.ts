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
      const vehicles = await this.withCurrentAvailability(data as Vehicle[]);
      localStorage.setItem('fleetData', JSON.stringify(vehicles));
      return vehicles;
    }

    try {
      const stored = JSON.parse(localStorage.getItem('fleetData') || '[]');
      if (Array.isArray(stored) && stored.length) {
        return this.withCurrentAvailability(
          stored.filter((vehicle) => vehicle.status !== 'archived') as Vehicle[],
        );
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
    if (!error && data) {
      const [vehicle] = await this.withCurrentAvailability([data as Vehicle]);
      return vehicle;
    }
    let cachedVehicle: Vehicle | null = null;
    try {
      const stored = JSON.parse(localStorage.getItem('fleetData') || '[]');
      const vehicle = Array.isArray(stored)
        ? stored.find((item) => Number(item.id) === id || String(item.vehicle_id) === String(id))
        : null;
      if (vehicle) cachedVehicle = vehicle as Vehicle;
    } catch {
      localStorage.removeItem('fleetData');
    }
    if (cachedVehicle) {
      const [currentVehicle] = await this.withCurrentAvailability([cachedVehicle]);
      return currentVehicle;
    }
    if (error) throw new Error(error.message);
    return null;
  }

  private async withCurrentAvailability(vehicles: Vehicle[]): Promise<Vehicle[]> {
    const { data, error } = await this.supabase.client.rpc('get_current_vehicle_availability');
    if (error) throw new Error(`Could not load current vehicle availability: ${error.message}`);
    if (!Array.isArray(data)) throw new Error('Current vehicle availability returned an unexpected response.');

    const availability = new Map<number, { fleetQuantity: number; availableQuantity: number }>();
    for (const row of data) {
      if (
        !row
        || typeof row !== 'object'
        || !('vehicle_id' in row)
        || !('fleet_quantity' in row)
        || !('available_quantity' in row)
        || !Number.isInteger(row.vehicle_id)
        || !Number.isInteger(row.fleet_quantity)
        || !Number.isInteger(row.available_quantity)
        || Number(row.fleet_quantity) < 1
        || Number(row.available_quantity) < 0
        || Number(row.available_quantity) > Number(row.fleet_quantity)
      ) {
        throw new Error('Current vehicle availability returned invalid values.');
      }
      availability.set(Number(row.vehicle_id), {
        fleetQuantity: Number(row.fleet_quantity),
        availableQuantity: Number(row.available_quantity),
      });
    }

    return vehicles.map((vehicle) => {
      const currentAvailability = availability.get(vehicle.id);
      if (!currentAvailability) {
        throw new Error(`Current availability was not returned for ${vehicle.name}.`);
      }
      return {
        ...vehicle,
        fleet_quantity: currentAvailability.fleetQuantity,
        available_quantity: currentAvailability.availableQuantity,
      };
    });
  }
}
