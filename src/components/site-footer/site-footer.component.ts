import { Component, DestroyRef, ElementRef, NgZone, afterNextRender, inject, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CatalogService } from '../../service/catalog.service';

gsap.registerPlugin(ScrollTrigger);

/**
 * An ink footer that closes every page like the back cover of a lookbook.
 * Finale: the full-width KŌRA wordmark rises letter by letter out of its masks,
 * scrubbed to the last stretch of scrolling, so the page "signs off" as you
 * reach the end. Under reduced motion the wordmark is simply set.
 */
@Component({
  selector: 'app-site-footer',
  imports: [RouterLink],
  templateUrl: './site-footer.component.html',
})
export class SiteFooterComponent {
  private catalog = inject(CatalogService);
  readonly editions = toSignal(this.catalog.editions(), { initialValue: [] });
  readonly credits = toSignal(this.catalog.credits(), { initialValue: [] });
  readonly year = new Date().getFullYear();
  readonly letters = ['K', 'Ō', 'R', 'A'];

  private mark = viewChild.required<ElementRef<HTMLElement>>('mark');

  constructor() {
    const zone = inject(NgZone);
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const mm = zone.runOutsideAngular(() => {
        const m = gsap.matchMedia();
        m.add('(prefers-reduced-motion: no-preference)', () => {
          const mark = this.mark().nativeElement;
          gsap.fromTo(mark.querySelectorAll('[data-mark-char]'),
            { yPercent: 105 },
            {
              yPercent: 0,
              ease: 'none',
              stagger: 0.12,
              scrollTrigger: { trigger: mark, start: 'top bottom', end: 'bottom bottom', scrub: 0.6 },
            });
        });
        return m;
      });
      destroyRef.onDestroy(() => mm.revert());
    });
  }
}
