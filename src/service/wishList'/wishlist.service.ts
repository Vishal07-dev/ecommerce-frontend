// wishlist.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';

// --- CHANGE 1: Define the correct API interfaces here ---
// These should match the actual structure of the JSON response.

interface ApiProduct {
  _id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  stock: number;
  image: string;
  ratings: number;
  numReviews: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

// Renamed to ApiWishlistResponse for clarity and consistency
interface ApiWishlistResponse {
  _id: string;
  user: string;
  products: ApiProduct[];
  createdAt: string;
  updatedAt: string;
  __v: number; // The missing property is now included!
}

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private baseUrl = environment.apiUrl;
  wishlist: any[] = [];

  constructor(private http: HttpClient) {}

  // The interface used for adding an item might be different.
  // For this example, let's assume it only needs the product ID.
  addItemToWishList(productId:any): Observable<any> {
    let product_id = productId._id || productId; // Ensure we get the ID correctly
    localStorage.setItem('wishList', JSON.stringify(productId));
    return this.http.post(`${this.baseUrl}/wishlist/add`, { productId });
  }

  // --- CHANGE 2: Update the return type of the method ---
  // It now correctly returns an Observable of the full API response type.
  getUserWishList(): Observable<ApiWishlistResponse> {
    return this.http.get<ApiWishlistResponse>(`${this.baseUrl}/wishlist/list`);
  }

  removeItemFromWishList(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/wishlist/remove/${id}`);
  }

  clearWishList(): Observable<any> {
    return this.http.delete(`${this.baseUrl}/wishlist/clear`);
  }

  // mergeWishListItems likely takes an array of product IDs, not full product objects.
  // Adjust as needed based on your backend API.
  mergeWishListItems(productIds: string[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/wishlist/merge`, { items: productIds });
  }
}