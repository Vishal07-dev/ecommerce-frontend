import { NgFor, NgIf, NgClass, CommonModule } from '@angular/common'; // Added NgClass and CommonModule for [style.transform]
import { Component, inject, OnInit, OnDestroy, effect } from '@angular/core'; // Added OnDestroy
import { ProductsService } from '../../service/products.service';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CategoryService } from '../../service/category.service';
import { CartService } from '../../service/cartService/cart.service';
import { Router, RouterLink } from '@angular/router'; // Corrected: Route to Router
import { LoaderService } from '../../service/loader/loader.service';
import { LoaderComponent } from "../loader/loader.component";

@Component({
  selector: 'app-home',
  standalone: true, // Assuming standalone, add CommonModule or NgClass to imports if not
  imports: [NgFor, FormsModule, NgIf, NgClass, CommonModule, RouterLink, LoaderComponent], // Added NgClass and CommonModule
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
goToSlide(_t33: number) {
throw new Error('Method not implemented.');
}
subscribeNewsletter() {
throw new Error('Method not implemented.');
} // Implement OnDestroy
  images = [
    'https://img.freepik.com/free-psd/horizontal-banner-online-fashion-sale_23-2148585404.jpg?semt=ais_hybrid&w=1380', // Example: Using wider images
    'https://img.freepik.com/free-vector/gradient-shopping-discount-horizontal-sale-banner_23-2150322008.jpg?ga=GA1.1.1569401692.1747807102&semt=ais_hybrid&w=1380',
    'https://img.freepik.com/free-psd/pop-up-shop-youtube-cover-template_23-2150931519.jpg?ga=GA1.1.1569401692.1747807102&semt=ais_hybrid&w=1380',
    'https://img.freepik.com/free-vector/gradient-shopping-discount-horizontal-sale-banner_23-2150321984.jpg?ga=GA1.1.1569401692.1747807102&semt=ais_hybrid&w=1380',
    'https://img.freepik.com/free-vector/flat-horizontal-sale-banner-template-with-photo_23-2149000923.jpg?ga=GA1.1.1569401692.1747807102&semt=ais_hybrid&w=1380',
  ];
  public currentYear: number = new Date().getFullYear(); // Add this line

  product: any[] = [];
  categories: any[] = [];
  categoryService = inject(CategoryService);
  cartService = inject(CartService);
  router = inject(Router); // Changed 'route' to 'router' for convention and consistency
  selectedCategory = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  loaderService = inject(LoaderService)
  // Properties for new Carousel
  public currentImageIndex: number = 0;
  private carouselInterval: ReturnType<typeof setInterval> | undefined;

  // Property for Filter Toggle
  public isFilterOpen: boolean = false;
newsletterEmail: any;

  constructor(private productService: ProductsService, private http: HttpClient) { 
     effect(() => {
    this.product = this.productService.searchResults();
  });
  }

  ngOnInit(): void {
    this.cartService.getUserCart();
    this.loadProducts();
    this.fetchCategories();
    this.startCarousel(); // Start the new carousel
  }

  ngOnDestroy(): void { // Lifecycle hook to clean up interval
    this.stopCarousel();
  }

  // --- New Carousel Methods ---
  public nextImage(): void {
    this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
    this.resetCarouselInterval();
  }

  public prevImage(): void {
    this.currentImageIndex = (this.currentImageIndex - 1 + this.images.length) % this.images.length;
    this.resetCarouselInterval();
  }

  public goToImage(index: number): void {
    this.currentImageIndex = index;
    this.resetCarouselInterval();
  }

  public startCarousel(): void {
    this.stopCarousel(); // Ensure no multiple intervals
    this.carouselInterval = setInterval(() => {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
    }, 5000); // Change image every 5 seconds
  }

  public stopCarousel(): void {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
      this.carouselInterval = undefined;
    }
  }

  private resetCarouselInterval(): void {
    this.stopCarousel();
    this.startCarousel();
  }
  // --- End of New Carousel Methods ---

  // --- New Filter Toggle Method ---
  public toggleFilter(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }
  // --- End of New Filter Toggle Method ---

  fetchCategories() {
    this.loaderService.show();
    this.categoryService.getCategory().subscribe({
      next: (categories: any) => {
        this.categories = categories;
         this.loaderService.hide();
      },
      error: (err) => {
        console.error('Failed to fetch categories:', err);
      }
    });
  }

  resetFilters() {
    // Original logic: if (this.selectedCategory == '' && this.minPrice == null && this.maxPrice == null)
    // Simplified check:
    if (!this.selectedCategory && this.minPrice === null && this.maxPrice === null) {
      return false; // No filters active to reset
    }
    else {
      this.selectedCategory = '';
      this.minPrice = null;
      this.maxPrice = null;
      this.applyFilters(); // Reload products with no filters
      return true;
    }
  }

  loadProducts() {
    this.loaderService.show();

    this.productService.fetchProduct().subscribe((res: any) => {
      this.product = res.products ?? res;
          this.loaderService.hide();

    });
  }

  applyFilters() {
    const params: any = {};

    if (this.selectedCategory) params.category = this.selectedCategory;
    if (this.minPrice !== null && this.minPrice !== undefined) params.minPrice = this.minPrice; // Added undefined check for safety
    if (this.maxPrice !== null && this.maxPrice !== undefined) params.maxPrice = this.maxPrice; // Added undefined check for safety

    this.productService.fetchProduct(params).subscribe((res: any) => {
      this.product = res.products ?? res;
    });
  }

  addtocart(product: any) {
    // console.log(product); // Keep if needed for debugging
    this.cartService.addtocart(product);
    this.router.navigateByUrl('/cart').then(() => {
    window.scrollTo({ top: 0, behavior: 'auto' }); // Scrolls to top smoothly
  });
  }

  //Product Information Routing
  productInfo(product:any)
  {
    this.productService.getProductById(product._id)
    this.router.navigateByUrl(`/product/${product._id}`).then(() => {
    window.scrollTo({ top: 0, behavior: 'auto' }); // Scrolls to top smoothly
  });
  }
}