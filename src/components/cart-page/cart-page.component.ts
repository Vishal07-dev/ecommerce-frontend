import { CommonModule } from '@angular/common';
import { Component, signal, computed, effect, inject, OnInit } from '@angular/core';
import { CartService } from '../../service/cartService/cart.service';
import { RouterLink } from '@angular/router';

interface CartItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category: { name:''};
  productId: string; 
  originalPrice?: number;
}

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart-page.component.html',
  styleUrl: './cart-page.component.css'
})
export class CartPageComponent implements OnInit {
  cartService = inject(CartService);
  cartItems = signal<CartItem[]>([]);

  ngOnInit() {
    this.cartService.getUserCart();
    // Update cart when notified
    this.cartService.addedToCart$.subscribe(() => {
      const items = this.cartService.showproduct().map((item: any) => ({
        
        ...item,
        quantity: item.quantity ?? 1
      }));
      console.log(items);
      
      this.cartItems.set(items);
    });
    console.log(this.cartItems());
    
  }


  shipping = computed(() => this.subtotal() > 100 ? 0 : 0);
  tax = computed(() => this.subtotal() * 0.08);
  total = computed(() => this.subtotal() + this.tax() + this.shipping());
  totalItems = computed(() => this.cartItems().reduce((sum, item) => sum + item.quantity, 0));

  updateQuantity(itemId: string, newQuantity: number): void {
    if (newQuantity < 1) return;
    this.cartItems.update(items =>
      items.map(item =>
        item._id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
    this.cartService.updateLocalCart(this.cartItems());
    
  }
  getItemSubtotal(item: CartItem): number {
  return item.price * item.quantity;
}

  subtotal = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  removeItem(itemId: string): void {
    if (this.cartService.token) {
      this.cartService.removeItem(itemId); // API call and refresh
    } else {
      this.cartService.removeGuestItem(itemId); // Local only
      this.cartItems.update(items => items.filter(item => item._id !== itemId));
    }
  }

  trackByItemId(index: number, item: CartItem): string {
    return item._id;
  }

  recommendedItems = [
    { _id: '4', name: 'Phone Case', price: 24.99, image: 'https://images.unsplash.com/photo-1601593346740-925612772716?w=200&h=200&fit=crop&crop=center' },
    { _id: '5', name: 'Bluetooth Speaker', price: 89.99, image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=200&h=200&fit=crop&crop=center' },
    { _id: '6', name: 'Laptop Stand', price: 49.99, image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=200&h=200&fit=crop&crop=center' },
    { _id: '7', name: 'USB Cable', price: 14.99, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop&crop=center' }
  ];
}
