import { Component, ElementRef, effect, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../service/auth.service';
import { CartService } from '../../service/cartService/cart.service';
import { ThemeService } from '../../service/theme/theme.service';
import { MotionService } from '../../ui/motion.service';
import { closeDialog, isBackdropClick, openDialog } from '../../ui/dialog';

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './site-header.component.html',
  // The host must not box the header in, or position: sticky has no room to stick.
  host: { class: 'contents' },
})
export class SiteHeaderComponent {
  readonly auth = inject(AuthService);
  readonly bag = inject(CartService);
  readonly theme = inject(ThemeService);
  private motion = inject(MotionService);
  private router = inject(Router);

  readonly signedIn = toSignal(this.auth.loggedIn$, { initialValue: this.auth.isLoggedIn() });
  readonly menuOpen = signal(false);
  private menu = viewChild.required<ElementRef<HTMLDialogElement>>('menu');

  readonly nav = [
    { label: 'Shop', link: '/shop' },
    { label: 'Lookbook', link: '/lookbook' },
    { label: 'About', link: '/about' },
  ];

  constructor() {
    effect(() => {
      const dialog = this.menu().nativeElement;
      if (this.menuOpen()) { this.motion.stop(); openDialog(dialog); }
      else closeDialog(dialog, () => this.motion.start());
    });
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.menuOpen.set(false));
  }

  isAdmin(): boolean { return this.signedIn() && this.auth.getUserRole() === 'admin'; }

  onMenuCancel(event: Event): void { event.preventDefault(); this.menuOpen.set(false); }
  onMenuClick(event: MouseEvent): void {
    if (isBackdropClick(event, this.menu().nativeElement)) this.menuOpen.set(false);
  }

  signOut(): void { this.menuOpen.set(false); this.auth.logout(); }
}
