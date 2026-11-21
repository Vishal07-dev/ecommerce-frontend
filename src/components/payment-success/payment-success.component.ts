import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { environment } from '../../environment/environment';
import { CartService } from '../../service/cartService/cart.service';
import { InrPipe } from '../../ui/price.pipe';

/** The same breakdown the receipt, account page and Studio show. */
interface OrderSummary {
  _id: string; ref: string; createdAt: string; email: string;
  lines: { name: string; size: string | null; quantity: number; unitPrice: number; amount: number; image: string | null }[];
  itemCount: number; subtotal: number; deliveryFee: number; total: number;
}

@Component({
  selector: 'app-payment-success',
  imports: [RouterLink, InrPipe, DatePipe],
  template: `
    <div class="page section-y max-w-3xl">
      @switch (state()) {
        @case ('saving') {
          <p class="type-label text-fg-3" role="status">Confirming your order…</p>
        }
        @case ('confirmed') {
          <p class="type-label text-fg-3">Order confirmed@if (order(); as o) { · #{{ o.ref }} }</p>
          <h1 class="type-display mt-3">Thank you. Your order is in.</h1>
          <p class="mt-6 type-body text-fg-2 measure">
            Your payment went through and your order is placed. Delivery takes 3–6 working days across India.
            @if (order(); as o) { A copy of the receipt is below; you can also find this order in your account. }
          </p>

          @if (order(); as o) {
            <section class="mt-10 rounded-[var(--radius-surface)] border border-line bg-raised p-5 md:p-7" aria-labelledby="summary-title">
              <div class="flex flex-wrap items-baseline justify-between gap-3">
                <h2 id="summary-title" class="type-h3">Order #{{ o.ref }}</h2>
                <p class="type-body-sm text-fg-3">{{ o.createdAt | date: 'd MMM y, h:mm a' }}</p>
              </div>
              <ul class="mt-4 divide-y divide-line border-y border-line">
                @for (l of o.lines; track $index) {
                  <li class="flex items-center gap-4 py-3">
                    @if (l.image) { <span class="media block aspect-[4/5] w-12 shrink-0"><img [src]="l.image" alt="" class="size-full object-cover" /></span> }
                    <div class="min-w-0 flex-1">
                      <p class="type-body-sm font-medium">{{ l.name }}</p>
                      <p class="type-body-sm text-fg-3">@if (l.size) { Size {{ l.size }} · }Qty {{ l.quantity }}@if (l.quantity > 1) { · {{ l.unitPrice | inr }} each }</p>
                    </div>
                    <p class="type-price type-body-sm">{{ l.amount | inr }}</p>
                  </li>
                }
              </ul>
              <dl class="mt-4 ms-auto flex max-w-xs flex-col gap-1.5 type-body-sm">
                <div class="flex justify-between gap-4 text-fg-2"><dt>Subtotal ({{ o.itemCount }} {{ o.itemCount === 1 ? 'piece' : 'pieces' }})</dt><dd class="type-price">{{ o.subtotal | inr }}</dd></div>
                <div class="flex justify-between gap-4 text-fg-2"><dt>Delivery</dt><dd class="type-price">{{ o.deliveryFee > 0 ? (o.deliveryFee | inr) : 'Free' }}</dd></div>
                <div class="flex justify-between gap-4 border-t border-line pt-2 type-body font-medium"><dt>Total paid</dt><dd class="type-price">{{ o.total | inr }}</dd></div>
              </dl>
              <p class="mt-2 text-end type-body-sm text-fg-3">Prices include GST. Billed to {{ o.email }}.</p>
            </section>
          }

          <div class="mt-8 flex flex-wrap gap-3">
            <button type="button" class="btn btn-solid" (click)="downloadReceipt()" [disabled]="!orderId() || downloading()" [attr.aria-busy]="downloading()">
              {{ downloading() ? 'Preparing receipt…' : 'Download receipt (PDF)' }}
            </button>
            <a routerLink="/profile" [queryParams]="{ tab: 'orders' }" class="btn btn-quiet">View your orders</a>
            <a routerLink="/shop" class="btn btn-quiet">Keep shopping</a>
          </div>
          @if (receiptError()) {
            <p class="mt-4 type-body-sm text-danger" role="alert">We couldn’t create your receipt just now. Try again in a moment, or download it later from your account.</p>
          }
        }
        @case ('error') {
          <p class="type-label text-fg-3">Payment received</p>
          <h1 class="type-h1 mt-3">We couldn’t confirm your order on this page</h1>
          <p class="mt-6 type-body text-fg-2 measure">
            If Stripe showed a successful payment, your money is safe. Refresh this page to try again, or contact us with the email you paid with and we’ll confirm it for you.
          </p>
          <div class="mt-10 flex flex-wrap gap-3">
            <button type="button" class="btn btn-solid" (click)="reload()">Refresh</button>
            <a routerLink="/contact" class="btn btn-quiet">Contact us</a>
          </div>
        }
      }
    </div>
  `,
})
export class PaymentSuccessComponent {
  private http = inject(HttpClient);
  private bag = inject(CartService);
  private api = environment.apiUrl;

  readonly state = signal<'saving' | 'confirmed' | 'error'>('saving');
  readonly orderId = signal<string | null>(null);
  readonly order = signal<OrderSummary | null>(null);
  readonly downloading = signal(false);
  readonly receiptError = signal(false);

  constructor() {
    inject(Title).setTitle('Order confirmed — KŌRA');
    const sessionId = inject(ActivatedRoute).snapshot.queryParamMap.get('session_id');
    if (!sessionId) { this.state.set('error'); return; }
    // Safe to repeat: reloading this page returns the same order, never a second one.
    this.http.post<{ orderId: string; order?: OrderSummary }>(`${this.api}/payment/store-order`, { sessionId }).subscribe({
      next: res => {
        this.orderId.set(res.orderId);
        this.order.set(res.order ?? null);
        this.state.set('confirmed');
        this.bag.clearAfterOrder();
      },
      error: () => this.state.set('error'),
    });
  }

  downloadReceipt(): void {
    const id = this.orderId();
    if (!id) return;
    this.downloading.set(true);
    this.receiptError.set(false);
    this.http.get(`${this.api}/receipet/download-receipt/${id}`, { responseType: 'blob' }).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kora-receipt-${this.order()?.ref ?? id}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.downloading.set(false);
      },
      error: () => { this.downloading.set(false); this.receiptError.set(true); },
    });
  }

  reload(): void { location.reload(); }
}
