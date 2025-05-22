import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive';
  image: string;
  description: string;
  sku: string;
}
@Component({
  selector: 'app-product',
  imports: [FormsModule],
  templateUrl: './product.component.html',
  styleUrl: './product.component.css'
})
export class ProductComponent {
searchTerm = '';
  selectedCategory = '';
  selectedStatus = '';

  products: Product[] = [
    {
      id: '1',
      name: 'Wireless Bluetooth Headphones',
      category: 'Electronics',
      price: 299.99,
      stock: 45,
      status: 'active',
      image: '/api/placeholder/40/40',
      description: 'High-quality wireless headphones with noise cancellation',
      sku: 'WBH-001'
    },
    {
      id: '2',
      name: 'Smart Fitness Watch',
      category: 'Electronics',
      price: 199.99,
      stock: 23,
      status: 'active',
      image: '/api/placeholder/40/40',
      description: 'Advanced fitness tracking with heart rate monitor',
      sku: 'SFW-002'
    },
    {
      id: '3',
      name: 'Laptop Stand Adjustable',
      category: 'Accessories',
      price: 79.99,
      stock: 67,
      status: 'active',
      image: '/api/placeholder/40/40',
      description: 'Ergonomic laptop stand for better posture',
      sku: 'LSA-003'
    },
    {
      id: '4',
      name: 'USB-C Charging Cable',
      category: 'Accessories',
      price: 24.99,
      stock: 8,
      status: 'active',
      image: '/api/placeholder/40/40',
      description: 'Fast charging USB-C cable 6ft length',
      sku: 'UCC-004'
    },
    {
      id: '5',
      name: 'Cotton T-Shirt Basic',
      category: 'Clothing',
      price: 29.99,
      stock: 0,
      status: 'inactive',
      image: '/api/placeholder/40/40',
      description: '100% cotton comfortable t-shirt',
      sku: 'CTB-005'
    },
    {
      id: '6',
      name: 'Coffee Mug Ceramic',
      category: 'Home',
      price: 15.99,
      stock: 125,
      status: 'active',
      image: '/api/placeholder/40/40',
      description: 'Premium ceramic coffee mug 12oz',
      sku: 'CMC-006'
    }
  ];

  filteredProducts = signal<Product[]>([]);

  ngOnInit() {
    this.updateFilteredProducts();
  }

  updateFilteredProducts() {
    let filtered = this.products;

    if (this.searchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    if (this.selectedCategory) {
      filtered = filtered.filter(product => product.category === this.selectedCategory);
    }

    if (this.selectedStatus) {
      filtered = filtered.filter(product => product.status === this.selectedStatus);
    }

    this.filteredProducts.set(filtered);
  }
}

