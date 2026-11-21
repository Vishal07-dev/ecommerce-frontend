import { Component, Directive, ElementRef, OnDestroy, afterNextRender, computed, input, signal, viewChild } from '@angular/core';

export interface Point { label: string; value: number; }
type Format = 'inr' | 'count';

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const count = new Intl.NumberFormat('en-IN');
export function formatValue(v: number, f: Format): string { return f === 'inr' ? inr.format(v) : count.format(v); }
function compact(v: number, f: Format): string {
  if (f === 'inr') {
    if (v >= 1e7) return `₹${+(v / 1e7).toFixed(1)}Cr`;
    if (v >= 1e5) return `₹${+(v / 1e5).toFixed(1)}L`;
    if (v >= 1e3) return `₹${+(v / 1e3).toFixed(1)}k`;
    return `₹${Math.round(v)}`;
  }
  return count.format(v);
}
/** "Nice" y-axis maximum and 4 ticks (0, ¼, ½, ¾, max). */
function niceMax(max: number): number {
  if (max <= 0) return 4;
  const pow = 10 ** Math.floor(Math.log10(max));
  const step = [1, 2, 2.5, 5, 10].find(s => s * pow * 4 >= max)! * pow;
  return step * 4;
}
function dayLabel(iso: string, long = false): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString('en-IN', long ? { weekday: 'short', day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short' });
}

/** Shared sizing: the SVG is drawn at the container's real width, so text never scales. */
@Directive()
abstract class Sized implements OnDestroy {
  protected host = viewChild.required<ElementRef<HTMLElement>>('host');
  readonly width = signal(600);
  private ro?: ResizeObserver;
  constructor() {
    afterNextRender(() => {
      const el = this.host().nativeElement;
      this.width.set(el.clientWidth || 600);
      this.ro = new ResizeObserver(([e]) => this.width.set(Math.max(240, Math.round(e.contentRect.width))));
      this.ro.observe(el);
    });
  }
  ngOnDestroy(): void { this.ro?.disconnect(); }
}

const H = 220, PAD = { t: 12, r: 12, b: 26, l: 52 };

/**
 * Single-series area chart (daily revenue). No legend: the card title names
 * the series. Crosshair + tooltip on hover; arrow keys move it for keyboard users.
 */
@Component({
  selector: 'studio-area-chart',
  template: `
    <div #host class="viz relative" (pointerleave)="active.set(null)">
      <svg [attr.width]="width()" [attr.height]="h" role="img" [attr.aria-label]="ariaLabel()" tabindex="0"
           (pointermove)="onMove($event)" (keydown)="onKey($event)" (focus)="active.set(active() ?? data().length - 1)" (blur)="active.set(null)"
           class="block outline-offset-4">
        @for (t of ticks(); track $index) {
          <line [attr.x1]="pad.l" [attr.x2]="width() - pad.r" [attr.y1]="t.y" [attr.y2]="t.y" stroke="var(--viz-grid)" stroke-width="1" />
          <text [attr.x]="pad.l - 8" [attr.y]="t.y + 4" text-anchor="end">{{ t.label }}</text>
        }
        @for (x of xLabels(); track $index) {
          <text [attr.x]="x.x" [attr.y]="h - 6" [attr.text-anchor]="x.anchor">{{ x.label }}</text>
        }
        <path [attr.d]="areaPath()" fill="var(--series-1)" fill-opacity="0.12" />
        <path [attr.d]="linePath()" fill="none" stroke="var(--series-1)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
        @if (active() !== null) {
          <line [attr.x1]="px(active()!)" [attr.x2]="px(active()!)" [attr.y1]="pad.t" [attr.y2]="h - pad.b" stroke="var(--viz-axis)" stroke-width="1" stroke-dasharray="3 3" />
          <circle [attr.cx]="px(active()!)" [attr.cy]="py(data()[active()!].value)" r="4.5" fill="var(--series-1)" stroke="var(--viz-surface)" stroke-width="2" />
        }
      </svg>
      @if (active() !== null) {
        <div class="viz-tip" [style.left.px]="px(active()!)" [style.top.px]="py(data()[active()!].value)">
          <div class="opacity-70">{{ longLabel(data()[active()!].label) }}</div>
          <div class="font-medium">{{ fmt(data()[active()!].value) }}</div>
        </div>
      }
    </div>
    <details class="mt-2 px-1 type-body-sm text-fg-3">
      <summary class="cursor-pointer">Show data</summary>
      <div class="studio-scroll mt-2 max-h-56 overflow-y-auto">
        <table class="studio-table"><thead><tr><th>Day</th><th class="num">{{ valueName() }}</th></tr></thead>
          <tbody>@for (d of data(); track d.label) { <tr><td>{{ longLabel(d.label) }}</td><td class="num">{{ fmt(d.value) }}</td></tr> }</tbody></table>
      </div>
    </details>
  `,
})
export class AreaChartComponent extends Sized {
  readonly data = input.required<Point[]>();
  readonly format = input<Format>('inr');
  readonly valueName = input('Revenue');
  readonly active = signal<number | null>(null);
  readonly h = H;
  readonly pad = PAD;

  private readonly max = computed(() => niceMax(Math.max(0, ...this.data().map(d => d.value))));
  readonly ticks = computed(() => [0, 1, 2, 3, 4].map(i => { const v = (this.max() / 4) * i; return { y: this.py(v), label: compact(v, this.format()) }; }));
  readonly xLabels = computed(() => {
    const d = this.data(); if (!d.length) return [];
    const idx = d.length > 2 ? [0, Math.floor((d.length - 1) / 2), d.length - 1] : [0, d.length - 1];
    return idx.map((i, k) => ({ x: this.px(i), label: dayLabel(d[i].label), anchor: k === 0 ? 'start' : k === idx.length - 1 ? 'end' : 'middle' }));
  });
  readonly linePath = computed(() => this.data().map((d, i) => `${i ? 'L' : 'M'}${this.px(i).toFixed(1)},${this.py(d.value).toFixed(1)}`).join(''));
  readonly areaPath = computed(() => { const d = this.data(); if (!d.length) return ''; return `${this.linePath()}L${this.px(d.length - 1)},${H - PAD.b}L${this.px(0)},${H - PAD.b}Z`; });
  readonly ariaLabel = computed(() => {
    const d = this.data(); const total = d.reduce((n, p) => n + p.value, 0);
    const peak = d.reduce((a, b) => (b.value > a.value ? b : a), d[0] ?? { label: '', value: 0 });
    return `${this.valueName()} by day, ${d.length} days. Total ${this.fmt(total)}. Highest ${this.fmt(peak.value)} on ${peak.label ? longLabelOf(peak.label) : '-'}. Use arrow keys to read each day.`;
  });

  px(i: number): number { const n = this.data().length; return PAD.l + (n <= 1 ? 0 : (i / (n - 1)) * (this.width() - PAD.l - PAD.r)); }
  py(v: number): number { return PAD.t + (1 - v / this.max()) * (H - PAD.t - PAD.b); }
  fmt(v: number): string { return formatValue(v, this.format()); }
  longLabel(l: string): string { return longLabelOf(l); }

  onMove(e: PointerEvent): void {
    const n = this.data().length; if (!n) return;
    const x = e.offsetX - PAD.l; const w = this.width() - PAD.l - PAD.r;
    this.active.set(Math.max(0, Math.min(n - 1, Math.round((x / w) * (n - 1)))));
  }
  onKey(e: KeyboardEvent): void {
    const n = this.data().length; const a = this.active() ?? n - 1;
    if (e.key === 'ArrowLeft') { this.active.set(Math.max(0, a - 1)); e.preventDefault(); }
    if (e.key === 'ArrowRight') { this.active.set(Math.min(n - 1, a + 1)); e.preventDefault(); }
  }
}
function longLabelOf(l: string): string { return dayLabel(l, true); }

/** Single-series column chart (orders per day). Columns with 4px rounded tops, 2px gaps. */
@Component({
  selector: 'studio-column-chart',
  template: `
    <div #host class="viz relative" (pointerleave)="active.set(null)">
      <svg [attr.width]="width()" [attr.height]="h" role="img" [attr.aria-label]="ariaLabel()" tabindex="0"
           (keydown)="onKey($event)" (focus)="active.set(active() ?? data().length - 1)" (blur)="active.set(null)" class="block outline-offset-4">
        @for (t of ticks(); track $index) {
          <line [attr.x1]="pad.l" [attr.x2]="width() - pad.r" [attr.y1]="t.y" [attr.y2]="t.y" stroke="var(--viz-grid)" stroke-width="1" />
          <text [attr.x]="pad.l - 8" [attr.y]="t.y + 4" text-anchor="end">{{ t.label }}</text>
        }
        @for (d of data(); track d.label; let i = $index) {
          @if (d.value > 0) {
            <path [attr.d]="bar(i, d.value)" fill="var(--series-1)" [attr.fill-opacity]="active() === null || active() === i ? 1 : 0.45" />
          }
          <rect [attr.x]="slot() * i + pad.l" [attr.y]="pad.t" [attr.width]="slot()" [attr.height]="h - pad.t - pad.b" fill="transparent"
                (pointerenter)="active.set(i)" />
        }
        @for (x of xLabels(); track $index) {
          <text [attr.x]="x.x" [attr.y]="h - 6" [attr.text-anchor]="x.anchor">{{ x.label }}</text>
        }
      </svg>
      @if (active() !== null) {
        <div class="viz-tip" [style.left.px]="pad.l + slot() * (active()! + 0.5)" [style.top.px]="py(data()[active()!].value)">
          <div class="opacity-70">{{ longLabel(data()[active()!].label) }}</div>
          <div class="font-medium">{{ data()[active()!].value }} {{ data()[active()!].value === 1 ? unit()[0] : unit()[1] }}</div>
        </div>
      }
    </div>
    <details class="mt-2 px-1 type-body-sm text-fg-3">
      <summary class="cursor-pointer">Show data</summary>
      <div class="studio-scroll mt-2 max-h-56 overflow-y-auto">
        <table class="studio-table"><thead><tr><th>Day</th><th class="num">Orders</th></tr></thead>
          <tbody>@for (d of data(); track d.label) { <tr><td>{{ longLabel(d.label) }}</td><td class="num">{{ d.value }}</td></tr> }</tbody></table>
      </div>
    </details>
  `,
})
export class ColumnChartComponent extends Sized {
  readonly data = input.required<Point[]>();
  readonly unit = input<[string, string]>(['order', 'orders']);
  readonly active = signal<number | null>(null);
  readonly h = 180;
  readonly pad = { t: 12, r: 12, b: 26, l: 40 };

  private readonly max = computed(() => niceMax(Math.max(0, ...this.data().map(d => d.value))));
  readonly slot = computed(() => (this.width() - this.pad.l - this.pad.r) / Math.max(1, this.data().length));
  readonly ticks = computed(() => [0, 2, 4].map(i => { const v = (this.max() / 4) * i; return { y: this.py(v), label: count.format(v) }; }));
  readonly xLabels = computed(() => {
    const d = this.data(); if (!d.length) return [];
    const idx = [0, d.length - 1];
    return idx.map((i, k) => ({ x: this.pad.l + this.slot() * (i + 0.5), label: dayLabel(d[i].label), anchor: k === 0 ? 'start' : 'end' }));
  });
  readonly ariaLabel = computed(() => {
    const d = this.data(); const total = d.reduce((n, p) => n + p.value, 0);
    return `Orders by day, ${d.length} days, ${total} in total. Use arrow keys to read each day.`;
  });

  py(v: number): number { return this.pad.t + (1 - v / this.max()) * (this.h - this.pad.t - this.pad.b); }
  longLabel(l: string): string { return longLabelOf(l); }
  /** Column with 4px rounded top, anchored square to the baseline, 2px gap each side. */
  bar(i: number, v: number): string {
    const gap = Math.min(2, this.slot() * 0.2);
    const x = this.pad.l + this.slot() * i + gap / 2, w = Math.max(1, this.slot() - gap);
    const y = this.py(v), base = this.h - this.pad.b, r = Math.min(4, w / 2, base - y);
    return `M${x},${base}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${base}Z`;
  }
  onKey(e: KeyboardEvent): void {
    const n = this.data().length; const a = this.active() ?? n - 1;
    if (e.key === 'ArrowLeft') { this.active.set(Math.max(0, a - 1)); e.preventDefault(); }
    if (e.key === 'ArrowRight') { this.active.set(Math.min(n - 1, a + 1)); e.preventDefault(); }
  }
}
