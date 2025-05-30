import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private apiUrl = environment.apiUrl;
  public searchResults = signal<any[]>([]);

  private productCreate = new BehaviorSubject<boolean>(false);
  productCreate$ = this.productCreate.asObservable();

  constructor(private http: HttpClient) {}

  createProduct(product: any) {
    return this.http.post(`${this.apiUrl}/product/create`, product).subscribe({
      next: () => {
        alert('Product created successfully!');
        this.productCreate.next(true);
      },
      error: (err) => {
        console.error('Error creating product:', err);
        alert('Failed to create product. Check console.');
      },
    });
  }

  updateProduct(product: any, id: string) {
    return this.http.put(`${this.apiUrl}/product/update/${id}`, product).subscribe({
      next: () => {
        alert('Product Updated successfully!');
        this.productCreate.next(true);
      },
      error: (err) => {
        console.error('Error Updating product:', err);
        alert('Failed to Update product. Check console.');
      },
    });
  }

  deleteProduct(id: string) {
    if (confirm('Are you sure you want to delete?')) {
      return this.http.delete(`${this.apiUrl}/product/delete/${id}`).subscribe({
        next: () => {
          alert('Product deleted successfully!');
          this.productCreate.next(true);
        },
        error: (err) => {
          console.error('Error deleting product:', err);
          alert('Failed to delete product. Check console.');
        },
      });
    }
    return false;
  }

  fetchProduct(params: any = {}) {
    return this.http.get(`${this.apiUrl}/product/list`, { params });
  }

  // ✅ New method to fetch product by ID
  getProductById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/product/single/${id}`);
  }

  //Filter Product for home component

   handleSearch(term: string) {
    const params: any = {};
    if (term) params.name = term;

    this.fetchProduct(params).subscribe((res: any) => {
      this.searchResults.set(res.products ?? res); // Set signal value
    });
  }


}
