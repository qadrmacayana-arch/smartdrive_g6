import { TestBed } from '@angular/core/testing';
import { Booking } from '../models/booking.model';
import { Vehicle } from '../models/vehicle.model';
import { SupabaseService } from './supabase.service';
import { PredictiveInsightsService } from './predictive-insights.service';

describe('PredictiveInsightsService', () => {
  let service: PredictiveInsightsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PredictiveInsightsService,
        { provide: SupabaseService, useValue: { client: { rpc: vi.fn() } } },
      ],
    });
    service = TestBed.inject(PredictiveInsightsService);
  });

  it('estimates the next 30 days from the previous two periods and excludes cancelled bookings', () => {
    const bookings = [
      makeBooking('2026-09-20'),
      makeBooking('2026-09-25'),
      makeBooking('2026-08-20'),
      makeBooking('2026-08-25'),
      makeBooking('2026-09-30', { booking_status: 'cancelled' }),
    ];

    const result = service.getFleetForecast(bookings, [], new Date(2026, 9, 1, 12));

    expect(result.recentBookings).toBe(2);
    expect(result.previousBookings).toBe(2);
    expect(result.forecastNext30Days).toBe(2);
    expect(result.changePercent).toBe(0);
  });

  it('withholds demand estimates when fewer than three bookings exist in 60 days', () => {
    const result = service.getFleetForecast([
      makeBooking('2026-09-20'),
      makeBooking('2026-08-20'),
    ], [], new Date(2026, 9, 1, 12));

    expect(result.forecastNext30Days).toBeNull();
  });

  it('ignores invalid pickup dates in the fleet estimate', () => {
    const result = service.getFleetForecast([
      makeBooking('2026-02-30'),
      makeBooking('not-a-date'),
    ], [], new Date(2026, 9, 1, 12));

    expect(result.recentBookings).toBe(0);
    expect(result.previousBookings).toBe(0);
    expect(result.forecastNext30Days).toBeNull();
  });

  it('recommends only available vehicles, favoring the customer’s previously booked vehicle', () => {
    const vehicles = [
      makeVehicle({ id: 1, name: 'City Scooter', type: 'Scooter', main_category: 'Motorcycles' }),
      makeVehicle({ id: 2, name: 'Commuter Scooter', type: 'Scooter', main_category: 'Motorcycles', is_featured: false }),
      makeVehicle({ id: 3, name: 'Unavailable Car', status: 'booked' }),
    ];

    const recommendations = service.getPersonalizedRecommendations(vehicles, [
      makeBooking('2026-09-20', { vehicle_id: 1, vehicle_name: 'City Scooter' }),
    ]);

    expect(recommendations.map((vehicle) => vehicle.id)).toEqual([1, 2]);
  });
});

function makeBooking(
  pickupDate: string,
  overrides: Partial<Booking> = {},
): Booking {
  return {
    reference_number: 'SD-TEST',
    user_id: 'user-test',
    customer_email: 'customer@example.com',
    customer_name: 'Test Customer',
    customer_phone: null,
    vehicle_id: 1,
    vehicle_name: 'City Scooter',
    pickup_date: pickupDate,
    return_date: pickupDate,
    pickup_location: 'Manila',
    daily_rate: 1000,
    rental_days: 1,
    subtotal: 1000,
    insurance: 500,
    discount: 0,
    discount_label: null,
    total_price: 1500,
    payment_method: 'card',
    payment_status: 'completed',
    booking_status: 'completed',
    is_pwd_senior: false,
    ...overrides,
  };
}

function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: 1,
    vehicle_id: 'VEH-1',
    name: 'City Scooter',
    type: 'Motorcycle',
    main_category: 'Motorcycles',
    price: 1000,
    sr_points: 10,
    image: null,
    description: null,
    features: [],
    transmission: 'Automatic',
    fuel: 'Gasoline',
    seats: 2,
    status: 'available',
    is_featured: true,
    ...overrides,
  };
}
