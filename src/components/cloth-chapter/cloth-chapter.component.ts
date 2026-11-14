import { Component, DestroyRef, ElementRef, NgZone, afterNextRender, inject, input, viewChild } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Asset } from '../../ui/models';
import { SplitLinesDirective } from '../../ui/split-lines';

gsap.registerPlugin(ScrollTrigger);

/**
 * Home, chapter two: "The cloth". An ink chapter that breaks the bone pages.
 *
 * Aperture: as the chapter crosses the screen, a photograph of the cloth opens
 * from a small window into a full-bleed frame, the way you'd unfold a bolt to
 * see the whole width. Behind it a single oversized word drifts sideways at a
 * different speed, so type and picture sit on separate planes.
 * Everything is scrubbed to normal scrolling; nothing is pinned.
 */
@Component({
  selector: 'app-cloth-chapter',
  imports: [NgOptimizedImage, RouterLink, SplitLinesDirective],
  template: `
    <!-- Follows the site theme; a slightly deeper tone marks it as its own chapter -->
    <section #root class="cloth" aria-labelledby="cloth-title">
      <div class="cloth-stage">
        <!-- Sits behind the photo: seen around the small window, covered as it opens -->
        <p data-cloth-word class="cloth-word" aria-hidden="true">Cloth&nbsp;first&nbsp;·&nbsp;Cloth&nbsp;first</p>
        <div data-cloth-aperture class="cloth-aperture">
          <div data-cloth-photo class="absolute inset-[-8%_0]">
            <img [ngSrc]="photo().url" fill sizes="100vw" [alt]="photo().alt" />
          </div>
        </div>
      </div>

      <div class="page cloth-copy">
        <div class="max-w-xl">
          <p class="type-label text-fg-3">The cloth</p>
          <h2 id="cloth-title" class="type-display mt-4" splitLines>Heavy, honest, <em>made slowly.</em></h2>
          <p class="mt-6 type-body text-fg-2 measure">
            Before anything is cut, the cloth has to be good on its own. Dense cotton that keeps its line, wool that softens instead of pilling, jersey knitted on slow frames.
          </p>
          <a routerLink="/about" class="mt-8 inline-flex min-h-11 items-center gap-2 type-body-sm font-medium link-underline">
            Where the cloth comes from
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5" stroke-linecap="round" stroke-linejoin="round" /></svg>
          </a>
        </div>
        @if (photo().credit; as c) {
          <p class="mt-10 type-label text-fg-3">Photo: <a [href]="c.url" target="_blank" rel="noopener" class="hover:underline">{{ c.name }}</a></p>
        }
      </div>
    </section>
  `,
})
export class ClothChapterComponent {
  readonly photo = input.required<Asset>();
  private root = viewChild.required<ElementRef<HTMLElement>>('root');

  constructor() {
    const zone = inject(NgZone);
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const mm = zone.runOutsideAngular(() => {
        const m = gsap.matchMedia();
        m.add({
          wide: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
          narrow: '(max-width: 767px) and (prefers-reduced-motion: no-preference)',
        }, ctx => {
          const { wide } = ctx.conditions as { wide: boolean };
          const root = this.root().nativeElement;
          const q = gsap.utils.selector(root);
          const crossing = { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true };

          // Aperture: a small window opens to the full frame by the time the
          // chapter's top reaches the upper third of the screen.
          gsap.fromTo(q('[data-cloth-aperture]'),
            { clipPath: wide ? 'inset(24% 34% 24% 34% round 14px)' : 'inset(18% 14% 18% 14% round 14px)' },
            { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none',
              scrollTrigger: { trigger: root, start: 'top 85%', end: 'top 15%', scrub: true } });
          gsap.fromTo(q('[data-cloth-photo]'), { yPercent: -6, scale: 1.25 }, { yPercent: 6, scale: 1, ease: 'none', scrollTrigger: crossing });
          // The word drifts against the scroll on its own plane.
          gsap.fromTo(q('[data-cloth-word]'), { xPercent: 0 }, { xPercent: -28, ease: 'none', scrollTrigger: crossing });
        });
        return m;
      });
      destroyRef.onDestroy(() => mm.revert());
    });
  }
}
