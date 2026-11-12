import { Injectable, signal } from '@angular/core';

// Light ("Bone & Ink") is the default. Dark is opt-in and remembered.
// The initial class is applied by an inline script in index.html before
// first paint; this service only keeps state and handles the toggle.
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly isDark = signal(document.documentElement.classList.contains('dark'));

  toggleTheme(): void {
    const html = document.documentElement;
    const next = !this.isDark();

    // Suppress every transition for the swap so colours don't smear.
    html.classList.add('theme-switching');
    html.classList.toggle('dark', next);
    void html.offsetHeight; // force a style flush
    requestAnimationFrame(() => html.classList.remove('theme-switching'));

    try { localStorage.setItem('theme', next ? 'dark' : 'light'); } catch { /* storage blocked */ }
    this.isDark.set(next);
  }
}
