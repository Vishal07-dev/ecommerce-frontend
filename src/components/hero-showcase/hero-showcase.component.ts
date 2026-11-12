import { Component, DestroyRef, ElementRef, NgZone, afterNextRender, computed, inject, input, signal, viewChild } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CartService } from '../../service/cartService/cart.service';
import { InrPipe } from '../../ui/price.pipe';
import { MotionService } from '../../ui/motion.service';
import { Product, productLink, sizesOf } from '../../ui/models';
import { SizePickerComponent } from '../size-picker/size-picker.component';
import { cld } from '../../ui/image';

gsap.registerPlugin(ScrollTrigger);

/** Scroll position (0–1 through the track) where each stage is fully shown. */
const STAGE_AT = { intro: 0, fabric: 0.42, details: 0.7, shop: 0.96 } as const;
type Stage = keyof typeof STAGE_AT;
const STAGE_NAMES: Record<Stage, string> = { intro: 'The coat', fabric: 'The cloth', details: 'The details', shop: 'Make it yours' };

/**
 * Homepage centrepiece. A pinned stage that the scroll drives through four
 * beats: the garment in depth → a lens onto the real cloth → timed hotspot
 * callouts → a working quick-shop panel.
 *
 * Figure modes (chosen from the product's data, no code change needed):
 *   turntable — product.turntable has frames: scroll scrubs through a 360° spin
 *   flip      — product has 'front' and 'back' images: the figure turns in 3D
 *   still     — otherwise: one photograph with layered parallax and zoom
 */
@Component({
  selector: 'app-hero-showcase',
  imports: [NgOptimizedImage, RouterLink, InrPipe, SizePickerComponent],
  templateUrl: './hero-showcase.component.html',
})
export class HeroShowcaseComponent {
  readonly product = input.required<Product>();

  readonly bag = inject(CartService);
  private motion = inject(MotionService);
  private zone = inject(NgZone);

  private track = viewChild.required<ElementRef<HTMLElement>>('track');
  private stage = viewChild.required<ElementRef<HTMLElement>>('stage');
  private turntableImg = viewChild<ElementRef<HTMLImageElement>>('turntableImg');

  readonly size = signal<string | null>(null);
  readonly sizeError = signal<string | null>(null);
  readonly activeSpot = signal<number | null>(null);
  readonly stageNames = STAGE_NAMES;

  readonly mode = computed<'turntable' | 'flip' | 'still'>(() => {
    const p = this.product();
    if ((p.turntable?.length ?? 0) > 1) return 'turntable';
    const roles = new Set(p.images?.map(i => i.role));
    return roles.has('front') && roles.has('back') ? 'flip' : 'still';
  });
  readonly figure = computed(() => {
    const imgs = this.product().images ?? [];
    return imgs.find(i => i.role === 'cutout') ?? imgs.find(i => i.role === 'front') ?? imgs.find(i => i.role === 'model') ?? imgs[0];
  });
  readonly back = computed(() => this.product().images?.find(i => i.role === 'back'));
  readonly detail = computed(() => this.product().images?.find(i => i.role === 'detail'));
  readonly aspect = computed(() => {
    const f = this.figure();
    return f?.width && f?.height ? f.width / f.height : 2 / 3;
  });
  readonly hotspots = computed(() => this.product().hotspots ?? []);
  readonly lensAt = computed(() => this.hotspots()[0] ?? { x: 50, y: 40 });
  readonly link = computed(() => productLink(this.product()));
  readonly composition = computed(() =>
    (this.product().fabric?.composition ?? []).map(c => `${c.percent}% ${c.fiber.toLowerCase()}`).join(' · '));
  readonly turntableFrames = computed(() => (this.product().turntable ?? []).map(u => cld(u, 1200)));

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const mm = this.zone.runOutsideAngular(() => this.choreograph());
      destroyRef.onDestroy(() => mm.revert());
    });
  }

  // -------------------------------------------------------------------------
  // Interaction
  // -------------------------------------------------------------------------
  toggleSpot(i: number): void { this.activeSpot.set(this.activeSpot() === i ? null : i); }

  addToBag(): void {
    const p = this.product();
    const sizes = sizesOf(p);
    const size = this.size() ?? (sizes.length === 1 ? sizes[0].size : null);
    if (!size) { this.sizeError.set('Choose a size first.'); return; }
    this.sizeError.set(null);
    this.bag.add(p, size).subscribe();
  }

  onSizeChange(size: string | null): void {
    this.size.set(size);
    if (size) this.sizeError.set(null);
  }

  /**
   * Keyboard users tab into controls that belong to later stages. Scroll the
   * timeline to that stage so a focused control is never invisible.
   */
  onFocusIn(event: FocusEvent): void {
    if (this.motion.reducedMotion()) return;
    const stageEl = (event.target as HTMLElement).closest<HTMLElement>('[data-focus-stage]');
    const stage = stageEl?.dataset['focusStage'] as Stage | undefined;
    if (!stage) return;
    const track = this.track().nativeElement;
    const top = track.getBoundingClientRect().top + window.scrollY;
    const travel = track.offsetHeight - window.innerHeight;
    const target = top + STAGE_AT[stage] * travel;
    if (Math.abs(window.scrollY - target) > window.innerHeight * 0.15) {
      this.motion.scrollTo(target);
      // Skip the scrub's easing so the focused control is visible at once.
      requestAnimationFrame(() => {
        ScrollTrigger.update();
        this.timeline?.scrollTrigger?.getTween()?.progress(1);
      });
    }
  }

  private timeline?: gsap.core.Timeline;

  // -------------------------------------------------------------------------
  // Choreography. Runs only when motion is welcome; gsap.matchMedia reverts
  // every inline style if the preference or breakpoint changes.
  // -------------------------------------------------------------------------
  private choreograph(): gsap.MatchMedia {
    const mm = gsap.matchMedia();
    const root = this.stage().nativeElement;
    const q = gsap.utils.selector(root);
    const frames = this.turntableFrames();
    const mode = this.mode();
    const spot = this.lensAt();

    mm.add({
      wide: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
      narrow: '(max-width: 767px) and (prefers-reduced-motion: no-preference)',
    }, (ctx) => {
      const { wide } = ctx.conditions as { wide: boolean; narrow: boolean };
      const rail = root.querySelector<HTMLElement>('[data-hero-rail]');

      gsap.set(q('[data-hero-stage="fabric"], [data-hero-stage="details"], [data-hero-stage="shop"], [data-hero-spot]'), { opacity: 0 });
      gsap.set(q('[data-hero-figure]'), { transformOrigin: `${spot.x}% ${spot.y}%` });
      gsap.set(q('[data-hero-lens]'), { clipPath: 'circle(0% at 50% 50%)' });

      const tl = this.timeline = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: this.track().nativeElement,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.6,
          onUpdate: self => {
            const p = self.progress;
            const stage: Stage = p < 0.3 ? 'intro' : p < 0.56 ? 'fabric' : p < 0.84 ? 'details' : 'shop';
            if (rail && rail.dataset['stage'] !== stage) {
              rail.dataset['stage'] = stage;
              rail.textContent = `${String(Object.keys(STAGE_AT).indexOf(stage) + 1).padStart(2, '0')} / 04 · ${STAGE_NAMES[stage]}`;
            }
          },
        },
      });

      // Depth: the ghost headline drifts slower than the figure in front of it.
      tl.fromTo(q('[data-hero-ghost]'), { yPercent: 0, scale: 1 }, { yPercent: -18, scale: 1.08, duration: 10 }, 0);

      // 1 → 2: copy lifts away, the figure pushes in on the collar, the lens opens.
      tl.to(q('[data-hero-stage="intro"]'), { opacity: 0, y: -60, duration: 1.5, ease: 'power1.in' }, 1.2);
      tl.to(q('[data-hero-figure]'), { scale: wide ? 2.2 : 1.8, duration: 2.6, ease: 'power2.inOut' }, 1.4);
      if (mode === 'flip') tl.to(q('[data-hero-flip]'), { rotateY: 180, duration: 2.6, ease: 'power2.inOut' }, 1.4);
      if (mode === 'turntable' && frames.length > 1) {
        const img = this.turntableImg()?.nativeElement;
        const proxy = { frame: 0 };
        frames.forEach(src => { const pre = new Image(); pre.src = src; }); // warm the cache
        tl.to(proxy, {
          frame: frames.length - 1, duration: 6, snap: { frame: 1 },
          onUpdate: () => { if (img) img.src = frames[Math.round(proxy.frame)]; },
        }, 1.4);
      }
      tl.to(q('[data-hero-lens]'), { clipPath: 'circle(50% at 50% 50%)', duration: 1.2, ease: 'power2.out' }, 2.9);
      tl.fromTo(q('[data-hero-stage="fabric"]'), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power1.out' }, 3.1);

      // 2 → 3: lens closes, the figure settles back, hotspots arrive one by one.
      tl.to(q('[data-hero-lens]'), { clipPath: 'circle(0% at 50% 50%)', duration: 0.9, ease: 'power2.in' }, 5);
      tl.to(q('[data-hero-stage="fabric"]'), { opacity: 0, y: -12, duration: 0.6 }, 5);
      tl.to(q('[data-hero-figure]'), { scale: 1, duration: 1.2, ease: 'power2.inOut' }, 5.2);
      tl.to(q('[data-hero-stage="details"]'), { opacity: 1, duration: 0.4 }, 6.2);
      q('[data-hero-spot]').forEach((el, i) => {
        tl.fromTo(el, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2)' }, 6.3 + i * 0.45);
      });
      q('[data-hero-callout]').forEach((el, i) => {
        tl.fromTo(el, { opacity: 0.25 }, { opacity: 1, duration: 0.4 }, 6.3 + i * 0.45);
      });

      // 3 → 4: callouts clear, the figure steps aside, quick shop slides in.
      tl.to(q('[data-hero-stage="details"], [data-hero-spot]'), { opacity: 0, duration: 0.5 }, 8.3);
      if (wide) tl.to(q('[data-hero-figure-wrap]'), { xPercent: -62, duration: 1.2, ease: 'power2.inOut' }, 8.4);
      tl.fromTo(q('[data-hero-stage="shop"]'),
        wide ? { opacity: 0, x: 48 } : { opacity: 0, y: 48 },
        { opacity: 1, x: 0, y: 0, duration: 0.9, ease: 'power2.out' }, 8.9);
      tl.to({}, { duration: 0.6 }); // hold the final frame

      return () => { /* matchMedia reverts tweens and inline styles */ };
    });

    return mm;
  }
}
