import { Component, OnInit, computed, signal } from "@angular/core";
import { AuthService } from "../../service/auth.service";
import { CartService } from "../../service/cartService/cart.service";
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe, CommonModule, NgIf } from '@angular/common';
import { debouncingSignal } from '../../../debounce-util';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink,NgIf,AsyncPipe,RouterLinkActive,CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  mobileMenuOpen: boolean = false;

  auth: AuthService;
  cartService: CartService;
  showSearchInput = signal(false);
  searchTerm = signal('');
  searchQuery = debouncingSignal(this.searchTerm, 500, '');
  // Signal to track cart item count
  cartItemCount = signal<number>(0);

  constructor(authService: AuthService, cartService: CartService,) {
    this.auth = authService;
    this.cartService = cartService;
    this.updateCartCount()


    
  }

  ngOnInit(): void {
      this.cartService.getUserCart()
    this.updateCartCount();
    this.cartService.addedToCart$.subscribe(() => {
      this.updateCartCount();
    });
    
  }

  private updateCartCount(): void {
    // Get cart items from localStorage
    const storedProducts = localStorage.getItem('Product');
    if (storedProducts) {
      try {
        const products = JSON.parse(storedProducts);
        
        // Get quantities from localStorage
        const storedQuantities = localStorage.getItem('ProductQuantities');
        let totalCount = 0;
        
        if (storedQuantities) {
          const quantities = JSON.parse(storedQuantities);
          // Sum up all quantities
          totalCount = Object.values(quantities).reduce((sum: number, qty: any) => sum + qty, 0);
        } else {
          // If no quantities stored, count unique products
          totalCount = this.cartService.productcart.length;
        }
        
        this.cartItemCount.set(totalCount);
      } catch (error) {
        console.error('Error reading cart data:', error);
        this.cartItemCount.set(0);
      }
    } else {
      this.cartItemCount.set(0);
    }
  }
}