/**
 * Native <dialog> helpers. showModal() gives us the focus trap, an inert
 * page, Escape handling and focus restoration for free; these add the
 * enter/exit transition (styles.css §7) around it.
 */
export function openDialog(dialog: HTMLDialogElement): void {
  if (dialog.open) return;
  dialog.showModal();
  requestAnimationFrame(() => dialog.classList.add('is-open'));
}

export function closeDialog(dialog: HTMLDialogElement, done?: () => void): void {
  if (!dialog.open) return;
  dialog.classList.remove('is-open');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finish = () => { if (dialog.open) dialog.close(); done?.(); };
  if (reduced) { setTimeout(finish, 200); return; }
  let finished = false;
  const once = () => { if (!finished) { finished = true; finish(); } };
  dialog.addEventListener('transitionend', once, { once: true });
  setTimeout(once, 450); // in case no transition runs
}

/** Close when the click lands on the backdrop, not inside the panel. */
export function isBackdropClick(event: MouseEvent, dialog: HTMLDialogElement): boolean {
  if (event.target !== dialog) return false;
  const r = dialog.getBoundingClientRect();
  return event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom;
}
