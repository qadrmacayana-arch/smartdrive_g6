import { Routes } from '@angular/router';
import { adminGuard } from './admin.guard';

export const adminRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'admin' },
  {
    path: 'login',
    loadComponent: () => import('./app/pages/admin-login/admin-login.page').then((m) => m.AdminLoginPage),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./app/pages/admin/admin.page').then((m) => m.AdminPage),
  },
  { path: '**', redirectTo: 'admin' },
];
