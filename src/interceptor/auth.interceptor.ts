// auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../service/auth.service';
import { HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Guard Clause: If the request is for the refresh-token endpoint,
  // or if there's no token at all, pass it through without changes.
  if (!token || req.url.includes('refresh-token')) {
    return next(req);
  }

  // --- NEW PROACTIVE REFRESH LOGIC ---
  // If the token is present but considered invalid by our service, refresh it first.
  if (!authService.isLoggedIn()) {
    console.log('Proactive Refresh: Token invalid, refreshing before request.');

    // This is the refresh logic, triggered BEFORE sending the original request.
    return authService.refreshAccessToken().pipe(
      switchMap(() => {
        const newToken = authService.getToken();
        if (newToken) {
          // If refresh succeeds, clone the original request with the new token.
          const newReq = req.clone({
            setHeaders: { Authorization: `Bearer ${newToken}` },
            withCredentials: true,
          });
          return next(newReq);
        }
        // If refresh fails, logout and throw an error.
        authService.logout();
        return throwError(() => new Error('Proactive refresh token failed'));
      }),
      catchError(err => {
        // If the refresh call itself errors out, logout and propagate the error.
        authService.logout();
        return throwError(() => err);
      })
    );
  }
  // --- END OF NEW LOGIC ---

  // --- EXISTING LOGIC (If token is considered valid) ---
  // The token is valid, so we proceed with the original request.
  // We will still handle a 401 error in case the server invalidated the token.
  else {
    console.log('Token seems valid, sending request.');
    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    });

    // This is your original code, which handles the reactive refresh on 401.
    return next(authReq).pipe(
      catchError((error) => {
        // The URL check is now redundant because of the guard clause at the top,
        // but we'll leave it for consistency with your original code.
        if (error.status === 401 && !req.url.includes('refresh-token')) {
          console.log('Reactive Refresh: Received 401, refreshing token.');

          return authService.refreshAccessToken().pipe(
            switchMap(() => {
              const newToken = authService.getToken();
              if (newToken) {
                const newReq = req.clone({
                  setHeaders: { Authorization: `Bearer ${newToken}` },
                  withCredentials: true,
                });
                return next(newReq);
              }
              authService.logout();
              return throwError(() => new Error('Reactive refresh token failed'));
            }),
            catchError(err => {
              authService.logout();
              return throwError(() => err);
            })
          );
        }

        return throwError(() => error);
      })
    );
  }
};