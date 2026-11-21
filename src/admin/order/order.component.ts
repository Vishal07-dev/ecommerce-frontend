import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { HotToastService } from '@ngxpert/hot-toast';
import { AdminOrder, AdminService, ORDER_STATUSES, OrderPage, OrderStatus, STATUS_LABEL, adminError } from '../admin.service';
import { AdminLiveService } from '../live.service';
import { formatValue } from '../charts';

/** Orders: filter by status, search, move an order along, download its receipt. */
@Component({
  selector: 'app-order',
  imports: [DatePipe, RouterLink],
  template: `
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div><h1 class="studio-h1">Orders</h1></div>
      <form class="flex w-full gap-2 sm:w-auto" role="search" (submit)="$event.preventDefault(); search(q.value)">
        <label for="order-q" class="visually-hidden">Search orders</label>
        <input #q id="order-q" type="search" class="studio-input w-full sm:w-72" placeholder="Email, product or order number" [value]="query()" />
        <button type="submit" class="btn btn-quiet min-h-10 px-4 text-sm">Search</button>
      </form>
    </div>

    <div class="mt-5 studio-seg" role="group" aria-label="Filter by status">
      <button type="button" [attr.aria-pressed]="!status()" (click)="setStatus('')">All <span class="type-price text-fg-3">{{ allCount() }}</span></button>
      @for (s of statuses; track s) {
        <button type="button" [attr.aria-pressed]="status() === s" (click)="setStatus(s)">{{ label[s] }} <span class="type-price text-fg-3">{{ page()?.counts?.[s] ?? 0 }}</span></button>
      }
    </div>

    @if (error()) { <p class="mt-4 type-body-sm text-danger" role="alert">{{ error() }}</p> }

    <div class="studio-card mt-4">
      @if (page(); as p) {
        @if (p.orders.length) {
          <div class="studio-scroll">
            <table class="studio-table">
              <thead><tr><th><span class="visually-hidden">Details</span></th><th>Order</th><th>Placed</th><th>Customer</th><th class="num">Items</th><th class="num">Total</th><th>Status</th><th><span class="visually-hidden">Receipt</span></th></tr></thead>
              <tbody>
                @for (o of p.orders; track o._id) {
                  <tr>
                    <td class="w-10">
                      <button type="button" class="btn btn-icon size-8 min-h-8" (click)="toggle(o._id)" [attr.aria-expanded]="open() === o._id"
                              [attr.aria-controls]="'order-' + o._id" [attr.aria-label]="(open() === o._id ? 'Hide' : 'Show') + ' items in order ' + ref(o)">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"
                             [style.rotate]="open() === o._id ? '90deg' : '0deg'" class="transition-[rotate] duration-150"><path d="m9 6 6 6-6 6" /></svg>
                      </button>
                    </td>
                    <td class="type-price font-medium">#{{ ref(o) }}</td>
                    <td class="whitespace-nowrap text-fg-2">{{ o.createdAt | date: 'd MMM y, h:mm a' }}</td>
                    <td class="max-w-[16rem] truncate">{{ o.email }}</td>
                    <td class="num">{{ itemCount(o) }}</td>
                    <td class="num font-medium">{{ inr(o.totalAmount) }}</td>
                    <td>
                      <label class="visually-hidden" [for]="'st-' + o._id">Status of order {{ ref(o) }}</label>
                      <select [id]="'st-' + o._id" class="studio-input min-h-9 py-1" [value]="o.status" (change)="setOrderStatus(o, $any($event.target).value)" [disabled]="saving() === o._id">
                        @for (s of statuses; track s) { <option [value]="s" [selected]="o.status === s">{{ label[s] }}</option> }
                      </select>
                    </td>
                    <td>
                      <button type="button" class="type-body-sm link-underline whitespace-nowrap" (click)="receipt(o)" [disabled]="downloading() === o._id">
                        {{ downloading() === o._id ? 'Preparing…' : 'Receipt' }}
                      </button>
                    </td>
                  </tr>
                  @if (open() === o._id) {
                    <tr [id]="'order-' + o._id">
                      <td></td>
                      <td colspan="7" class="!bg-sunken/40">
                        <ul class="flex flex-col gap-2 py-1">
                          @for (it of o.items; track $index) {
                            <li class="flex items-center gap-3">
                              <span class="studio-thumb">@if (it.image) { <img [src]="it.image" alt="" /> }</span>
                              <span class="min-w-0 flex-1">
                                @if (it.productId && canManage) { <a [routerLink]="['/admin/products', it.productId]" class="link-underline">{{ it.name }}</a> } @else { {{ it.name }} }
                                <span class="block text-fg-3">Qty {{ it.quantity }}@if (it.size) { · Size {{ it.size }} }</span>
                              </span>
                              <span class="type-price">{{ inr(it.price) }}</span>
                            </li>
                          }
                        </ul>
                        <p class="mt-2 text-fg-3">Stripe session <span class="font-mono text-xs">{{ o.sessionId }}</span></p>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
          @if (p.pages > 1) {
            <nav class="flex items-center justify-between gap-3 border-t border-line px-4 py-3 type-body-sm" aria-label="Pages">
              <button type="button" class="btn btn-quiet min-h-9 px-3 text-sm" [disabled]="p.page <= 1" (click)="go(p.page - 1)">Previous</button>
              <span class="text-fg-3">Page {{ p.page }} of {{ p.pages }}</span>
              <button type="button" class="btn btn-quiet min-h-9 px-3 text-sm" [disabled]="p.page >= p.pages" (click)="go(p.page + 1)">Next</button>
            </nav>
          }
        } @else {
          <p class="p-8 text-center type-body-sm text-fg-3">
            @if (query() || status()) { No orders match. <button type="button" class="link-underline" (click)="clear()">Clear filters</button> } @else { No orders yet. }
          </p>
        }
      } @else {
        <p class="p-8 text-center type-body-sm text-fg-3" role="status">Loading orders…</p>
      }
    </div>
  `,
})
export class OrderComponent {
  private admin = inject(AdminService);
  private live = inject(AdminLiveService);
  private toast = inject(HotToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly statuses = ORDER_STATUSES;
  readonly label = STATUS_LABEL;
  readonly canManage = this.admin.canManage();
  readonly page = signal<OrderPage | null>(null);
  readonly error = signal<string | null>(null);
  readonly saving = signal<string | null>(null);
  readonly downloading = signal<string | null>(null);
  readonly open = signal<string | null>(null);

  private params = toSignal(this.route.queryParamMap, { requireSync: true });
  readonly status = computed(() => this.params().get('status') ?? '');
  readonly query = computed(() => this.params().get('q') ?? '');
  readonly pageNo = computed(() => Number(this.params().get('page')) || 1);
  readonly allCount = computed(() => Object.values(this.page()?.counts ?? {}).reduce((n, c) => n + c, 0));

  constructor() {
    inject(Title).setTitle('Orders — KŌRA Studio');
    const openId = this.route.snapshot.queryParamMap.get('open');
    if (openId) { this.open.set(openId); this.router.navigate([], { queryParams: { q: openId, open: null }, queryParamsHandling: 'merge', replaceUrl: true }); }
    effect(() => {
      const q = { status: this.status(), q: this.query(), page: this.pageNo() };
      this.live.tick();
      untracked(() => this.load(q));
    });
  }

  private load(q: { status: string; q: string; page: number }): void {
    this.admin.orders(q).subscribe({
      next: p => { this.page.set(p); this.error.set(null); },
      error: e => this.error.set(adminError(e, 'Couldn’t load orders.').message),
    });
  }

  private nav(params: Record<string, string | number | null>): void {
    this.router.navigate([], { queryParams: params, queryParamsHandling: 'merge' });
  }
  setStatus(s: string): void { this.nav({ status: s || null, page: null }); }
  search(q: string): void { this.nav({ q: q.trim() || null, page: null }); }
  go(n: number): void { this.nav({ page: n > 1 ? n : null }); }
  clear(): void { this.router.navigate([], { queryParams: {} }); }
  toggle(id: string): void { this.open.set(this.open() === id ? null : id); }

  ref(o: AdminOrder): string { return o._id.slice(-6).toUpperCase(); }
  itemCount(o: AdminOrder): number { return o.items.reduce((n, i) => n + (i.quantity ?? 1), 0); }
  inr(v: number): string { return formatValue(v, 'inr'); }

  setOrderStatus(o: AdminOrder, status: OrderStatus): void {
    const previous = o.status;
    if (status === previous) return;
    this.saving.set(o._id);
    this.page.update(p => p && ({ ...p, orders: p.orders.map(x => (x._id === o._id ? { ...x, status } : x)) })); // optimistic
    this.admin.setOrderStatus(o._id, status).subscribe({
      next: () => { this.saving.set(null); this.toast.success(`Order #${this.ref(o)} marked ${STATUS_LABEL[status].toLowerCase()}.`); this.live.refresh(); },
      error: e => {
        this.saving.set(null);
        this.page.update(p => p && ({ ...p, orders: p.orders.map(x => (x._id === o._id ? { ...x, status: previous } : x)) }));
        this.toast.error(adminError(e, 'Couldn’t update that order.').message);
      },
    });
  }

  receipt(o: AdminOrder): void {
    this.downloading.set(o._id);
    this.admin.receipt(o._id).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `kora-receipt-${this.ref(o)}.pdf`; a.click();
        URL.revokeObjectURL(url);
        this.downloading.set(null);
      },
      error: () => { this.downloading.set(null); this.toast.error('That receipt didn’t download. Try again.'); },
    });
  }
}
