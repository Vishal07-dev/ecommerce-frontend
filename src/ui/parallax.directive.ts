import { Directive, DestroyRef, ElementRef, NgZone, afterNextRender, inject, input } from '@angular/core';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * GPU parallax for an image inside a clipping frame: the element is scaled up
 * slightly and drifts against the scroll. Transform only, scrubbed, and never
 * runs under prefers-reduced-motion (gsap.matchMedia reverts it if the
 * preference changes mid-visit).
 */
@Directive({ selector: '[parallax]' })
export class ParallaxDirective {
  /** Drift as a percentage of the element's height. */
  readonly parallax = input<number | string>(8);

  constructor() {
    const el = inject(ElementRef<HTMLElement>);
    const zone = inject(NgZone);
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const amount = Number(this.parallax()) || 8;
      const mm = zone.runOutsideAngular(() => {
        const m = gsap.matchMedia();
        m.add('(prefers-reduced-motion: no-preference)', () => {
          const node = el.nativeElement as HTMLElement;
          gsap.fromTo(node, { yPercent: -amount, scale: 1 + amount / 50 }, {
            yPercent: amount,
            ease: 'none',
            scrollTrigger: { trigger: node.parentElement ?? node, start: 'top bottom', end: 'bottom top', scrub: true },
          });
        });
        return m;
      });
      destroyRef.onDestroy(() => mm.revert());
    });
  }
}
