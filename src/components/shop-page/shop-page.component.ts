import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductsService } from '../../service/products.service';
import { CategoryService } from '../../service/category.service';
import { CartService } from '../../service/cartService/cart.service';
import { Router } from '@angular/router';
import { WishlistService } from '../../service/wishList\'/wishlist.service';
import { HotToastService } from '@ngxpert/hot-toast';

interface Product {
  id: number | string;
  name: string;
  category: any;
  price: number;
  originalPrice?: number;
  image: string;
  ratings: number;
  reviews: number;
  isNew?: boolean;
  onSale?: boolean;
  colors?: string[];
  sizes?: string[];
  _id?: string;
}

interface ApiCategory {
  _id: string;
  name: string;
}

@Component({
  selector: 'app-shop-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shop-page.component.html',
  styleUrl: './shop-page.component.css'
})
export class ShopPageComponent implements OnInit {
  constructor(private toast: HotToastService){}
  
  private productService = inject(ProductsService);
  private categoryService = inject(CategoryService);
  private cartService = inject(CartService);
  private router = inject(Router);

  products: Product[] = [];
  allProducts: Product[] = [];

  categories: ApiCategory[] = [];
  selectedCategories: string[] = [];

  priceRange = { min: null as number | null, max: null as number | null };
  currentMinPriceInput: number | null = null;
  currentMaxPriceInput: number | null = null;
  wishlistService = inject(WishlistService);

  selectedRating: number = 0;

  sortBy: string = 'popularity';
  itemsPerPage: number = 12;
  currentPage: number = 1;

  showMobileFilters = false;
  isLoadingProducts = true;
  isLoadingCategories = true;

  ngOnInit(): void {
    this.loadInitialProducts();
    this.fetchCategories();
  }

  fetchCategories() {
    this.isLoadingCategories = true;
    this.categoryService.getCategory().subscribe({
      next: (res: any) => {
        this.categories = res;
        this.isLoadingCategories = false;
      },
      error: (err) => {
        console.error('Failed to fetch categories:', err);
        this.categories = [];
        this.isLoadingCategories = false;
      }
    });
  }

  loadInitialProducts() {
    this.isLoadingProducts = true;
    this.productService.fetchProduct().subscribe({
      next: (res: any) => {
        const productList = res.products ?? res;
        this.allProducts = productList.map((p: any) => ({ ...p, id: p._id || p.id }));
        this.applyFiltersAndSort();
        this.isLoadingProducts = false;
      },
      error: (err: any) => {
        console.error('Failed to load products:', err);
        this.allProducts = [];
        this.products = [];
        this.isLoadingProducts = false;
      }
    });
  }

  applyFiltersAndSort() {
    let filtered = [...this.allProducts];

    // Category
    if (this.selectedCategories.length > 0) {
      filtered = filtered.filter(product =>
        this.selectedCategories.includes(product.category._id)
      );
    }

    // Price
    if (this.priceRange.min !== null) {
      filtered = filtered.filter(p => p.price >= this.priceRange.min!);
    }
    if (this.priceRange.max !== null) {
      filtered = filtered.filter(p => p.price <= this.priceRange.max!);
    }

    // Rating
    if (this.selectedRating > 0) {
      filtered = filtered.filter(p => p.ratings >= this.selectedRating);
    }

    // Sorting
    switch (this.sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => (b.ratings || 0) - (a.ratings || 0));
        break;
      case 'newest':
        // Optional: sort by creation date if available
        break;
    }

    this.products = filtered;
    this.currentPage = 1;
  }

  toggleCategory(category: ApiCategory) {
    const index = this.selectedCategories.indexOf(category._id);
    if (index > -1) {
      this.selectedCategories.splice(index, 1);
    } else {
      this.selectedCategories.push(category._id);
    }
    this.applyFiltersAndSort();
  }

  applyPriceRange() {
    this.priceRange.min = this.currentMinPriceInput;
    this.priceRange.max = this.currentMaxPriceInput;
    this.applyFiltersAndSort();
  }

  selectRating(rating: number) {
    this.selectedRating = this.selectedRating === rating ? 0 : rating;
    this.applyFiltersAndSort();
  }

  clearFilters() {
    this.selectedCategories = [];
    this.priceRange = { min: null, max: null };
    this.currentMinPriceInput = null;
    this.currentMaxPriceInput = null;
    this.selectedRating = 0;
    this.sortBy = 'popularity';
    this.applyFiltersAndSort();
  }

  changeSort(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.sortBy = selectElement.value;
    this.applyFiltersAndSort();
  }

  addToCart(product: Product, event: MouseEvent) {
    event.stopPropagation();
    this.cartService.addtocart(product);
    this.router.navigateByUrl('cart');
    console.log("Added to cart:", product.name);
  }

 addtowishlist(product: any) {
    this.wishlistService.addItemToWishList(product).subscribe({
      next: (res) => {
       this.toast.success('Product added to wish successfully!')
      },
      error: (err) => {
        this.router.navigateByUrl('/login');
      this.toast.error('pleaso login to add product to wishlist')
      }
    });
  }

  viewProductDetails(product: Product) {
    this.router.navigateByUrl(`/product/${product._id ?? product.id}`).then(() => {
      window.scrollTo({ top: 0, behavior: 'auto' });
    });
  }

  changePage(page: number) {
    this.currentPage = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getTotalPages(): number {
    if (!this.products || this.products.length === 0) return 0;
    return Math.ceil(this.products.length / this.itemsPerPage);
  }

  getPaginatedProducts(): Product[] {
    if (!this.products) return [];
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.products.slice(startIndex, endIndex);
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    return Array(totalPages).fill(0).map((_, i) => i + 1);
  }

  toggleMobileFilters() {
    this.showMobileFilters = !this.showMobileFilters;
  }
}
