import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { CartService } from '../../service/cartService/cart.service';

@Component({
  selector: 'app-payment-cancel',
  imports: [RouterLink],
  template: `
    <div class="page section-y max-w-3xl">
      <p class="type-label text-fg-3">Checkout cancelled</p>
      <h1 class="type-display mt-3">No payment was taken.</h1>
      <p class="mt-6 type-body text-fg-2 measure">Your bag is saved exactly as you left it. Check out whenever you're ready.</p>
      <div class="mt-10 flex flex-wrap gap-3">
        <button type="button" class="btn btn-solid" (click)="bag.open()">Return to your bag</button>
        <a routerLink="/shop" class="btn btn-quiet">Keep shopping</a>
      </div>
    </div>
  `,
})
export class PaymentCancelComponent {
  readonly bag = inject(CartService);
  constructor() { inject(Title).setTitle('Checkout cancelled — KŌRA'); }
}
