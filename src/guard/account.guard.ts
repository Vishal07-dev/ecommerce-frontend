import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../service/auth.service';

export const ACCOUNT_RETURN_KEY = 'kora.account-return';

/** Account pages need a signed-in shopper; others go to sign in and come back. */
export const accountGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  if (!auth.isNotLoggedIN()) return true;
  try { sessionStorage.setItem(ACCOUNT_RETURN_KEY, state.url); } catch { /* storage unavailable */ }
  return inject(Router).createUrlTree(['/login']);
};
