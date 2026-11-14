import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { CatalogService } from '../../service/catalog.service';
import { Asset, Product } from '../../ui/models';
import { HeroShowcaseComponent } from '../hero-showcase/hero-showcase.component';
import { LookSpreadComponent } from '../look-spread/look-spread.component';
import { ProductCardComponent } from '../product-card/product-card.component';
import { RevealDirective } from '../../ui/reveal.directive';
import { ParallaxDirective } from '../../ui/parallax.directive';
import { WeaveDirective } from '../../ui/weave';
import { SplitLinesDirective } from '../../ui/split-lines';
import { ClothChapterComponent } from '../cloth-chapter/cloth-chapter.component';
import { EditionIndexComponent } from '../edition-index/edition-index.component';

/** Grid rhythm for "The Edit": column span, image ratio and a vertical offset. */
const EDIT_LAYOUT = [
  { mobile: 'col-span-2', span: 'md:col-span-7', aspect: 'aspect-[4/5]', offset: '', sizes: '(min-width: 768px) 58vw, 100vw' },
  { mobile: 'col-span-2', span: 'md:col-span-5', aspect: 'aspect-[3/4]', offset: 'md:mt-40', sizes: '(min-width: 768px) 42vw, 100vw' },
  { mobile: 'col-span-1', span: 'md:col-span-4', aspect: 'aspect-[4/5]', offset: '', sizes: '(min-width: 768px) 33vw, 50vw' },
  { mobile: 'col-span-1', span: 'md:col-span-4', aspect: 'aspect-[4/5]', offset: 'md:mt-20', sizes: '(min-width: 768px) 33vw, 50vw' },
  { mobile: 'col-span-2', span: 'md:col-span-4', aspect: 'aspect-[4/5]', offset: '', sizes: '(min-width: 768px) 33vw, 100vw' },
  { mobile: 'col-span-2', span: 'md:col-span-5', aspect: 'aspect-[3/4]', offset: 'md:mt-24', sizes: '(min-width: 768px) 42vw, 100vw' },
  { mobile: 'col-span-2', span: 'md:col-span-7', aspect: 'aspect-[5/4]', offset: '', sizes: '(min-width: 768px) 58vw, 100vw' },
];

@Component({
  selector: 'app-home',
  imports: [NgOptimizedImage, RouterLink, HeroShowcaseComponent, LookSpreadComponent, ProductCardComponent, RevealDirective, ParallaxDirective, WeaveDirective, SplitLinesDirective, ClothChapterComponent, EditionIndexComponent],
  templateUrl: './home.component.html',
})
export class HomeComponent {
  private catalog = inject(CatalogService);

  readonly hero = signal<Product | null>(null);
  readonly heroState = signal<'loading' | 'ready' | 'missing'>('loading');
  readonly edit = signal<Product[]>([]);
  readonly looks = toSignal(this.catalog.looks(), { initialValue: [] });
  readonly editions = toSignal(this.catalog.editions(), { initialValue: [] });
  readonly assets = toSignal(this.catalog.assets(), { initialValue: {} as Record<string, Asset> });
  readonly layout = EDIT_LAYOUT;

  constructor() {
    inject(Title).setTitle('KŌRA — Everyday Garments');
    this.catalog.hero().subscribe({
      next: p => { this.hero.set(p); this.heroState.set('ready'); },
      error: () => this.heroState.set('missing'),
    });
    this.catalog.products({ featured: true, limit: 8 }).subscribe({
      next: res => this.edit.set(res.products.filter(p => p._id !== this.hero()?._id).slice(0, EDIT_LAYOUT.length)),
      error: () => this.edit.set([]),
    });
  }
}
