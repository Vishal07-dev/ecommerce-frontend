import { Directive, ElementRef, OnDestroy, OnInit, inject, input } from '@angular/core';

/**
 * Staged entrance for infrequent moments (section headings, editorial blocks).
 * Children marked [reveal] enter 100ms apart when scrolled into view:
 * opacity + 4px blur + 12px rise over 300ms, opacity only under reduced motion
 * (the CSS in styles.css §8 handles both). Elements already in view on load
 * are shown immediately, so nothing is hidden waiting for a scroll.
 */
@Directive({ selector: '[reveal]', host: { 'data-reveal': '' } })
export class RevealDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef<HTMLElement>);
  /** Position in the stagger sequence: delay = order × 100ms. */
  readonly revealOrder = input(0);
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    const node = this.el.nativeElement as HTMLElement;
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9) return; // already visible: no entrance

    node.classList.add('is-pending');
    node.style.transitionDelay = `${this.revealOrder() * 100}ms`;
    this.observer = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) {
        node.classList.remove('is-pending');
        this.observer?.disconnect();
      }
    }, { rootMargin: '0px 0px -10% 0px' });
    this.observer.observe(node);
  }

  ngOnDestroy(): void { this.observer?.disconnect(); }
}
