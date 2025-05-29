import { Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NgFor, NgIf } from '@angular/common';
import { ProductsService } from '../../service/products.service';
import { FormsModule } from '@angular/forms';
import { debouncingSignal } from '../../../debounce-util';
import { CategoryService } from '../../service/category.service';

interface Product {
  _id: string;
  name: string;
  category: any;
  price: number;
  stock: number;
  status: 'active' | 'inactive';
  image: string;
  description: string;
  sku: string;
}

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, NgFor, NgIf],
  templateUrl: './product.component.html',
  styleUrl: './product.component.css',
})
export class ProductComponent {
  showForm = false;
  updateForm=false
  productForm: FormGroup;
categoryService = inject(CategoryService) 
  products: Product[] = [];
  filteredProducts = signal<Product[]>([]);
  id :string = ''
  searchTerm = signal('');
  searchQuery = debouncingSignal(this.searchTerm, 500, '');
  selectedCategory = '';
  selectedStatus = '';
  categories: any[] = [];

   productService = inject(ProductsService);

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.productForm = this.initForm();
    effect(() => {
      // if(this.showForm == true) this.productForm.reset()
      this.handleSearch(this.searchQuery());
    });

    
  }

  ngOnInit(): void {
      this.fetchCategories();

    this.productService.productCreate$.subscribe((created) => {
      if (created) this.loadProducts();
    });

    this.loadProducts();
  }

  private initForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      description: ['', Validators.required],
      stock: [0, [Validators.required, Validators.min(0)]],
      image: [''],
      category: ['', Validators.required],
    });
  }
fetchCategories() {
  this.categoryService.getCategory().subscribe({
    next: (categories: any) => {
      this.categories = categories;
    },
    error: (err) => {
      console.error('Failed to fetch categories:', err);
    }
  });
  
}

  private handleSearch(term: string): void {
    const params: any = {};
    if (term) params.name = term;

    this.productService.fetchProduct(params).subscribe((res: any) => {
      this.products = res.products ?? res;
      this.filteredProducts.set(this.products);
    });
  }

  private extractCategories(): void {
    const unique = new Set(this.products.map((p) => p.category));
    this.categories = Array.from(unique);
  }

  private loadProducts(): void {
    this.productService.fetchProduct().subscribe((res: any) => {
      this.products = res.products ?? res;
      this.filteredProducts.set(this.products);
      this.extractCategories();
    });
  }
showform(data?: Product): void {
 
  if (data) {
    this.updateForm = true
     this.id = data?._id
    this.productForm.patchValue({
      name: data.name,
      price: data.price,
      description: data.description,
      stock: data.stock,
      image: data.image,
      category: data.category._id
    });
  } else {
    this.productForm.reset(); // Prepare blank form for creating a new product
  }
}
  onSubmit(): void {
    if (this.productForm.valid) {
      const productData = this.productForm.value;
      if (this.updateForm) {
      this.productService.updateProduct(productData,this.id);
    } else {
      this.productService.createProduct(productData);
    }

    
    this.showForm = false;
    this.updateForm = false;

    this.productForm.reset();
    }
  }
  createbutton()
  {
    this.fetchCategories()
    console.log(this.showForm);
    
  }

  

  applyFilters(): void {
    const params: any = {};
    if (this.selectedCategory) params.category = this.selectedCategory;

    this.productService.fetchProduct(params).subscribe((res: any) => {
      this.products = res.products ?? res;
      this.filteredProducts.set(this.products);
    });
  }

  resetFilters(): void {
    this.selectedCategory = '';
    this.searchTerm = signal('');
    this.loadProducts();
  }

  closeForm():void{
    
    this.updateForm=false
    this.showForm=false
    this.productForm.reset()
    console.log(this.updateForm);
  }

  
}
