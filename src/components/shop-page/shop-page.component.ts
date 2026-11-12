import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { map } from 'rxjs';
import { CatalogService } from '../../service/catalog.service';
import { Product, sizesOf } from '../../ui/models';
import { ProductCardComponent } from '../product-card/product-card.component';
import { RevealDirective } from '../../ui/reveal.directive';

type Sort = 'featured' | 'newest' | 'price-asc' | 'price-desc';

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', '28', '30', '32', '34', '36', 'One size'];

@Component({
  selector: 'app-shop-page',
  imports: [RouterLink, ProductCardComponent, RevealDirective],
  templateUrl: './shop-page.component.html',
})
export class ShopPageComponent {
  private catalog = inject(CatalogService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private title = inject(Title);

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

  /** Editorial rhythm: every seventh card runs double width on large screens. */
  isFeature(index: number): boolean { return index % 7 === 0; }

  reload(): void { location.reload(); }
}
