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
  selectedImage: File | null = null;

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
  imagePreviewUrl=signal<string>('');
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
onFileSelected(event: any): void {
  const file = event.target.files[0];
  if (file) {
    this.selectedImage = file;

    // Create a preview for the newly selected file
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreviewUrl.set(reader.result as string) ;
    };
    reader.readAsDataURL(file);
  }
}
  private initForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      description: ['', Validators.required],
      stock: [0, [Validators.required, Validators.min(0)]],
      // image: [''],
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
  console.log(data);

  if (data) {
    this.updateForm = true;
    this.id = data?._id;
    this.imagePreviewUrl.set(data.image)  // <-- ADD THIS: Set the preview URL
    this.productForm.patchValue({
      name: data.name,
      price: data.price,
      description: data.description,
      stock: data.stock,
      // image: data.image, // <-- REMOVE THIS LINE
      category: data.category._id
    });
 console.log(this.imagePreviewUrl(),'sefw');
  } else {
       

    // This is for the "Create New" case
    this.productForm.reset();
    this.imagePreviewUrl.set(''); // Reset the preview URL
    
  }
}
onSubmit(): void {
  if (this.productForm.valid) {
    const formData = new FormData();

    Object.entries(this.productForm.value).forEach(([key, value]) => {
      formData.append(key, value as string);
    });

    if (this.selectedImage) {
      formData.append('image', this.selectedImage);
    }

    if (this.updateForm) {
      this.productService.updateProduct(formData, this.id);  // Ensure updateProduct handles FormData
    } else {
      this.productService.createProduct(formData);
    }

    this.showForm = false;
    this.updateForm = false;
    this.productForm.reset();
    this.selectedImage = null;
  }
}

  createbutton()
  {
    this.imagePreviewUrl.set(''); // Reset the preview URL
   
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
