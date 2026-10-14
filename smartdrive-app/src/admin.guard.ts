import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './app/core/services/auth.service';

export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.refreshSession();
  if (auth.currentUser()?.isAdmin) return true;
  if (auth.currentUser()) await auth.logout();
  return router.createUrlTree(['/login']);
};
