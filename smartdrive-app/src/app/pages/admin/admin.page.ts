import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
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
import { DemoTrackingService } from '../../core/services/demo-tracking.service';
import { FleetForecast, PredictiveInsightsService } from '../../core/services/predictive-insights.service';
import {
  SupportAdminNote,
  SupportConversation,
  SupportConversationService,
  SupportMessage,
  SupportTicket,
} from '../../core/services/support-conversation.service';

interface AdminStats {
  revenue: number;
  bookings: number;
  users: number;
  vehicles: number;
}

type AdminSection = 'overview' | 'bookings' | 'users' | 'fleet' | 'transactions' | 'reviews' | 'tracking' | 'support' | 'promos';
type GenderCategory = 'male' | 'female' | 'other' | 'preferNotToSay' | 'notProvided';
interface GenderSegment { key: GenderCategory; label: string; count: number; percent: number; color: string; }
interface VehiclePerformance { id: number | string; name: string; bookings: number; revenue: number; share: number; }
interface AdminUser { id: string; full_name: string; email: string; phone?: string | null; is_active?: boolean; created_at?: string; }
interface AdminReview { id?: string; customer_name?: string; customer_email?: string; rating: number; comment?: string; created_at?: string; }
interface AdminLocation {
  key: string;
  name: string;
  latitude: number;
  longitude: number;
  recorded_at?: string;
  activity?: string;
  area?: string;
  is_demo?: boolean;
}
interface UserTransactionSummary { user: AdminUser; balance: number; transactions: Array<{ created_at?: string; description: string; amount: number }>; bookings: Booking[]; }
interface AdminPromo {
  id: number;
  code: string;
  description: string | null;
  discount_percent: number;
  max_uses: number | null;
  current_uses: number;
  min_spend: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
}

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
})
export class AdminPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseService);
  private readonly demoTracking = inject(DemoTrackingService);
  private readonly predictiveInsights = inject(PredictiveInsightsService);
  private readonly supportService = inject(SupportConversationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);

  readonly currentUser = this.auth.currentUser;
  readonly stats = signal<AdminStats>({ revenue: 0, bookings: 0, users: 0, vehicles: 0 });
  readonly recentBookings = signal<Booking[]>([]);
  readonly topUsers = signal<Array<{ name: string; email: string; spent: number }>>([]);
  readonly genderSegments = signal<GenderSegment[]>([]);
  readonly genderTotal = computed(() => this.genderSegments().reduce((total, segment) => total + segment.count, 0));
  readonly genderPie = computed(() => {
    const segments = this.genderSegments();
    let stop = 0;
    const slices = segments.map((segment) => {
      const start = stop;
      stop += segment.percent;
      return `${segment.color} ${start}% ${stop}%`;
    });
    return slices.length ? `conic-gradient(${slices.join(', ')})` : 'var(--sd-muted)';
  });
  readonly vehiclePerformance = signal<VehiclePerformance[]>([]);
  readonly fleetForecast = signal<FleetForecast | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly section = signal<AdminSection>('overview');
  readonly bookings = signal<Booking[]>([]);
  readonly users = signal<AdminUser[]>([]);
  readonly vehicles = signal<any[]>([]);
  readonly reviews = signal<AdminReview[]>([]);
  readonly supportConversations = signal<SupportConversation[]>([]);
  readonly supportTickets = signal<SupportTicket[]>([]);
  readonly supportMessages = signal<SupportMessage[]>([]);
  readonly supportNotes = signal<SupportAdminNote[]>([]);
  readonly selectedSupportConversation = signal<SupportConversation | null>(null);
  readonly supportNoteDraft = signal('');
  readonly savingSupportNote = signal(false);
  readonly promoCodes = signal<AdminPromo[]>([]);
  readonly promoFeedback = signal<string | null>(null);
  readonly savingPromo = signal(false);
  readonly newPromo = {
    code: '',
    description: '',
    discountPercent: 10,
    maxUses: null as number | null | '',
    minSpend: 0,
    validFrom: '',
    validUntil: '',
  };
  readonly locations = signal<AdminLocation[]>([]);
  readonly trackingColorsByKey = computed(() => {
    const keys = [...new Set(this.locations().map((location) => location.key))].sort();
    const assigned = new Map<string, string>();
    const occupiedHues = new Set<number>();
    for (const key of keys) {
      let hash = 0;
      for (const character of key) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
      let hue = hash % 360;
      let attempts = 0;
      while (occupiedHues.has(hue) && attempts < 360) {
        hue = (hue + 1) % 360;
        attempts++;
      }
      occupiedHues.add(hue);
      assigned.set(key, `hsl(${hue} 72% 43%)`);
    }
    return assigned;
  });
  readonly selectedLocationKey = signal<string | null>(null);
  readonly selectedLocation = computed(
    () => this.locations().find((location) => location.key === this.selectedLocationKey()) ?? this.locations()[0] ?? null,
  );
  readonly trackingMapUrl = computed<SafeResourceUrl>(() => {
    const location = this.selectedLocation();
    const latitude = location?.latitude ?? 14.5995;
    const longitude = location?.longitude ?? 120.9842;
    const zoom = location ? 15 : 12;
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://maps.google.com/maps?q=${latitude},${longitude}&z=${zoom}&output=embed`,
    );
  });
  readonly transactionSummaries = signal<UserTransactionSummary[]>([]);
  readonly trackingDemoMode = signal(false);
  readonly hasTransactionDemos = signal(false);
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
      if (section === 'support') await this.loadSupport();
      if (section === 'promos') await this.loadPromos();
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

  private async loadSupport(): Promise<void> {
    const [conversations, tickets] = await Promise.all([
      this.supportService.listConversations(),
      this.supportService.listTickets(),
    ]);
    this.supportConversations.set(conversations);
    this.supportTickets.set(tickets);
    if (this.selectedSupportConversation()) {
      const selected = conversations.find((item) => item.id === this.selectedSupportConversation()?.id);
      if (selected) await this.selectSupportConversation(selected);
      else this.selectedSupportConversation.set(null);
    }
  }

  private async loadPromos(): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    this.promoCodes.set((data ?? []) as AdminPromo[]);
  }

  async selectSupportConversation(conversation: SupportConversation): Promise<void> {
    this.selectedSupportConversation.set(conversation);
    this.errorMessage.set(null);
    try {
      const [messages, notes] = await Promise.all([
        this.supportService.listMessages(conversation.id),
        this.supportService.listAdminNotes(conversation.id),
      ]);
      this.supportMessages.set(messages);
      this.supportNotes.set(notes);
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to load this support conversation.');
    }
  }

  async saveSupportNote(): Promise<void> {
    const conversation = this.selectedSupportConversation();
    const adminId = this.currentUser()?.id;
    const note = this.supportNoteDraft().trim();
    if (!conversation || !adminId || !note || this.savingSupportNote()) return;

    this.savingSupportNote.set(true);
    this.errorMessage.set(null);
    try {
      const saved = await this.supportService.addAdminNote(conversation.id, adminId, note);
      this.supportNotes.update((items) => [...items, saved]);
      this.supportNoteDraft.set('');
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to save the internal note.');
    } finally {
      this.savingSupportNote.set(false);
    }
  }

  async updateSupportTicketStatus(ticket: SupportTicket, status: SupportTicket['status']): Promise<void> {
    this.errorMessage.set(null);
    try {
      await this.supportService.updateTicketStatus(ticket.id, status);
      this.supportTickets.update((items) => items.map((item) => item.id === ticket.id ? { ...item, status } : item));
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to update the support ticket.');
    }
  }

  conversationNumber(conversationId: string): string {
    return this.supportConversations().find((item) => item.id === conversationId)?.conversation_number ?? conversationId;
  }

  updateTicketStatusFromSelect(ticket: SupportTicket, status: string): void {
    if (status === 'open' || status === 'in_progress' || status === 'resolved') {
      void this.updateSupportTicketStatus(ticket, status);
    }
  }

  async togglePromo(promo: AdminPromo): Promise<void> {
    this.errorMessage.set(null);
    const isActive = !promo.is_active;
    try {
      const { error } = await this.supabase.client
        .from('discount_codes')
        .update({ is_active: isActive })
        .eq('id', promo.id);
      if (error) throw new Error(error.message);
      this.promoCodes.update((items) => items.map((item) => item.id === promo.id ? { ...item, is_active: isActive } : item));
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to update the promo code.');
    }
  }

  async savePromo(): Promise<void> {
    const code = this.newPromo.code.trim().toUpperCase();
    const discountPercent = Number(this.newPromo.discountPercent);
    const maxUses = this.newPromo.maxUses === null || this.newPromo.maxUses === ''
      ? null
      : Number(this.newPromo.maxUses);
    const minSpend = Number(this.newPromo.minSpend);
    if (!/^[A-Z0-9_-]{3,30}$/.test(code)) {
      this.promoFeedback.set('Use 3–30 letters, numbers, hyphens, or underscores for the code.');
      return;
    }
    if (!Number.isFinite(discountPercent) || discountPercent <= 0 || discountPercent > 100) {
      this.promoFeedback.set('Discount must be greater than 0% and no more than 100%.');
      return;
    }
    if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1)) {
      this.promoFeedback.set('Maximum uses must be a positive whole number or left blank.');
      return;
    }
    if (!Number.isFinite(minSpend) || minSpend < 0) {
      this.promoFeedback.set('Minimum spend must be zero or more.');
      return;
    }
    const validFrom = this.newPromo.validFrom ? new Date(`${this.newPromo.validFrom}T00:00:00`).toISOString() : null;
    const validUntil = this.newPromo.validUntil ? new Date(`${this.newPromo.validUntil}T23:59:59`).toISOString() : null;
    if (validFrom && validUntil && new Date(validUntil) < new Date(validFrom)) {
      this.promoFeedback.set('The end date must be on or after the start date.');
      return;
    }

    this.savingPromo.set(true);
    this.promoFeedback.set(null);
    try {
      const { error } = await this.supabase.client.from('discount_codes').insert({
        code,
        description: this.newPromo.description.trim() || null,
        discount_percent: discountPercent,
        max_uses: maxUses,
        current_uses: 0,
        min_spend: minSpend,
        valid_from: validFrom,
        valid_until: validUntil,
        is_active: true,
      });
      if (error) throw new Error(error.message);
      this.newPromo.code = '';
      this.newPromo.description = '';
      this.newPromo.discountPercent = 10;
      this.newPromo.maxUses = null;
      this.newPromo.minSpend = 0;
      this.newPromo.validFrom = '';
      this.newPromo.validUntil = '';
      this.promoFeedback.set('Promo code created.');
      await this.loadPromos();
    } catch (error) {
      this.promoFeedback.set(error instanceof Error ? error.message : 'Could not create promo code.');
    } finally {
      this.savingPromo.set(false);
    }
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
        is_demo: false,
      })).filter((location: AdminLocation) =>
        Number.isFinite(location.latitude) &&
        Number.isFinite(location.longitude) &&
        Math.abs(location.latitude) <= 90 &&
        Math.abs(location.longitude) <= 180,
      );
      const demoLocations = this.demoTracking.getLocations();
      this.trackingDemoMode.set(false);
      this.hasTransactionDemos.set(demoLocations.length > 0);
      const demoUserKeys = new Set(demoLocations.map((location) => location.key));
      const sampleLocations = this.getDemoLocations().filter((location) => !demoUserKeys.has(location.key));
      const allDemoKeys = new Set([...demoUserKeys, ...sampleLocations.map((location) => location.key)]);
      this.setTrackingLocations([
        ...demoLocations,
        ...sampleLocations,
        ...liveLocations.filter((location: AdminLocation) => !allDemoKeys.has(location.key)),
      ]);
    } catch {
      this.trackingDemoMode.set(true);
      this.hasTransactionDemos.set(this.demoTracking.getLocations().length > 0);
      this.setTrackingLocations([...this.demoTracking.getLocations(), ...this.getDemoLocations()]);
    }
  }

  private setTrackingLocations(locations: AdminLocation[]): void {
    this.locations.set(locations);
    if (!locations.some((location) => location.key === this.selectedLocationKey())) {
      this.selectedLocationKey.set(locations[0]?.key ?? null);
    }
  }

  selectTrackingLocation(location: AdminLocation): void {
    this.selectedLocationKey.set(location.key);
  }

  locationColor(location: AdminLocation): string {
    return this.trackingColorsByKey().get(location.key) ?? 'hsl(270 72% 43%)';
  }

  distanceFromSelected(location: AdminLocation): number | null {
    const selected = this.selectedLocation();
    if (!selected || selected.key === location.key) return null;
    const radians = Math.PI / 180;
    const lat1 = selected.latitude * radians;
    const lat2 = location.latitude * radians;
    const deltaLat = (location.latitude - selected.latitude) * radians;
    const deltaLon = (location.longitude - selected.longitude) * radians;
    const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private getDemoLocations(): AdminLocation[] {
    return [
      {
        key: 'demo-maria',
        name: 'Maria Santos (Demo)',
        latitude: 14.5995,
        longitude: 120.9842,
        area: 'Rizal Park, Manila (demo)',
        recorded_at: new Date().toISOString(),
        is_demo: true,
      },
      {
        key: 'demo-john',
        name: 'John Dela Cruz (Demo)',
        latitude: 14.676,
        longitude: 121.0437,
        area: 'Cubao, Quezon City (demo)',
        recorded_at: new Date().toISOString(),
        is_demo: true,
      },
      {
        key: 'demo-anna',
        name: 'Anna Reyes (Demo)',
        latitude: 14.5547,
        longitude: 121.0244,
        area: 'Legazpi Village, Makati (demo)',
        recorded_at: new Date().toISOString(),
        is_demo: true,
      },
      {
        key: 'demo-pampanga',
        name: 'Carlos Mendoza (Demo)',
        latitude: 15.1859,
        longitude: 120.5600,
        area: 'Clark Freeport Zone, Pampanga (demo)',
        recorded_at: new Date().toISOString(),
        is_demo: true,
      },
      {
        key: 'demo-pangasinan',
        name: 'Beatriz Ramos (Demo)',
        latitude: 16.0433,
        longitude: 120.3333,
        area: 'Dagupan City, Pangasinan (demo)',
        recorded_at: new Date().toISOString(),
        is_demo: true,
      },
      {
        key: 'demo-la-union',
        name: 'Miguel Torres (Demo)',
        latitude: 16.6159,
        longitude: 120.3169,
        area: 'San Fernando City, La Union (demo)',
        recorded_at: new Date().toISOString(),
        is_demo: true,
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
        this.supabase.client.from('profiles').select('id, full_name, email, gender, created_at, registration_date'),
        this.supabase.client.from('vehicles').select('id, name, type, price, status').neq('status', 'archived'),
      ]);

      if (bookingsResult.error) throw new Error(`Bookings could not be loaded: ${bookingsResult.error.message}`);
      if (usersResult.error) throw new Error(`Users could not be loaded: ${usersResult.error.message}`);
      if (vehiclesResult.error) throw new Error(`Vehicles could not be loaded: ${vehiclesResult.error.message}`);

      const bookings = (bookingsResult.data ?? []) as Booking[];
      const users = (usersResult.data ?? []) as Array<{
        full_name: string | null;
        email: string;
        gender: string | null;
      }>;
      const vehicles = (vehiclesResult.data ?? []) as Array<{
        id: number;
        name: string;
        type?: string | null;
        price?: number | string | null;
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
      this.genderSegments.set(this.buildGenderSegments(users));
      this.vehiclePerformance.set(this.buildVehiclePerformance(vehicles, bookings));
      this.fleetForecast.set(this.predictiveInsights.getFleetForecast(bookings, vehicles));
      this.recentBookings.set(bookings.slice(0, 5));
      this.topUsers.set([...spending.values()].sort((a, b) => b.spent - a.spent).slice(0, 5));
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to load the admin dashboard.');
    } finally {
      this.loading.set(false);
      (event?.target as HTMLIonRefresherElement | undefined)?.complete();
    }
  }

  private buildGenderSegments(users: Array<{ gender: string | null }>): GenderSegment[] {
    const definitions: Array<{ key: GenderCategory; label: string; color: string }> = [
      { key: 'female', label: 'Female', color: '#c026d3' },
      { key: 'male', label: 'Male', color: '#7c3aed' },
      { key: 'other', label: 'Other', color: '#a855f7' },
      { key: 'preferNotToSay', label: 'Prefer not to say', color: '#d8b4fe' },
      { key: 'notProvided', label: 'Not provided', color: '#e9e5f1' },
    ];
    const counts = new Map<GenderCategory, number>(definitions.map(({ key }) => [key, 0]));
    for (const user of users) {
      const gender = user.gender?.trim().toLowerCase();
      const key: GenderCategory =
        gender === 'female' ? 'female' :
        gender === 'male' ? 'male' :
        gender === 'other' ? 'other' :
        gender === 'prefer_not_to_say' || gender === 'prefer not to say' ? 'preferNotToSay' :
        'notProvided';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const total = users.length;
    return definitions.map((definition) => ({
      ...definition,
      count: counts.get(definition.key) ?? 0,
      percent: total ? (counts.get(definition.key) ?? 0) / total * 100 : 0,
    }));
  }

  private buildVehiclePerformance(
    vehicles: Array<{ id: number; name: string; type?: string | null; price?: number | string | null }>,
    bookings: Booking[],
  ): VehiclePerformance[] {
    const performance = new Map<string, VehiclePerformance>();
    for (const vehicle of vehicles) {
      performance.set(String(vehicle.id), {
        id: vehicle.id,
        name: vehicle.name,
        bookings: 0,
        revenue: 0,
        share: 0,
      });
    }
    for (const booking of bookings) {
      if (booking.booking_status === 'cancelled' || booking.payment_status === 'refunded') continue;
      const key = String(booking.vehicle_id ?? booking.vehicle_name);
      const current = performance.get(key) ?? {
        id: booking.vehicle_id ?? key,
        name: booking.vehicle_name || 'Vehicle',
        bookings: 0,
        revenue: 0,
        share: 0,
      };
      current.bookings += 1;
      current.revenue += Number(booking.total_price || 0);
      performance.set(key, current);
    }
    const ranked = [...performance.values()]
      .sort((a, b) => b.bookings - a.bookings || b.revenue - a.revenue || a.name.localeCompare(b.name))
      .slice(0, 5);
    const highestBookingCount = ranked[0]?.bookings ?? 0;
    return ranked.map((vehicle) => ({
      ...vehicle,
      share: highestBookingCount ? vehicle.bookings / highestBookingCount * 100 : 0,
    }));
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/login');
  }
}
