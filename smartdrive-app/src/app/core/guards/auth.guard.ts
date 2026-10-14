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

async function restoreSessionIfNeeded(auth: AuthService): Promise<void> {
  if (!auth.currentUser()) await auth.refreshSession();
}

export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await waitForInit(auth);
  await restoreSessionIfNeeded(auth);

  if (auth.currentUser()?.isAdmin) {
    await auth.logout();
    return router.createUrlTree(['/login']);
  }
  if (auth.needsGoogleProfileCompletion()) {
    return router.createUrlTree(['/signup'], { queryParams: { googleRegistration: '1' } });
  }
  if (auth.currentUser()) return true;
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

export const customerGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await waitForInit(auth);
  await restoreSessionIfNeeded(auth);

  if (auth.currentUser()?.isAdmin) {
    await auth.logout();
    return router.createUrlTree(['/login']);
  }
  if (auth.needsGoogleProfileCompletion()) {
    return router.createUrlTree(['/signup'], { queryParams: { googleRegistration: '1' } });
  }
  return true;
};

export const guestGuard: CanActivateFn = async (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await waitForInit(auth);
  await restoreSessionIfNeeded(auth);

  if (auth.currentUser()?.isAdmin) await auth.logout();
  if (
    route.routeConfig?.path === 'signup'
    && route.queryParamMap.get('googleRegistration') === '1'
    && auth.currentUser()?.isGoogleAccount
  ) {
    return true;
  }
  if (!auth.currentUser()) return true;
  const returnUrl = route.queryParamMap.get('returnUrl');
  if (returnUrl?.startsWith('/') && !returnUrl.startsWith('//')) {
    return router.parseUrl(returnUrl);
  }
  return router.createUrlTree(['/tabs/home']);
};

export const bookingConfirmationGuard: CanActivateFn = async (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await waitForInit(auth);

  if (route.queryParamMap.get('attempt')) {
    try {
      await restoreSessionIfNeeded(auth);
    } catch (error) {
      console.error('Unable to restore the customer session after payment return.', error);
    }
    return true;
  }

  await restoreSessionIfNeeded(auth);

  if (auth.currentUser()?.isAdmin) {
    await auth.logout();
    return router.createUrlTree(['/login']);
  }
  if (auth.needsGoogleProfileCompletion()) {
    return router.createUrlTree(['/signup'], { queryParams: { googleRegistration: '1' } });
  }
  if (auth.currentUser()) return true;
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: `/booking/confirmation/${route.paramMap.get('reference')}` },
  });
};
