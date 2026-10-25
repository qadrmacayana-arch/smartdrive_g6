import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
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
import { BOOKING_SELECT_FIELDS, Booking } from '../../core/models/booking.model';
import { Vehicle } from '../../core/models/vehicle.model';
import { DemoTrackingService } from '../../core/services/demo-tracking.service';
import { FleetForecast, PredictiveInsightsService } from '../../core/services/predictive-insights.service';
import {
  SupportAdminNote,
  SupportConversation,
  SupportConversationService,
  SupportMessage,
  SupportTicket,
} from '../../core/services/support-conversation.service';
import { ContactMessage, ContactMessageService } from '../../core/services/contact-message.service';
import { RealtimeChannel } from '@supabase/supabase-js';

interface AdminStats {
  revenue: number;
  bookings: number;
  users: number;
  vehicles: number;
}

type AdminSection = 'overview' | 'bookings' | 'availability' | 'users' | 'fleet' | 'transactions' | 'reviews' | 'tracking' | 'support' | 'email-concerns' | 'reports' | 'promos' | 'cms' | 'settings' | 'notifications' | 'audit';
type CmsStatus = 'draft' | 'published' | 'archived';
interface CmsContentItem {
  id: string;
  title: string;
  message: string;
  route: string;
  status: CmsStatus;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}
interface AdminNotification {
  id: string;
  title: string;
  message: string;
  route: string;
  status: CmsStatus;
  published_at: string | null;
  expires_at: string | null;
  created_at: string;
}
interface SiteSetting {
  setting_key: string;
  setting_value: string;
  is_public: boolean;
}
interface AdminAuditLog {
  id: number;
  actor_email: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  changed_fields: string[];
  created_at: string;
}
type GenderCategory = 'male' | 'female' | 'other' | 'preferNotToSay' | 'notProvided';
interface GenderSegment { key: GenderCategory; label: string; count: number; percent: number; color: string; }
interface VehiclePerformance { id: number | string; name: string; bookings: number; revenue: number; share: number; }
interface VehicleAvailability {
  vehicle: Vehicle;
  using: Booking[];
  reserved: Booking[];
  pending: Booking[];
  availableUnits: number;
}
interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  is_active?: boolean;
  created_at?: string;
  gender?: string | null;
  member_type?: string | null;
}
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
interface UserTransactionSummary {
  user: AdminUser;
  balance: number;
  transactions: Array<{
    id?: number;
    created_at?: string;
    type?: string;
    description: string;
    amount: number;
    payment_method?: string | null;
    status?: string;
  }>;
  bookings: Booking[];
}
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
interface VehicleEditDraft {
  id: number;
  plate_number: string;
  fleet_quantity: number;
  name: string;
  type: string;
  main_category: string;
  price: number;
  image: string;
  description: string;
  features: string;
  transmission: string;
  fuel: string;
  seats: number;
  is_featured: boolean;
}

type PickupDocumentField =
  | 'pickup_license_verified'
  | 'pickup_government_ids_verified'
  | 'pickup_proof_of_billing_verified'
  | 'pickup_pwd_senior_id_verified';

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
export class AdminPage implements OnDestroy, OnInit {
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseService);
  private readonly demoTracking = inject(DemoTrackingService);
  private readonly predictiveInsights = inject(PredictiveInsightsService);
  private readonly supportService = inject(SupportConversationService);
  private readonly contactMessageService = inject(ContactMessageService);
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
  readonly savingPickupDocuments = signal<Set<number>>(new Set());
  readonly errorMessage = signal<string | null>(null);
  readonly section = signal<AdminSection>('overview');
  readonly bookings = signal<Booking[]>([]);
  readonly availabilityDate = signal(this.todayDate());
  readonly availabilityClock = signal(Date.now());
  readonly availabilityFilter = signal('all');
  readonly overviewBookingStatusFilter = signal('all');
  readonly bookingStatusFilter = signal('all');
  readonly paymentStatusFilter = signal('all');
  readonly userStatusFilter = signal('all');
  readonly transactionFilter = signal('all');
  readonly fleetFilter = signal('all');
  readonly reviewRatingFilter = signal('all');
  readonly conversationStatusFilter = signal('all');
  readonly ticketStatusFilter = signal('all');
  readonly contactReadFilter = signal('all');
  readonly promoStatusFilter = signal('all');
  readonly vehicleAvailability = computed<VehicleAvailability[]>(() => {
    const date = this.availabilityDate();
    const now = this.availabilityClock();
    const eligible = this.bookings().filter((booking) =>
      booking.booking_status !== 'cancelled'
      && booking.payment_status !== 'failed'
      && booking.payment_status !== 'refunded'
      && booking.pickup_date <= date
      && booking.return_date > date,
    );
    return this.vehicles()
      .filter((vehicle) => vehicle.status !== 'archived')
      .map((vehicle) => {
        const vehicleBookings = eligible.filter((booking) => booking.vehicle_id === vehicle.id);
        const using = vehicleBookings.filter((booking) =>
          booking.booking_status === 'ongoing' && booking.payment_status === 'completed',
        );
        const reserved = vehicleBookings.filter((booking) =>
          booking.booking_status === 'confirmed' && booking.payment_status === 'completed',
        );
        const pending = vehicleBookings.filter((booking) =>
          booking.booking_status === 'confirmed'
          && booking.payment_status === 'pending'
          && booking.created_at != null
          && Date.parse(booking.created_at) > now - 10 * 60 * 1000,
        );
        return {
          vehicle,
          using,
          reserved,
          pending,
          availableUnits: vehicle.status === 'available'
            ? Math.max(0, Number(vehicle.fleet_quantity ?? 1) - using.length - reserved.length - pending.length)
            : 0,
        };
      });
  });
  readonly availabilitySummary = computed(() => {
    const vehicles = this.vehicleAvailability();
    const using = vehicles.reduce((count, item) => count + item.using.length, 0);
    const reserved = vehicles.reduce((count, item) => count + item.reserved.length, 0);
    const pending = vehicles.reduce((count, item) => count + item.pending.length, 0);
    return { using, reserved, pending, total: using + reserved + pending };
  });
  readonly users = signal<AdminUser[]>([]);
  readonly vehicles = signal<Vehicle[]>([]);
  readonly reviews = signal<AdminReview[]>([]);
  readonly supportConversations = signal<SupportConversation[]>([]);
  readonly supportTickets = signal<SupportTicket[]>([]);
  readonly contactMessages = signal<ContactMessage[]>([]);
  readonly unreadContactMessageCount = signal(0);
  readonly contactNotification = signal<string | null>(null);
  readonly supportMessages = signal<SupportMessage[]>([]);
  readonly supportNotes = signal<SupportAdminNote[]>([]);
  readonly selectedSupportConversation = signal<SupportConversation | null>(null);
  readonly supportNoteDraft = signal('');
  readonly savingSupportNote = signal(false);
  readonly promoCodes = signal<AdminPromo[]>([]);
  readonly reportPeriod = signal<'all' | '30' | '365'>('all');
  readonly reportBookings = signal<Booking[]>([]);
  readonly activePromoCount = signal(0);
  readonly reportSummary = computed(() => {
    const bookings = this.filteredReportBookings();
    return {
      revenue: bookings
        .filter((booking) => booking.payment_status === 'completed' && booking.booking_status !== 'cancelled')
        .reduce((sum, booking) => sum + Number(booking.total_price ?? 0), 0),
      bookings: bookings.length,
      activeCustomers: new Set(bookings.map((booking) => booking.customer_email).filter(Boolean)).size,
      activePromos: this.activePromoCount(),
      completedTrips: bookings.filter((booking) => booking.booking_status === 'completed').length,
      pendingPayments: bookings.filter((booking) => booking.payment_status === 'pending').length,
    };
  });
  readonly reportStatusBreakdown = computed(() => {
    const bookings = this.filteredReportBookings();
    return ([
      ['confirmed', 'Confirmed'],
      ['ongoing', 'In progress'],
      ['completed', 'Completed'],
      ['cancelled', 'Cancelled'],
    ] as const).map(([status, label]) => ({
      status,
      label,
      count: bookings.filter((booking) => booking.booking_status === status).length,
    }));
  });
  readonly reportPaymentBreakdown = computed(() => {
    const bookings = this.filteredReportBookings();
    const groups = new Map<string, { method: string; count: number; paid: number; pending: number; refunded: number }>();
    for (const booking of bookings) {
      const method = this.paymentMethod(booking.payment_method);
      const group = groups.get(method) ?? { method, count: 0, paid: 0, pending: 0, refunded: 0 };
      group.count++;
      if (booking.payment_status === 'completed') group.paid += Number(booking.total_price ?? 0);
      if (booking.payment_status === 'pending') group.pending += Number(booking.total_price ?? 0);
      if (booking.payment_status === 'refunded') group.refunded += Number(booking.total_price ?? 0);
      groups.set(method, group);
    }
    return [...groups.values()].sort((first, second) => second.paid - first.paid);
  });
  readonly reportVehicleBreakdown = computed(() => {
    const groups = new Map<string, { vehicle: string; bookings: number; revenue: number; cancelled: number }>();
    for (const booking of this.filteredReportBookings()) {
      const group = groups.get(booking.vehicle_name) ?? { vehicle: booking.vehicle_name, bookings: 0, revenue: 0, cancelled: 0 };
      group.bookings++;
      if (booking.payment_status === 'completed' && booking.booking_status !== 'cancelled') {
        group.revenue += Number(booking.total_price ?? 0);
      }
      if (booking.booking_status === 'cancelled') group.cancelled++;
      groups.set(booking.vehicle_name, group);
    }
    return [...groups.values()].sort((first, second) => second.bookings - first.bookings);
  });
  readonly reportCustomerBreakdown = computed(() => {
    const groups = new Map<string, { customer: string; email: string; bookings: number; paid: number }>();
    for (const booking of this.filteredReportBookings()) {
      const key = booking.customer_email.trim().toLowerCase() || booking.customer_name;
      const customer = groups.get(key) ?? {
        customer: booking.customer_name,
        email: booking.customer_email,
        bookings: 0,
        paid: 0,
      };
      customer.bookings++;
      if (booking.payment_status === 'completed' && booking.booking_status !== 'cancelled') {
        customer.paid += Number(booking.total_price ?? 0);
      }
      groups.set(key, customer);
    }
    return [...groups.values()].sort((first, second) => second.bookings - first.bookings).slice(0, 10);
  });
  readonly reportCancellationCount = computed(() =>
    this.filteredReportBookings().filter((booking) => booking.booking_status === 'cancelled').length,
  );
  readonly promoFeedback = signal<string | null>(null);
  readonly savingPromo = signal(false);
  readonly cmsItems = signal<CmsContentItem[]>([]);
  readonly cmsFeedback = signal<string | null>(null);
  readonly savingCms = signal(false);
  readonly cmsDraft: {
    id: string | null;
    title: string;
    message: string;
    route: string;
    status: CmsStatus;
    startsAt: string;
    endsAt: string;
  } = {
    id: null,
    title: '',
    message: '',
    route: '/offers',
    status: 'draft',
    startsAt: '',
    endsAt: '',
  };
  readonly adminNotifications = signal<AdminNotification[]>([]);
  readonly notificationFeedback = signal<string | null>(null);
  readonly savingAdminNotification = signal(false);
  readonly editingAdminNotificationId = signal<string | null>(null);
  readonly notificationDraft = {
    title: '',
    message: '',
    route: '/notifications',
    expiresAt: '',
  };
  readonly siteSettings = signal<SiteSetting[]>([]);
  readonly siteSettingsDraft = signal<Record<string, string>>({});
  readonly settingsFeedback = signal<string | null>(null);
  readonly savingSiteSettings = signal(false);
  readonly auditLogs = signal<AdminAuditLog[]>([]);
  readonly auditSearch = signal('');
  readonly filteredAuditLogs = computed(() => {
    const search = this.auditSearch().trim().toLowerCase();
    if (!search) return this.auditLogs();
    return this.auditLogs().filter((event) =>
      [event.actor_email, event.action, event.resource_type, event.resource_id, ...event.changed_fields]
        .some((value) => String(value ?? '').toLowerCase().includes(search)),
    );
  });
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
  readonly trackingSourceFilter = signal('all');
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
  readonly filteredLocations = computed(() => {
    const filter = this.trackingSourceFilter();
    return this.locations().filter((location) =>
      filter === 'all'
      || (filter === 'demo' && location.is_demo)
      || (filter === 'live' && !location.is_demo),
    );
  });
  readonly selectedLocation = computed(
    () => this.filteredLocations().find((location) => location.key === this.selectedLocationKey()) ?? this.filteredLocations()[0] ?? null,
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
  readonly editingVehicle = signal<VehicleEditDraft | null>(null);
  readonly vehicleEditError = signal<string | null>(null);
  readonly savingVehicleEdit = signal(false);
  readonly newVehicle = {
    vehicle_id: '',
    plate_number: '',
    fleet_quantity: 1,
    name: '',
    type: '',
    main_category: 'Cars',
    price: 0,
    image: '',
    status: 'available',
  };
  private contactMessageChannel: RealtimeChannel | null = null;

  ngOnInit(): void {
    this.contactMessageChannel = this.contactMessageService.watchForNewMessages((message) => {
      if (!message.is_read) {
        this.unreadContactMessageCount.update((count) => count + 1);
      }
      this.contactNotification.set(`New customer message from ${message.full_name}.`);
    });
    void this.loadUnreadContactMessageCount();
    this.route.queryParamMap.subscribe((params) => {
      const requested = params.get('section');
      const availableSections: AdminSection[] = [
        'overview', 'bookings', 'availability', 'users', 'fleet', 'transactions', 'reviews',
        'tracking', 'support', 'email-concerns', 'reports', 'promos', 'cms', 'settings',
        'notifications', 'audit',
      ];
      const currentSection = availableSections.find((item) => item === requested) ?? 'overview';
      this.section.set(currentSection);
      void this.loadSection(this.section());
    });
    window.setInterval(() => {
      if (this.section() === 'tracking') void this.loadLocations();
      if (this.section() === 'availability') this.availabilityClock.set(Date.now());
    }, 10000);
  }

  ngOnDestroy(): void {
    if (this.contactMessageChannel) {
      void this.supabase.client.removeChannel(this.contactMessageChannel);
      this.contactMessageChannel = null;
    }
  }

  private async loadUnreadContactMessageCount(): Promise<void> {
    try {
      this.unreadContactMessageCount.set(await this.contactMessageService.countUnreadForAdmin());
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to load unread customer messages.');
    }
  }

  async loadSection(section: AdminSection): Promise<void> {
    if (section === 'overview') return this.loadDashboard();
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      if (section === 'bookings') await this.loadBookings();
      if (section === 'availability') await Promise.all([this.loadBookings(), this.loadFleet()]);
      if (section === 'users') await this.loadUsers();
      if (section === 'transactions') await this.loadTransactions();
      if (section === 'fleet') await this.loadFleet();
      if (section === 'reviews') await this.loadReviews();
      if (section === 'tracking') await this.loadLocations();
      if (section === 'support') await this.loadSupport();
      if (section === 'email-concerns') await this.loadContactMessages();
      if (section === 'reports') await this.loadReports();
      if (section === 'promos') await this.loadPromos();
      if (section === 'cms') await this.loadCmsContent();
      if (section === 'settings') await this.loadSiteSettings();
      if (section === 'notifications') await this.loadAdminNotifications();
      if (section === 'audit') await this.loadAuditLogs();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : `Unable to load ${section}.`);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadBookings(): Promise<void> {
    const bookings = await this.supabase.client
      .from('bookings')
      .select(BOOKING_SELECT_FIELDS)
      .order('created_at', { ascending: false });
    if (bookings.error) throw new Error(bookings.error.message);
    this.bookings.set((bookings.data ?? []) as Booking[]);
  }

  private todayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  setAvailabilityDate(value: string): void {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) this.availabilityDate.set(value);
  }

  private async loadUsers(): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('id,full_name,email,phone,is_active,created_at,gender,member_type')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    this.users.set((data ?? []) as AdminUser[]);
  }

  private async loadTransactions(): Promise<void> {
    await this.loadUsers();
    const [balances, transactions, bookings] = await Promise.all([
      this.supabase.client.from('wallet_balances').select('*'),
      this.supabase.client.from('wallet_transactions').select('*').order('created_at', { ascending: false }),
      this.supabase.client.from('bookings').select(BOOKING_SELECT_FIELDS).order('created_at', { ascending: false }),
    ]);
    if (balances.error) throw new Error(balances.error.message);
    if (transactions.error) throw new Error(transactions.error.message);
    if (bookings.error) throw new Error(bookings.error.message);
    const normalizeEmail = (email: unknown): string => String(email ?? '').trim().toLowerCase();
    const summaries = new Map<string, UserTransactionSummary>();
    const userKeys = new Map<string, string>();
    const emailKeys = new Map<string, string>();
    const ensureSummary = (
      userId: unknown,
      emailValue: unknown,
      fullName?: string | null,
      phone?: string | null,
    ): UserTransactionSummary | null => {
      const userIdValue = String(userId ?? '').trim();
      const email = normalizeEmail(emailValue);
      if (email === 'admin@smartrentals.com') return null;
      const key = (userIdValue && userKeys.get(userIdValue))
        || (email && emailKeys.get(email))
        || (userIdValue ? `user:${userIdValue}` : email ? `email:${email}` : '');
      if (!key) return null;

      let summary = summaries.get(key);
      if (!summary) {
        summary = {
          user: {
            id: userIdValue || email,
            email,
            full_name: fullName || email.split('@')[0] || 'Customer',
            phone: phone ?? null,
          },
          balance: 0,
          transactions: [],
          bookings: [],
        };
        summaries.set(key, summary);
      } else {
        if (
          fullName
          && (!summary.user.full_name || summary.user.full_name === summary.user.email.split('@')[0])
        ) summary.user.full_name = fullName;
        if (phone && !summary.user.phone) summary.user.phone = phone;
        if (!summary.user.email && email) summary.user.email = email;
        if (userIdValue) summary.user.id = userIdValue;
      }
      if (userIdValue) userKeys.set(userIdValue, key);
      if (email) emailKeys.set(email, key);
      return summary;
    };

    for (const user of this.users()) {
      if (normalizeEmail(user.email) !== 'admin@smartrentals.com') {
        ensureSummary(user.id, user.email, user.full_name, user.phone);
      }
    }
    for (const balance of balances.data ?? []) {
      const summary = ensureSummary(balance.user_id, balance.email);
      if (summary) summary.balance = Number(balance.balance ?? 0);
    }
    for (const transaction of transactions.data ?? []) {
      ensureSummary(transaction.user_id, transaction.email)?.transactions.push(transaction as UserTransactionSummary['transactions'][number]);
    }
    for (const booking of (bookings.data ?? []) as Booking[]) {
      ensureSummary(booking.user_id, booking.customer_email, booking.customer_name, booking.customer_phone)
        ?.bookings.push(booking);
    }
    this.transactionSummaries.set([...summaries.values()]);
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

  private async loadContactMessages(): Promise<void> {
    const messages = await this.contactMessageService.listForAdmin();
    this.contactMessages.set(messages);
    this.unreadContactMessageCount.set(messages.filter((message) => !message.is_read).length);
  }

  async setContactMessageRead(message: ContactMessage, isRead: boolean): Promise<void> {
    this.errorMessage.set(null);
    try {
      await this.contactMessageService.markRead(message.id, isRead);
      this.contactMessages.update((items) =>
        items.map((item) => item.id === message.id ? { ...item, is_read: isRead } : item),
      );
      this.unreadContactMessageCount.update((count) => Math.max(0, count + (isRead ? -1 : 1)));
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to update the contact message.');
    }
  }

  private async loadReports(): Promise<void> {
    const [bookings, users, promos] = await Promise.all([
      this.supabase.client.from('bookings').select(BOOKING_SELECT_FIELDS).order('created_at', { ascending: false }),
      this.supabase.client.from('profiles').select('id, email').order('created_at', { ascending: false }),
      this.supabase.client.from('discount_codes').select('*').eq('is_active', true),
    ]);
    if (bookings.error) throw new Error(bookings.error.message);
    if (users.error) throw new Error(users.error.message);
    if (promos.error) throw new Error(promos.error.message);

    this.reportBookings.set((bookings.data ?? []) as Booking[]);
    this.activePromoCount.set((promos.data ?? []).length);
  }

  filteredReportBookings(): Booking[] {
    const period = this.reportPeriod();
    if (period === 'all') return this.reportBookings();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - Number(period));
    return this.reportBookings().filter((booking) => {
      if (!booking.created_at) return false;
      const createdAt = new Date(booking.created_at);
      return !Number.isNaN(createdAt.getTime()) && createdAt >= start;
    });
  }

  exportBusinessReport(): void {
    const bookings = this.filteredReportBookings();
    const quote = (value: unknown): string => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rows = [
      ['Reference', 'Created', 'Customer', 'Email', 'Vehicle', 'Pickup', 'Return', 'Booking status', 'Payment method', 'Payment status', 'Total PHP'],
      ...bookings.map((booking) => [
        booking.reference_number,
        booking.created_at ?? '',
        booking.customer_name,
        booking.customer_email,
        booking.vehicle_name,
        booking.pickup_date,
        booking.return_date,
        booking.booking_status,
        this.paymentMethod(booking.payment_method),
        booking.payment_status,
        Number(booking.total_price ?? 0).toFixed(2),
      ]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(quote).join(',')).join('\r\n')}`;
    const file = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SmartDrive-business-report-${this.reportPeriod()}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  private async loadPromos(): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    this.promoCodes.set((data ?? []) as AdminPromo[]);
  }

  private async loadCmsContent(): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('cms_content')
      .select('id,title,message,route,status,starts_at,ends_at,created_at')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    this.cmsItems.set((data ?? []) as CmsContentItem[]);
  }

  editCmsContent(item: CmsContentItem): void {
    this.cmsDraft.id = item.id;
    this.cmsDraft.title = item.title;
    this.cmsDraft.message = item.message;
    this.cmsDraft.route = item.route;
    this.cmsDraft.status = item.status;
    this.cmsDraft.startsAt = item.starts_at ? this.toLocalDateTime(item.starts_at) : '';
    this.cmsDraft.endsAt = item.ends_at ? this.toLocalDateTime(item.ends_at) : '';
    this.cmsFeedback.set(null);
  }

  resetCmsDraft(): void {
    this.cmsDraft.id = null;
    this.cmsDraft.title = '';
    this.cmsDraft.message = '';
    this.cmsDraft.route = '/offers';
    this.cmsDraft.status = 'draft';
    this.cmsDraft.startsAt = '';
    this.cmsDraft.endsAt = '';
    this.cmsFeedback.set(null);
  }

  async saveCmsContent(): Promise<void> {
    const title = this.cmsDraft.title.trim();
    const message = this.cmsDraft.message.trim();
    const route = this.cmsDraft.route.trim();
    if (title.length < 3 || title.length > 120 || message.length < 5 || message.length > 1000) {
      this.cmsFeedback.set('Title must be 3–120 characters and message 5–1,000 characters.');
      return;
    }
    if (!/^\/(?!\/)/.test(route) || route.includes('\\')) {
      this.cmsFeedback.set('Use a local app route beginning with one slash, such as /offers.');
      return;
    }
    const startsAt = this.cmsDraft.startsAt ? new Date(this.cmsDraft.startsAt) : null;
    const endsAt = this.cmsDraft.endsAt ? new Date(this.cmsDraft.endsAt) : null;
    if ((startsAt && !Number.isFinite(startsAt.getTime())) || (endsAt && !Number.isFinite(endsAt.getTime()))) {
      this.cmsFeedback.set('Enter valid publication dates.');
      return;
    }
    if (startsAt && endsAt && endsAt <= startsAt) {
      this.cmsFeedback.set('The end date must be after the start date.');
      return;
    }

    this.savingCms.set(true);
    this.cmsFeedback.set(null);
    this.errorMessage.set(null);
    try {
      const adminId = this.currentUser()?.id ?? null;
      const values = {
        title,
        message,
        route,
        status: this.cmsDraft.status,
        starts_at: startsAt?.toISOString() ?? null,
        ends_at: endsAt?.toISOString() ?? null,
        updated_by: adminId,
      };
      const result = this.cmsDraft.id
        ? await this.supabase.client.from('cms_content').update(values).eq('id', this.cmsDraft.id)
        : await this.supabase.client.from('cms_content').insert({ ...values, created_by: adminId });
      if (result.error) throw new Error(result.error.message);
      const successMessage = this.cmsDraft.id ? 'Content updated.' : 'Content created.';
      this.resetCmsDraft();
      this.cmsFeedback.set(successMessage);
      await this.loadCmsContent();
    } catch (error) {
      this.cmsFeedback.set(error instanceof Error ? error.message : 'Unable to save content.');
    } finally {
      this.savingCms.set(false);
    }
  }

  async changeCmsStatus(item: CmsContentItem, status: CmsStatus): Promise<void> {
    this.errorMessage.set(null);
    try {
      const { error } = await this.supabase.client
        .from('cms_content')
        .update({ status, updated_by: this.currentUser()?.id ?? null })
        .eq('id', item.id);
      if (error) throw new Error(error.message);
      await this.loadCmsContent();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to update content status.');
    }
  }

  private async loadSiteSettings(): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('site_settings')
      .select('setting_key,setting_value,is_public')
      .order('setting_key');
    if (error) throw new Error(error.message);
    const settings = (data ?? []) as SiteSetting[];
    this.siteSettings.set(settings);
    this.siteSettingsDraft.set(Object.fromEntries(settings.map((item) => [item.setting_key, item.setting_value])));
  }

  updateSiteSettingDraft(key: string, value: string): void {
    this.siteSettingsDraft.update((draft) => ({ ...draft, [key]: value }));
  }

  updateSiteSettingFromEvent(key: string, event: Event): void {
    const target = event.currentTarget;
    if (target instanceof HTMLInputElement) this.updateSiteSettingDraft(key, target.value);
  }

  async saveSiteSettings(): Promise<void> {
    const draft = this.siteSettingsDraft();
    const email = draft['support_email']?.trim() ?? '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.settingsFeedback.set('Enter a valid support email address.');
      return;
    }
    const phone = draft['support_phone']?.trim() ?? '';
    if (phone.length > 40) {
      this.settingsFeedback.set('Support phone must be 40 characters or fewer.');
      return;
    }

    this.savingSiteSettings.set(true);
    this.settingsFeedback.set(null);
    this.errorMessage.set(null);
    try {
      const updatedBy = this.currentUser()?.id ?? null;
      const rows = this.siteSettings().map((item) => ({
        setting_key: item.setting_key,
        setting_value: (draft[item.setting_key] ?? '').trim(),
        is_public: item.is_public,
        updated_by: updatedBy,
      }));
      const { error } = await this.supabase.client
        .from('site_settings')
        .upsert(rows, { onConflict: 'setting_key' });
      if (error) throw new Error(error.message);
      this.settingsFeedback.set('Settings saved.');
      await this.loadSiteSettings();
    } catch (error) {
      this.settingsFeedback.set(error instanceof Error ? error.message : 'Unable to save settings.');
    } finally {
      this.savingSiteSettings.set(false);
    }
  }

  private async loadAdminNotifications(): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('admin_notifications')
      .select('id,title,message,route,status,published_at,expires_at,created_at')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    this.adminNotifications.set((data ?? []) as AdminNotification[]);
  }

  editAdminNotification(item: AdminNotification): void {
    if (item.status !== 'draft') return;
    this.editingAdminNotificationId.set(item.id);
    this.notificationDraft.title = item.title;
    this.notificationDraft.message = item.message;
    this.notificationDraft.route = item.route;
    this.notificationDraft.expiresAt = item.expires_at ? this.toLocalDateTime(item.expires_at) : '';
    this.notificationFeedback.set(null);
  }

  resetAdminNotificationDraft(): void {
    this.editingAdminNotificationId.set(null);
    this.notificationDraft.title = '';
    this.notificationDraft.message = '';
    this.notificationDraft.route = '/notifications';
    this.notificationDraft.expiresAt = '';
  }

  async saveAdminNotification(): Promise<void> {
    const title = this.notificationDraft.title.trim();
    const message = this.notificationDraft.message.trim();
    const route = this.notificationDraft.route.trim();
    if (title.length < 3 || title.length > 120 || message.length < 5 || message.length > 1000) {
      this.notificationFeedback.set('Title must be 3–120 characters and message 5–1,000 characters.');
      return;
    }
    if (!/^\/(?!\/)/.test(route) || route.includes('\\')) {
      this.notificationFeedback.set('Use a local app route beginning with one slash, such as /offers.');
      return;
    }
    const expiresAt = this.notificationDraft.expiresAt ? new Date(this.notificationDraft.expiresAt) : null;
    if (expiresAt && (!Number.isFinite(expiresAt.getTime()) || expiresAt <= new Date())) {
      this.notificationFeedback.set('Choose an expiry date and time in the future.');
      return;
    }
    this.savingAdminNotification.set(true);
    this.notificationFeedback.set(null);
    this.errorMessage.set(null);
    try {
      const adminId = this.currentUser()?.id ?? null;
      const values = {
        title,
        message,
        route,
        status: 'draft' as const,
        expires_at: expiresAt?.toISOString() ?? null,
      };
      const editingId = this.editingAdminNotificationId();
      const result = editingId
        ? await this.supabase.client.from('admin_notifications').update(values).eq('id', editingId)
        : await this.supabase.client.from('admin_notifications').insert({ ...values, created_by: adminId });
      if (result.error) throw new Error(result.error.message);
      this.notificationFeedback.set(editingId ? 'Draft updated.' : 'Notification draft saved.');
      this.resetAdminNotificationDraft();
      await this.loadAdminNotifications();
    } catch (error) {
      this.notificationFeedback.set(error instanceof Error ? error.message : 'Unable to save notification.');
    } finally {
      this.savingAdminNotification.set(false);
    }
  }

  async changeAdminNotificationStatus(item: AdminNotification, status: CmsStatus): Promise<void> {
    this.errorMessage.set(null);
    try {
      const { error } = await this.supabase.client
        .from('admin_notifications')
        .update({
          status,
          published_at: status === 'published' ? new Date().toISOString() : item.published_at,
        })
        .eq('id', item.id);
      if (error) throw new Error(error.message);
      await this.loadAdminNotifications();
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to update notification status.');
    }
  }

  private async loadAuditLogs(): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('admin_audit_logs')
      .select('id,actor_email,action,resource_type,resource_id,changed_fields,created_at')
      .order('created_at', { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);
    this.auditLogs.set((data ?? []) as AdminAuditLog[]);
  }

  private toLocalDateTime(value: string): string {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return '';
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 16);
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
    const bookingStatus = this.bookingStatusFilter();
    const paymentStatus = this.paymentStatusFilter();
    return this.bookings().filter((booking) =>
      (bookingStatus === 'all' || booking.booking_status === bookingStatus)
      && (paymentStatus === 'all' || booking.payment_status === paymentStatus)
      && (!term || [booking.reference_number, booking.customer_name, booking.customer_email, booking.vehicle_name].some((value) => String(value ?? '').toLowerCase().includes(term))),
    );
  }

  filteredRecentBookings(): Booking[] {
    const filter = this.overviewBookingStatusFilter();
    return this.recentBookings().filter((booking) => filter === 'all' || booking.booking_status === filter);
  }

  filteredUsers(): AdminUser[] {
    const term = this.search().trim().toLowerCase();
    return this.users().filter((user) => !term || [
      user.full_name,
      user.email,
      user.phone,
    ].some((value) => String(value ?? '').toLowerCase().includes(term)))
      .filter((user) => this.userStatusFilter() === 'all'
        || (this.userStatusFilter() === 'active' && user.is_active !== false)
        || (this.userStatusFilter() === 'suspended' && user.is_active === false));
  }

  filteredTransactionSummaries(): UserTransactionSummary[] {
    const term = this.search().trim().toLowerCase();
    const filter = this.transactionFilter();
    return this.transactionSummaries().filter((summary) =>
      (filter === 'all'
        || (filter === 'wallet' && summary.transactions.length > 0)
        || (filter === 'bookings' && summary.bookings.length > 0)
        || (filter === 'balance' && summary.balance > 0))
      && (!term || [
      summary.user.full_name,
      summary.user.email,
      summary.user.phone,
      ...summary.transactions.map((transaction) => `${transaction.type ?? ''} ${transaction.description}`),
      ...summary.bookings.map((booking) => `${booking.reference_number} ${booking.vehicle_name}`),
      ].some((value) => String(value ?? '').toLowerCase().includes(term))),
    );
  }

  paymentProvider(method: string): string {
    return method === 'srpoints' ? 'SmartDrive Wallet' : 'PayMongo';
  }

  paymentMethod(method: string): string {
    return ({
      'credit-card': 'Credit / Debit Card',
      srpoints: 'SR Wallet',
      gcash: 'GCash',
      maya: 'Maya',
    } as Record<string, string>)[method] ?? method;
  }

  filteredVehicles(): Vehicle[] {
    const term = this.search().trim().toLowerCase();
    const filter = this.fleetFilter();
    return this.vehicles().filter((vehicle) =>
      (filter === 'all'
        || vehicle.main_category.toLowerCase() === filter
        || (filter === 'available' && vehicle.status === 'available')
        || (filter === 'archived' && vehicle.status === 'archived'))
      && (!term || [vehicle.name, vehicle.type, vehicle.vehicle_id, vehicle.plate_number]
        .some((value) => String(value ?? '').toLowerCase().includes(term))),
    );
  }

  filteredAvailability(): VehicleAvailability[] {
    const filter = this.availabilityFilter();
    return this.vehicleAvailability().filter((item) =>
      filter === 'all'
      || (filter === 'available' && item.availableUnits > 0)
      || (filter === 'using' && item.using.length > 0)
      || (filter === 'reserved' && item.reserved.length > 0)
      || (filter === 'pending' && item.pending.length > 0)
      || (filter === 'idle' && item.using.length + item.reserved.length + item.pending.length === 0),
    );
  }

  filteredReviews(): AdminReview[] {
    const filter = this.reviewRatingFilter();
    return this.reviews().filter((review) => filter === 'all' || review.rating === Number(filter));
  }

  filteredConversations(): SupportConversation[] {
    const filter = this.conversationStatusFilter();
    return this.supportConversations().filter((conversation) => filter === 'all' || conversation.status === filter);
  }

  filteredTickets(): SupportTicket[] {
    const filter = this.ticketStatusFilter();
    return this.supportTickets().filter((ticket) => filter === 'all' || ticket.status === filter);
  }

  filteredContactMessages(): ContactMessage[] {
    const filter = this.contactReadFilter();
    return this.contactMessages().filter((message) =>
      filter === 'all' || (filter === 'read' && message.is_read) || (filter === 'unread' && !message.is_read),
    );
  }

  filteredPromoCodes(): AdminPromo[] {
    const filter = this.promoStatusFilter();
    return this.promoCodes().filter((promo) =>
      filter === 'all' || (filter === 'active' && promo.is_active) || (filter === 'inactive' && !promo.is_active),
    );
  }

  async updateBookingStatus(booking: Booking, status: Booking['booking_status']): Promise<void> {
    if (!booking.id) return;
    if (booking.booking_status === 'cancelled') {
      this.errorMessage.set('Customers control booking cancellations. Cancelled bookings cannot be changed by admins.');
      return;
    }
    if (status !== 'completed' || booking.booking_status !== 'ongoing') {
      this.errorMessage.set('Bookings become in progress automatically on the pickup date. Admins can mark an in-progress booking completed only after confirming the vehicle was returned.');
      return;
    }
    if (booking.is_pwd_senior && booking.pwd_senior_cashback_status === 'pending_verification') {
      this.errorMessage.set('Verify or decline the PWD/Senior cashback claim at pickup before marking this booking returned.');
      return;
    }
    if (!window.confirm(`Confirm the vehicle for booking ${booking.reference_number} has been returned? This will mark the booking completed.`)) {
      return;
    }
    this.errorMessage.set(null);
    try {
      const { error } = await this.supabase.client.from('bookings').update({ booking_status: status }).eq('id', booking.id);
      if (error) throw new Error(error.message);
      this.bookings.update((items) => items.map((item) => item.id === booking.id ? { ...item, booking_status: status } : item));
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to update booking progress.');
    }
  }

  async reviewPwdSeniorCashback(booking: Booking, approve: boolean): Promise<void> {
    if (!booking.id || !booking.is_pwd_senior || booking.pwd_senior_cashback_status !== 'pending_verification') return;
    if (booking.booking_status !== 'ongoing' || booking.payment_status !== 'completed') {
      this.errorMessage.set('Cashback can be reviewed only after payment and vehicle pickup.');
      return;
    }
    if (approve && !this.pickupDocumentsComplete(booking)) {
      this.errorMessage.set('Confirm each required pickup document in the checklist before crediting cashback.');
      return;
    }
    const action = approve ? 'verify the original PWD/Senior ID and credit cashback' : 'decline this cashback claim';
    if (!window.confirm(`Confirm you have reviewed the original ID at pickup and want to ${action} for booking ${booking.reference_number}?`)) {
      return;
    }

    this.errorMessage.set(null);
    try {
      const { data, error } = await this.supabase.client.rpc('review_pwd_senior_cashback', {
        target_booking_id: booking.id,
        approve,
      });
      if (error) throw new Error(error.message);
      if (!data || typeof data !== 'object' || !('status' in data) || !('amount' in data)) {
        throw new Error('Cashback review returned an unexpected result.');
      }

      const result = data as { status: unknown; amount: unknown };
      const cashbackStatus = result.status;
      const cashbackAmount = result.amount;
      if (cashbackStatus !== 'credited' && cashbackStatus !== 'declined') {
        throw new Error('Cashback review returned an invalid status.');
      }
      if (typeof cashbackAmount !== 'number' || !Number.isFinite(cashbackAmount)) {
        throw new Error('Cashback review returned an invalid result.');
      }
      const updated: Booking = {
        ...booking,
        pwd_senior_cashback_status: cashbackStatus,
        pwd_senior_cashback_amount: cashbackAmount,
      };
      this.bookings.update((items) => items.map((item) => item.id === booking.id ? updated : item));
      this.recentBookings.update((items) => items.map((item) => item.id === booking.id ? updated : item));
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to review the cashback claim.');
    }
  }

  pickupDocumentsComplete(booking: Booking): boolean {
    return Boolean(
      booking.pickup_license_verified
      && booking.pickup_government_ids_verified
      && booking.pickup_proof_of_billing_verified
      && (!booking.is_pwd_senior || booking.pickup_pwd_senior_id_verified),
    );
  }

  async updatePickupDocument(
    booking: Booking,
    field: PickupDocumentField,
    event: Event,
  ): Promise<void> {
    if (!booking.id) return;
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    const verified = target.checked;
    const bookingId = booking.id;
    this.errorMessage.set(null);
    this.savingPickupDocuments.update((current) => new Set(current).add(bookingId));

    try {
      const updates: Partial<Pick<Booking, PickupDocumentField>> = { [field]: verified };
      const { error } = await this.supabase.client
        .from('bookings')
        .update(updates)
        .eq('id', bookingId);
      if (error) throw new Error(error.message);

      const updatedBooking = { ...booking, ...updates };
      this.bookings.update((items) => items.map((item) => item.id === bookingId ? updatedBooking : item));
      this.recentBookings.update((items) => items.map((item) => item.id === bookingId ? updatedBooking : item));
    } catch (error) {
      target.checked = Boolean(booking[field]);
      this.errorMessage.set(error instanceof Error ? error.message : 'Unable to save the pickup document check.');
    } finally {
      this.savingPickupDocuments.update((current) => {
        const next = new Set(current);
        next.delete(bookingId);
        return next;
      });
    }
  }

  printBookingReport(): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      this.errorMessage.set('The printable report was blocked by your browser. Allow pop-ups for this site and try again.');
      return;
    }
    this.errorMessage.set(null);

    const escapeHtml = (value: unknown): string => String(value ?? '').replace(/[&<>"']/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    })[character] ?? character);
    const formatDate = (value: string): string => {
      const date = new Date(`${value}T00:00:00`);
      return Number.isNaN(date.getTime())
        ? value
        : new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
    };
    const rows = this.filteredBookings().map((booking) => `
      <tr>
        <td>${escapeHtml(booking.reference_number)}</td>
        <td>${escapeHtml(booking.customer_name)}<br><small>${escapeHtml(booking.customer_email)}${booking.customer_phone ? `<br>${escapeHtml(booking.customer_phone)}` : ''}</small></td>
        <td>${escapeHtml(booking.vehicle_name)}<br><small>${escapeHtml(booking.pickup_location || 'Pickup location not provided')}</small></td>
        <td>${escapeHtml(formatDate(booking.pickup_date))} – ${escapeHtml(formatDate(booking.return_date))}<br><small>${escapeHtml(booking.rental_days)} days</small></td>
        <td>${escapeHtml(booking.payment_method)}<br><small>${escapeHtml(booking.payment_status)}</small></td>
        <td>${escapeHtml(booking.booking_status)}</td>
        <td class="amount">₱${escapeHtml(Number(booking.total_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}</td>
      </tr>`).join('');

    printWindow.document.write(`<!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>SmartDrive booking report</title>
          <style>
            body { margin: 2rem; color: #1d2433; font: 13px Arial, sans-serif; }
            h1 { margin: 0 0 .3rem; font-size: 24px; }
            p { margin: .2rem 0 1.2rem; color: #5b6472; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 9px 7px; border: 1px solid #d8dce4; text-align: left; vertical-align: top; }
            th { background: #f1eef9; }
            small { color: #596273; }
            .amount { text-align: right; white-space: nowrap; }
            @media print { body { margin: 10mm; } tr { break-inside: avoid; } }
          </style>
        </head>
        <body>
          <h1>SmartDrive booking report</h1>
          <p>${this.filteredBookings().length} booking(s) · Generated ${escapeHtml(new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date()))}</p>
          <table>
            <thead><tr><th>Reference</th><th>Customer</th><th>Vehicle / pickup</th><th>Rental dates</th><th>Payment</th><th>Booking status</th><th>Total</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="7">No bookings match the current search.</td></tr>'}</tbody>
          </table>
        </body>
      </html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
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
    const vehicle = {
      ...this.newVehicle,
      vehicle_id: this.newVehicle.vehicle_id.trim().toUpperCase(),
      plate_number: this.newVehicle.plate_number.trim().toUpperCase(),
      fleet_quantity: Number(this.newVehicle.fleet_quantity),
      name: this.newVehicle.name.trim(),
      type: this.newVehicle.type.trim(),
      main_category: this.newVehicle.main_category.trim(),
    };
    if (!vehicle.vehicle_id || !vehicle.plate_number || !vehicle.name || !vehicle.type || !vehicle.main_category || !Number.isFinite(vehicle.price) || vehicle.price <= 0 || !Number.isInteger(vehicle.fleet_quantity) || vehicle.fleet_quantity < 1) {
      this.errorMessage.set('Enter a unique vehicle ID and plate number, name, type, category, a positive daily rate, and a quantity of at least 1.');
      return;
    }
    this.errorMessage.set(null);
    const { data, error } = await this.supabase.client.from('vehicles').insert([vehicle]).select().single();
    if (error) {
      this.errorMessage.set(error.message.includes('vehicles_vehicle_id_key') || error.message.includes('vehicles_plate_number_uidx')
        ? 'That vehicle ID or plate number is already in the fleet. Each physical vehicle needs its own unique values.'
        : `Could not add this vehicle: ${error.message}`);
      return;
    }
    this.vehicles.update((items) => [data, ...items]);
    Object.assign(this.newVehicle, {
      vehicle_id: '',
      plate_number: '',
      fleet_quantity: 1,
      name: '',
      type: '',
      main_category: 'Cars',
      price: 0,
      image: '',
      status: 'available',
    });
  }

  openVehicleEditor(vehicle: Vehicle): void {
    this.vehicleEditError.set(null);
    this.editingVehicle.set({
      id: vehicle.id,
      plate_number: vehicle.plate_number ?? '',
      fleet_quantity: Number(vehicle.fleet_quantity ?? 1),
      name: vehicle.name,
      type: vehicle.type,
      main_category: vehicle.main_category,
      price: vehicle.price,
      image: vehicle.image ?? '',
      description: vehicle.description ?? '',
      features: (vehicle.features ?? []).join('\n'),
      transmission: vehicle.transmission,
      fuel: vehicle.fuel,
      seats: vehicle.seats,
      is_featured: vehicle.is_featured,
    });
  }

  closeVehicleEditor(): void {
    if (this.savingVehicleEdit()) return;
    this.editingVehicle.set(null);
    this.vehicleEditError.set(null);
  }

  async saveVehicleEdits(): Promise<void> {
    const draft = this.editingVehicle();
    if (!draft || this.savingVehicleEdit()) return;

    const name = draft.name.trim();
    const plateNumber = draft.plate_number.trim().toUpperCase();
    const type = draft.type.trim();
    const mainCategory = draft.main_category.trim();
    const price = Number(draft.price);
    const seats = Number(draft.seats);
    const fleetQuantity = Number(draft.fleet_quantity);
    if (!name || !type || !mainCategory || !Number.isFinite(price) || price <= 0 || !Number.isInteger(seats) || seats < 1 || !Number.isInteger(fleetQuantity) || fleetQuantity < 1) {
      this.vehicleEditError.set('Enter a name, type, category, positive daily rate, seat capacity of at least 1, and fleet quantity of at least 1.');
      return;
    }

    this.savingVehicleEdit.set(true);
    this.vehicleEditError.set(null);
    try {
      const updates = {
        plate_number: plateNumber || null,
        fleet_quantity: fleetQuantity,
        name,
        type,
        main_category: mainCategory,
        price,
        image: draft.image.trim() || null,
        description: draft.description.trim() || null,
        features: draft.features.split(/\r?\n/).map((feature) => feature.trim()).filter(Boolean),
        transmission: draft.transmission.trim(),
        fuel: draft.fuel.trim(),
        seats,
        is_featured: draft.is_featured,
      };
      const { data, error } = await this.supabase.client
        .from('vehicles')
        .update(updates)
        .eq('id', draft.id)
        .select()
        .single();
      if (error) {
        throw new Error(error.message.includes('vehicles_plate_number_uidx')
          ? 'That plate number is already assigned to another vehicle.'
          : error.message);
      }
      if (!data) throw new Error('The updated vehicle was not returned by the database.');
      const savedVehicle = data as Vehicle;
      this.vehicles.update((items) => items.map((vehicle) => vehicle.id === savedVehicle.id ? savedVehicle : vehicle));
      this.editingVehicle.set(null);
    } catch (error) {
      this.vehicleEditError.set(error instanceof Error ? error.message : 'Unable to save vehicle details.');
    } finally {
      this.savingVehicleEdit.set(false);
    }
  }

  async archiveVehicle(vehicle: Vehicle): Promise<void> {
    const { error } = await this.supabase.client.from('vehicles').update({ status: vehicle.status === 'archived' ? 'available' : 'archived' }).eq('id', vehicle.id);
    if (error) throw new Error(error.message);
    this.vehicles.update((items) => items.map((item) => item.id === vehicle.id ? { ...item, status: vehicle.status === 'archived' ? 'available' : 'archived' } : item));
  }

  async deleteVehicle(vehicle: Vehicle): Promise<void> {
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

  sectionTitle(): string {
    const titles: Partial<Record<AdminSection, string>> = {
      overview: `Good to see you, ${this.currentUser()?.fullName || 'Admin'}`,
      fleet: 'Fleet management',
      tracking: 'Vehicle tracking',
      transactions: 'User transactions',
      reviews: 'Reviews & ratings',
      support: 'Support inbox',
      'email-concerns': 'Email concerns',
      reports: 'Business reports',
      promos: 'Promo codes',
      cms: 'Content management',
      settings: 'Settings & configuration',
      notifications: 'Notification management',
      audit: 'Audit trail',
    };
    return titles[this.section()] ?? this.section().replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  sectionDescription(): string {
    const descriptions: Partial<Record<AdminSection, string>> = {
      overview: "Here's what's happening across your rental business today.",
      bookings: 'Review reservations and keep every trip moving smoothly.',
      users: 'Manage your customer accounts and membership details.',
      fleet: 'Keep your vehicles, rates, and availability up to date.',
      transactions: 'Review wallet balances, bookings, and transaction history.',
      reviews: 'See what customers are saying about their experience.',
      tracking: 'View the latest reported and sample vehicle locations.',
      support: 'Review saved conversations, reported problems, and internal follow-up notes.',
      'email-concerns': 'Read and manage messages sent to the support team.',
      reports: 'Review operational performance, booking volume, and business health trends.',
      promos: 'Create and manage discount codes available at checkout.',
      cms: 'Create and schedule customer-facing content in the app notification feed.',
      settings: 'Configure public contact information displayed to customers.',
      notifications: 'Draft and publish in-app announcements for all customers.',
      audit: 'Review administrator changes and the fields affected.',
    };
    return descriptions[this.section()] ?? 'Manage SmartDrive operations.';
  }

  async loadDashboard(event?: CustomEvent): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      const [bookingsResult, usersResult, vehiclesResult] = await Promise.all([
        this.supabase.client.from('bookings').select(BOOKING_SELECT_FIELDS).order('created_at', { ascending: false }),
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
