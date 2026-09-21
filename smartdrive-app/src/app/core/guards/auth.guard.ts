import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

async function waitForInit(auth: AuthService): Promise<void> {
  if (auth.initialized()) return;
  await new Promise<void>((resolve) => {
    const check = () => {
      if (auth.initialized()) {
        resolve();
      } else {
        setTimeout(check, 30);
      }
    };
    check();
  });
}

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await waitForInit(auth);

  if (auth.currentUser()) return true;
  return router.createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await waitForInit(auth);

  if (!auth.currentUser()) return true;
  return router.createUrlTree(['/tabs/home']);
};
