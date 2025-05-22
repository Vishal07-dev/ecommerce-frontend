import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ProductsService } from '../../service/products.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  showForm = false;
  productForm: FormGroup;
  products: any[] = []; // 👈 Store fetched products

  productservice = inject(ProductsService);

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      description: ['', Validators.required],
      stock: [0, [Validators.required, Validators.min(0)]],
      image: [''],
      category:['',]
    });
  }

  ngOnInit(): void {
    // 👇 Listen for product creation and fetch updated list
    this.productservice.productCreate$.subscribe((created) => {
      if (created) {
        this.getProducts(); // Fetch updated list
      }
    });

    // Load initial product list
    this.getProducts();
  }

  onSubmit() {
    if (this.productForm.valid) {
      const productData = this.productForm.value;
      this.productservice.createProduct(productData);
      this.productForm.reset(); // Optional: clear the form
    }
  }

  getProducts() {
    this.productservice.fetchProduct().subscribe((res: any) => {
      this.products = res.products;
    });
  }
}
