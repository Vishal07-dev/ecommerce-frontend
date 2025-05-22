import { NgFor, NgIf } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ProductsService } from '../../service/products.service';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-home',
  imports: [NgFor,FormsModule,NgIf],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit{
images = [
  'https://img.freepik.com/free-psd/horizontal-banner-online-fashion-sale_23-2148585404.jpg?semt=ais_hybrid&w=740',
  'https://img.freepik.com/free-vector/gradient-shopping-discount-horizontal-sale-banner_23-2150322008.jpg?ga=GA1.1.1569401692.1747807102&semt=ais_hybrid&w=740',
  'https://img.freepik.com/free-psd/pop-up-shop-youtube-cover-template_23-2150931519.jpg?ga=GA1.1.1569401692.1747807102&semt=ais_hybrid&w=740',
  'https://img.freepik.com/free-vector/gradient-shopping-discount-horizontal-sale-banner_23-2150321984.jpg?ga=GA1.1.1569401692.1747807102&semt=ais_hybrid&w=740',
  'https://img.freepik.com/free-vector/flat-horizontal-sale-banner-template-with-photo_23-2149000923.jpg?ga=GA1.1.1569401692.1747807102&semt=ais_hybrid&w=740',
];

product: any[] = [];
  categories: any[] = [];

  selectedCategory = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;

  constructor(private productService: ProductsService, private http: HttpClient) {}

  ngOnInit(): void {
    this.loadProducts();
  }


resetFilters() {
  if(this.selectedCategory == '' && this.minPrice == null && this.maxPrice == null) {
    return false
  }
  else{
this.selectedCategory = '';
  this.minPrice = null;
  this.maxPrice = null;
  this.applyFilters(); // or reload products
  return true
  }
  
}


  loadProducts() {
    this.productService.fetchProduct().subscribe((res: any) => {
      this.product = res.products ?? res;
    });
  }

  applyFilters() {
    const params: any = {};

    if (this.selectedCategory) params.category = this.selectedCategory;
    if (this.minPrice !== null) params.minPrice = this.minPrice;
    if (this.maxPrice !== null) params.maxPrice = this.maxPrice;

    this.productService.fetchProduct(params).subscribe((res: any) => {
      this.product = res.products ?? res;
    });
  }}
