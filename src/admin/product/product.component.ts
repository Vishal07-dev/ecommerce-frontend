import { Component, ElementRef, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { HotToastService } from '@ngxpert/hot-toast';
import { AdminProductRow, AdminService, PLACEMENT_LABEL, Placement, ProductList, adminError } from '../admin.service';
import { AdminLiveService } from '../live.service';
import { formatValue } from '../charts';
import { closeDialog, openDialog } from '../../ui/dialog';

const PLACEMENTS: Placement[] = ['hero', 'featured', 'shop', 'archived'];
const PLACEMENT_HELP: Record<Placement, string> = {
  hero: 'The big cover at the top of the home page. Only one product at a time.',
  featured: 'Shown in “The Edit” on the home page, and in the shop.',
  shop: 'In the shop and search only.',
  archived: 'Hidden from the store. Nothing is deleted; restore it any time.',
};

/** Products: where each piece appears, its stock, and quick actions. */
@Component({
  selector: 'app-product',
  imports: [RouterLink],
  template: `
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>

        <h1 class="studio-h1">Products</h1>
      </div>
      <div class="flex w-full flex-wrap gap-2 sm:w-auto">
        <label for="prod-q" class="visually-hidden">Search products</label>
        <input id="prod-q" type="search" class="studio-input min-w-0 flex-1 sm:w-64" placeholder="Search by name" [value]="q()" (input)="q.set($any($event.target).value)" />
        <a routerLink="/admin/products/new" class="btn btn-solid min-h-10 px-4 text-sm">Add a product</a>
      </div>
    </div>

    <div class="mt-5 studio-seg" role="group" aria-label="Show products by placement">
      <button type="button" [attr.aria-pressed]="!filter()" (click)="setFilter('')">All <span class="type-price text-fg-3">{{ list()?.counts?.all ?? 0 }}</span></button>
      @for (p of placements; track p) {
        <button type="button" [attr.aria-pressed]="filter() === p" (click)="setFilter(p)">{{ label[p] }} <span class="type-price text-fg-3">{{ list()?.counts?.[p] ?? 0 }}</span></button>
      }
    </div>
    @if (filter()) { <p class="mt-3 type-body-sm text-fg-3">{{ helpText() }}</p> }

    @if (error()) { <p class="mt-4 type-body-sm text-danger" role="alert">{{ error() }}</p> }

    <div class="studio-card mt-4">
      @if (list()) {
        @if (rows().length) {
          <div class="studio-scroll">
            <table class="studio-table">
              <thead><tr><th>Product</th><th>Category</th><th class="num">Price</th><th class="num">Stock</th><th>Shows on</th><th><span class="visually-hidden">Actions</span></th></tr></thead>
              <tbody>
                @for (p of rows(); track p._id) {
                  <tr [class.opacity-60]="p.placement === 'archived'">
                    <td>
                      <a [routerLink]="['/admin/products', p._id]" class="flex items-center gap-3">
                        <span class="studio-thumb">@if (p.image) { <img [src]="p.image" alt="" loading="lazy" /> }</span>
                        <span class="min-w-0">
                          <span class="block max-w-[18rem] truncate font-medium hover:underline">{{ p.name }}</span>
                          <span class="block max-w-[18rem] truncate text-fg-3">{{ p.colorway || p.subtitle || p.slug }}</span>
                        </span>
                      </a>
                    </td>
                    <td class="text-fg-2"><span class="capitalize">{{ p.category ?? '—' }}</span>@if (p.edition) { <span class="block text-fg-3">{{ p.edition }}</span> }</td>
                    <td class="num">{{ inr(p.price) }}@if (p.compareAtPrice) { <s class="block text-fg-3">{{ inr(p.compareAtPrice) }}</s> }</td>
                    <td class="num">
                      {{ p.stock }}
                      @if (p.lowSizes.length) {
                        <span class="block text-danger">@for (s of p.lowSizes; track s.size; let last = $last) { {{ s.size }}: {{ s.stock }}{{ last ? '' : ', ' }} }</span>
                      }
                    </td>
                    <td>
                      <label class="visually-hidden" [for]="'pl-' + p._id">Where {{ p.name }} shows</label>
                      <select [id]="'pl-' + p._id" class="studio-input min-h-9 py-1" [value]="p.placement" (change)="move(p, $any($event.target).value)" [disabled]="busy() === p._id">
                        @for (pl of placements; track pl) { <option [value]="pl" [selected]="p.placement === pl">{{ label[pl] }}</option> }
                      </select>
                    </td>
                    <td>
                      <div class="flex items-center justify-end gap-1">
                        <a [routerLink]="['/admin/products', p._id]" class="btn btn-quiet min-h-9 px-3 text-sm">Edit</a>
                        <a [href]="'/product/' + (p.slug || p._id)" target="_blank" rel="noopener" class="btn btn-icon size-9 min-h-9" [attr.aria-label]="'View ' + p.name + ' in the store (opens a new tab)'">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>
                        </a>
                        <button type="button" class="btn btn-icon size-9 min-h-9 text-danger" (click)="askDelete(p)" [attr.aria-label]="'Delete ' + p.name">
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
          <p class="p-8 text-center type-body-sm text-fg-3">No products here. <a routerLink="/admin/products/new" class="link-underline">Add one</a></p>
        }
      } @else {
        <p class="p-8 text-center type-body-sm text-fg-3" role="status">Loading products…</p>
      }
    </div>

    <!-- Delete confirmation -->
    <dialog #confirm class="modal" aria-labelledby="del-title" (close)="toDelete.set(null)">
      @if (toDelete(); as p) {
        <div class="p-6">
          <h2 id="del-title" class="type-h2">Delete {{ p.name }}?</h2>
          <p class="mt-3 type-body text-fg-2">It will be removed from the store for good. Past orders keep their record of it. This can’t be undone.</p>
          <p class="mt-2 type-body-sm text-fg-3">To hide it but keep it, choose <strong>Archived</strong> instead.</p>
          <div class="mt-6 flex flex-wrap justify-end gap-2">
            <button type="button" class="btn btn-quiet" (click)="archiveInstead(p)">Archive instead</button>
            <button type="button" class="btn btn-quiet" (click)="closeConfirm()">Keep it</button>
            <button type="button" class="btn btn-solid !bg-danger !text-white" (click)="doDelete(p)" [disabled]="busy() === p._id">{{ busy() === p._id ? 'Deleting…' : 'Delete' }}</button>
          </div>
        </div>
      }
    </dialog>
  `,
})
export class ProductComponent {
  private admin = inject(AdminService);
  private live = inject(AdminLiveService);
  private toast = inject(HotToastService);
  private router = inject(Router);
  private confirmDialog = viewChild.required<ElementRef<HTMLDialogElement>>('confirm');
  private params = toSignal(inject(ActivatedRoute).queryParamMap, { requireSync: true });

  readonly placements = PLACEMENTS;
  readonly label = PLACEMENT_LABEL;
  readonly help = PLACEMENT_HELP;
  readonly list = signal<ProductList | null>(null);
  readonly error = signal<string | null>(null);
  readonly busy = signal<string | null>(null);
  readonly toDelete = signal<AdminProductRow | null>(null);
  readonly q = signal('');
  readonly filter = computed(() => this.params().get('placement') ?? '');
  readonly helpText = computed(() => PLACEMENT_HELP[this.filter() as Placement] ?? '');

  readonly rows = computed(() => {
    const term = this.q().trim().toLowerCase();
    return (this.list()?.products ?? [])
      .filter(p => !this.filter() || p.placement === this.filter())
      .filter(p => !term || p.name.toLowerCase().includes(term) || (p.colorway ?? '').toLowerCase().includes(term));
  });

  constructor() {
    inject(Title).setTitle('Products — KŌRA Studio');
    effect(() => { this.live.tick(); untracked(() => this.load()); });
  }

  load(): void {
    this.admin.products().subscribe({
      next: l => { this.list.set(l); this.error.set(null); },
      error: e => this.error.set(adminError(e, 'Couldn’t load products.').message),
    });
  }

  setFilter(p: string): void { this.router.navigate([], { queryParams: { placement: p || null } }); }
  inr(v: number): string { return formatValue(v, 'inr'); }

  move(p: AdminProductRow, placement: Placement): void {
    if (placement === p.placement) return;
    const previousHero = this.list()?.products.find(x => x.placement === 'hero' && x._id !== p._id);
    this.busy.set(p._id);
    this.admin.setPlacement(p._id, placement).subscribe({
      next: () => {
        this.busy.set(null);
        const msg = placement === 'hero'
          ? `${p.name} is now the home page hero${previousHero ? ` (it replaces ${previousHero.name}, now featured)` : ''}.`
          : `${p.name}: ${PLACEMENT_LABEL[placement]}.`;
        this.toast.success(msg);
        this.load();
      },
      error: e => { this.busy.set(null); this.toast.error(adminError(e, 'Couldn’t move that product.').message); this.load(); },
    });
  }

  askDelete(p: AdminProductRow): void {
    if (p.placement === 'hero') { this.toast.error('This is the home page hero. Choose another hero first.'); return; }
    this.toDelete.set(p);
    openDialog(this.confirmDialog().nativeElement);
  }
  closeConfirm(): void { closeDialog(this.confirmDialog().nativeElement); }
  archiveInstead(p: AdminProductRow): void { this.closeConfirm(); this.move(p, 'archived'); }

  doDelete(p: AdminProductRow): void {
    this.busy.set(p._id);
    this.admin.deleteProduct(p._id).subscribe({
      next: r => { this.busy.set(null); this.closeConfirm(); this.toast.success(r.message); this.load(); },
      error: e => { this.busy.set(null); this.toast.error(adminError(e, 'Couldn’t delete that product.').message); },
    });
  }
}
