import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = environment.apiUrl;
  private addedToCart = new BehaviorSubject<boolean>(false);
  addedToCart$ = this.addedToCart.asObservable();

  productcart: any[] = [];

  constructor(private http: HttpClient) { }

  get token(): string | null {
    return localStorage.getItem('accessToken');
  }

  private refreshCart() {
      if (!this.token) {
    const guestCart = localStorage.getItem('Product'); // Not 'Products', and no stringify
    if (guestCart) {
      this.productcart = JSON.parse(guestCart);
      this.addedToCart.next(true);
    }
    return;
  }


    if(this.token){
          const decoded: any = jwtDecode(this.token);

      this.http.get(`${this.apiUrl}/cart/show`).subscribe({
      next: (res: any) => {
        this.productcart = res.items.map((item: any) => ({
          ...item.productId,
          quantity: item.quantity,
          price: item.priceAtTime
        }));
        localStorage.setItem('Product', JSON.stringify(this.productcart));
        this.addedToCart.next(true);
      },
      error: (err) => console.error('Failed to refresh cart:', err)
    });}

    
  }

  addProductToCart(product: any) {
    console.log(product);
    
    this.http.post(`${this.apiUrl}/cart/add`, product).subscribe({
      next: () => {
        alert('Added to cart successfully!');
        this.refreshCart();
      },
      error: (err) => {
        console.error('Error adding product:', err);
        alert('Failed to add product.');
      }
    });
  }

  getUserCart() {
    this.refreshCart();
  }

  addtocart(product: any) {
    if (this.token) {
      const decoded: any = jwtDecode(this.token);
      console.log(product,'for adding');
      
      const cartItem = {
        userId: decoded.id,
        productId: product._id,
        quantity: 1,
        price: product.price,
      };
      this.addProductToCart(cartItem);
    } else {
      const index = this.productcart.findIndex(item => item._id === product._id);
      if (index !== -1) {
        this.productcart[index].quantity += 1;
      } else {
        this.productcart.push({ ...product, quantity: 1 });
      }

      localStorage.setItem('Product', JSON.stringify(this.productcart));
      this.addedToCart.next(true);
    }
  }

  removeGuestItem(productId: string) {
    this.productcart = this.productcart.filter(item => item._id !== productId);
    localStorage.setItem('Product', JSON.stringify(this.productcart));
    this.addedToCart.next(true);
  }

  removeItem(itemId: string) {
    if (!this.token) return;
    const decoded: any = jwtDecode(this.token);
    this.http.delete(`${this.apiUrl}/cart/delete/${itemId}`, {
      body: { userId: decoded.id }
    }).subscribe({
      next: () => this.refreshCart(),
      error: (err) => {
        console.error('Error deleting item:', err);
        alert('Failed to delete item.');
      }
    });
  }

  

  updateLocalCart(cartItems: any[]) {
    this.productcart = cartItems;
    localStorage.setItem('Product', JSON.stringify(this.productcart));
    this.addedToCart.next(true);
  }
showproduct() {
    return this.productcart;
  }
  clearCart() {
    this.productcart = [];
    localStorage.removeItem('Product');
    this.addedToCart.next(true);
  }

  mergeGuestCartWithUser(products: any[], userId: string) {
  const payload = {
    userId,
    products: products.map(p => ({
      productId: p._id,
      quantity: p.quantity,
      price: p.price
    }))
  };

  return this.http.post(`${this.apiUrl}/cart/merge`, payload);
}

}
