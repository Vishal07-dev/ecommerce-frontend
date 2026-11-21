import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { HotToastService } from '@ngxpert/hot-toast';
import { environment } from '../../environment/environment';
import { AdminService, adminError } from '../admin.service';
import { closeDialog, openDialog } from '../../ui/dialog';

interface Category { _id: string; name: string; description: string; status: 'Active' | 'Inactive'; updatedAt?: string; }

/** Categories: add, rename, switch on or off, and delete when unused. */
@Component({
  selector: 'app-category',
  imports: [RouterLink],
  template: `
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>

        <h1 class="studio-h1">Categories</h1>
        <p class="mt-1 type-body-sm text-fg-3">Shop filters use these. Inactive categories can’t receive new products.</p>
      </div>
      <button type="button" class="btn btn-solid min-h-10 px-4 text-sm" (click)="edit()">Add a category</button>
    </div>

    @if (error()) { <p class="mt-4 type-body-sm text-danger" role="alert">{{ error() }}</p> }

    <div class="studio-card mt-5">
      @if (list()) {
        @if (list()!.length) {
          <div class="studio-scroll">
            <table class="studio-table">
              <thead><tr><th>Category</th><th>Description</th><th class="num">Products</th><th>Status</th><th><span class="visually-hidden">Actions</span></th></tr></thead>
              <tbody>
                @for (c of list(); track c._id) {
                  <tr>
                    <td class="font-medium capitalize">{{ c.name }}</td>
                    <td class="max-w-[24rem] truncate text-fg-2">{{ c.description }}</td>
                    <td class="num">
                      @if (counts()[c.name]) { <a routerLink="/admin/products" class="link-underline">{{ counts()[c.name] }}</a> } @else { <span class="text-fg-3">0</span> }
                    </td>
                    <td><span class="studio-pill" [attr.data-tone]="c.status === 'Active' ? 'delivered' : 'archived'">{{ c.status === 'Active' ? 'Active' : 'Inactive' }}</span></td>
                    <td>
                      <div class="flex justify-end gap-1">
                        <button type="button" class="btn btn-quiet min-h-9 px-3 text-sm" (click)="edit(c)">Edit</button>
                        <button type="button" class="btn btn-icon size-9 min-h-9 text-danger" (click)="askDelete(c)" [attr.aria-label]="'Delete ' + c.name">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 7h14M10 11v6m4-6v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4h6v3" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <p class="p-8 text-center type-body-sm text-fg-3">No categories yet. Add one before adding products.</p>
        }
      } @else {
        <p class="p-8 text-center type-body-sm text-fg-3" role="status">Loading categories…</p>
      }
    </div>

    <!-- Add / edit -->
    <dialog #editor class="modal" aria-labelledby="cat-title" (close)="formError.set(null)">
      <form class="flex flex-col gap-4 p-6" (submit)="$event.preventDefault(); save()" novalidate>
        <h2 id="cat-title" class="type-h2">{{ draft()._id ? 'Edit category' : 'New category' }}</h2>
        @if (formError(); as e) { <p class="type-body-sm text-danger" role="alert">{{ e }}</p> }
        <div class="flex flex-col gap-1.5">
          <label for="cat-name" class="type-body-sm font-medium">Name</label>
          <input id="cat-name" class="studio-input" [value]="draft().name" (input)="patch('name', $any($event.target).value)" placeholder="knitwear" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="cat-desc" class="type-body-sm font-medium">Description</label>
          <textarea id="cat-desc" rows="2" class="studio-input" [value]="draft().description" (input)="patch('description', $any($event.target).value)"></textarea>
        </div>
        <label class="flex min-h-11 items-center gap-3 type-body-sm">
          <input type="checkbox" class="size-4 accent-[var(--fg)]" [checked]="draft().status === 'Active'" (change)="patch('status', $any($event.target).checked ? 'Active' : 'Inactive')" />
          Active (new products can use it)
        </label>
        <div class="flex justify-end gap-2">
          <button type="button" class="btn btn-quiet" (click)="close(editor)">Cancel</button>
          <button type="submit" class="btn btn-solid" [disabled]="saving()">{{ saving() ? 'Saving…' : 'Save' }}</button>
        </div>
      </form>
    </dialog>

    <!-- Delete -->
    <dialog #confirm class="modal" aria-labelledby="catdel-title">
      @if (toDelete(); as c) {
        <div class="p-6">
          <h2 id="catdel-title" class="type-h2">Delete “{{ c.name }}”?</h2>
          <p class="mt-3 type-body text-fg-2">
            @if (counts()[c.name]) { {{ counts()[c.name] }} {{ counts()[c.name] === 1 ? 'product uses' : 'products use' }} it. Move them to another category first, or switch it to inactive instead. }
            @else { No products use it. This can’t be undone. }
          </p>
          <div class="mt-6 flex justify-end gap-2">
            <button type="button" class="btn btn-quiet" (click)="close(confirm)">Keep it</button>
            @if (!counts()[c.name]) { <button type="button" class="btn btn-solid !bg-danger !text-white" (click)="doDelete(c)" [disabled]="saving()">Delete</button> }
          </div>
        </div>
      }
    </dialog>
  `,
})
export class CategoryComponent {
  private http = inject(HttpClient);
  private admin = inject(AdminService);
  private toast = inject(HotToastService);
  private api = `${environment.apiUrl}/category`;
  private editor = viewChild.required<ElementRef<HTMLDialogElement>>('editor');
  private confirm = viewChild.required<ElementRef<HTMLDialogElement>>('confirm');

  readonly list = signal<Category[] | null>(null);
  readonly productCats = signal<(string | null)[]>([]);
  readonly counts = computed(() => this.productCats().reduce<Record<string, number>>((m, c) => (c ? { ...m, [c]: (m[c] ?? 0) + 1 } : m), {}));
  readonly error = signal<string | null>(null);
  readonly formError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly draft = signal<Partial<Category>>({ name: '', description: '', status: 'Active' });
  readonly toDelete = signal<Category | null>(null);

  constructor() {
    inject(Title).setTitle('Categories — KŌRA Studio');
    this.load();
  }

  load(): void {
    this.http.get<Category[]>(`${this.api}/`).subscribe({
      next: l => { this.list.set([...l].sort((a, b) => a.name.localeCompare(b.name))); this.error.set(null); },
      error: e => this.error.set(adminError(e, 'Couldn’t load categories.').message),
    });
    this.admin.products().subscribe({ next: r => this.productCats.set(r.products.map(p => p.category)) });
  }

  patch<K extends keyof Category>(k: K, v: Category[K]): void { this.draft.update(d => ({ ...d, [k]: v })); }

  edit(c?: Category): void {
    this.draft.set(c ? { ...c } : { name: '', description: '', status: 'Active' });
    this.formError.set(null);
    openDialog(this.editor().nativeElement);
    setTimeout(() => document.getElementById('cat-name')?.focus(), 50);
  }

  close(d: HTMLDialogElement): void { closeDialog(d); }

  save(): void {
    const d = this.draft();
    if (!d.name?.trim()) { this.formError.set('Give the category a name.'); return; }
    if (!d.description?.trim()) { this.formError.set('Add a short description.'); return; }
    this.saving.set(true);
    const body = { name: d.name.trim(), description: d.description.trim(), status: d.status ?? 'Active' };
    const req = d._id ? this.http.put(`${this.api}/update/${d._id}`, body) : this.http.post(`${this.api}/create`, body);
    req.subscribe({
      next: () => { this.saving.set(false); closeDialog(this.editor().nativeElement); this.toast.success(`${body.name} saved.`); this.load(); },
      error: e => { this.saving.set(false); this.formError.set(adminError(e, 'Couldn’t save the category.').message); },
    });
  }

  askDelete(c: Category): void { this.toDelete.set(c); openDialog(this.confirm().nativeElement); }

  doDelete(c: Category): void {
    this.saving.set(true);
    this.http.delete(`${this.api}/delete/${c._id}`).subscribe({
      next: () => { this.saving.set(false); closeDialog(this.confirm().nativeElement); this.toast.success(`${c.name} deleted.`); this.load(); },
      error: e => { this.saving.set(false); this.toast.error(adminError(e, 'Couldn’t delete the category.').message); },
    });
  }
}
