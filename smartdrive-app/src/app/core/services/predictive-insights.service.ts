import { Injectable } from '@angular/core';
import { Booking } from '../models/booking.model';
import { Vehicle } from '../models/vehicle.model';
import { SupabaseService } from './supabase.service';

export interface BookingDateEstimate {
  hasConflict: boolean;
  historicalSignalPercent: number | null;
}

export interface VehicleDemandInsight {
  id: number;
  name: string;
  recentBookings: number;
  bookingLikelihoodIndex: number;
  forecastBookings: number | null;
}

export interface FleetForecast {
  recentBookings: number;
  previousBookings: number;
  forecastNext30Days: number | null;
  changePercent: number | null;
  vehicles: VehicleDemandInsight[];
}

@Injectable({ providedIn: 'root' })
export class PredictiveInsightsService {
  constructor(private readonly supabase: SupabaseService) {}

  async getBookingDateEstimate(
    vehicleId: number,
    pickupDate: string,
    returnDate: string,
  ): Promise<BookingDateEstimate> {
    const { data, error } = await this.supabase.client.rpc('get_vehicle_booking_signal', {
      p_vehicle_id: vehicleId,
      p_pickup_date: pickupDate,
      p_return_date: returnDate,
    });
    if (error) throw new Error(`Date estimate unavailable: ${error.message}`);

    const row = Array.isArray(data) ? data[0] : data;
    if (
      !row
      || typeof row !== 'object'
      || !('has_conflict' in row)
      || !('historical_signal_percent' in row)
    ) {
      throw new Error('Date estimate returned an unexpected response.');
    }

    const result = row as { has_conflict: unknown; historical_signal_percent: unknown };
    if (
      typeof result.has_conflict !== 'boolean'
      || (result.historical_signal_percent !== null && typeof result.historical_signal_percent !== 'number')
    ) {
      throw new Error('Date estimate returned invalid values.');
    }
    return {
      hasConflict: result.has_conflict,
      historicalSignalPercent: result.historical_signal_percent,
    };
  }

  getFleetForecast(
    bookings: Booking[],
    vehicles: Array<Pick<Vehicle, 'id' | 'name'>>,
    today = new Date(),
  ): FleetForecast {
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const eligible = bookings.filter((booking) =>
      booking.booking_status !== 'cancelled'
      && booking.payment_status !== 'failed'
      && booking.payment_status !== 'refunded',
    );
    const recent = eligible.filter((booking) => this.daysBefore(booking.pickup_date, startOfToday, 30));
    const previous = eligible.filter((booking) => this.daysBefore(booking.pickup_date, startOfToday, 60, 30));
    const enoughHistory = recent.length + previous.length >= 3;
    const forecastNext30Days = enoughHistory
      ? Math.max(0, Math.round(recent.length + recent.length - previous.length))
      : null;
    const changePercent = previous.length
      ? Math.round(((recent.length - previous.length) / previous.length) * 100)
      : null;

    const recentByVehicle = new Map<number, number>();
    const threeMonthStart = startOfToday - 90 * 24 * 60 * 60 * 1000;
    for (const booking of eligible) {
      const pickup = this.parseDate(booking.pickup_date);
      if (pickup == null || pickup < threeMonthStart || pickup > startOfToday) continue;
      recentByVehicle.set(booking.vehicle_id, (recentByVehicle.get(booking.vehicle_id) ?? 0) + 1);
    }

    const topCount = Math.max(0, ...recentByVehicle.values());
    const insights = vehicles.map((vehicle) => {
      const recentBookings = recentByVehicle.get(vehicle.id) ?? 0;
      const vehicleRecent = recent.filter((booking) => booking.vehicle_id === vehicle.id).length;
      const vehiclePrevious = previous.filter((booking) => booking.vehicle_id === vehicle.id).length;
      return {
        id: vehicle.id,
        name: vehicle.name,
        recentBookings,
        bookingLikelihoodIndex: topCount ? Math.round((recentBookings / topCount) * 100) : 0,
        forecastBookings: enoughHistory
          ? Math.max(0, Math.round(vehicleRecent + vehicleRecent - vehiclePrevious))
          : null,
      };
    }).sort((a, b) =>
      b.recentBookings - a.recentBookings || a.name.localeCompare(b.name),
    );

    return {
      recentBookings: recent.length,
      previousBookings: previous.length,
      forecastNext30Days,
      changePercent,
      vehicles: insights,
    };
  }

  getPersonalizedRecommendations(vehicles: Vehicle[], bookings: Booking[]): Vehicle[] {
    const eligibleBookings = bookings.filter((booking) =>
      booking.booking_status !== 'cancelled'
      && booking.payment_status !== 'failed'
      && booking.payment_status !== 'refunded',
    );
    const availableVehicles = vehicles.filter((vehicle) => vehicle.status === 'available');
    const scores = new Map<number, number>();

    for (const vehicle of availableVehicles) {
      let score = 0;
      for (const booking of eligibleBookings) {
        if (booking.vehicle_id === vehicle.id) score += 3;
        if (booking.vehicle_name.toLowerCase() === vehicle.name.toLowerCase()) score += 3;
        if (booking.vehicle_id === vehicle.id || booking.vehicle_name.toLowerCase() === vehicle.name.toLowerCase()) continue;

        const previousVehicle = vehicles.find((item) =>
          item.id === booking.vehicle_id
          || item.name.toLowerCase() === booking.vehicle_name.toLowerCase(),
        );
        if (previousVehicle?.type === vehicle.type) score += 2;
        if (previousVehicle?.main_category === vehicle.main_category) score += 1;
      }
      scores.set(vehicle.id, score);
    }

    return [...availableVehicles].sort((a, b) =>
      (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0)
      || Number(b.is_featured) - Number(a.is_featured)
      || a.price - b.price
      || a.name.localeCompare(b.name),
    ).slice(0, 3);
  }

  private daysBefore(dateValue: string, end: number, windowDays: number, offsetDays = 0): boolean {
    const date = this.parseDate(dateValue);
    if (date == null) return false;
    const ageInDays = Math.floor((end - date) / (24 * 60 * 60 * 1000));
    return ageInDays >= offsetDays && ageInDays < windowDays;
  }

  private parseDate(value: string): number | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return null;
    const [, year, month, day] = match;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day));
    if (
      parsed.getFullYear() !== Number(year)
      || parsed.getMonth() !== Number(month) - 1
      || parsed.getDate() !== Number(day)
    ) return null;
    const date = parsed.getTime();
    return Number.isNaN(date) ? null : date;
  }
}
