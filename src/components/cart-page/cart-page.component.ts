import { Component, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { BagLine, CartService, FREE_DELIVERY_FROM } from '../../service/cartService/cart.service';
import { InrPipe, formatInr } from '../../ui/price.pipe';
import { thumb } from '../../ui/image';

@Component({
  selector: 'app-cart-page',
  imports: [NgOptimizedImage, RouterLink, InrPipe],
  template: `
    <div class="page pt-10 pb-24 md:pt-16">
      <h1 class="type-display">Your bag</h1>

      @if (bag.lines().length) {
        <div class="mt-10 grid gap-12 lg:grid-cols-12">
          <section class="lg:col-span-7" aria-label="Items">
            @if (bag.removed(); as removed) {
              <div class="mb-4 flex items-center justify-between gap-3 rounded-[var(--radius-inset)] bg-sunken px-4 py-3 type-body-sm" role="status">
                <span>Removed {{ removed.name }} ({{ removed.size }}).</span>
                <button type="button" class="link-underline font-medium" (click)="bag.undoRemove()">Undo</button>
              </div>
            }
            <ul class="divide-y divide-line border-y border-line">
              @for (line of bag.lines(); track line._id) {
                <li class="grid grid-cols-[6rem_1fr] gap-5 py-6 sm:grid-cols-[8rem_1fr]">
                  <a [routerLink]="link(line)" class="media aspect-[4/5]" tabindex="-1" aria-hidden="true">
                    @if (line.image) { <img [ngSrc]="thumb(line.image)" width="128" height="160" alt="" /> }
                  </a>
                  <div class="flex flex-col">
                    <div class="flex items-start justify-between gap-4">
                      <div>
                        <h2 class="type-body font-medium"><a [routerLink]="link(line)" class="hover:underline">{{ line.name }}</a></h2>
                        <p class="type-body-sm text-fg-3">@if (line.colorway) { {{ line.colorway }} · } Size {{ line.size }} · {{ line.price | inr }} each</p>
                      </div>
                      <p class="type-price">{{ line.price * line.quantity | inr }}</p>
                    </div>
                    <div class="mt-auto flex items-center gap-4 pt-4">
                      <label class="flex items-center gap-2 type-body-sm">
                        <span class="text-fg-3">Quantity</span>
                        <select class="field min-h-10 w-auto py-1 type-price" [value]="line.quantity"
                                (change)="bag.setQuantity(line, +$any($event.target).value)">
                          @for (q of quantities(line); track q) { <option [value]="q" [selected]="q === line.quantity">{{ q }}</option> }
                        </select>
                      </label>
                      <button type="button" class="type-body-sm text-fg-2 link-underline min-h-10" (click)="bag.remove(line)">
                        Remove<span class="visually-hidden"> {{ line.name }}, size {{ line.size }}</span>
                      </button>
                    </div>
                  </div>
                </li>
              }
            </ul>
          </section>

          <aside class="lg:col-span-4 lg:col-start-9" aria-labelledby="summary-title">
            <div class="rounded-[var(--radius-surface)] bg-raised p-6 lg:sticky lg:top-24">
              <h2 id="summary-title" class="type-h3">Summary</h2>
              <p class="mt-4 type-body-sm">
                @if (bag.awayFromFreeDelivery() > 0) {
                  Add <span class="type-price">{{ bag.awayFromFreeDelivery() | inr }}</span> more for free delivery.
                } @else { Delivery is free on this order. }
              </p>
              <div class="mt-2 h-1 overflow-hidden rounded-full bg-sunken" aria-hidden="true">
                <div class="h-full origin-left rounded-full bg-accent" [style.scale]="bag.freeDeliveryProgress() + ' 1'"></div>
              </div>
              <dl class="mt-6 grid grid-cols-[1fr_auto] gap-y-2 type-body-sm">
                <dt class="text-fg-2">Subtotal ({{ bag.count() }} {{ bag.count() === 1 ? 'item' : 'items' }})</dt>
                <dd class="type-price text-end">{{ bag.subtotal() | inr }}</dd>
                <dt class="text-fg-2">Delivery</dt>
                <dd class="type-price text-end">{{ bag.delivery() ? (bag.delivery() | inr) : 'Free' }}</dd>
                <dt class="mt-2 border-t border-line pt-3 font-medium">Total</dt>
                <dd class="type-price mt-2 border-t border-line pt-3 text-end font-medium">{{ bag.total() | inr }}</dd>
              </dl>
              <p class="mt-2 type-body-sm text-fg-3">Prices include GST. Free delivery from {{ freeFrom }}.</p>
              @if (bag.error()) { <p class="mt-4 type-body-sm text-danger" role="alert">{{ bag.error() }}</p> }
              <button type="button" class="btn btn-solid mt-6 w-full" [disabled]="bag.busy()" (click)="bag.checkout()">
                {{ bag.signedIn ? (bag.busy() ? 'Opening checkout…' : 'Check out') : 'Sign in to check out' }}
              </button>
              <p class="mt-3 text-center type-body-sm text-fg-3">Secure payment by Stripe.</p>
            </div>
          </aside>
        </div>
      } @else {
        <div class="mt-10 max-w-xl">
          <p class="type-body text-fg-2">Your bag is empty. Coats, knits and heavy cotton are waiting in the shop.</p>
          <a routerLink="/shop" class="btn btn-solid mt-8">Shop the edit</a>
        </div>
      }
    </div>
  `,
})
export class CartPageComponent {
  readonly bag = inject(CartService);
  readonly freeFrom = formatInr(FREE_DELIVERY_FROM);
  readonly thumb = thumb;

  constructor() { inject(Title).setTitle('Your bag — KŌRA'); }

  link(line: BagLine): string[] { return ['/product', line.slug ?? line.productId]; }
  quantities(line: BagLine): number[] {
    const max = Math.max(line.quantity, Math.min(line.maxQuantity, 10));
    return Array.from({ length: max }, (_, i) => i + 1);
  }
}
