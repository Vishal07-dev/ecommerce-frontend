import { Component, DestroyRef, ElementRef, HostListener, computed, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { AuthService } from '../../service/auth.service';
import { ThemeService } from '../../service/theme/theme.service';
import { AdminLiveService } from '../live.service';
import { AdminNotification, AdminService, ROLE_LABEL, TeamRole } from '../admin.service';

interface NavItem { link: string; label: string; icon: string; roles: TeamRole[]; }

const NAV: NavItem[] = [
  { link: '/admin/dashboard', label: 'Overview', roles: ['owner', 'admin', 'staff'], icon: 'M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6v-9h-6v9Zm0-16v5h6V4h-6Z' },
  { link: '/admin/orders', label: 'Orders', roles: ['owner', 'admin', 'staff'], icon: 'M6 7h12l-1 13H7L6 7Zm3 0V6a3 3 0 0 1 6 0v1' },
  { link: '/admin/products', label: 'Products', roles: ['owner', 'admin'], icon: 'M4 8l8-4 8 4-8 4-8-4Zm0 0v8l8 4m8-12v8l-8 4m0-8v8' },
  { link: '/admin/customers', label: 'Customers', roles: ['owner', 'admin'], icon: 'M16 19v-1a4 4 0 0 0-8 0v1m4-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm6 8v-1a3 3 0 0 0-2-2.8M15.5 5.2a3 3 0 0 1 0 5.6' },
  { link: '/admin/category', label: 'Categories', roles: ['owner', 'admin'], icon: 'M4 6h7v5H4V6Zm9 0h7v5h-7V6ZM4 13h7v5H4v-5Zm9 0h7v5h-7v-5Z' },
  { link: '/admin/team', label: 'Team', roles: ['owner'], icon: 'M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-7 9v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1M18 8.5a2.5 2.5 0 0 1 0 5M6 8.5a2.5 2.5 0 0 0 0 5' },
];

/**
 * KŌRA Studio shell: sidebar (a drawer below 1024px), a top bar with the page
 * title, the live sync status and notifications, and the page outlet.
 */
@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout1.component.html',
})
export class LayoutComponent1 {
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  readonly live = inject(AdminLiveService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private bellWrap = viewChild<ElementRef<HTMLElement>>('bellWrap');

  private admin = inject(AdminService);
  readonly role = this.admin.role();
  readonly roleLabel = this.role ? ROLE_LABEL[this.role] : '';
  readonly nav = NAV.filter(n => !!this.role && n.roles.includes(this.role));
  readonly isSidebarOpen = signal(false);
  readonly bellOpen = signal(false);

  /** Page title from the deepest route's data. */
  readonly title = toSignal(this.router.events.pipe(
    filter(e => e instanceof NavigationEnd),
    map(() => this.deepestTitle()),
  ), { initialValue: this.deepestTitle() });

  /** "Synced 10:42" in the top bar. */
  readonly syncLabel = computed(() => {
    const d = this.live.lastSync();
    return d ? d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '…';
  });

  constructor() {
    this.live.start();
    inject(DestroyRef).onDestroy(() => this.live.stop());
    this.router.events.pipe(filter(e => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => { this.isSidebarOpen.set(false); this.bellOpen.set(false); });
  }

  toggleBell(): void {
    const next = !this.bellOpen();
    this.bellOpen.set(next);
  }

  openNotification(n: AdminNotification): void {
    this.bellOpen.set(false);
    this.router.navigateByUrl(n.link);
  }

  relative(at: string): string {
    const s = Math.max(0, (Date.now() - new Date(at).getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)} min ago`;
    if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
    const d = Math.floor(s / 86400);
    return d === 1 ? 'yesterday' : `${d} days ago`;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { this.isSidebarOpen.set(false); this.bellOpen.set(false); }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    if (this.bellOpen() && !this.bellWrap()?.nativeElement.contains(e.target as Node)) this.bellOpen.set(false);
  }

  private deepestTitle(): string {
    let r = this.route.snapshot;
    while (r.firstChild) r = r.firstChild;
    return (r.data?.['title'] as string) ?? 'Studio';
  }
}
