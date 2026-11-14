import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { WishlistService } from "../../service/wishList'/wishlist.service";
import { AuthService } from '../../service/auth.service';
import { ProductCardComponent } from '../product-card/product-card.component';
import { SplitLinesDirective } from '../../ui/split-lines';
import { RevealDirective } from '../../ui/reveal.directive';
import { InrPipe } from '../../ui/price.pipe';
import { Product, sizesOf } from '../../ui/models';

type Sort = 'recent' | 'price-asc' | 'price-desc';

/**
 * Saved pieces. The cards are the same as the shop's (heart to unsave, sizes
 * to add straight to the bag); the page adds a running total, a sort, and
 * an undo for the last piece removed.
 */
@Component({
  selector: 'app-wishlist',
  imports: [RouterLink, ProductCardComponent, SplitLinesDirective, RevealDirective, InrPipe],
  template: `
    <header class="page pt-12 md:pt-20">
      <p class="type-label text-fg-3">Saved pieces</p>
      <div class="mt-4 flex items-start gap-3">
        <h1 class="type-display-xl" splitLines>Kept for <em>later.</em></h1>
        @if (saved.count()) { <span class="type-price type-body-sm mt-2 text-fg-3 md:mt-4" aria-hidden="true">({{ saved.count() }})</span> }
      </div>
      <p class="mt-6 type-body text-fg-2 measure">
        Pieces you’ve saved with the heart. Choose a size on any of them to put it in your bag.
      </p>
      @if (guest()) {
        <p class="mt-4 type-body-sm text-fg-2">
          These are saved on this device. <a routerLink="/login" class="link-underline font-medium text-fg">Sign in</a> to keep them in your account, on every device.
        </p>
      }
    </header>

    @switch (saved.state()) {
      @case ('loading') {
        <div class="page section-y grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4" aria-busy="true">
          @for (i of [1, 2, 3, 4]; track i) { <div class="aspect-[4/5] animate-pulse bg-sunken motion-reduce:animate-none"></div> }
          <p class="visually-hidden" role="status">Loading your saved pieces…</p>
        </div>
      }
      @case ('error') {
        <div class="page section-y">
          <p class="type-h2">We couldn’t load your saved pieces</p>
          <p class="mt-2 type-body text-fg-2">Check your connection, then try again.</p>
          <button type="button" class="btn btn-solid mt-6" (click)="saved.load()">Try again</button>
        </div>
      }
      @default {
        @if (!saved.count()) {
          <div class="page section-y">
            <div class="rounded-[var(--radius-surface)] bg-sunken p-8 md:p-12">
              <p class="type-h2">Nothing saved yet</p>
              <p class="mt-2 type-body text-fg-2 measure">Tap the heart on any piece to keep it here while you decide.</p>
              <a routerLink="/shop" class="btn btn-solid mt-6">Browse the shop</a>
            </div>
            @if (lastRemoved(); as r) {
              <p class="mt-6 type-body-sm text-fg-2" role="status">{{ r.name }} removed. <button type="button" class="link-underline font-medium text-fg" (click)="undo()">Undo</button></p>
            }
          </div>
        } @else {
          <!-- Summary bar -->
          <div class="mt-10 border-y border-line">
            <div class="page flex flex-wrap items-center gap-x-6 gap-y-3 py-3">
              <p class="type-body-sm text-fg-2" role="status">
                {{ saved.count() }} {{ saved.count() === 1 ? 'piece' : 'pieces' }} · <span class="type-price">{{ total() | inr }}</span>
                @if (soldOutCount()) { · {{ soldOutCount() }} sold out }
              </p>
              <label class="ms-auto flex items-center gap-2 type-body-sm">
                <span class="text-fg-3">Sort</span>
                <select class="field min-h-10 py-1" [value]="sort()" (change)="sort.set($any($event.target).value)">
                  <option value="recent">Recently saved</option>
                  <option value="price-asc">Price, low to high</option>
                  <option value="price-desc">Price, high to low</option>
                </select>
              </label>
            </div>
          </div>

          @if (lastRemoved(); as r) {
            <p class="page mt-6 type-body-sm text-fg-2" role="status">{{ r.name }} removed. <button type="button" class="link-underline font-medium text-fg" (click)="undo()">Undo</button></p>
          }
          @if (saved.error()) { <p class="page mt-6 type-body-sm text-danger" role="alert">{{ saved.error() }}</p> }

          <section class="page pt-10 pb-24" aria-label="Saved pieces">
            <ul class="grid grid-cols-2 items-start gap-x-4 gap-y-12 md:grid-cols-3 lg:grid-cols-4">
              @for (p of sorted(); track p._id; let i = $index) {
                <li reveal [revealOrder]="i % 4" class="flex flex-col">
                  <app-product-card [product]="p" [headingLevel]="2" [priority]="i < 2" sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" />
                  <button type="button" class="mt-3 self-start type-body-sm text-fg-3 link-underline" (click)="remove(p)"
                          [attr.aria-label]="'Remove ' + p.name + ' from saved pieces'">Remove</button>
                </li>
              }
            </ul>
          </section>
        }
      }
    }
  `,
})
export class WishlistPageComponent {
  readonly saved = inject(WishlistService);
  private auth = inject(AuthService);

  readonly sort = signal<Sort>('recent');
  readonly lastRemoved = signal<Product | null>(null);
  readonly guest = computed(() => !this.auth.isLoggedIn());

  readonly sorted = computed(() => {
    const items = [...this.saved.items()];
    switch (this.sort()) {
      case 'price-asc': return items.sort((a, b) => a.price - b.price);
      case 'price-desc': return items.sort((a, b) => b.price - a.price);
      default: return items;
    }
  });
  readonly total = computed(() => this.saved.items().reduce((n, p) => n + p.price, 0));
  readonly soldOutCount = computed(() =>
    this.saved.items().filter(p => { const v = sizesOf(p); return v.length > 0 && v.every(s => s.stock < 1); }).length);

  constructor() {
    inject(Title).setTitle('Saved pieces — KŌRA');
    this.saved.load(); // fresh prices and stock every visit
  }

  remove(p: Product): void {
    this.saved.remove(p._id).subscribe(ok => { if (ok) this.lastRemoved.set(p); });
  }

  undo(): void {
    const p = this.lastRemoved();
    if (!p) return;
    this.lastRemoved.set(null);
    this.saved.add(p).subscribe();
  }
}
