import { Component, HostListener, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet,RouterLink,RouterLinkActive],
  templateUrl: './layout1.component.html',
  styleUrl: './layout1.component.css'
})
export class LayoutComponent1 {
  /** Drawer state for screens below 1024px (the sidebar is always shown above). */
  isSidebarOpen = signal(false);
  auth = inject(AuthService)

  /** Picking a section in the drawer closes it, so the page is visible. */
  closeOnNavigate(event: Event): void {
    if ((event.target as HTMLElement).closest('a')) this.isSidebarOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { this.isSidebarOpen.set(false); }
}
