import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Vehicle } from '../models/vehicle.model';

@Injectable({ providedIn: 'root' })
export class VehicleService {
  constructor(private readonly supabase: SupabaseService) {}

  async getAvailable(): Promise<Vehicle[]> {
    const { data, error } = await this.supabase.client
      .from('vehicles')
      .select('*')
      .neq('status', 'archived')
      .order('is_featured', { ascending: false })
      .order('name', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as Vehicle[];
  }

  async getById(id: number): Promise<Vehicle | null> {
    const { data, error } = await this.supabase.client
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as Vehicle | null;
  }
}
