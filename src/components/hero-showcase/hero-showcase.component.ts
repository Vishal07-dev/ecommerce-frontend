import { Component, DestroyRef, ElementRef, NgZone, afterNextRender, computed, inject, input, viewChild } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { InrPipe } from '../../ui/price.pipe';
import { Product, productLink } from '../../ui/models';
import { warpLift } from '../../ui/weave';

gsap.registerPlugin(ScrollTrigger);

/**
 * Homepage cover. One screen, no pinning: on load the photograph is revealed
 * by the warp lift (ui/weave.ts) and the headline lines rise out of their
 * masks; as the page
 * scrolls away the photo drifts inside its frame. With reduced motion the
 * cover is simply there.
 */
@Component({
  selector: 'app-hero-showcase',
  imports: [NgOptimizedImage, RouterLink, InrPipe],
  templateUrl: './hero-showcase.component.html',
})
export class HeroShowcaseComponent {
  readonly product = input.required<Product>();

  private zone = inject(NgZone);
  private root = viewChild.required<ElementRef<HTMLElement>>('root');

  readonly figure = computed(() => {
    const imgs = this.product().images ?? [];
    return imgs.find(i => i.role === 'model') ?? imgs.find(i => i.role === 'front') ?? imgs[0];
  });
  readonly ratio = computed(() => {
    const f = this.figure();
    return f?.width && f?.height ? `${f.width} / ${f.height}` : '4 / 5';
  });
  readonly link = computed(() => productLink(this.product()));

  /** Short caption chips on the photograph: cloth, weight, origin. */
  readonly facts = computed(() => {
    const f = this.product().fabric;
    if (!f) return [];
    const origin = f.origin?.match(/India/) ? 'Made in India' : undefined;
    return [f.weave, f.weightGsm ? `${f.weightGsm} gsm` : undefined, origin].filter((x): x is string => !!x);
  });

  readonly ticker = computed(() => {
    const p = this.product();
    const e = p.edition;
    const items = [
      e ? `${e.name}` : 'Everyday Garments',
      e?.season,
      p.name,
      ...(p.hotspots ?? []).map(h => h.label),
      'Cloth from Tiruppur to Biella',
      'Free delivery over ₹5,000',
    ].filter((x): x is string => !!x);
    return [...items, ...items];
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const mm = this.zone.runOutsideAngular(() => this.animate());
      destroyRef.onDestroy(() => mm.revert());
    });
  }

  private animate(): gsap.MatchMedia {
    const mm = gsap.matchMedia();
    const root = this.root().nativeElement;
    const q = gsap.utils.selector(root);

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      // Entrance: a single, short sequence (about 1.6 s), then it gets out of the way.
      const frame = root.querySelector<HTMLElement>('[data-hero-frame]')!;
      const lift = warpLift(frame, { threads: frame.clientWidth < 420 ? 7 : 11 });
      const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
      intro
        .add(lift.play(), 0)
        .fromTo(q('[data-hero-photo]'), { scale: 1.18 }, { scale: 1, duration: 2.2 }, 0.3)
        .fromTo(q('[data-hero-line]'), { yPercent: 110 }, { yPercent: 0, duration: 1.2, stagger: 0.12 }, 0.35)
        .fromTo(q('[data-hero-fade]'), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.08, ease: 'power2.out' }, 0.75)
        .fromTo(q('[data-hero-fact]'), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.07, ease: 'power2.out' }, 1.1);

      // Scroll away: the photo drifts inside its frame, the copy lifts a little faster.
      const scroll = { trigger: root, start: 'top top', end: 'bottom top', scrub: true };
      gsap.to(q('[data-hero-photo]'), { yPercent: 8, ease: 'none', scrollTrigger: scroll });
      gsap.to(q('[data-hero-copy]'), { y: -60, ease: 'none', scrollTrigger: scroll });
      return () => { lift.progress(1); lift.kill(); };
    });

    return mm;
  }
}
