import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  brand: string;
  imageUrl: string;
  category: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  discount?: number;
  dateAddedToWishlist: Date;
  description: string;
}

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <header class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <button class="text-gray-600 hover:text-gray-900">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
              </button>
              <h1 class="text-2xl font-bold text-gray-900">My Wishlist</h1>
              <span class="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                {{ wishlistItems().length }} items
              </span>
            </div>
            <div class="flex items-center space-x-4">
              <button class="text-gray-600 hover:text-gray-900">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Filter and Sort -->
        <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div class="flex flex-wrap gap-4">
              <select [(ngModel)]="selectedCategory" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">All Categories</option>
                <option value="electronics">Electronics</option>
                <option value="clothing">Clothing</option>
                <option value="home">Home & Garden</option>
                <option value="books">Books</option>
                <option value="sports">Sports</option>
              </select>
              
              <select [(ngModel)]="selectedAvailability" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">All Items</option>
                <option value="instock">In Stock</option>
                <option value="outofstock">Out of Stock</option>
              </select>
            </div>
            
            <div class="flex items-center space-x-2">
              <label class="text-sm text-gray-600">Sort by:</label>
              <select [(ngModel)]="sortBy" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Wishlist Items -->
        @if (filteredAndSortedItems().length > 0) {
          <!-- Grid View -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            @for (product of filteredAndSortedItems(); track product.id) {
              <div class="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-200 overflow-hidden group">
                <!-- Product Image -->
                <div class="relative aspect-square overflow-hidden bg-gray-100">
                  <img [src]="product.imageUrl" [alt]="product.name" 
                       class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                  
                  <!-- Discount Badge -->
                  @if (product.discount) {
                    <div class="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">
                      -{{ product.discount }}%
                    </div>
                  }
                  
                  <!-- Stock Status -->
                  @if (!product.inStock) {
                    <div class="absolute top-3 right-3 bg-gray-800 text-white px-2 py-1 rounded text-xs">
                      Out of Stock
                    </div>
                  }
                  
                  <!-- Remove from Wishlist -->
                  <button (click)="removeFromWishlist(product.id)" 
                          class="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors group opacity-0 group-hover:opacity-100"
                          [class.opacity-100]="!product.inStock"
                          [class.right-20]="!product.inStock">
                    <svg class="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                    </svg>
                  </button>
                </div>

                <!-- Product Info -->
                <div class="p-4">
                  <div class="mb-2">
                    <h3 class="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">{{ product.name }}</h3>
                    <p class="text-xs text-gray-500">{{ product.brand }}</p>
                  </div>

                  <!-- Rating -->
                  <div class="flex items-center mb-2">
                    <div class="flex text-yellow-400">
                      @for (star of [1,2,3,4,5]; track star) {
                        <svg class="w-4 h-4" [class.text-gray-300]="star > product.rating" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                        </svg>
                      }
                    </div>
                    <span class="text-xs text-gray-500 ml-1">({{ product.reviewCount }})</span>
                  </div>

                  <!-- Price -->
                  <div class="mb-3">
                    <div class="flex items-center space-x-2">
                      <span class="text-lg font-bold text-gray-900">\${{ product.price }}</span>
                      @if (product.originalPrice && product.originalPrice > product.price) {
                        <span class="text-sm text-gray-500 line-through">\${{ product.originalPrice }}</span>
                      }
                    </div>
                  </div>

                  <!-- Added Date -->
                  <p class="text-xs text-gray-400 mb-3">
                    Added {{ getRelativeDate(product.dateAddedToWishlist) }}
                  </p>

                  <!-- Actions -->
                  <div class="space-y-2">
                    @if (product.inStock) {
                      <button class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                        Add to Cart
                      </button>
                      <button class="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                        Buy Now
                      </button>
                    } @else {
                      <button class="w-full bg-gray-100 text-gray-500 py-2 px-4 rounded-lg text-sm font-medium cursor-not-allowed">
                        Notify When Available
                      </button>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        } @else {
          <!-- Empty State -->
          <div class="text-center py-16">
            <div class="max-w-md mx-auto">
              <svg class="mx-auto h-24 w-24 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
              </svg>
              <h3 class="text-lg font-medium text-gray-900 mb-2">Your wishlist is empty</h3>
              <p class="text-gray-500 mb-6">Save items you love to your wishlist and shop them later.</p>
              <button class="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Start Shopping
              </button>
            </div>
          </div>
        }

        <!-- Wishlist Summary -->
        @if (wishlistItems().length > 0) {
          <div class="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h3 class="text-lg font-semibold mb-4">Wishlist Summary</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div class="text-2xl font-bold text-blue-600">{{ wishlistItems().length }}</div>
                <div class="text-sm text-gray-600">Total Items</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-green-600">\${{ getTotalValue().toFixed(2) }}</div>
                <div class="text-sm text-gray-600">Total Value</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-purple-600">{{ getInStockCount() }}</div>
                <div class="text-sm text-gray-600">In Stock</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-orange-600">\${{ getTotalSavings().toFixed(2) }}</div>
                <div class="text-sm text-gray-600">Potential Savings</div>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class WishlistPageComponent {
  selectedCategory = signal('');
  selectedAvailability = signal('');
  sortBy = signal('newest');

  wishlistItems = signal<Product[]>([
    {
      id: 1,
      name: 'Apple MacBook Air 13" M2 Chip with 8-Core CPU',
      price: 1099,
      originalPrice: 1199,
      brand: 'Apple',
      imageUrl: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&h=400&fit=crop',
      category: 'electronics',
      rating: 4.8,
      reviewCount: 2847,
      inStock: true,
      discount: 8,
      dateAddedToWishlist: new Date('2024-01-15'),
      description: 'Lightweight laptop with powerful M2 chip'
    },
    {
      id: 2,
      name: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
      price: 349,
      originalPrice: 399,
      brand: 'Sony',
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
      category: 'electronics',
      rating: 4.6,
      reviewCount: 1523,
      inStock: true,
      discount: 13,
      dateAddedToWishlist: new Date('2024-02-01'),
      description: 'Premium noise canceling headphones'
    },
    {
      id: 3,
      name: 'Nike Air Max 270 Running Shoes',
      price: 130,
      brand: 'Nike',
      imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
      category: 'sports',
      rating: 4.4,
      reviewCount: 892,
      inStock: false,
      dateAddedToWishlist: new Date('2024-01-28'),
      description: 'Comfortable running shoes with air cushioning'
    },
    {
      id: 4,
      name: 'The Design of Everyday Things - Revised Edition',
      price: 18.99,
      originalPrice: 24.99,
      brand: 'Basic Books',
      imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop',
      category: 'books',
      rating: 4.7,
      reviewCount: 3421,
      inStock: true,
      discount: 24,
      dateAddedToWishlist: new Date('2024-02-10'),
      description: 'Essential book on design principles'
    },
    {
      id: 5,
      name: 'Minimalist Cotton T-Shirt - Premium Quality',
      price: 45,
      brand: 'Everlane',
      imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
      category: 'clothing',
      rating: 4.3,
      reviewCount: 567,
      inStock: true,
      dateAddedToWishlist: new Date('2024-02-05'),
      description: 'High-quality cotton t-shirt'
    },
    {
      id: 6,
      name: 'Smart Home Security Camera System',
      price: 199,
      originalPrice: 249,
      brand: 'Ring',
      imageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=400&fit=crop',
      category: 'home',
      rating: 4.5,
      reviewCount: 1876,
      inStock: true,
      discount: 20,
      dateAddedToWishlist: new Date('2024-01-20'),
      description: 'Advanced security camera with mobile app'
    }
  ]);

  filteredAndSortedItems = computed(() => {
    let items = this.wishlistItems();

    // Filter by category
    if (this.selectedCategory()) {
      items = items.filter(item => item.category === this.selectedCategory());
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

  removeFromWishlist(productId: number) {
    this.wishlistItems.update(items => items.filter(item => item.id !== productId));
  }

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
}

// Bootstrap the application
