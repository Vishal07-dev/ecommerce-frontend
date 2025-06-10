import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { WishlistService } from '../../service/wishList\'/wishlist.service';
import { RouterLink } from '@angular/router';

// API Response interfaces (matching your backend)
interface ApiProduct {
  _id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  stock: number;
  image: string;
  ratings: number;
  numReviews: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface ApiWishlistResponse {
  _id: string;
  user: string;
  products: ApiProduct[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}
interface Product extends ApiProduct {
  originalPrice?: number;
  inStock: boolean;
  discount?: number;
  dateAddedToWishlist: Date;
}

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './wishlist-page.component.html',
  styleUrl: './wishlist-page.component.css',
})
export class WishlistPageComponent {
  private wishlistService = inject(WishlistService);
  selectedCategory = signal('');
  selectedAvailability = signal('');
  sortBy = signal('newest');
  wishlistItems = signal<Product[]>([]);
  isDarkMode = signal(false);

  ngOnInit(): void {
    this.loadWishlist();
  }

  loadWishlist() {
    this.wishlistService.getUserWishList().subscribe({
      next: (response: ApiWishlistResponse) => {
        // Map API response to Product interface
        const mappedProducts = response.products.map(product => ({
          ...product,
          inStock: product.stock > 0,
          dateAddedToWishlist: new Date(response.createdAt),
          originalPrice: product.price * 1.2, // Assuming 20% discount for demo
          discount: Math.floor(Math.random() * 30) + 10 // Random discount for demo
        }));
        this.wishlistItems.set(mappedProducts);
      },
      error: (err: any) => console.error('Error loading wishlist', err)
    });
  }

  removeFromWishlist(productId: string) {
    this.wishlistService.removeItemFromWishList(productId).subscribe({
      next: () => this.wishlistItems.update(items => items.filter(item => item._id !== productId)),
      error: err => console.error('Error removing from wishlist', err)
    });
  }

  filteredAndSortedItems = computed(() => {
    let items = this.wishlistItems();

    // Filter by category
    if (this.selectedCategory()) {
      items = items.filter(item => item.category.toLowerCase().includes(this.selectedCategory().toLowerCase()));
    }

    // Filter by availability
    if (this.selectedAvailability()) {
      if (this.selectedAvailability() === 'instock') {
        items = items.filter(item => item.inStock);
      } else if (this.selectedAvailability() === 'outofstock') {
        items = items.filter(item => !item.inStock);
      }
    }

    // Sort items
    return items.sort((a, b) => {
      switch (this.sortBy()) {
        case 'newest':
          return new Date(b.dateAddedToWishlist).getTime() - new Date(a.dateAddedToWishlist).getTime();
        case 'oldest':
          return new Date(a.dateAddedToWishlist).getTime() - new Date(b.dateAddedToWishlist).getTime();
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  });

  getTotalValue(): number {
    return this.wishlistItems().reduce((total, item) => total + item.price, 0);
  }

  getInStockCount(): number {
    return this.wishlistItems().filter(item => item.inStock).length;
  }

  getTotalSavings(): number {
    return this.wishlistItems().reduce((total, item) => {
      if (item.originalPrice) {
        return total + (item.originalPrice - item.price);
      }
      return total;
    }, 0);
  }

  getRelativeDate(date: Date): string {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
  }

  getCategoryName(categoryId: string): string {
    // You might want to have a category mapping service for this
    const categoryMap: { [key: string]: string } = {
      '6833f964b45c9a67d3e7d5aa': 'Clothing',
      // Add more category mappings as needed
    };
    return categoryMap[categoryId] || 'Other';
  }
}