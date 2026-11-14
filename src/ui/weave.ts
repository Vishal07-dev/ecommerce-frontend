import { Directive, DestroyRef, ElementRef, NgZone, afterNextRender, inject, input } from '@angular/core';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * KŌRA signature reveal: "warp lift".
 *
 * Kōra is cloth fresh off the loom, so photographs arrive the way cloth is
 * made. A single weft thread is laid across the frame, then alternate warp
 * threads lift and drop away from that line, opening from the centre out
 * (the shed of a loom), and the picture underneath is revealed.
 *
 * The overlay is built in JavaScript, so without JS or under reduced motion
 * the image is simply there. `frame` must clip (position: relative and
 * overflow: hidden, which `.media` already has).
 */
export function warpLift(frame: HTMLElement, opts: { threads?: number } = {}): gsap.core.Timeline {
  const n = opts.threads ?? (frame.clientWidth < 420 ? 5 : frame.clientWidth < 900 ? 7 : 9);
  const loom = document.createElement('div');
  loom.className = 'weave';
  loom.setAttribute('aria-hidden', 'true');
  const threads: HTMLElement[] = [];
  for (let i = 0; i < n; i++) {
    const t = document.createElement('span');
    loom.append(t);
    threads.push(t);
  }
  const weft = document.createElement('i');
  weft.className = 'weave-weft';
  loom.append(weft);
  frame.append(loom);

  const centre = (n - 1) / 2;
  const tl = gsap.timeline({ paused: true, onComplete: () => loom.remove() });
  tl.fromTo(weft, { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: 'power3.inOut' }, 0)
    .to(weft, { opacity: 0, duration: 0.25, ease: 'none' }, 0.55);
  threads.forEach((t, i) => {
    tl.to(t, {
      yPercent: i % 2 === 0 ? -101 : 101, // alternate heddles: up, down, up…
      duration: 1.05,
      ease: 'expo.inOut',
    }, 0.32 + Math.abs(i - centre) * 0.055);
  });
  return tl;
}

/**
 * `<div class="media" weave>`: plays the warp lift the first time the frame
 * scrolls into view.
 */
@Directive({ selector: '[weave]' })
export class WeaveDirective {
  readonly weave = input<number | ''>('');

  constructor() {
    const el = inject(ElementRef<HTMLElement>);
    const zone = inject(NgZone);
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const mm = zone.runOutsideAngular(() => {
        const m = gsap.matchMedia();
        m.add('(prefers-reduced-motion: no-preference)', () => {
          const threads = Number(this.weave()) || undefined;
          const tl = warpLift(el.nativeElement as HTMLElement, { threads });
          ScrollTrigger.create({
            trigger: el.nativeElement,
            start: 'top 82%',
            once: true,
            onEnter: () => tl.play(),
          });
          return () => { tl.progress(1); tl.kill(); };
        });
        return m;
      });
      destroyRef.onDestroy(() => mm.revert());
    });
  }
}
