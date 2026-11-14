import { Component, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { CatalogService } from '../../service/catalog.service';
import { RevealDirective } from '../../ui/reveal.directive';
import { WeaveDirective } from '../../ui/weave';
import { ParallaxDirective } from '../../ui/parallax.directive';

/** Where the cloth comes from. Matches the fabric origins on the products. */
const MILLS = [
  { place: 'Tiruppur', country: 'India', cloth: 'Cotton jersey for the tees, hoodie and dress, knitted and garment-dyed' },
  { place: 'Ludhiana', country: 'India', cloth: 'Rib knits and a fine wool crepe' },
  { place: 'Ahmedabad', country: 'India', cloth: 'Cotton voile for summer shirts' },
  { place: 'Bhilwara', country: 'India', cloth: 'Heavy cotton twill for trousers' },
  { place: 'Biella', country: 'Italy', cloth: 'Brushed melton for the long coat' },
  { place: 'Prato', country: 'Italy', cloth: 'Boiled wool' },
  { place: 'Yorkshire', country: 'England', cloth: 'Cotton gabardine for the field coat' },
];

const PRINCIPLES = [
  { title: 'Fewer pieces', body: 'A short list of garments you reach for every day, made in small runs and released when they’re ready, not on a fashion calendar.' },
  { title: 'Heavier cloth', body: 'Dense cottons, honest wool and knits from slow frames. Weight is what lets a tee keep its shape and a coat keep its line.' },
  { title: 'Made to be worn for years', body: 'Fewer seams that fail, and cuts plain enough that they don’t date.' },
];

@Component({
  selector: 'app-about-page',
  imports: [NgOptimizedImage, RouterLink, RevealDirective, WeaveDirective, ParallaxDirective],
  template: `
    <!-- Opener -->
    <section class="page pt-12 md:pt-20" aria-labelledby="about-title">
      <p class="type-label text-fg-3">About KŌRA</p>
      <h1 id="about-title" class="type-display-xl mt-4 max-w-[14ch]">Cloth, as it leaves the <em>loom.</em></h1>
      <div class="mt-10 grid gap-6 md:grid-cols-12">
        <p class="type-body text-fg-2 measure md:col-span-6 md:col-start-7">
          KŌRA makes everyday garments in heavy cotton and honest wool, designed in Ahmedabad and made with mills we know by name.
          This is how we work, and why.
        </p>
      </div>
    </section>

    @if (assets()['fabric-flow']; as a) {
      <figure class="page mt-16 md:mt-24">
        <div class="media aspect-[3/2] md:aspect-[21/9]" weave>
          <div class="absolute inset-0" parallax="6">
            <img [ngSrc]="a.url" fill sizes="100vw" priority [alt]="a.alt" />
          </div>
        </div>
        @if (a.credit) {
          <figcaption class="mt-2 type-label text-fg-3">Photo: <a [href]="a.credit.url" target="_blank" rel="noopener" class="hover:underline">{{ a.credit.name }}</a></figcaption>
        }
      </figure>
    }

    <!-- The name -->
    <section class="page section-y grid gap-10 md:grid-cols-12" aria-labelledby="name-title">
      <div class="md:col-span-4">
        <p class="type-label text-fg-3" reveal>The name</p>
        <h2 id="name-title" class="type-display mt-4" reveal [revealOrder]="1">Kōra <span class="text-fg-3" lang="hi">कोरा</span></h2>
      </div>
      <div class="flex flex-col gap-5 md:col-span-6 md:col-start-7">
        <p class="type-body text-fg-2 measure" reveal>
          In Hindi, <em>kōra</em> is cloth as it comes off the loom: unbleached, unwashed, not yet cut. A kōra sheet is a new one.
          It’s the plainest state a fabric can be in, and the most honest, because there is nothing yet to hide a weak weave.
        </p>
        <p class="type-body text-fg-2 measure" reveal [revealOrder]="1">
          We start every garment there. If the cloth isn’t good on its own, no finish or print will make it so.
        </p>
      </div>
    </section>

    <!-- How we work -->
    <section class="border-t border-line" aria-labelledby="work-title">
      <div class="page section-y">
        <h2 id="work-title" class="type-h1" reveal>How we work</h2>
        <div class="mt-12 grid gap-12 md:mt-16 md:grid-cols-12 md:gap-8">
          <ul class="flex flex-col divide-y divide-line border-y border-line md:col-span-6">
            @for (p of principles; track p.title; let i = $index) {
              <li class="py-8" reveal [revealOrder]="i">
                <h3 class="type-h2">{{ p.title }}</h3>
                <p class="mt-3 type-body text-fg-2 measure">{{ p.body }}</p>
              </li>
            }
          </ul>
          <div class="grid grid-cols-2 gap-3 self-start md:col-span-5 md:col-start-8 md:sticky md:top-24">
            @if (assets()['texture-woven']; as a) {
              <figure class="col-span-2">
                <div class="media aspect-[4/3]" weave><img [ngSrc]="a.url" fill sizes="(min-width: 768px) 40vw, 100vw" [alt]="a.alt" /></div>
              </figure>
            }
            @if (assets()['texture-knit']; as a) {
              <figure>
                <div class="media aspect-square" weave><img [ngSrc]="a.url" fill sizes="(min-width: 768px) 20vw, 50vw" [alt]="a.alt" /></div>
              </figure>
            }
            @if (assets()['brand-note']; as a) {
              <figure>
                <div class="media aspect-square" weave><img [ngSrc]="a.url" fill sizes="(min-width: 768px) 20vw, 50vw" [alt]="a.alt" /></div>
              </figure>
            }
          </div>
        </div>
      </div>
    </section>

    <!-- Where it's made -->
    <section class="border-t border-line" aria-labelledby="mills-title">
      <div class="page section-y grid gap-10 md:grid-cols-12">
        <div class="md:col-span-4">
          <h2 id="mills-title" class="type-h1" reveal>Where the cloth comes from</h2>
          <p class="mt-4 type-body text-fg-2 measure" reveal [revealOrder]="1">
            Every product page names the mill town behind its fabric. Most of it is made in India; a few wools come from mills in Italy and England that have done one thing well for generations.
          </p>
        </div>
        <dl class="divide-y divide-line border-y border-line md:col-span-7 md:col-start-6">
          @for (m of mills; track m.place; let i = $index) {
            <div class="grid gap-1 py-5 sm:grid-cols-[12rem_1fr] sm:gap-6" reveal [revealOrder]="i % 4">
              <dt class="type-h3">{{ m.place }} <span class="type-label ms-1 text-fg-3">{{ m.country }}</span></dt>
              <dd class="type-body text-fg-2">{{ m.cloth }}</dd>
            </div>
          }
        </dl>
      </div>
    </section>

    <!-- Close -->
    <section class="border-t border-line" aria-labelledby="close-title">
      <div class="page section-y text-center">
        <h2 id="close-title" class="type-display mx-auto max-w-[18ch]" reveal>See it in the cloth, <em>not the copy.</em></h2>
        <div class="mt-10 flex flex-wrap justify-center gap-3" reveal [revealOrder]="1">
          <a routerLink="/shop" class="btn btn-solid">Shop the edition</a>
          <a routerLink="/contact" class="btn btn-quiet">Ask us anything</a>
        </div>
      </div>
    </section>
  `,
})
export class AboutPageComponent {
  readonly assets = toSignal(inject(CatalogService).assets(), { initialValue: {} as Record<string, never> });
  readonly principles = PRINCIPLES;
  readonly mills = MILLS;

  constructor() { inject(Title).setTitle('About — KŌRA'); }
}
