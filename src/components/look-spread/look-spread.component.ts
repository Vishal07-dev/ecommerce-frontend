import { Component, computed, input, signal } from '@angular/core';
import { NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InrPipe } from '../../ui/price.pipe';
import { Look, Product, primaryImage, productLink } from '../../ui/models';
import { ParallaxDirective } from '../../ui/parallax.directive';
import { thumb } from '../../ui/image';
import { RevealDirective } from '../../ui/reveal.directive';
import { WeaveDirective } from '../../ui/weave';

/**
 * One lookbook frame: a large photograph with a small tag on each piece (a dot that opens into its name and price),
 * and a "Shop the look" list beside it. `flip` puts the text first, in both
 * the DOM and the layout, so reading order always matches visual order.
 */
@Component({
  selector: 'app-look-spread',
  imports: [NgOptimizedImage, NgTemplateOutlet, RouterLink, InrPipe, ParallaxDirective, RevealDirective, WeaveDirective],
  template: `
    <article class="grid items-end gap-8 md:grid-cols-12 md:gap-12" [attr.aria-labelledby]="headingId()">
      @if (flip()) {
        <div class="md:col-span-5 md:pb-10"><ng-container *ngTemplateOutlet="copy" /></div>
        <div class="md:col-span-7"><ng-container *ngTemplateOutlet="photo" /></div>
      } @else {
        <div class="md:col-span-7"><ng-container *ngTemplateOutlet="photo" /></div>
        <div class="md:col-span-5 md:pb-10"><ng-container *ngTemplateOutlet="copy" /></div>
      }
    </article>

    <ng-template #photo>
      <figure>
        <div class="media" weave [style.aspect-ratio]="ratio()">
          <!-- Markers ride inside the parallax layer so they stay on the garment -->
          <div class="absolute inset-0" parallax="5">
            <img [ngSrc]="look().image.url" fill sizes="(min-width: 768px) 58vw, 100vw" [priority]="priority()" [alt]="look().image.alt" />
            @for (item of look().items; track item.product._id; let i = $index) {
              <a [routerLink]="link(item.product)" class="look-tag"
                 [class.is-active]="active() === i"
                 [class.look-tag-left]="item.x > 60"
                 [style.left.%]="item.x" [style.top.%]="item.y"
                 (mouseenter)="active.set(i)" (mouseleave)="active.set(null)"
                 (focus)="active.set(i)" (blur)="active.set(null)">
                <span class="look-tag-dot" aria-hidden="true"></span>
                <span class="look-tag-label">
                  <span>{{ item.product.name }}</span>
                  <span class="type-price opacity-70">{{ item.product.price | inr }}</span>
                </span>
              </a>
            }
          </div>
        </div>
        @if (look().image.credit; as c) {
          <figcaption class="mt-2 type-label text-fg-3">Photo: <a [href]="c.url" target="_blank" rel="noopener" class="hover:underline">{{ c.name }}</a></figcaption>
        }
      </figure>
    </ng-template>

    <ng-template #copy>
      <p class="type-label text-fg-3" reveal>Look {{ look().number.toString().padStart(2, '0') }}</p>
      <h2 [id]="headingId()" class="type-h1 mt-3" reveal [revealOrder]="1">{{ look().title }}</h2>
      <p class="mt-4 type-body text-fg-2 measure" reveal [revealOrder]="2">{{ look().caption }}</p>

      <h3 class="type-label mt-10 text-fg-3">Shop the look</h3>
      <ul class="mt-4 divide-y divide-line border-y border-line">
        @for (item of look().items; track item.product._id; let i = $index) {
          <li>
            <a [routerLink]="link(item.product)" class="group grid grid-cols-[3.5rem_1fr_auto] items-center gap-4 py-3 transition-colors duration-150"
               [class.text-accent]="active() === i"
               (mouseenter)="active.set(i)" (mouseleave)="active.set(null)">
              <span class="media block aspect-[4/5]">
                <img [ngSrc]="thumb(item.product)" width="56" height="70" alt="" />
              </span>
              <span class="type-body-sm font-medium group-hover:underline">{{ item.product.name }}</span>
              <span class="type-price type-body-sm">{{ item.product.price | inr }}</span>
            </a>
          </li>
        }
      </ul>
    </ng-template>
  `,
})
export class LookSpreadComponent {
  readonly look = input.required<Look>();
  readonly flip = input(false);
  readonly priority = input(false);
  /** The piece being pointed at, in the photo or the list; lights up both. */
  readonly active = signal<number | null>(null);

  readonly headingId = computed(() => `look-${this.look().slug}`);
  readonly ratio = computed(() => `${this.look().image.width} / ${this.look().image.height}`);

  link(p: Product): string[] { return productLink(p); }
  thumb(p: Product): string { return thumb(primaryImage(p).url); }
}
