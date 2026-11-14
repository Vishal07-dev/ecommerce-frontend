import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ViewTransitionInfo } from '@angular/router';
import { HandoffService } from './handoff';

/**
 * KŌRA "bolt unroll": page changes run as a View Transition. The incoming
 * page unrolls down over the outgoing one like cloth off a bolt, its leading
 * edge hanging at a slight angle before it settles; the outgoing page sinks
 * back under it. The keyframes live in styles.css §11b.
 *
 * Stands aside when: motion is reduced, only the query string changed (shop
 * filters), or a product photo is being carried to its page (pick up).
 */
export function onRouteTransition({ transition, from, to }: ViewTransitionInfo): void {
  const handoff = inject(HandoffService);
  // Skipping rejects these promises by design; keep them out of the console.
  transition.ready.catch(() => {});
  transition.finished.catch(() => {});
  transition.updateCallbackDone.catch(() => {});

  if (
    matchMedia('(prefers-reduced-motion: reduce)').matches ||
    handoff.active ||
    pageKey(from) === pageKey(to)
  ) {
    transition.skipTransition();
  }
}

/** The deepest matched route and its path params: same key = same page. */
function pageKey(snapshot: ActivatedRouteSnapshot): string {
  let s = snapshot;
  while (s.firstChild) s = s.firstChild;
  return `${s.routeConfig?.path ?? ''}|${JSON.stringify(s.params)}`;
}
