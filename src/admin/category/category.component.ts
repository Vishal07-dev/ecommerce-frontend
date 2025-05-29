import { Component, computed, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../service/category.service'

interface Category {
  id: number;
  name: string;
  description: string;
  status: 'Active' | 'Inactive';
  createdAt: Date;
  updatedAt: Date;
}
@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category.component.html',
  styleUrl: './category.component.css'
})


export class CategoryComponent {
  categories = signal<Category[]>([]);
  filteredCategories = signal<Category[]>([]);
  showModal = signal(false);
  showDeleteModal = signal(false);
  isEditing = false;
  searchTerm = '';
  statusFilter = '';

  currentCategory: any = {
    name: '',
    description: '',
    status: 'Active'
  };
  categoryToDelete: any = null;

  constructor(private categoryService: CategoryService) {
    this.fetchCategories();

    // ReActively refresh list on creation/update/deletion
    effect(() => {
      this.categoryService.categoryCreate$.subscribe(refresh => {
        if (refresh) {
          this.fetchCategories();
        }
      });
    });
  }

  fetchCategories() {
   
    
    this.categoryService.getCategory().subscribe({
      next: (categories: any) => {
        this.categories.set(categories);
        this.filterCategories();
      },
      error: (err) => {
        console.error('Failed to fetch categories:', err);
      }
    });
  }

  openCreateModal() {
    this.isEditing = false;
    this.currentCategory = { name: '', description: '', status: 'Active' };
    this.showModal.set(true);
  }

  openEditModal(category: any) {
    this.isEditing = true;
    this.currentCategory = { ...category };
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.currentCategory = { name: '', description: '', status: 'Active' };
  }

  saveCategory() {
    if (!this.currentCategory.name?.trim()) return;

    if (this.isEditing && this.currentCategory._id) {
      this.categoryService.updateCategory(this.currentCategory, this.currentCategory._id);
    } else {
      this.categoryService.createCategory(this.currentCategory);
    }

    this.closeModal();
  }

  openDeleteModal(category: any) {
    this.categoryToDelete = category;
    this.showDeleteModal.set(true);
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.categoryToDelete = null;
  }

  confirmDelete() {
    if (this.categoryToDelete) {
      this.categoryService.deleteCategory(this.categoryToDelete._id);
    }
    this.closeDeleteModal();
  }

  toggleStatus(category: any) {
    const updatedStatus = category.status === 'Active' ? 'Inactive' : 'Active';
    this.categoryService.updateCategory({ ...category, status: updatedStatus }, category._id);
  }

  filterCategories() {
    let filtered = this.categories();

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(term) ||
        c.description.toLowerCase().includes(term)
      );
    }

    if (this.statusFilter) {
      filtered = filtered.filter(c => c.status === this.statusFilter);
    }

    this.filteredCategories.set(filtered);
  }

  getActiveCount(): number {
    return this.categories().filter(c => c.status === 'Active').length;
  }

  getInactiveCount(): number {
    return this.categories().filter(c => c.status === 'Inactive').length;
  }
}
