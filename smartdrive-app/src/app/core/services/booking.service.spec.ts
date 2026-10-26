import { TestBed } from '@angular/core/testing';
import { DemoTrackingService } from './demo-tracking.service';
import { SupabaseService } from './supabase.service';
import { BookingService } from './booking.service';

describe('BookingService', () => {
  let service: BookingService;
  let responses: Array<{ data: unknown[] | null; error: { message: string } | null }>;
  let from: ReturnType<typeof vi.fn>;
  let order: ReturnType<typeof vi.fn>;
  let refreshSession: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    responses = [];
    order = vi.fn(() => Promise.resolve(responses.shift()!));
    const eq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq }));
    from = vi.fn(() => ({ select }));
    refreshSession = vi.fn().mockResolvedValue({ data: { session: null }, error: null });

    TestBed.configureTestingModule({
      providers: [
        BookingService,
        { provide: SupabaseService, useValue: { client: { from, auth: { refreshSession } } } },
        { provide: DemoTrackingService, useValue: {} },
      ],
    });
    service = TestBed.inject(BookingService);
  });

  afterEach(() => TestBed.resetTestingModule());

  it('refreshes the access token once and retries a future-issued JWT error', async () => {
    responses.push(
      { data: null, error: { message: 'JWT issued at future' } },
      { data: [], error: null },
    );

    await expect(service.listMyBookings('renter@example.com')).resolves.toEqual([]);

    expect(refreshSession).toHaveBeenCalledOnce();
    expect(from).toHaveBeenCalledTimes(2);
  });

  it('reports a clock synchronization error when the refreshed token is still rejected', async () => {
    responses.push(
      { data: null, error: { message: 'JWT issued at future' } },
      { data: null, error: { message: 'JWT issued at future' } },
    );

    await expect(service.listMyBookings('renter@example.com'))
      .rejects.toThrow('newer than the database server clock');
    expect(refreshSession).toHaveBeenCalledOnce();
    expect(from).toHaveBeenCalledTimes(2);
  });

  it('does not refresh the token for unrelated booking query errors', async () => {
    responses.push({ data: null, error: { message: 'permission denied' } });

    await expect(service.listMyBookings('renter@example.com')).rejects.toThrow('permission denied');

    expect(refreshSession).not.toHaveBeenCalled();
    expect(from).toHaveBeenCalledOnce();
  });
});
