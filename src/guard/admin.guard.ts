import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../service/auth.service';

/** Roles that can open KŌRA Studio. The server re-checks every request. */
export const STUDIO_ROLES = ['owner', 'admin', 'staff'];
export type StudioRole = 'owner' | 'admin' | 'staff';

/** Studio entry: any team member. */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (auth.isLoggedIn() && STUDIO_ROLES.includes(auth.getUserRole() ?? '')) return true;
  return inject(Router).createUrlTree(['/']);
};

/** A Studio page limited to some roles; others go back to the overview. */
export const roleGuard = (...roles: StudioRole[]): CanActivateFn => () => {
  const role = inject(AuthService).getUserRole() as StudioRole | null;
  return role && roles.includes(role) ? true : inject(Router).createUrlTree(['/admin/dashboard']);
};
