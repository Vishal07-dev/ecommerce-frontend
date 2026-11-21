import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment/environment';

export interface Address {
  _id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface Account {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'owner' | 'admin' | 'staff' | 'user';
  createdAt: string;
  addresses: Address[];
}

/** price = line amount charged (unit × qty); unitPrice = one piece. */
export interface OrderItem { name: string; quantity: number; price: number; unitPrice: number; size?: string; image?: string; productId?: string; }
export interface AccountOrder {
  _id: string;
  ref: string;
  createdAt: string;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  status: 'paid' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[];
}

export type AddressInput = Omit<Address, '_id'>;

/** Error shape from /api/user/me routes: a message and, often, the field it belongs to. */
export interface FieldError { message: string; field?: string; }

export function readError(err: unknown, fallback: string): FieldError {
  const body = (err as { error?: FieldError; status?: number })?.error;
  if (body?.message) return { message: body.message, field: body.field };
  const status = (err as { status?: number })?.status;
  return { message: status === 0 ? 'We couldn’t reach the shop. Check your connection and try again.' : fallback };
}

/** The signed-in shopper's own account. */
@Injectable({ providedIn: 'root' })
export class AccountService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/user/me`;

  me(): Observable<Account> { return this.http.get<Account>(this.api); }
  update(changes: Partial<Pick<Account, 'name' | 'email' | 'phone'>> & { currentPassword?: string }): Observable<Account> {
    return this.http.patch<Account>(this.api, changes);
  }
  changePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.api}/password`, { currentPassword, newPassword });
  }
  orders(): Observable<AccountOrder[]> { return this.http.get<AccountOrder[]>(`${this.api}/orders`); }
  addAddress(a: AddressInput): Observable<Account> { return this.http.post<Account>(`${this.api}/addresses`, a); }
  updateAddress(id: string, a: AddressInput): Observable<Account> { return this.http.patch<Account>(`${this.api}/addresses/${id}`, a); }
  removeAddress(id: string): Observable<Account> { return this.http.delete<Account>(`${this.api}/addresses/${id}`); }
  receipt(orderId: string): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/receipet/download-receipt/${orderId}`, { responseType: 'blob' });
  }
}
