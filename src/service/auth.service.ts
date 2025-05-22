import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError, timer } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

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
  private apiUrl = 'http://localhost:2000/api/user'; // your backend URL
  private tokenKey = 'accessToken';
  private refreshInProgress = false;
  private loggedInSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  public loggedIn$ = this.loggedInSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}
private userProfile: any = null; // store profile

  login(email: string, password: string): Observable<any> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      switchMap(res => {
        this.setToken(res.accessToken);
        this.loggedInSubject.next(true);
        console.log(res);
      this.userProfile = res; 
        // Redirect based on role
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
  }

  register(name: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, { name, email, password });
  }

  getprofile(){ 
    return this.http.get(`${this.apiUrl}/profile`)
  }

  logout() {
    this.clearToken();
    this.loggedInSubject.next(false);
    this.router.navigate(['/login']);
  }
  islogout(){
    return this.logout()
  }
 

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey) ;
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
  return this.http.put(`${this.apiUrl}/update/${data._id}`,data)
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
