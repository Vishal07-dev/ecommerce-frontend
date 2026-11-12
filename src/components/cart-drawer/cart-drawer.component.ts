import { Component, ElementRef, computed, effect, inject, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';
import { BagLine, CartService, FREE_DELIVERY_FROM } from '../../service/cartService/cart.service';
import { CatalogService } from '../../service/catalog.service';
import { MotionService } from '../../ui/motion.service';
import { InrPipe, formatInr } from '../../ui/price.pipe';
import { closeDialog, isBackdropClick, openDialog } from '../../ui/dialog';
import { thumb } from '../../ui/image';

// The quantity digit slides in the direction of the change (150ms, ease-out).
// Disabled entirely under reduced motion via [@.disabled].
const quantitySwap = trigger('quantity', [
  transition(':increment', [style({ opacity: 0, transform: 'translateY(8px)' }), animate('150ms ease-out', style({ opacity: 1, transform: 'none' }))]),
  transition(':decrement', [style({ opacity: 0, transform: 'translateY(-8px)' }), animate('150ms ease-out', style({ opacity: 1, transform: 'none' }))]),
]);

@Component({
  selector: 'app-cart-drawer',
  imports: [RouterLink, NgOptimizedImage, InrPipe],
  templateUrl: './cart-drawer.component.html',
  animations: [quantitySwap],
})
export class CartDrawerComponent {
  readonly bag = inject(CartService);
  readonly motion = inject(MotionService);
  private catalog = inject(CatalogService);
  private dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  readonly assets = toSignal(this.catalog.assets(), { initialValue: {} as Record<string, never> });
  readonly freeFrom = formatInr(FREE_DELIVERY_FROM);

  /** One polite announcement at a time for screen readers. */
  readonly status = computed(() => {
    const removed = this.bag.removed();
    if (removed) return `Removed ${removed.name}, size ${removed.size}.`;
    const added = this.bag.lines().find(l => l._id === this.bag.lastAddedId());
    if (added) return `Added ${added.name}, size ${added.size}, to your bag.`;
    return '';
  });

  constructor() {
    effect(() => {
      const dialog = this.dialog().nativeElement;
      if (this.bag.isOpen()) { this.motion.stop(); openDialog(dialog); }
      else closeDialog(dialog, () => this.motion.start());
    });
  }

  onCancel(event: Event): void { event.preventDefault(); this.bag.close(); }
  onClick(event: MouseEvent): void {
    if (isBackdropClick(event, this.dialog().nativeElement)) this.bag.close();
  }

  link(line: BagLine): string[] { return ['/product', line.slug ?? line.productId]; }
  track(_: number, line: BagLine): string { return line._id; }
  readonly thumb = thumb;
}
