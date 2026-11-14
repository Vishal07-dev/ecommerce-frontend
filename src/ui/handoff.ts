import { Injectable } from '@angular/core';
import gsap from 'gsap';

/**
 * KŌRA "pick up": product card → product page.
 *
 * Clicking a card lifts its photograph off the grid like a garment picked up
 * from a table (a small rise and shadow). The page changes underneath, and
 * when the product page's lead photo is ready the lifted photo glides into
 * that exact spot, swaying a little as cloth does when it's carried, then
 * hands over to the real image.
 *
 * Purely decorative: the overlay is aria-hidden, navigation never waits on
 * it, and it does nothing under reduced motion or for modified clicks.
 */
@Injectable({ providedIn: 'root' })
export class HandoffService {
  private carried: HTMLElement | null = null;
  private timer?: ReturnType<typeof setTimeout>;

  /** True while a photo is in the air; the route transition stands aside. */
  get active(): boolean { return !!this.carried; }

  lift(event: MouseEvent, card: HTMLElement): void {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // The photo the shopper is looking at: the hover image if it is showing.
    const imgs = [...card.querySelectorAll<HTMLImageElement>('img')];
    const img = imgs.reverse().find(i => getComputedStyle(i).opacity === '1') ?? imgs[imgs.length - 1];
    if (!img?.currentSrc) return;
    this.drop();

    const r = img.getBoundingClientRect();
    const box = document.createElement('div');
    box.className = 'handoff';
    box.setAttribute('aria-hidden', 'true');
    Object.assign(box.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
    const clone = new Image();
    clone.src = img.currentSrc;
    clone.alt = '';
    box.append(clone);
    document.body.append(box);
    this.carried = box;

    gsap.to(box, { scale: 1.03, y: -6, boxShadow: '0 30px 60px -20px oklch(0 0 0 / 0.35)', duration: 0.35, ease: 'power2.out' });
    // If the product page never reports in (slow network, error), let go.
    this.timer = setTimeout(() => this.drop(true), 4000);
  }

  /** Called by the product page once its lead photo is laid out. */
  land(target: HTMLElement): void {
    const box = this.carried;
    if (!box) return;
    clearTimeout(this.timer);
    const t = target.getBoundingClientRect();
    target.style.visibility = 'hidden';

    gsap.timeline({
      onComplete: () => {
        target.style.visibility = '';
        gsap.to(box, { opacity: 0, duration: 0.2, onComplete: () => box.remove() });
        if (this.carried === box) this.carried = null;
      },
    })
      .to(box, {
        left: t.left, top: t.top, width: t.width, height: t.height,
        scale: 1, y: 0,
        boxShadow: '0 0 0 0 oklch(0 0 0 / 0)',
        duration: 0.85, ease: 'expo.inOut',
      }, 0)
      // The sway: a slight skew that peaks mid-flight and settles.
      .to(box, { skewY: -2.5, duration: 0.4, ease: 'sine.out' }, 0.05)
      .to(box, { skewY: 0, duration: 0.45, ease: 'sine.inOut' }, 0.45);
  }

  drop(fade = false): void {
    clearTimeout(this.timer);
    const box = this.carried;
    this.carried = null;
    if (!box) return;
    if (fade) gsap.to(box, { opacity: 0, duration: 0.25, onComplete: () => box.remove() });
    else box.remove();
  }
}
