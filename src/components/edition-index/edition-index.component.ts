import { Component, DestroyRef, ElementRef, NgZone, afterNextRender, inject, input, signal, viewChild } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import gsap from 'gsap';
import { Edition } from '../../ui/models';
import { SplitLinesDirective } from '../../ui/split-lines';

/**
 * Home: the editions as a typographic index, set like the contents page of a
 * printed lookbook. Pointing at an edition (or focusing it) brings its cover
 * up beside the pointer, a swatch pulled from the shelf, tilted slightly
 * and trailing the pointer with a little weight. The other rows recede.
 * Touch screens show a small cover inline on every row instead.
 */
@Component({
  selector: 'app-edition-index',
  imports: [NgOptimizedImage, RouterLink, SplitLinesDirective],
  template: `
    <section class="page section-y" aria-labelledby="editions-title">
      <div class="flex flex-wrap items-end justify-between gap-6">
        <h2 id="editions-title" class="type-display" splitLines>Editions</h2>
        <p class="type-body-sm text-fg-3">Small runs, released when they’re ready.</p>
      </div>

      <div #list class="ed-list relative mt-12 md:mt-16" (pointermove)="onMove($event)" (pointerleave)="setActive(null)">
        <ul class="border-t border-line">
          @for (e of editions(); track e._id; let i = $index) {
            <li class="border-b border-line">
              <a [routerLink]="['/shop']" [queryParams]="{ edition: e.slug }" class="ed-row"
                 [class.is-dim]="active() !== null && active() !== i"
                 (pointerenter)="setActive(i)" (focus)="focusRow(i, $event)" (blur)="setActive(null)">
                @if (e.cover; as c) {
                  <span class="ed-thumb media" aria-hidden="true">
                    <img [ngSrc]="c.url" width="96" height="120" alt="" />
                  </span>
                }
                <span class="ed-name">{{ e.name }}</span>
                <span class="ed-meta type-label text-fg-3">{{ e.season }}</span>
                <span class="ed-count type-price type-body-sm text-fg-2">{{ e.productCount }} {{ e.productCount === 1 ? 'piece' : 'pieces' }}</span>
                <svg class="ed-arrow" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5" stroke-linecap="round" stroke-linejoin="round" /></svg>
              </a>
            </li>
          }
        </ul>

        <!-- Floating cover (pointer devices only; decorative) -->
        <div #float class="ed-float" aria-hidden="true">
          @for (e of editions(); track e._id; let i = $index) {
            @if (e.cover; as c) {
              <img [ngSrc]="c.url" fill sizes="22rem" alt="" [class.is-on]="active() === i" />
            }
          }
        </div>
      </div>
    </section>
  `,
})
export class EditionIndexComponent {
  readonly editions = input.required<Edition[]>();
  readonly active = signal<number | null>(null);

  private list = viewChild.required<ElementRef<HTMLElement>>('list');
  private float = viewChild.required<ElementRef<HTMLElement>>('float');
  private zone = inject(NgZone);
  private moveX?: (v: number) => void;
  private moveY?: (v: number) => void;
  private tilt?: (v: number) => void;
  private lastX = 0;

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const mm = this.zone.runOutsideAngular(() => {
        const m = gsap.matchMedia();
        m.add('(hover: hover) and (prefers-reduced-motion: no-preference)', () => {
          const el = this.float().nativeElement;
          // Trails the pointer with a little weight, like a swatch being carried.
          this.moveX = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
          this.moveY = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
          this.tilt = gsap.quickTo(el, 'rotation', { duration: 0.8, ease: 'power3.out' });
          return () => { this.moveX = this.moveY = this.tilt = undefined; };
        });
        return m;
      });
      destroyRef.onDestroy(() => mm.revert());
    });
  }

  setActive(i: number | null): void {
    this.active.set(i);
    this.float().nativeElement.classList.toggle('is-shown', i !== null);
  }

  onMove(event: PointerEvent): void {
    if (event.pointerType !== 'mouse' || !this.moveX) return;
    const box = this.list().nativeElement.getBoundingClientRect();
    const x = event.clientX - box.left;
    this.moveX(x);
    this.moveY!(event.clientY - box.top);
    // Lean in the direction of travel, then settle.
    this.tilt!(gsap.utils.clamp(-6, 6, (x - this.lastX) * 0.4));
    this.lastX = x;
  }

  /** Keyboard focus parks the cover at the right of the focused row. */
  focusRow(i: number, event: FocusEvent): void {
    this.setActive(i);
    if (!this.moveX) return;
    const row = (event.target as HTMLElement).getBoundingClientRect();
    const box = this.list().nativeElement.getBoundingClientRect();
    this.moveX(box.width * 0.72);
    this.moveY!(row.top - box.top + row.height / 2);
    this.tilt!(0);
  }
}
