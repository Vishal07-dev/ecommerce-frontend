import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, tap, catchError, map } from 'rxjs';
import { environment } from '../../environment/environment';
import { ONE_SIZE, Product, primaryImage, sizesOf } from '../../ui/models';

/** One bag line: a product in one size. */
export interface BagLine {
  _id: string;          // server line id, or `${productId}:${size}` for a guest bag
  productId: string;
  slug?: string;
  name: string;
  colorway?: string;
  image: string;
  size: string;
  quantity: number;
  price: number;
  maxQuantity: number;
}

interface BagResponse { items: BagLine[]; count: number; subtotal: number; }

// Same rule as back-end/controllers/payment.controller.js
export const FREE_DELIVERY_FROM = 5000;
export const DELIVERY_FEE = 250;

const GUEST_KEY = 'kora.bag';
const RETURN_KEY = 'kora.returnUrl';
const OFFLINE = "We couldn't reach the shop. Check your connection and try again.";

/**
 * The bag. Signed-in shoppers' bags live on the server; guests' bags live in
 * this browser and are folded into the account bag on sign-in.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private api = environment.apiUrl;

  readonly lines = signal<BagLine[]>([]);
  readonly isOpen = signal(false);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  /** The line just added, highlighted in the drawer. */
  readonly lastAddedId = signal<string | null>(null);
  /** The line just removed, offered back through "Undo". */
  readonly removed = signal<BagLine | null>(null);

  readonly count = computed(() => this.lines().reduce((n, l) => n + l.quantity, 0));
  readonly subtotal = computed(() => this.lines().reduce((n, l) => n + l.quantity * l.price, 0));
  readonly delivery = computed(() => (this.subtotal() === 0 || this.subtotal() >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE));
  readonly total = computed(() => this.subtotal() + this.delivery());
  readonly freeDeliveryProgress = computed(() => Math.min(1, this.subtotal() / FREE_DELIVERY_FROM));
  readonly awayFromFreeDelivery = computed(() => Math.max(0, FREE_DELIVERY_FROM - this.subtotal()));

  get signedIn(): boolean {
    try { return !!localStorage.getItem('accessToken'); } catch { return false; }
  }

  load(): void {
    if (!this.signedIn) {
      this.lines.set(this.readGuest());
      return;
    }
    this.http.get<BagResponse>(`${this.api}/cart/show`).subscribe({
      next: res => this.lines.set(res.items),
      error: () => this.lines.set([]),
    });
  }

  open(): void { this.error.set(null); this.isOpen.set(true); }
  close(): void { this.isOpen.set(false); this.removed.set(null); this.lastAddedId.set(null); }

  /** Adds a product in a size, then opens the bag as the confirmation. */
  add(product: Product, size: string, quantity = 1): Observable<boolean> {
    this.error.set(null);
    this.removed.set(null);
    if (!this.signedIn) {
      const result = this.addGuest(product, size, quantity);
      if (result) this.afterAdd(result);
      return of(!!result);
    }
    this.busy.set(true);
    return this.http.post<BagResponse>(`${this.api}/cart/add`, { productId: product._id, size, quantity }).pipe(
      map(res => {
        this.lines.set(res.items);
        const line = res.items.find(l => l.productId === product._id && l.size === size);
        this.afterAdd(line?._id ?? null);
        return true;
      }),
      catchError(err => { this.error.set(this.messageFrom(err)); return of(false); }),
      tap(() => this.busy.set(false)),
    );
  }

  setQuantity(line: BagLine, quantity: number): void {
    const next = Math.max(1, Math.min(quantity, Math.max(line.maxQuantity, 1)));
    if (next === line.quantity) return;
    this.error.set(null);
    if (!this.signedIn) {
      this.writeGuest(this.lines().map(l => (l._id === line._id ? { ...l, quantity: next } : l)));
      return;
    }
    const previous = this.lines();
    this.lines.update(ls => ls.map(l => (l._id === line._id ? { ...l, quantity: next } : l))); // optimistic
    this.http.patch<BagResponse>(`${this.api}/cart/items/${line._id}`, { quantity: next }).subscribe({
      next: res => this.lines.set(res.items),
      error: err => { this.lines.set(previous); this.error.set(this.messageFrom(err)); },
    });
  }

  remove(line: BagLine): void {
    this.error.set(null);
    this.lastAddedId.set(null);
    this.removed.set(line);
    if (!this.signedIn) {
      this.writeGuest(this.lines().filter(l => l._id !== line._id));
      return;
    }
    const previous = this.lines();
    this.lines.update(ls => ls.filter(l => l._id !== line._id));
    this.http.delete<BagResponse>(`${this.api}/cart/items/${line._id}`).subscribe({
      next: res => this.lines.set(res.items),
      error: err => { this.lines.set(previous); this.removed.set(null); this.error.set(this.messageFrom(err)); },
    });
  }

  undoRemove(): void {
    const line = this.removed();
    if (!line) return;
    this.removed.set(null);
    if (!this.signedIn) {
      this.writeGuest([...this.lines(), line]);
      return;
    }
    this.http.post<BagResponse>(`${this.api}/cart/add`, { productId: line.productId, size: line.size, quantity: line.quantity }).subscribe({
      next: res => this.lines.set(res.items),
      error: err => this.error.set(this.messageFrom(err)),
    });
  }

  /** Called by AuthService right after sign-in. */
  mergeGuestBag(): Observable<unknown> {
    const guest = this.readGuest();
    if (!guest.length) { this.load(); return of(null); }
    return this.http.post<BagResponse>(`${this.api}/cart/merge`, {
      products: guest.map(l => ({ productId: l.productId, size: l.size, quantity: l.quantity })),
    }).pipe(
      tap(res => { this.lines.set(res.items); this.clearGuest(); }),
      catchError(() => { this.load(); return of(null); }),
    );
  }

  /** After a completed order. */
  clearAfterOrder(): void {
    this.clearGuest();
    this.lines.set([]);
    if (this.signedIn) this.http.delete(`${this.api}/cart`).subscribe({ error: () => {} });
  }

  /** On sign-out: forget the account bag in this browser. */
  resetLocal(): void { this.clearGuest(); this.lines.set([]); }

  checkout(): void {
    if (!this.lines().length) return;
    if (!this.signedIn) {
      try { sessionStorage.setItem(RETURN_KEY, this.router.url); } catch { /* storage blocked */ }
      this.close();
      this.router.navigateByUrl('/login');
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    this.http.post<{ url: string }>(`${this.api}/payment/create-checkout-session`, {
      items: this.lines().map(l => ({ productId: l.productId, size: l.size, quantity: l.quantity })),
    }).subscribe({
      next: res => { window.location.href = res.url; },
      error: err => { this.busy.set(false); this.error.set(this.messageFrom(err, "We couldn't start checkout. Your bag is saved — try again in a moment.")); },
    });
  }

  /** Where to send a shopper after sign-in, if they were checking out. */
  takeReturnUrl(): string | null {
    try {
      const url = sessionStorage.getItem(RETURN_KEY);
      sessionStorage.removeItem(RETURN_KEY);
      return url;
    } catch { return null; }
  }

  // -------------------------------------------------------------------------
  private afterAdd(lineId: string | null): void {
    this.lastAddedId.set(lineId);
    this.open();
  }

  private addGuest(product: Product, size: string, quantity: number): string | null {
    const variant = sizesOf(product).find(v => v.size === size);
    if (!variant || variant.stock < 1) {
      this.error.set(`Size ${size} is sold out. Choose another size.`);
      return null;
    }
    const id = `${product._id}:${size}`;
    const lines = this.lines();
    const existing = lines.find(l => l._id === id);
    const next: BagLine = existing
      ? { ...existing, quantity: Math.min(existing.quantity + quantity, variant.stock) }
      : {
          _id: id,
          productId: product._id,
          slug: product.slug,
          name: product.name,
          colorway: product.colorway?.name,
          image: primaryImage(product).url,
          size: size || ONE_SIZE,
          quantity: Math.min(quantity, variant.stock),
          price: product.price,
          maxQuantity: variant.stock,
        };
    this.writeGuest(existing ? lines.map(l => (l._id === id ? next : l)) : [...lines, next]);
    return id;
  }

  private readGuest(): BagLine[] {
    try {
      const raw = JSON.parse(localStorage.getItem(GUEST_KEY) ?? '[]');
      return Array.isArray(raw) ? raw : [];
    } catch { return []; }
  }

  private writeGuest(lines: BagLine[]): void {
    this.lines.set(lines);
    try { localStorage.setItem(GUEST_KEY, JSON.stringify(lines)); } catch { /* storage blocked: bag lasts this visit */ }
  }

  private clearGuest(): void {
    try { localStorage.removeItem(GUEST_KEY); localStorage.removeItem('Product'); } catch { /* storage blocked */ }
  }

  private messageFrom(err: unknown, fallback = OFFLINE): string {
    const e = err as HttpErrorResponse;
    return (typeof e?.error?.message === 'string' && e.error.message) || (typeof e?.error?.error === 'string' && e.error.error) || fallback;
  }
}
