import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private darkClass = 'dark';
  private lightClass = 'light';

  constructor() {
    this.loadInitialTheme();
  }

  toggleTheme(): void {
    const htmlEl = document.documentElement;
    const isDark = htmlEl.classList.contains(this.darkClass);

    if (isDark) {
      htmlEl.classList.remove(this.darkClass);
      htmlEl.classList.add(this.lightClass);
      localStorage.setItem('theme', 'light');
    } else {
      htmlEl.classList.add(this.darkClass);
      htmlEl.classList.remove(this.lightClass);
      localStorage.setItem('theme', 'dark');
    }
  }

  private loadInitialTheme(): void {
    const htmlEl = document.documentElement;
    const userPref = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (userPref === 'dark' || (!userPref && systemPrefersDark)) {
      htmlEl.classList.add(this.darkClass);
      htmlEl.classList.remove(this.lightClass);
    } else {
      htmlEl.classList.remove(this.darkClass);
      htmlEl.classList.add(this.lightClass);
    }
  }
}
