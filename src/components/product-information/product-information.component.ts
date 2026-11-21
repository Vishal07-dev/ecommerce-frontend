import { Component, DestroyRef, ElementRef, Injector, computed, inject, signal, viewChild, afterNextRender } from '@angular/core';
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
import { HandoffService } from '../../ui/handoff';
import { MotionService } from '../../ui/motion.service';
import { thumb } from '../../ui/image';
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
  readonly wishlistError = computed(() => this.wishlist.error() ?? 'We couldn’t save this piece. Try again in a moment.');
  private auth = inject(AuthService);
  readonly bag = inject(CartService);
  private handoff = inject(HandoffService);
  private injector = inject(Injector);

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
  private galleryList = viewChild<ElementRef<HTMLElement>>('galleryList');
  private motion = inject(MotionService);
  private galleryObserver?: IntersectionObserver;
  /** Which gallery photo is most in view (drives the thumbnail strip). */
  readonly inView = signal(0);
  readonly thumb = thumb;

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
        this.inView.set(0);
        afterNextRender(() => this.watchGallery(), { injector: this.injector });
        // Pick up: a photo carried from a product card lands on the lead photo.
        afterNextRender(() => requestAnimationFrame(() => {
          const lead = document.querySelector<HTMLElement>('[data-lead-photo]');
          if (lead) this.handoff.land(lead); else this.handoff.drop(true);
        }), { injector: this.injector });
      },
      error: () => { this.state.set('missing'); this.title.setTitle('Piece not found — KŌRA'); },
    });

    // Show the small-screen sticky "Add to bag" bar once the main button scrolls away.
    afterNextRender(() => {
      const observer = new IntersectionObserver(([entry]) => this.showStickyBar.set(!entry.isIntersecting && entry.boundingClientRect.top < 0));
      const watch = () => { const el = this.addButton()?.nativeElement; if (el) observer.observe(el); else setTimeout(watch, 200); };
      watch();
      destroyRef.onDestroy(() => { observer.disconnect(); this.galleryObserver?.disconnect(); });
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

  /** Whether this piece is in the shopper's saved list (shared with every heart on the site). */
  readonly isSaved = computed(() => { const p = this.product(); return !!p && this.wishlist.items().some(i => i._id === p._id); });
  readonly guest = computed(() => !this.auth.isLoggedIn());

  save(): void {
    const product = this.product();
    if (!product) return;
    this.wishlist.toggle(product).subscribe(saved =>
      this.saveStatus.set(this.wishlist.error() ? 'error' : saved ? 'saved' : 'removed'));
  }

  private loadRelated(product: Product): void {
    const edition = product.edition?.slug;
    this.catalog.products({ edition, exclude: product._id, limit: 4 }).subscribe({
      next: res => this.related.set(res.products.slice(0, 4)),
      error: () => this.related.set([]),
    });
  }

  /** Desktop gallery: track the photo crossing the middle of the screen. */
  private watchGallery(): void {
    this.galleryObserver?.disconnect();
    const list = this.galleryList()?.nativeElement;
    if (!list) return;
    this.galleryObserver = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (e.isIntersecting) this.inView.set(Number((e.target as HTMLElement).dataset['galleryIndex']));
      }
    }, { rootMargin: '-45% 0px -45% 0px' });
    list.querySelectorAll('[data-gallery-index]').forEach(el => this.galleryObserver!.observe(el));
  }

  jumpTo(i: number): void {
    const el = this.galleryList()?.nativeElement.querySelector<HTMLElement>('[data-gallery-index="' + i + '"]');
    if (el) this.motion.scrollToElement(el);
    this.inView.set(i);
  }
}
