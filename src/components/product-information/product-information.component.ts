import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductsService } from '../../service/products.service';
import { CartService } from '../../service/cartService/cart.service';
import { NgFor, TitleCasePipe, CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-information',
  templateUrl: './product-information.component.html',
  styleUrl: './product-information.component.css',
  standalone: true,
  imports: [TitleCasePipe, NgFor,CommonModule]
})
export class ProductInformationComponent implements OnInit {
  product: any;
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductsService);
  private cartService = inject(CartService);

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.productService.getProductById(productId).subscribe({
        next: (res: any) => {
          this.product = res;
        },
        error: (err) => {
          console.error('Failed to fetch product:', err);
          alert('Product not found.');
          this.router.navigate(['/']);
        }
      });
    }
  }

  addtocart(product: any) {
    this.cartService.addtocart(product);
    this.router.navigateByUrl('/cart');
  }
}
