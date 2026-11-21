import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { AdminService, CustomerPage, adminError } from '../admin.service';
import { AdminLiveService } from '../live.service';
import { formatValue } from '../charts';

/** Customers: every account with what they've bought. Read-only by design. */
@Component({
  selector: 'app-customer',
  imports: [DatePipe, RouterLink],
  template: `
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>

        <h1 class="studio-h1">Customers</h1>
        @if (page(); as p) { <p class="mt-1 type-body-sm text-fg-3">{{ p.total }} {{ p.total === 1 ? 'account' : 'accounts' }}</p> }
      </div>
      <form class="flex w-full gap-2 sm:w-auto" role="search" (submit)="$event.preventDefault(); search(q.value)">
        <label for="cust-q" class="visually-hidden">Search customers</label>
        <input #q id="cust-q" type="search" class="studio-input w-full sm:w-72" placeholder="Name or email" [value]="query()" />
        <button type="submit" class="btn btn-quiet min-h-10 px-4 text-sm">Search</button>
      </form>
    </div>

    @if (error()) { <p class="mt-4 type-body-sm text-danger" role="alert">{{ error() }}</p> }

    <div class="studio-card mt-5">
      @if (page(); as p) {
        @if (p.customers.length) {
          <div class="studio-scroll">
            <table class="studio-table">
              <thead><tr><th>Customer</th><th>City</th><th>Joined</th><th class="num">Orders</th><th class="num">Spent</th><th>Last order</th></tr></thead>
              <tbody>
                @for (c of p.customers; track c._id) {
                  <tr>
                    <td>
                      <div class="flex items-center gap-3">
                        <span class="grid size-9 shrink-0 place-items-center rounded-full bg-sunken text-xs font-medium uppercase text-fg-2" aria-hidden="true">{{ initials(c.name) }}</span>
                        <span class="min-w-0">
                          <span class="block truncate font-medium capitalize">{{ c.name }}</span>
                          <span class="block truncate text-fg-3">{{ c.email }}@if (c.phone) { · {{ c.phone }} }</span>
                        </span>
                      </div>
                    </td>
                    <td class="text-fg-2">{{ c.city ?? '—' }}</td>
                    <td class="whitespace-nowrap text-fg-2">{{ c.createdAt | date: 'd MMM y' }}</td>
                    <td class="num">{{ c.orders }}</td>
                    <td class="num font-medium">{{ inr(c.spent) }}</td>
                    <td class="whitespace-nowrap">
                      @if (c.lastOrder) { <a routerLink="/admin/orders" [queryParams]="{ q: c.email }" class="link-underline">{{ c.lastOrder | date: 'd MMM y' }}</a> }
                      @else { <span class="text-fg-3">No orders yet</span> }
                    </td>
                  </tr>
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
          <p class="p-8 text-center type-body-sm text-fg-3">@if (query()) { No customers match “{{ query() }}”. } @else { No customer accounts yet. }</p>
        }
      } @else {
        <p class="p-8 text-center type-body-sm text-fg-3" role="status">Loading customers…</p>
      }
    </div>
  `,
})
export class CustomerComponent {
  private admin = inject(AdminService);
  private live = inject(AdminLiveService);
  private router = inject(Router);
  private params = toSignal(inject(ActivatedRoute).queryParamMap, { requireSync: true });

  readonly page = signal<CustomerPage | null>(null);
  readonly error = signal<string | null>(null);
  readonly query = computed(() => this.params().get('q') ?? '');
  readonly pageNo = computed(() => Number(this.params().get('page')) || 1);

  constructor() {
    inject(Title).setTitle('Customers — KŌRA Studio');
    effect(() => {
      const q = { q: this.query(), page: this.pageNo() };
      this.live.tick();
      untracked(() => this.admin.customers(q).subscribe({
        next: p => { this.page.set(p); this.error.set(null); },
        error: e => this.error.set(adminError(e, 'Couldn’t load customers.').message),
      }));
    });
  }

  search(q: string): void { this.router.navigate([], { queryParams: { q: q.trim() || null, page: null }, queryParamsHandling: 'merge' }); }
  go(n: number): void { this.router.navigate([], { queryParams: { page: n > 1 ? n : null }, queryParamsHandling: 'merge' }); }
  initials(name: string): string { return name.split(/\s+/).map(w => w[0]).slice(0, 2).join(''); }
  inr(v: number): string { return formatValue(v, 'inr'); }
}
