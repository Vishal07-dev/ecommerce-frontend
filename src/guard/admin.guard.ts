import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../service/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
 const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn() && auth.getUserRole()=='admin') {
    return true;
  } else {
    router.navigate(['']);
    return false;
  }
};
