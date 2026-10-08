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

  if (auth.currentUser()?.isAdmin) return router.createUrlTree(['/admin']);
  if (auth.needsGoogleProfileCompletion()) {
    return router.createUrlTree(['/signup'], { queryParams: { googleRegistration: '1' } });
  }
  if (auth.currentUser()) return true;
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: router.url } });
};

export const customerGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await waitForInit(auth);

  if (auth.currentUser()?.isAdmin) return router.createUrlTree(['/admin']);
  if (auth.needsGoogleProfileCompletion()) {
    return router.createUrlTree(['/signup'], { queryParams: { googleRegistration: '1' } });
  }
  return true;
};

export const guestGuard: CanActivateFn = async (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await waitForInit(auth);

  if (auth.currentUser()?.isAdmin) return router.createUrlTree(['/admin']);
  if (
    route.routeConfig?.path === 'signup'
    && route.queryParamMap.get('googleRegistration') === '1'
    && auth.currentUser()?.isGoogleAccount
  ) {
    return true;
  }
  if (!auth.currentUser()) return true;
  return router.createUrlTree(['/tabs/home']);
};

export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await waitForInit(auth);

  if (auth.currentUser()?.isAdmin) return true;
  return router.createUrlTree(['/login']);
};
