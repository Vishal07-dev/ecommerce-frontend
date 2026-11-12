import { Component, ElementRef, OnInit, inject, viewChild } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, skip } from 'rxjs';
import { SiteHeaderComponent } from '../site-header/site-header.component';
import { SiteFooterComponent } from '../site-footer/site-footer.component';
import { CartDrawerComponent } from '../cart-drawer/cart-drawer.component';
import { ChatbotComponent } from '../chatbot/chatbot.component';
import { CartService } from '../../service/cartService/cart.service';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, SiteHeaderComponent, SiteFooterComponent, CartDrawerComponent, ChatbotComponent],
  templateUrl: './layout.component.html',
})
export class LayoutComponent implements OnInit {
  private router = inject(Router);
  private bag = inject(CartService);
  private main = viewChild.required<ElementRef<HTMLElement>>('main');

  ngOnInit(): void {
    this.bag.load();
    // Client-side navigation resets nothing for assistive tech: move focus to
    // the new view so screen readers start at its content (skips first load).
    this.router.events.pipe(filter(e => e instanceof NavigationEnd), skip(1)).subscribe(() => {
      requestAnimationFrame(() => {
        const heading = this.main().nativeElement.querySelector<HTMLElement>('h1');
        const target = heading ?? this.main().nativeElement;
        if (heading && !heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      });
    });
  }
}
