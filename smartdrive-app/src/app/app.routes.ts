import { Routes } from '@angular/router';
import {
  authGuard,
  bookingConfirmationGuard,
  customerGuard,
  guestGuard,
} from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'tabs/home', pathMatch: 'full' },
  {
    path: 'legal/terms',
    data: { document: 'terms' },
    loadComponent: () => import('./pages/legal/legal.page').then((m) => m.LegalPage),
  },
  {
    path: 'legal/privacy',
    data: { document: 'privacy' },
    loadComponent: () => import('./pages/legal/legal.page').then((m) => m.LegalPage),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/auth/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'signup',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/auth/signup/signup.page').then((m) => m.SignupPage),
  },
  {
    path: 'forgot-password',
    canActivate: [customerGuard],
    loadComponent: () =>
      import('./pages/auth/forgot-password/forgot-password.page').then((m) => m.ForgotPasswordPage),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./pages/auth/reset-password/reset-password.page').then((m) => m.ResetPasswordPage),
  },
  {
    path: 'services',
    canActivate: [customerGuard],
    loadComponent: () => import('./pages/services/services.page').then((m) => m.ServicesPage),
  },
  {
    path: 'trip-planner',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/trip-planner/trip-planner.page').then((m) => m.TripPlannerPage),
  },
  {
    path: 'offers',
    canActivate: [customerGuard],
    loadComponent: () => import('./pages/offers/offers.page').then((m) => m.OffersPage),
  },
  {
    path: 'notifications',
    canActivate: [customerGuard],
    loadComponent: () => import('./pages/notifications/notifications.page').then((m) => m.NotificationsPage),
  },
  {
    path: 'tabs',
    canActivate: [customerGuard],
    loadComponent: () => import('./pages/tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        loadComponent: () => import('./pages/tabs/home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'dashboard',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/tabs/dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'rent-a-car',
        loadComponent: () => import('./pages/tabs/landing/landing.page').then((m) => m.LandingPage),
      },
      {
        path: 'favorites',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/tabs/favorites/favorites.page').then((m) => m.FavoritesPage),
      },
      {
        path: 'about',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/about/about.page').then((m) => m.AboutPage),
      },
      {
        path: 'bookings',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/tabs/bookings/bookings.page').then((m) => m.BookingsPage),
      },
      {
        path: 'wallet',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/tabs/wallet/wallet.page').then((m) => m.WalletPage),
      },
      {
        path: 'account',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/tabs/account/account.page').then((m) => m.AccountPage),
      },
    ],
  },
  {
    path: 'vehicle/:id',
    canActivate: [customerGuard],
    loadComponent: () => import('./pages/vehicle-detail/vehicle-detail.page').then((m) => m.VehicleDetailPage),
  },
  {
    path: 'booking/:vehicleId/dates',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/booking/dates/booking-dates.page').then((m) => m.BookingDatesPage),
  },
  {
    path: 'booking/:vehicleId/details',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/booking/details/booking-details.page').then((m) => m.BookingDetailsPage),
  },
  {
    path: 'booking/:vehicleId/payment',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/booking/payment/booking-payment.page').then((m) => m.BookingPaymentPage),
  },
  {
    path: 'booking/confirmation/:reference',
    canActivate: [bookingConfirmationGuard],
    loadComponent: () =>
      import('./pages/booking/confirmation/booking-confirmation.page').then((m) => m.BookingConfirmationPage),
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/settings/settings.page').then((m) => m.SettingsPage),
  },
  {
    path: 'reviews',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/reviews/reviews.page').then((m) => m.ReviewsPage),
  },
  {
    path: 'faq',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/faq/faq.page').then((m) => m.FaqPage),
  },
  {
    path: 'about',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/about/about.page').then((m) => m.AboutPage),
  },
  { path: '**', redirectTo: 'tabs/home' },
];
