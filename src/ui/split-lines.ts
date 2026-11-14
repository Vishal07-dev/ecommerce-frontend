import { Directive, DestroyRef, ElementRef, NgZone, afterNextRender, inject, input } from '@angular/core';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

/**
 * "Set type". Display headings are typeset, not faded: each line rises out of
 * its own mask the first time the heading scrolls into view, the way a line of
 * metal type is dropped into a forme. The typographic partner of the warp lift.
 *
 * SplitText re-splits on resize and font load (autoSplit), and labels the
 * element for assistive tech, so screen readers hear the heading once.
 * Under reduced motion nothing is split.
 */
@Directive({ selector: '[splitLines]' })
export class SplitLinesDirective {
  /** Delay in seconds, to follow other motion. */
  readonly splitLines = input<number | ''>('');

  constructor() {
    const el = inject(ElementRef<HTMLElement>);
    const zone = inject(NgZone);
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const mm = zone.runOutsideAngular(() => {
        const m = gsap.matchMedia();
        m.add('(prefers-reduced-motion: no-preference)', () => {
          const node = el.nativeElement as HTMLElement;
          const split = SplitText.create(node, {
            type: 'lines',
            mask: 'lines',
            linesClass: 'split-line',
            autoSplit: true,
            onSplit: self => gsap.from(self.lines, {
              yPercent: 112,
              duration: 1.15,
              ease: 'expo.out',
              stagger: 0.09,
              delay: Number(this.splitLines()) || 0,
              scrollTrigger: { trigger: node, start: 'top 88%', once: true },
            }),
          });
          return () => split.revert();
        });
        return m;
      });
      destroyRef.onDestroy(() => mm.revert());
    });
  }
}
