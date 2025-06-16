// auth.interceptor.ts

import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../front-end/src/service/auth.service'; // Adjust path if necessary

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);
  private isRefreshing = false; // Add a local flag to handle token refresh

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();

    // Clone the request and add the token if available
    let authReq = req;
    if (token) {
      authReq = this.addTokenHeader(req, token);
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Only handle 401 errors and ensure it's not a failed refresh token request
        if (error.status === 401 && !authReq.url.includes('refresh-token')) {
          return this.handle401Error(authReq, next);
        }

        // For all other errors, just re-throw
        return throwError(() => error);
      })
    );
  }

 private handle401Error(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
  return this.authService.refreshAccessToken().pipe(
    switchMap(() => {
      const newToken = this.authService.getToken();
      console.log(newToken, 'new token from interceptor');
      
      if (newToken) {
        // Retry the original request with the new token
        const clonedRequest = this.addTokenHeader(req, newToken);
        return next.handle(clonedRequest);
      } else {
        this.authService.logout();
        return throwError(() => new Error('Failed to get new token after refresh'));
      }
    }),
    catchError(refreshError => {
      this.authService.logout();
      return throwError(() => refreshError);
    })
  );
}

  // Helper function to avoid code duplication
  private addTokenHeader(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
      // Keep withCredentials for the cookie-based refresh token
      withCredentials: true,
    });
  }
}