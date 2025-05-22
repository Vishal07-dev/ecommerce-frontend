import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {

  constructor(private http: HttpClient) { }

  private productCreate = new BehaviorSubject<boolean>(false)
  productCreate$ = this.productCreate.asObservable()

  createProduct(product: any) {
    return this.http.post('http://localhost:2000/api/product/create', product)
      .subscribe({
        next: () => {
          alert('Product created successfully!');
          this.productCreate.next(true)
        },
        error: (err) => {
          console.error('Error creating product:', err);
          alert('Failed to create product. Check console.');
        },
      });
  }

  fetchProduct(params: any = {}) {
  return this.http.get('http://localhost:2000/api/product/list', { params });
}

}
