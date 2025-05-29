import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  private apiUrl = environment.apiUrl; // your backend URL

  constructor(private http: HttpClient) { }

  private categoryCreate = new BehaviorSubject<boolean>(false)
  categoryCreate$ = this.categoryCreate.asObservable()

  createCategory(category: any) {
    return this.http.post(`${this.apiUrl}/category/create`, category)
      .subscribe({
        next: () => {
          alert('Product created successfully!');
          this.categoryCreate.next(true)
        },
        error: (err) => {
          console.error('Error creating category:', err);
          alert('Failed to create category. Check console.');
        },
      });
  }

  updateCategory(category: any,id:string) {
    return this.http.put(`${this.apiUrl}/category/update/${id}`, category)
      .subscribe({
        next: () => {
          alert('Category updated successfully!');
          this.categoryCreate.next(true)
        },
        error: (err) => {
          console.error('Error updating category:', err);
          alert('Failed to update category. Check console.');
        },
      });
  }

  deleteCategory(id:string) {
    return this.http.delete(`${this.apiUrl}/category/delete/${id}`)
      .subscribe({
        next: () => {
          alert('Category deleteted successfully!');
          this.categoryCreate.next(true)
        },
        error: (err) => {
          console.error('Error deleteing category:', err);
          alert('Failed to  delete category. Check console.');
        },
      });
  }

  getCategory() {
    return this.http.get(`${this.apiUrl}/category`)
    
  }
}
