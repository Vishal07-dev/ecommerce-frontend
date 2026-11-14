import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../environment/environment';
import { Product } from '../../ui/models';

interface WishResponse { items: Product[]; ids: string[]; }

const GUEST_KEY = 'kora.saved';

/**
 * Saved pieces ("wishlist"). One signal store for the whole site, so every
 * heart (product card, product page, header count) agrees.
 *
 * Signed out: saves live in this browser (localStorage) and are merged into
 * the account at sign-in. Signed in: the server is the source of truth, with
 * optimistic updates that roll back if a request fails.
 */
@Injectable({ providedIn: 'root' })
export class WishlistService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/wishlist`;

  /** Newest first. */
  readonly items = signal<Product[]>([]);
  readonly state = signal<'idle' | 'loading' | 'ready' | 'error'>('idle');
  readonly error = signal<string | null>(null);
  private readonly idSet = computed(() => new Set(this.items().map(p => p._id)));
  readonly count = computed(() => this.items().length);

  constructor() { this.load(); }

  private get signedIn(): boolean {
    try { return !!localStorage.getItem('accessToken'); } catch { return false; }
  }

  has(id: string): boolean { return this.idSet().has(id); }

  load(): void {
    this.error.set(null);
    if (!this.signedIn) { this.items.set(this.readGuest()); this.state.set('ready'); return; }
    this.state.set('loading');
    this.http.get<WishResponse>(`${this.api}/list`).subscribe({
      next: res => { this.items.set(res.items); this.state.set('ready'); },
      error: () => this.state.set('error'),
    });
  }

  /** Save or unsave. Returns the new saved state. */
  toggle(product: Product): Observable<boolean> {
    return this.has(product._id) ? this.remove(product._id).pipe(map(() => false)) : this.add(product).pipe(map(ok => ok));
  }

  add(product: Product): Observable<boolean> {
    this.error.set(null);
    if (this.has(product._id)) return of(true);
    const previous = this.items();
    this.items.set([product, ...previous]); // optimistic
    if (!this.signedIn) { this.writeGuest(this.items()); return of(true); }
    return this.http.post<WishResponse>(`${this.api}/add`, { productId: product._id }).pipe(
      tap(res => this.items.set(res.items)),
      map(() => true),
      catchError(() => { this.items.set(previous); this.error.set('We couldn’t save that piece. Try again.'); return of(false); }),
    );
  }

  remove(id: string): Observable<boolean> {
    this.error.set(null);
    const previous = this.items();
    this.items.set(previous.filter(p => p._id !== id)); // optimistic
    if (!this.signedIn) { this.writeGuest(this.items()); return of(true); }
    return this.http.delete<WishResponse>(`${this.api}/remove/${id}`).pipe(
      tap(res => this.items.set(res.items)),
      map(() => true),
      catchError(() => { this.items.set(previous); this.error.set('We couldn’t remove that piece. Try again.'); return of(false); }),
    );
  }

  /** At sign-in: fold this browser's saves into the account. */
  mergeGuest(): Observable<void> {
    const guest = this.readGuest();
    if (!guest.length) { this.load(); return of(void 0); }
    return this.http.post<WishResponse>(`${this.api}/merge`, { items: guest.map(p => p._id) }).pipe(
      tap(res => { this.items.set(res.items); this.state.set('ready'); this.writeGuest([]); }),
      map(() => void 0),
      catchError(() => { this.load(); return of(void 0); }),
    );
  }

  /** At sign-out: forget the account's list, show this browser's (now empty) one. */
  resetLocal(): void {
    this.items.set(this.readGuest());
    this.state.set('ready');
  }

  // Backwards-compatible names used elsewhere -----------------------------------
  addItemToWishList(productId: string): Observable<unknown> {
    return this.http.post(`${this.api}/add`, { productId }).pipe(tap(() => this.load()));
  }

  private readGuest(): Product[] {
    try { return JSON.parse(localStorage.getItem(GUEST_KEY) ?? '[]') as Product[]; } catch { return []; }
  }

  private writeGuest(items: Product[]): void {
    // Keep only what a product card needs, so storage stays small.
    const slim = items.slice(0, 100).map(({ _id, name, slug, subtitle, price, compareAtPrice, images, image, variants, stock, colorway }) =>
      ({ _id, name, slug, subtitle, price, compareAtPrice, images: images?.slice(0, 2), image, variants, stock, colorway }));
    try { localStorage.setItem(GUEST_KEY, JSON.stringify(slim)); } catch { /* storage full or blocked */ }
  }
}
