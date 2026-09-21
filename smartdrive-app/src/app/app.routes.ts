import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'tabs/home', pathMatch: 'full' },
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
    loadComponent: () =>
      import('./pages/auth/forgot-password/forgot-password.page').then((m) => m.ForgotPasswordPage),
  },
  {
    path: 'tabs',
    loadComponent: () => import('./pages/tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        loadComponent: () => import('./pages/tabs/home/home.page').then((m) => m.HomePage),
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
    canActivate: [authGuard],
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
    loadComponent: () => import('./pages/reviews/reviews.page').then((m) => m.ReviewsPage),
  },
  {
    path: 'faq',
    loadComponent: () => import('./pages/faq/faq.page').then((m) => m.FaqPage),
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about.page').then((m) => m.AboutPage),
  },
  { path: '**', redirectTo: 'tabs/home' },
];
