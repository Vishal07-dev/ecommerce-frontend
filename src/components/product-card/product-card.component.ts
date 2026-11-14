import { Component, ElementRef, computed, inject, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../service/cartService/cart.service';
import { InrPipe } from '../../ui/price.pipe';
import { HandoffService } from '../../ui/handoff';
import { Product, primaryImage, productLink, secondaryImage, sizesOf } from '../../ui/models';

/**
 * Editorial product card. The second photo cross-fades in on hover or focus;
 * quick-add size buttons sit under the price (always visible on touch,
 * revealed on hover or keyboard focus elsewhere).
 */
@Component({
  selector: 'app-product-card',
  imports: [NgOptimizedImage, RouterLink, InrPipe],
  templateUrl: './product-card.component.html',
  host: { class: 'card group relative flex flex-col' },
})
export class ProductCardComponent {
  readonly product = input.required<Product>();
  /** Tailwind aspect-ratio class for the image frame. */
  readonly aspect = input('aspect-[4/5]');
  readonly sizes = input('(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw');
  readonly priority = input(false);
  readonly headingLevel = input<2 | 3>(3);
  readonly quickAdd = input(true);

  private bag = inject(CartService);
  private handoff = inject(HandoffService);
  private host = inject(ElementRef<HTMLElement>);

  readonly first = computed(() => primaryImage(this.product()));
  readonly second = computed(() => secondaryImage(this.product()));
  readonly link = computed(() => productLink(this.product()));
  readonly variants = computed(() => sizesOf(this.product()));
  readonly soldOut = computed(() => this.variants().every(v => v.stock < 1));

  /** Lift this card's photo so it can travel to the product page. */
  pickUp(event: MouseEvent): void {
    this.handoff.lift(event, this.host.nativeElement);
  }

  add(size: string): void {
    this.bag.add(this.product(), size).subscribe();
  }
}
