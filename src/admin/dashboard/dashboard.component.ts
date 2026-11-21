import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { AdminService, Kpi, Overview, STATUS_LABEL, adminError } from '../admin.service';
import { AdminLiveService } from '../live.service';
import { AreaChartComponent, ColumnChartComponent, formatValue } from '../charts';

type Range = 7 | 30 | 90;

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DatePipe, AreaChartComponent, ColumnChartComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  private admin = inject(AdminService);
  private live = inject(AdminLiveService);

  readonly ranges: Range[] = [7, 30, 90];
  readonly range = signal<Range>(30);
  readonly data = signal<Overview | null>(null);
  readonly error = signal<string | null>(null);
  readonly statusLabel = STATUS_LABEL;
  readonly canManage = this.admin.canManage();

  readonly revenueSeries = computed(() => (this.data()?.daily ?? []).map(d => ({ label: d.date, value: d.revenue })));
  readonly orderSeries = computed(() => (this.data()?.daily ?? []).map(d => ({ label: d.date, value: d.orders })));
  readonly statusTotal = computed(() => (this.data()?.statuses ?? []).reduce((n, s) => n + s.count, 0));
  readonly statusAria = computed(() => 'Order status: ' + (this.data()?.statuses ?? []).map(s => `${STATUS_LABEL[s.status]} ${s.count}`).join(', '));
  readonly topMax = computed(() => Math.max(1, ...(this.data()?.topProducts ?? []).map(t => t.revenue)));

  constructor() {
    inject(Title).setTitle('Overview — KŌRA Studio');
    // Reload when the range changes, and silently on every live tick.
    effect(() => {
      const days = this.range();
      this.live.tick();
      untracked(() => this.load(days));
    });
  }

  load(days: Range = this.range()): void {
    this.admin.overview(days).subscribe({
      next: d => { this.data.set(d); this.error.set(null); },
      error: e => this.error.set(adminError(e, 'Couldn’t load the overview.').message),
    });
  }

  inr(v: number): string { return formatValue(v, 'inr'); }

  /** "Up 12% on the previous 30 days" — direction in words, not colour alone. */
  delta(k: Kpi): { text: string; dir: 'up' | 'down' | 'flat' } {
    const days = this.range();
    if (!k.previous && !k.value) return { text: `No change on the previous ${days} days`, dir: 'flat' };
    if (!k.previous) return { text: `New this period (none in the previous ${days} days)`, dir: 'up' };
    const pct = Math.round(((k.value - k.previous) / k.previous) * 100);
    if (pct === 0) return { text: `Same as the previous ${days} days`, dir: 'flat' };
    return { text: `${pct > 0 ? 'Up' : 'Down'} ${Math.abs(pct)}% on the previous ${days} days`, dir: pct > 0 ? 'up' : 'down' };
  }

  pct(count: number): number { return this.statusTotal() ? (count / this.statusTotal()) * 100 : 0; }
}
