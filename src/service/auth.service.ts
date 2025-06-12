import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import {  switchMap } from 'rxjs/operators';
import { CartService } from './cartService/cart.service';
import { environment } from '../environment/environment';
// Use require instead of import for jwt-decode
// import jwtDecode from '';
import {jwtDecode} from 'jwt-decode'


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
  // public loggedIn$ = this.loggedInSubject.asObservable();
  constructor(private http: HttpClient, private router: Router, private cartService:CartService) {}
private userProfile: any = null; // store profile

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
  return this.http.post<LoginResponse>(`${this.apiUrl}/user/login`, { email, password }).pipe(
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
    this.clearToken();
    this.cartService.clearCart();
    localStorage.removeItem(this.tokenKey)
    this.loggedInSubject.next(false);
    this.router.navigate(['']);
  }
  islogout(){
    return this.logout()
  }
 


  getToken(): string | null {
    return localStorage.getItem(this.tokenKey) ;
  }

  isNotLoggedIN(): boolean{
   if(this.getToken())
   {
    return false
   }
   return true
  }

  getRefreshtoken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }
  
  setToken(token: string) {
    localStorage.setItem(this.tokenKey, token);
  }

  clearToken() {
    localStorage.removeItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return this.hasValidToken();
  }
 

  // Decode token and check expiry
  private hasValidToken(): boolean {
    let token = this.getToken();
    if (!token) return false;

    try { 
      let decoded: any = jwtDecode(token);
      let exp = decoded.exp;
      if (!exp) return false;
      let expiryTime = exp * 1000;
      return Date.now() < expiryTime
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

private refreshtoken():boolean{
  let token=this.getToken();
  if (!token) return false;

  if(!this.hasValidToken() || !token)
  {
  this.http.get(`${this.apiUrl}/refresh-token`).subscribe((res:any)=>{
      token =res
  })
}
 let decoded: any = jwtDecode(token);
  let exp = decoded.exp;
  let expiryTime = exp * 1000;   

 return Date.now() < expiryTime

}
 isLogged(): boolean {
    return this.refreshtoken();
  }

}
