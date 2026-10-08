import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonToolbar,
} from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { Booking } from '../../core/models/booking.model';

interface AdminStats {
  revenue: number;
  bookings: number;
  users: number;
  vehicles: number;
}

type AdminSection = 'overview' | 'bookings' | 'users' | 'fleet' | 'transactions' | 'reviews' | 'tracking';
interface AdminUser { id: string; full_name: string; email: string; phone?: string | null; is_active?: boolean; created_at?: string; }
interface AdminReview { id?: string; customer_name?: string; customer_email?: string; rating: number; comment?: string; created_at?: string; }
interface AdminLocation { key: string; name: string; latitude: number; longitude: number; recorded_at?: string; }
interface UserTransactionSummary { user: AdminUser; balance: number; transactions: Array<{ created_at?: string; description: string; amount: number }>; bookings: Booking[]; }

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
    IonToolbar,
  ],
  templateUrl: './admin.page.html',
  styleUrl: './admin.page.scss',
})
export class AdminPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly currentUser = this.auth.currentUser;
  readonly stats = signal<AdminStats>({ revenue: 0, bookings: 0, users: 0, vehicles: 0 });
  readonly recentBookings = signal<Booking[]>([]);
  readonly topUsers = signal<Array<{ name: string; email: string; spent: number }>>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly section = signal<AdminSection>('overview');
  readonly bookings = signal<Booking[]>([]);
  readonly users = signal<AdminUser[]>([]);
  readonly vehicles = signal<any[]>([]);
  readonly reviews = signal<AdminReview[]>([]);
  readonly locations = signal<AdminLocation[]>([]);
  readonly transactionSummaries = signal<UserTransactionSummary[]>([]);
  readonly trackingDemoMode = signal(false);
  readonly search = signal('');
  readonly selectedUser = signal<AdminUser | null>(null);
  readonly newVehicle = { name: '', type: '', price: 0, image: '', status: 'available' };

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const requested = params.get('section') as AdminSection | null;
      this.section.set(requested ?? 'overview');
      void this.loadSection(this.section());
    });
    window.setInterval(() => {
      if (this.section() === 'tracking') void this.loadLocations();
    }, 10000);
  }

  async loadSection(section: AdminSection): Promise<void> {
    if (section === 'overview') return this.loadDashboard();
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      if (section === 'bookings') await this.loadBookings();
      if (section === 'users') await this.loadUsers();
      if (section === 'transactions') await this.loadTransactions();
      if (section === 'fleet') await this.loadFleet();
      if (section === 'reviews') await this.loadReviews();
      if (section === 'tracking') await this.loadLocations();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : `Unable to load ${section}.`);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadBookings(): Promise<void> {
    const { data, error } = await this.supabase.client.from('bookings').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    this.bookings.set((data ?? []) as Booking[]);
  }

  private async loadUsers(): Promise<void> {
    const { data, error } = await this.supabase.client.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    this.users.set((data ?? []) as AdminUser[]);
  }

  private async loadTransactions(): Promise<void> {
    await this.loadUsers();
    const [balances, transactions, bookings] = await Promise.all([
      this.supabase.client.from('wallet_balances').select('*'),
      this.supabase.client.from('wallet_transactions').select('*').order('created_at', { ascending: false }),
      this.supabase.client.from('bookings').select('*').order('created_at', { ascending: false }),
    ]);
    if (balances.error) throw new Error(balances.error.message);
    if (transactions.error) throw new Error(transactions.error.message);
    if (bookings.error) throw new Error(bookings.error.message);
    this.transactionSummaries.set(this.users().filter((user) => user.email !== 'admin@smartrentals.com').map((user) => ({
      user,
      balance: Number((balances.data ?? []).find((item) => item.user_id === user.id || item.email === user.email)?.balance ?? 0),
      transactions: (transactions.data ?? []).filter((item) => item.user_id === user.id || item.email === user.email) as UserTransactionSummary['transactions'],
      bookings: (bookings.data ?? []).filter((item) => item.user_id === user.id || item.customer_email === user.email) as Booking[],
    })));
  }

  private async loadFleet(): Promise<void> {
    const { data, error } = await this.supabase.client.from('vehicles').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    this.vehicles.set(data ?? []);
  }

  private async loadReviews(): Promise<void> {
    const { data, error } = await this.supabase.client.from('reviews').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    this.reviews.set((data ?? []) as AdminReview[]);
  }

  private async loadLocations(): Promise<void> {
    try {
      const response = await fetch('api/latest-locations.php', { headers: { Accept: 'application/json' }, cache: 'no-store' });
      if (!response.ok) throw new Error(`Location API returned HTTP ${response.status}.`);
      const payload = await response.json();
      const locations = Array.isArray(payload) ? payload : payload.locations;
      if (!Array.isArray(locations)) throw new Error('Location API must return a locations array.');
      const liveLocations = locations.map((location: any) => ({
        key: String(location.user_id ?? location.id ?? location.email),
        name: location.full_name ?? location.name ?? 'Unknown user',
        latitude: Number(location.latitude),
        longitude: Number(location.longitude),
        recorded_at: location.recorded_at ?? location.timestamp,
      })).filter((location: AdminLocation) => Number.isFinite(location.latitude) && Number.isFinite(location.longitude));
      this.trackingDemoMode.set(false);
      this.locations.set(liveLocations);
    } catch {
      this.trackingDemoMode.set(true);
      this.locations.set(this.getDemoLocations());
    }
  }

  private getDemoLocations(): AdminLocation[] {
    const now = Date.now();
    const movement = Math.sin(now / 4500) * 0.003;
    return [
      {
        key: 'demo-maria',
        name: 'Maria Santos (Demo)',
        latitude: 14.5995 + movement,
        longitude: 120.9842 + movement * 0.7,
        recorded_at: new Date(now).toISOString(),
      },
      {
        key: 'demo-john',
        name: 'John Dela Cruz (Demo)',
        latitude: 14.676 + movement * 0.6,
        longitude: 121.0437 - movement * 0.8,
        recorded_at: new Date(now).toISOString(),
      },
      {
        key: 'demo-anna',
        name: 'Anna Reyes (Demo)',
        latitude: 14.5547 - movement * 0.5,
        longitude: 121.0244 + movement * 0.9,
        recorded_at: new Date(now).toISOString(),
      },
    ];
  }

  filteredBookings(): Booking[] {
    const term = this.search().trim().toLowerCase();
    return this.bookings().filter((booking) => !term || [booking.reference_number, booking.customer_name, booking.customer_email, booking.vehicle_name].some((value) => String(value ?? '').toLowerCase().includes(term)));
  }

  filteredUsers(): AdminUser[] {
    const term = this.search().trim().toLowerCase();
    return this.users().filter((user) => !term || [user.full_name, user.email, user.phone].some((value) => String(value ?? '').toLowerCase().includes(term)));
  }

  filteredVehicles(): any[] {
    const term = this.search().trim().toLowerCase();
    return this.vehicles().filter((vehicle) => !term || [vehicle.name, vehicle.type, vehicle.vehicle_id].some((value) => String(value ?? '').toLowerCase().includes(term)));
  }

  async updateBookingStatus(booking: Booking, status: Booking['booking_status']): Promise<void> {
    if (!booking.id) return;
    const { error } = await this.supabase.client.from('bookings').update({ booking_status: status }).eq('id', booking.id);
    if (error) throw new Error(error.message);
    this.bookings.update((items) => items.map((item) => item.id === booking.id ? { ...item, booking_status: status } : item));
  }

  async deleteBooking(booking: Booking): Promise<void> {
    if (!booking.id || !confirm(`Delete booking ${booking.reference_number}? This cannot be undone.`)) return;
    const { error } = await this.supabase.client.from('bookings').delete().eq('id', booking.id);
    if (error) throw new Error(error.message);
    this.bookings.update((items) => items.filter((item) => item.id !== booking.id));
  }

  async updateUser(user: AdminUser): Promise<void> {
    const { error } = await this.supabase.client.from('profiles').update({ full_name: user.full_name, phone: user.phone, is_active: user.is_active }).eq('id', user.id);
    if (error) throw new Error(error.message);
    this.selectedUser.set(null);
  }

  async deleteUser(user: AdminUser): Promise<void> {
    if (!confirm(`Delete ${user.email}? This cannot be undone.`)) return;
    const { error } = await this.supabase.client.from('profiles').delete().eq('id', user.id);
    if (error) throw new Error(error.message);
    this.users.update((items) => items.filter((item) => item.id !== user.id));
  }

  async saveVehicle(): Promise<void> {
    const vehicle = { ...this.newVehicle };
    if (!vehicle.name || !vehicle.type || !vehicle.price) return;
    const { data, error } = await this.supabase.client.from('vehicles').insert([vehicle]).select().single();
    if (error) throw new Error(error.message);
    this.vehicles.update((items) => [data, ...items]);
    Object.assign(this.newVehicle, { name: '', type: '', price: 0, image: '', status: 'available' });
  }

  async archiveVehicle(vehicle: any): Promise<void> {
    const { error } = await this.supabase.client.from('vehicles').update({ status: vehicle.status === 'archived' ? 'available' : 'archived' }).eq('id', vehicle.id);
    if (error) throw new Error(error.message);
    this.vehicles.update((items) => items.map((item) => item.id === vehicle.id ? { ...item, status: vehicle.status === 'archived' ? 'available' : 'archived' } : item));
  }

  async deleteVehicle(vehicle: any): Promise<void> {
    if (!vehicle.id || !confirm(`Delete ${vehicle.name}? This cannot be undone.`)) return;
    const { error } = await this.supabase.client.from('vehicles').delete().eq('id', vehicle.id);
    if (error) throw new Error(error.message);
    this.vehicles.update((items) => items.filter((item) => item.id !== vehicle.id));
  }

  async deleteReview(review: AdminReview): Promise<void> {
    if (!review.id || !confirm('Delete this review? This cannot be undone.')) return;
    const { error } = await this.supabase.client.from('reviews').delete().eq('id', review.id);
    if (error) throw new Error(error.message);
    this.reviews.update((items) => items.filter((item) => item.id !== review.id));
  }

  openSection(section: AdminSection): void {
    this.search.set('');
    void this.router.navigate(['/admin'], { queryParams: { section } });
  }

  async loadDashboard(event?: CustomEvent): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      const [bookingsResult, usersResult, vehiclesResult] = await Promise.all([
        this.supabase.client.from('bookings').select('*').order('created_at', { ascending: false }),
        this.supabase.client.from('profiles').select('id, full_name, email, created_at, registration_date'),
        this.supabase.client.from('vehicles').select('id').neq('status', 'archived'),
      ]);

      if (bookingsResult.error) throw new Error(`Bookings could not be loaded: ${bookingsResult.error.message}`);
      if (usersResult.error) throw new Error(`Users could not be loaded: ${usersResult.error.message}`);
      if (vehiclesResult.error) throw new Error(`Vehicles could not be loaded: ${vehiclesResult.error.message}`);

      const bookings = (bookingsResult.data ?? []) as Booking[];
      const users = (usersResult.data ?? []) as Array<{
        full_name: string | null;
        email: string;
      }>;
      const revenue = bookings
        .filter((booking) => booking.payment_status !== 'refunded' && booking.booking_status !== 'cancelled')
        .reduce((total, booking) => total + Number(booking.total_price || 0), 0);

      const spending = new Map<string, { name: string; email: string; spent: number }>();
      for (const booking of bookings) {
        const email = booking.customer_email;
        const existing = spending.get(email) ?? { name: booking.customer_name, email, spent: 0 };
        existing.spent += Number(booking.total_price || 0);
        spending.set(email, existing);
      }

      this.stats.set({
        revenue,
        bookings: bookings.length,
        users: users.length,
        vehicles: vehiclesResult.data?.length ?? 0,
      });
      this.recentBookings.set(bookings.slice(0, 5));
      this.topUsers.set([...spending.values()].sort((a, b) => b.spent - a.spent).slice(0, 5));
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to load the admin dashboard.');
    } finally {
      this.loading.set(false);
      (event?.target as HTMLIonRefresherElement | undefined)?.complete();
    }
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/login');
  }
}
