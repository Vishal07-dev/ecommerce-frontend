import { Component, OnInit, computed, effect, inject, signal } from "@angular/core";
import { AuthService } from "../../service/auth.service";
import { CartService } from "../../service/cartService/cart.service";
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe, CommonModule, NgIf } from '@angular/common';
import { debouncingSignal } from '../../../debounce-util';
import { ProductsService } from '../../service/products.service';
import { ThemeService } from "../../service/theme/theme.service";
import { WishlistService } from "../../service/wishList'/wishlist.service";

@Component({
  selector: 'app-navbar',
  imports: [RouterLink,NgIf,RouterLinkActive,CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  
  wishlistItemCount = signal(0); // ✅
  mobileMenuOpen: boolean = false;
 showSearch = signal(false); // Toggle visibility
  searchTerm = signal('');    // Search input value
  productService=inject(ProductsService)
  wishListService = inject(WishlistService);
  auth: AuthService;
  cartService: CartService;
  showSearchInput = signal(false);
  searchQuery = debouncingSignal(this.searchTerm, 500, '');
  // Signal to track cart item count
  cartItemCount = signal<number>(0);

  constructor(authService: AuthService, cartService: CartService,private themeService: ThemeService) {
    this.auth = authService;
    this.cartService = cartService;
    this.updateCartCount()
    this.updateWishCount()
 effect(() => {
      // if(this.showForm == true) this.productForm.reset()
     this.productService.handleSearch(this.searchQuery());
    });


    
  }
toggleDarkMode(): void {
    const html = document.documentElement;
    html.classList.toggle('dark');

    const isDark = html.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    console.log(isDark);
    
  }
  ngOnInit(): void {
      this.cartService.getUserCart()
    this.updateCartCount();
    this.updateWishCount();
    this.wishListService.getUserWishList().subscribe({
      next: (res) => {
        this.wishListService.wishlist = res.products;
        this.updateWishCount();
      },
      error: (err) => {
        console.error('Failed to fetch wishlist:', err);
      }
    });
    this.cartService.addedToCart$.subscribe(() => {
      this.updateCartCount();
    });
    
  }
toggleSearch() {
    this.showSearch.set(!this.showSearch());
  }

  onSearchInput(event: any) {
    this.searchTerm.set(event.target.value);
console.log(this.searchTerm());
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
  private updateWishCount(): void {
    // Get cart items from localStorage
    const storedProducts = localStorage.getItem('wishList');
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
          totalCount = this.wishListService.wishlist.length;
        }
        
        this.wishlistItemCount.set(totalCount);
      } catch (error) {
        console.error('Error reading cart data:', error);
        this.wishlistItemCount.set(0);
      }
    } else {
      this.wishlistItemCount.set(0);
    }
  }
  

   toggleTheme(): void {
    this.themeService.toggleTheme();
  }
  
}