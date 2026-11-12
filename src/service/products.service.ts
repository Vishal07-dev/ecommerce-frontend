import { inject, Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environment/environment';
import { HotToastService } from '@ngxpert/hot-toast';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private apiUrl = environment.apiUrl;
  public searchResults = signal<any[]>([]);
   toast =inject(HotToastService) 

  private productCreate = new BehaviorSubject<boolean>(false);
  productCreate$ = this.productCreate.asObservable();

  constructor(private http: HttpClient) {}

  createProduct(product: any) {
    return this.http.post(`${this.apiUrl}/product/create`, product).subscribe({
      next: () => {
       this.toast.success('Product created successfully!');
        this.productCreate.next(true);
      },
      error: (err) => {
        console.error('Error creating product:', err);
        this.toast.error(err.error?.message || 'Failed to create product. Check console.');
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
    Swal.fire({
    title: 'Are you sure?',
    text: 'This action cannot be undone!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!',
  }).then((result) => {

   if (result.isConfirmed) {
       this.http.delete(`${this.apiUrl}/product/delete/${id}`).subscribe({
        next: () => {
          this.toast.success('Product deleted'),
          this.productCreate.next(true);
        },
        error: (err) => {
          console.error('Error deleting product:', err);
          this.toast.error('Failed to delete')
        },
      });
    }
  })
 
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
