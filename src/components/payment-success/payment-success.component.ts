import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { environment } from '../../environment/environment';
import { CartService } from '../../service/cartService/cart.service';

@Component({
  selector: 'app-payment-success',
  imports: [RouterLink],
  template: `
    <div class="page section-y max-w-3xl">
      @switch (state()) {
        @case ('saving') {
          <p class="type-label text-fg-3" role="status">Confirming your order…</p>
        }
        @case ('confirmed') {
          <p class="type-label text-fg-3">Order confirmed</p>
          <h1 class="type-display mt-3">Thank you. Your order is in.</h1>
          <p class="mt-6 type-body text-fg-2 measure">
            Your payment went through and your order is placed. Delivery takes 3–6 working days across India.
          </p>
          @if (orderId()) {
            <p class="mt-6 type-label text-fg-3">Order reference <span class="type-price text-fg">{{ orderId() }}</span></p>
          }
          <div class="mt-10 flex flex-wrap gap-3">
            <button type="button" class="btn btn-solid" (click)="downloadReceipt()" [disabled]="!orderId() || downloading()">
              {{ downloading() ? 'Preparing receipt…' : 'Download receipt' }}
            </button>
            <a routerLink="/shop" class="btn btn-quiet">Keep shopping</a>
          </div>
          @if (receiptError()) {
            <p class="mt-4 type-body-sm text-danger" role="alert">We couldn't create your receipt. Try again in a moment.</p>
          }
        }
        @case ('error') {
          <p class="type-label text-fg-3">Payment received</p>
          <h1 class="type-h1 mt-3">We couldn't confirm your order on this page</h1>
          <p class="mt-6 type-body text-fg-2 measure">
            If Stripe showed a successful payment, your money is safe. Refresh this page to try again, or contact us with the email you paid with and we'll confirm it for you.
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
  readonly downloading = signal(false);
  readonly receiptError = signal(false);

  constructor() {
    inject(Title).setTitle('Order confirmed — KŌRA');
    const sessionId = inject(ActivatedRoute).snapshot.queryParamMap.get('session_id');
    if (!sessionId) { this.state.set('error'); return; }
    this.http.post<{ orderId: string }>(`${this.api}/payment/store-order`, { sessionId }).subscribe({
      next: res => { this.orderId.set(res.orderId); this.state.set('confirmed'); this.bag.clearAfterOrder(); },
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
        a.download = `kora-receipt-${id}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.downloading.set(false);
      },
      error: () => { this.downloading.set(false); this.receiptError.set(true); },
    });
  }

  reload(): void { location.reload(); }
}
