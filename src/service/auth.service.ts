// src/app/service/auth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { CartService } from './cartService/cart.service';
import { environment } from '../environment/environment';
import { jwtDecode } from 'jwt-decode';

interface LoginResponse {
  accessToken: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl; // your backend URL
  private tokenKey = 'accessToken';
  private refreshInProgress = false;
  private loggedInSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  public loggedIn$ = this.loggedInSubject.asObservable(); // It's good practice to expose this

  constructor(private http: HttpClient, private router: Router, private cartService: CartService) { }

  private userProfile: any = null;

  // No changes needed to login, register, getprofile, etc.
  // ... (keep your existing login, register, etc. methods as they are)
  login(email: string, password: string): Observable<any> {
    let guestCart: any[] = [];
    try {
      const productRaw = localStorage.getItem('Product');
      if (productRaw) {
        guestCart = JSON.parse(productRaw);
      }
    } catch (error) {
      console.error('Error parsing guest cart from localStorage:', error);
      guestCart = [];
    }
  
    // Proceed with login only after guestCart is ready
    return this.http.post<LoginResponse>(`${this.apiUrl}/user/login`, { email, password },{ withCredentials: true } ).pipe(
      switchMap(res => {
        this.setToken(res.accessToken);
        const decoded: any = jwtDecode(res.accessToken);
  
        // Now safely merge cart after login
        if (guestCart.length > 0) {
          return this.cartService.mergeGuestCartWithUser(guestCart, decoded.id).pipe(
            switchMap(() => {
              this.loggedInSubject.next(true);
              this.userProfile = res;
  
              // Redirect by role
              const role = this.getUserRole();
              if (role === 'user') {
                this.router.navigate(['/']);
              } else if (role === 'admin') {
                this.router.navigate(['/admin']);
              }
  
              return new Observable(observer => {
                observer.next(res);
                observer.complete();
              });
            })
          );
        } else {
          this.loggedInSubject.next(true);
          this.userProfile = res;
  
          // Redirect by role
          const role = this.getUserRole();
          if (role === 'user') {
            this.router.navigate(['/']);
          } else if (role === 'admin') {
            this.router.navigate(['/admin']);
          }
  
          return new Observable(observer => {
            observer.next(res);
            observer.complete();
          });
        }
      })
    );
  }
  
  
    register(name: string, email: string, password: string): Observable<any> {
      return this.http.post(`${this.apiUrl}/user/create`, { name, email, password });
    }
  
    getprofile(){ 
      return this.http.get(`${this.apiUrl}/user/profile`)
    }
  
    logout() {
      // Clear the token from localStorage
      localStorage.removeItem(this.tokenKey);
      this.cartService.clearCart();
      this.loggedInSubject.next(false);
      this.userProfile = null; // Clear user profile on logout
      this.router.navigate(['']);
    }

    getToken(): string | null {
      return localStorage.getItem(this.tokenKey);
    }
  
    isNotLoggedIN(): boolean {
     return !this.getToken();
    }
  
    setToken(token: string) {
      localStorage.setItem(this.tokenKey, token);
    }
  
    // The original clearToken was empty, this is handled in logout now
    clearToken() {
      localStorage.removeItem(this.tokenKey);
    }
  
    isLoggedIn(): boolean {
      return this.hasValidToken();
    }
   
    private hasValidToken(): boolean {
      const token = this.getToken();
      if (!token) return false;
  
      try {
        const decoded: any = jwtDecode(token);
        const exp = decoded.exp;
        if (!exp) return false;
        const expiryTime = exp * 1000;
        return Date.now() < expiryTime;
      }
      catch {
        return false;
      }
    }
  
    getUserRole(): string | null {
      const token = this.getToken();
      if (!token) return null;
      try {
        const decoded: any = jwtDecode(token);
        return decoded.role;
      } catch {
        return null;
      }
    }

  updateuser(data:any){
    return this.http.put(`${this.apiUrl}/user/update/${data._id}`,data)
  }


  refreshAccessToken(): Observable<any> {
    if (this.refreshInProgress) {
      
      return new Observable(observer => {
        observer.complete();
      });
    }

    this.refreshInProgress = true;

  
    return this.http.post<{ accessToken: string }>(`${this.apiUrl}/user/refresh-token`, {}, { withCredentials: true })
      .pipe(
        tap((res) => {
          this.refreshInProgress = false; // Reset flag on success
          if (res.accessToken) {
            this.setToken(res.accessToken);
            this.loggedInSubject.next(true);
          } else {
            // This case should ideally not happen if the API is consistent
            this.logout();
          }
        }),
        catchError((err) => {
          this.refreshInProgress = false; // Reset flag on error
          this.logout(); // If refresh fails, the user must be logged out
          return throwError(() => err);
        })
      );
  }

}