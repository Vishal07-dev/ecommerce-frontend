import { Component, ElementRef, computed, input, signal, viewChild } from '@angular/core';
import { Measurement, Product } from '../../ui/models';
import { closeDialog, isBackdropClick, openDialog } from '../../ui/dialog';

type Unit = 'cm' | 'in';

/** Measurements table + fit notes in a native modal <dialog>. */
@Component({
  selector: 'app-size-guide',
  template: `
    <button type="button" class="type-body-sm link-underline min-h-10" aria-haspopup="dialog" (click)="open()">Size guide</button>

    <dialog #dialog class="modal" aria-labelledby="size-guide-title" (cancel)="onCancel($event)" (click)="onClick($event)">
      <div class="p-6 sm:p-8">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="type-label text-fg-3">Size guide</p>
            <h2 id="size-guide-title" class="type-h2 mt-1">{{ product().name }}</h2>
          </div>
          <button type="button" class="btn btn-icon -me-3 -mt-2" aria-label="Close size guide" (click)="close()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke-linecap="round" /></svg>
          </button>
        </div>

        @if (product().fit; as fit) {
          <p class="mt-4 type-body text-fg-2 measure">
            @if (fit.cut) { <span class="capitalize">{{ fit.cut }}</span> fit. }
            {{ fit.notes }}
            @if (fit.modelHeightCm && fit.modelWears) { The model is {{ fit.modelHeightCm }} cm tall and wears {{ fit.modelWears }}. }
          </p>
        }

        @if (rows().length) {
          <div class="mt-6 flex items-center justify-between gap-4">
            <p class="type-body-sm text-fg-3">Garment measurements, laid flat.</p>
            <div class="inline-flex rounded-full border border-line-strong p-0.5" role="group" aria-label="Units">
              @for (u of units; track u) {
                <button type="button" class="min-h-9 rounded-full px-3 type-body-sm transition-colors duration-150"
                        [class.bg-solid]="unit() === u" [class.text-on-solid]="unit() === u"
                        [attr.aria-pressed]="unit() === u" (click)="unit.set(u)">{{ u }}</button>
              }
            </div>
          </div>
          <div class="mt-3 overflow-x-auto">
            <table class="w-full border-collapse type-body-sm">
              <caption class="visually-hidden">Measurements for {{ product().name }} in {{ unit() === 'cm' ? 'centimetres' : 'inches' }}</caption>
              <thead>
                <tr class="border-b border-line-strong text-start">
                  <th scope="col" class="py-2 pe-4 text-start font-medium">Size</th>
                  @for (col of columns(); track col.key) {
                    <th scope="col" class="py-2 pe-4 text-end font-medium">{{ col.label }}</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (row of rows(); track row.size) {
                  <tr class="border-b border-line">
                    <th scope="row" class="py-2.5 pe-4 text-start font-medium">{{ row.size }}</th>
                    @for (col of columns(); track col.key) {
                      <td class="type-price py-2.5 pe-4 text-end">{{ show(row[col.key]) }}</td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <p class="mt-4 type-body-sm text-fg-3">
            Compare with a garment you own: lay it flat and measure across the chest, armpit to armpit, then double it.
          </p>
        }
      </div>
    </dialog>
  `,
})
export class SizeGuideComponent {
  readonly product = input.required<Product>();
  readonly unit = signal<Unit>('cm');
  readonly units: Unit[] = ['cm', 'in'];
  private dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  readonly rows = computed(() => this.product().measurements ?? []);
  readonly columns = computed(() => {
    const all: { key: keyof Measurement; label: string }[] = [
      { key: 'chest', label: 'Chest' }, { key: 'waist', label: 'Waist' }, { key: 'length', label: 'Length' },
      { key: 'sleeve', label: 'Sleeve' }, { key: 'inseam', label: 'Inseam' },
    ];
    return all.filter(c => this.rows().some(r => r[c.key] != null));
  });

  show(value: unknown): string {
    if (typeof value !== 'number') return '—';
    return this.unit() === 'cm' ? String(value) : (value / 2.54).toFixed(1);
  }

  open(): void { openDialog(this.dialog().nativeElement); }
  close(): void { closeDialog(this.dialog().nativeElement); }
  onCancel(e: Event): void { e.preventDefault(); this.close(); }
  onClick(e: MouseEvent): void { if (isBackdropClick(e, this.dialog().nativeElement)) this.close(); }
}
