import { Injectable, NgZone, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

/**
 * Owns smooth scrolling (Lenis) and keeps GSAP ScrollTrigger in step with it.
 * Everything runs outside Angular's zone so scroll frames never trigger change
 * detection. Under prefers-reduced-motion, Lenis is never started and pages
 * fall back to native scrolling.
 */
@Injectable({ providedIn: 'root' })
export class MotionService {
  private zone = inject(NgZone);
  private router = inject(Router);
  private lenis: Lenis | null = null;
  private query = window.matchMedia('(prefers-reduced-motion: reduce)');

  readonly reducedMotion = signal(this.query.matches);

  init(): void {
    this.query.addEventListener('change', e => {
      this.reducedMotion.set(e.matches);
      e.matches ? this.destroyLenis() : this.startLenis();
    });
    if (!this.query.matches) this.startLenis();

    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.lenis?.scrollTo(0, { immediate: true, force: true });
      // Let the new view render, then re-measure every trigger.
      requestAnimationFrame(() => ScrollTrigger.refresh());
    });
  }

  /** Pause smooth scroll while a modal surface (bag, menu) owns scrolling. */
  stop(): void { this.lenis?.stop(); }
  start(): void { this.lenis?.start(); }

  /** Smooth-scroll an element to just under the sticky header. */
  scrollToElement(el: HTMLElement, offset = -96): void {
    if (this.lenis) this.lenis.scrollTo(el, { offset, duration: 1.1 });
    else el.scrollIntoView({ block: 'start', behavior: this.reducedMotion() ? 'auto' : 'smooth' });
  }

  scrollTo(y: number): void {
    if (this.lenis) this.lenis.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo({ top: y, behavior: 'instant' });
  }

  private startLenis(): void {
    if (this.lenis) return;
    this.zone.runOutsideAngular(() => {
      this.lenis = new Lenis({ lerp: 0.12, smoothWheel: true });
      this.lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(this.tick);
      gsap.ticker.lagSmoothing(0);
    });
  }

  private destroyLenis(): void {
    gsap.ticker.remove(this.tick);
    this.lenis?.destroy();
    this.lenis = null;
  }

  private tick = (time: number) => this.lenis?.raf(time * 1000);
}
