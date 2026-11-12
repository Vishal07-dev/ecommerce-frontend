import { Component, DestroyRef, ElementRef, computed, inject, signal, viewChild, afterNextRender } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap, tap } from 'rxjs';
import { CatalogService } from '../../service/catalog.service';
import { CartService, FREE_DELIVERY_FROM } from '../../service/cartService/cart.service';
import { WishlistService } from "../../service/wishList'/wishlist.service";
import { AuthService } from '../../service/auth.service';
import { InrPipe, formatInr } from '../../ui/price.pipe';
import { ONE_SIZE, Product, sizesOf } from '../../ui/models';
import { SizePickerComponent } from '../size-picker/size-picker.component';
import { SizeGuideComponent } from '../size-guide/size-guide.component';
import { ProductCardComponent } from '../product-card/product-card.component';

@Component({
  selector: 'app-product-information',
  imports: [NgOptimizedImage, RouterLink, InrPipe, SizePickerComponent, SizeGuideComponent, ProductCardComponent],
  templateUrl: './product-information.component.html',
})
export class ProductInformationComponent {
  private route = inject(ActivatedRoute);
  private catalog = inject(CatalogService);
  private title = inject(Title);
  private wishlist = inject(WishlistService);
  private auth = inject(AuthService);
  readonly bag = inject(CartService);

  readonly product = signal<Product | null>(null);
  readonly related = signal<Product[]>([]);
  readonly state = signal<'loading' | 'ready' | 'missing'>('loading');
  readonly size = signal<string | null>(null);
  readonly sizeError = signal<string | null>(null);
  readonly saveStatus = signal('');
  readonly showStickyBar = signal(false);
  readonly freeFrom = formatInr(FREE_DELIVERY_FROM);

  private picker = viewChild<ElementRef<HTMLElement>>('picker');
  private addButton = viewChild<ElementRef<HTMLElement>>('addButton');

  readonly gallery = computed(() => (this.product()?.images ?? []).filter(i => i.role !== 'look'));
  readonly composition = computed(() =>
    (this.product()?.fabric?.composition ?? []).map(c => `${c.percent}% ${c.fiber.toLowerCase()}`).join(', '));
  readonly soldOut = computed(() => { const p = this.product(); return !!p && sizesOf(p).every(v => v.stock < 1); });

  constructor() {
    const destroyRef = inject(DestroyRef);
    this.route.paramMap.pipe(
      tap(() => { this.state.set('loading'); this.size.set(null); this.sizeError.set(null); this.saveStatus.set(''); }),
      switchMap(params => this.catalog.product(params.get('id') ?? '')),
      takeUntilDestroyed(),
    ).subscribe({
      next: product => {
        this.product.set(product);
        this.state.set('ready');
        this.title.setTitle(`${product.name}${product.colorway ? ', ' + product.colorway.name : ''} — KŌRA`);
        // A product with one size (admin-created) needs no choice.
        const sizes = sizesOf(product);
        if (sizes.length === 1 && sizes[0].stock > 0) this.size.set(sizes[0].size);
        this.loadRelated(product);
      },
      error: () => { this.state.set('missing'); this.title.setTitle('Piece not found — KŌRA'); },
    });

    // Show the small-screen sticky "Add to bag" bar once the main button scrolls away.
    afterNextRender(() => {
      const observer = new IntersectionObserver(([entry]) => this.showStickyBar.set(!entry.isIntersecting && entry.boundingClientRect.top < 0));
      const watch = () => { const el = this.addButton()?.nativeElement; if (el) observer.observe(el); else setTimeout(watch, 200); };
      watch();
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  addToBag(): void {
    const product = this.product();
    if (!product) return;
    const size = this.size() ?? (sizesOf(product).length === 1 ? ONE_SIZE : null);
    if (!size) {
      this.sizeError.set('Choose a size to add this piece to your bag.');
      const host = this.picker()?.nativeElement;
      host?.scrollIntoView({ block: 'center' });
      host?.querySelector<HTMLInputElement>('input[type=radio]:not(:disabled)')?.focus({ preventScroll: true });
      return;
    }
    this.sizeError.set(null);
    this.bag.add(product, size).subscribe();
  }

  onSizeChange(size: string | null): void {
    this.size.set(size);
    if (size) this.sizeError.set(null);
  }

  save(): void {
    const product = this.product();
    if (!product) return;
    if (!this.auth.isLoggedIn()) {
      this.saveStatus.set('signin');
      return;
    }
    this.wishlist.addItemToWishList(product._id).subscribe({
      next: () => this.saveStatus.set('saved'),
      error: () => this.saveStatus.set('error'),
    });
  }

  private loadRelated(product: Product): void {
    const edition = product.edition?.slug;
    this.catalog.products({ edition, exclude: product._id, limit: 4, featured: true }).subscribe({
      next: res => this.related.set(res.products.slice(0, 4)),
      error: () => this.related.set([]),
    });
  }
}
