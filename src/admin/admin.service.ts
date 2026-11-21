import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment/environment';
import { AuthService } from '../service/auth.service';

export type TeamRole = 'owner' | 'admin' | 'staff';
export const ROLE_LABEL: Record<TeamRole, string> = { owner: 'Owner', admin: 'Admin', staff: 'Staff' };
export const ROLE_HELP: Record<TeamRole, string> = {
  owner: 'Everything, including adding and removing team members.',
  admin: 'Runs the store: products, orders, customers and categories.',
  staff: 'Handles orders: sees the overview and updates order status.',
};
export interface TeamMember { _id: string; name: string; email: string; role: TeamRole; since: string; createdAt: string; }
export interface TeamInvite { _id: string; role: TeamRole; note: string; expiresAt: string; createdAt: string; createdBy: string; link?: string; }
export interface TeamActivity { _id: string; action: string; actorName?: string; targetName?: string; role?: string; previousRole?: string; createdAt: string; }
export interface Team { me: string; members: TeamMember[]; invites: TeamInvite[]; activity: TeamActivity[]; }

export type Placement = 'hero' | 'featured' | 'shop' | 'archived';
export type OrderStatus = 'paid' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
export const ORDER_STATUSES: OrderStatus[] = ['paid', 'packed', 'shipped', 'delivered', 'cancelled'];
export const STATUS_LABEL: Record<OrderStatus, string> = {
  paid: 'Paid', packed: 'Packed', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled',
};
export const PLACEMENT_LABEL: Record<Placement, string> = {
  hero: 'Home hero', featured: 'Featured', shop: 'Shop only', archived: 'Archived',
};

export interface Kpi { value: number; previous: number; }
export interface Overview {
  days: number;
  updatedAt: string;
  kpis: { revenue: Kpi; orders: Kpi; aov: Kpi; customers: Kpi };
  daily: { date: string; revenue: number; orders: number }[];
  topProducts: { id: string; name: string; units: number; revenue: number }[];
  statuses: { status: OrderStatus; count: number }[];
  recentOrders: { _id: string; email: string; totalAmount: number; status: OrderStatus; createdAt: string; items: number }[];
  catalogue: { live: number; archived: number; featured: number; hero: { _id: string; name: string; image: string | null } | null };
  lowStock: { _id: string; name: string; image: string | null; stock: number; sizes: { size: string; stock: number }[] }[];
}

export interface AdminNotification { id: string; kind: 'order' | 'customer' | 'stock'; title: string; detail: string; at: string; link: string; }

export interface AdminOrder {
  _id: string; email: string; totalAmount: number; status: OrderStatus; createdAt: string; sessionId: string;
  items: { name: string; quantity: number; price: number; size?: string; image?: string; productId?: string }[];
}
export interface OrderPage { orders: AdminOrder[]; total: number; page: number; pages: number; counts: Record<OrderStatus, number>; }

export interface AdminCustomer { _id: string; name: string; email: string; phone: string; createdAt: string; city: string | null; orders: number; spent: number; lastOrder: string | null; }
export interface CustomerPage { customers: AdminCustomer[]; total: number; page: number; pages: number; }

export interface AdminProductRow {
  _id: string; name: string; slug?: string; subtitle?: string; price: number; compareAtPrice?: number;
  image: string | null; stock: number; lowSizes: { size: string; stock: number }[]; sizes: number;
  placement: Placement; featuredOrder: number | null; category: string | null; edition: string | null; colorway: string | null; updatedAt: string;
}
export interface ProductList { products: AdminProductRow[]; counts: Record<'all' | Placement, number>; }

export interface ProductImage { url: string; alt: string; role: string; width?: number; height?: number; credit?: { name: string; url: string } }
export interface ProductDraft {
  _id?: string;
  name: string; slug: string; subtitle: string; description: string; story: string;
  price: number | null; compareAtPrice: number | null;
  category: string; edition: string;
  images: ProductImage[];
  variants: { size: string; sku?: string; stock: number }[];
  colorway: { name: string; swatch: string };
  fabric: { composition: { fiber: string; percent: number }[]; weightGsm: number | null; weave: string; origin: string; care: string[] };
  fit: { cut: string; modelHeightCm: number | null; modelWears: string; notes: string };
  tags: string[];
  placement: Placement;
}

export interface Meta { categories: { _id: string; name: string; status?: string }[]; editions: { _id: string; name: string; slug: string; season?: string }[]; }

/** Client for /api/admin (every route requires an admin session). */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/admin`;
  private auth = inject(AuthService);

  /** The signed-in team role (for showing the right screens; the server re-checks). */
  role(): TeamRole | null { const r = this.auth.getUserRole(); return r === 'owner' || r === 'admin' || r === 'staff' ? r : null; }
  canManage(): boolean { const r = this.role(); return r === 'owner' || r === 'admin'; }
  isOwner(): boolean { return this.role() === 'owner'; }

  team(): Observable<Team> { return this.http.get<Team>(`${this.api}/team`); }
  searchAccounts(email: string): Observable<{ accounts: { _id: string; name: string; email: string; createdAt: string }[] }> {
    return this.http.get<{ accounts: { _id: string; name: string; email: string; createdAt: string }[] }>(`${this.api}/team/search`, { params: { email } });
  }
  addMember(userId: string, role: TeamRole, password: string): Observable<TeamMember> { return this.http.post<TeamMember>(`${this.api}/team/members`, { userId, role, password }); }
  changeRole(id: string, role: TeamRole, password: string): Observable<TeamMember> { return this.http.patch<TeamMember>(`${this.api}/team/members/${id}`, { role, password }); }
  removeMember(id: string, password: string): Observable<{ message: string }> { return this.http.post<{ message: string }>(`${this.api}/team/members/${id}/remove`, { password }); }
  createInvite(role: TeamRole, note: string, password: string): Observable<TeamInvite> { return this.http.post<TeamInvite>(`${this.api}/team/invites`, { role, note, password }); }
  revokeInvite(id: string): Observable<{ message: string }> { return this.http.delete<{ message: string }>(`${this.api}/team/invites/${id}`); }

  overview(days: number): Observable<Overview> { return this.http.get<Overview>(`${this.api}/overview`, { params: { days } }); }
  notifications(): Observable<{ items: AdminNotification[]; serverTime: string }> { return this.http.get<{ items: AdminNotification[]; serverTime: string }>(`${this.api}/notifications`); }
  meta(): Observable<Meta> { return this.http.get<Meta>(`${this.api}/meta`); }

  orders(q: { status?: string; q?: string; page?: number }): Observable<OrderPage> {
    let params = new HttpParams();
    Object.entries(q).forEach(([k, v]) => { if (v !== undefined && v !== '' && v !== null) params = params.set(k, String(v)); });
    return this.http.get<OrderPage>(`${this.api}/orders`, { params });
  }
  setOrderStatus(id: string, status: OrderStatus): Observable<AdminOrder> { return this.http.patch<AdminOrder>(`${this.api}/orders/${id}/status`, { status }); }
  receipt(id: string): Observable<Blob> { return this.http.get(`${environment.apiUrl}/receipet/download-receipt/${id}`, { responseType: 'blob' }); }

  customers(q: { q?: string; page?: number }): Observable<CustomerPage> {
    let params = new HttpParams();
    Object.entries(q).forEach(([k, v]) => { if (v !== undefined && v !== '') params = params.set(k, String(v)); });
    return this.http.get<CustomerPage>(`${this.api}/customers`, { params });
  }

  products(): Observable<ProductList> { return this.http.get<ProductList>(`${this.api}/products`); }
  product(id: string): Observable<any> { return this.http.get(`${this.api}/products/${id}`); }
  createProduct(draft: ProductDraft): Observable<any> { return this.http.post(`${this.api}/products`, draft); }
  updateProduct(id: string, draft: ProductDraft): Observable<any> { return this.http.put(`${this.api}/products/${id}`, draft); }
  setPlacement(id: string, placement: Placement): Observable<{ _id: string; placement: Placement }> { return this.http.patch<{ _id: string; placement: Placement }>(`${this.api}/products/${id}/placement`, { placement }); }
  deleteProduct(id: string): Observable<{ message: string }> { return this.http.delete<{ message: string }>(`${this.api}/products/${id}`); }
  upload(file: File): Observable<{ url: string; width?: number; height?: number }> {
    const body = new FormData();
    body.append('image', file);
    return this.http.post<{ url: string; width?: number; height?: number }>(`${this.api}/upload`, body);
  }
}

/** Server error → a sentence and, often, the field it belongs to. */
export function adminError(err: unknown, fallback: string): { message: string; field?: string } {
  const e = err as { error?: { message?: string; field?: string }; status?: number };
  if (e?.error?.message) return { message: e.error.message, field: e.error.field };
  if (e?.status === 0) return { message: 'Couldn’t reach the server. Check your connection.' };
  if (e?.status === 401 || e?.status === 403) return { message: 'Your admin session has ended. Sign in again.' };
  return { message: fallback };
}
