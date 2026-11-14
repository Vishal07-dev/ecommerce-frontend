import { Component, ElementRef, Injector, afterNextRender, computed, inject, signal, viewChild } from '@angular/core';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { map } from 'rxjs';
import { CatalogService } from '../../service/catalog.service';
import { Product, sizesOf } from '../../ui/models';
import { ProductCardComponent } from '../product-card/product-card.component';
import { RevealDirective } from '../../ui/reveal.directive';
import { SplitLinesDirective } from '../../ui/split-lines';

gsap.registerPlugin(Flip);

export type Density = 2 | 3 | 4;
const DENSITY_KEY = 'kora.density';

type Sort = 'featured' | 'newest' | 'price-asc' | 'price-desc';

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', '28', '30', '32', '34', '36', 'One size'];

@Component({
  selector: 'app-shop-page',
  imports: [RouterLink, ProductCardComponent, RevealDirective, SplitLinesDirective],
  templateUrl: './shop-page.component.html',
})
export class ShopPageComponent {
  private catalog = inject(CatalogService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private title = inject(Title);
  private injector = inject(Injector);
  private grid = viewChild<ElementRef<HTMLElement>>('grid');

  /** Pieces per row on wide screens. Phones always show two. */
  readonly density = signal<Density>(readDensity());
  readonly densities: Density[] = [2, 3, 4];
  readonly dots: Record<Density, number[]> = { 2: [1, 2], 3: [1, 2, 3], 4: [1, 2, 3, 4] };
  readonly gridClass = computed(() => ({ 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-3 lg:grid-cols-4' })[this.density()]);

  readonly all = signal<Product[]>([]);
  readonly state = signal<'loading' | 'ready' | 'error'>('loading');
  readonly editions = toSignal(this.catalog.editions(), { initialValue: [] });

  private params = toSignal(this.route.queryParamMap.pipe(map(p => ({
    edition: p.get('edition') ?? '',
    category: p.get('category') ?? '',
    size: p.get('size') ?? '',
    sort: (p.get('sort') as Sort) ?? 'featured',
  }))), { requireSync: true });

  readonly edition = computed(() => this.editions().find(e => e.slug === this.params().edition) ?? null);
  readonly filters = computed(() => this.params());

  readonly categories = computed(() => {
    const names = new Set(this.all().map(p => p.category?.name).filter((n): n is string => !!n));
    return [...names].sort();
  });
  readonly sizes = computed(() => {
    const set = new Set(this.all().flatMap(p => sizesOf(p).map(v => v.size)));
    return SIZE_ORDER.filter(s => set.has(s));
  });

  readonly results = computed(() => {
    const f = this.params();
    let list = this.all().filter(p =>
      (!f.edition || p.edition?.slug === f.edition) &&
      (!f.category || p.category?.name === f.category) &&
      (!f.size || sizesOf(p).some(v => v.size === f.size && v.stock > 0)));
    switch (f.sort) {
      case 'price-asc': list = [...list].sort((a, b) => a.price - b.price); break;
      case 'price-desc': list = [...list].sort((a, b) => b.price - a.price); break;
      case 'newest': list = [...list].reverse(); break;
    }
    return list;
  });

  readonly hasFilters = computed(() => !!(this.params().category || this.params().size));

  readonly resultLabel = computed(() => {
    const n = this.results().length;
    return new Intl.PluralRules('en-IN').select(n) === 'one' ? `${n} piece` : `${n} pieces`;
  });

  constructor() {
    this.catalog.products({ featured: true, limit: 100 }).subscribe({
      next: res => { this.all.set(res.products); this.state.set('ready'); },
      error: () => this.state.set('error'),
    });
    this.title.setTitle('Shop — KŌRA');
  }

  setFilter(key: 'category' | 'size' | 'sort', value: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [key]: value || null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  clearFilters(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: null, size: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  /** Editorial rhythm: every seventh card runs double width (not in the two-up view). */
  isFeature(index: number): boolean { return this.density() !== 2 && index % 7 === 0; }

  /**
   * "Re-hang": changing the view moves every piece from its old place to its
   * new one, like garments being re-spaced along a rail, instead of jumping.
   */
  setDensity(next: Density): void {
    if (next === this.density()) return;
    try { localStorage.setItem(DENSITY_KEY, String(next)); } catch { /* private mode */ }
    const grid = this.grid()?.nativeElement;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!grid || reduced) { this.density.set(next); return; }
    const state = Flip.getState(grid.querySelectorAll(':scope > li'));
    this.density.set(next);
    afterNextRender(() => {
      Flip.from(state, { duration: 0.75, ease: 'expo.inOut', stagger: 0.015, scale: true, absolute: false, nested: true });
    }, { injector: this.injector });
  }

  reload(): void { location.reload(); }
}

function readDensity(): Density {
  try {
    const v = Number(localStorage.getItem(DENSITY_KEY));
    if (v === 2 || v === 3 || v === 4) return v;
  } catch { /* storage unavailable */ }
  return 4;
}
