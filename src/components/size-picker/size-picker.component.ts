import { Component, computed, input, model } from '@angular/core';
import { Product, sizesOf } from '../../ui/models';

let nextId = 0;

/**
 * Size selection as a native radio group: arrow keys move between sizes,
 * sold-out sizes are disabled and say so to screen readers, and an error is
 * tied to the group with aria-describedby.
 */
@Component({
  selector: 'app-size-picker',
  template: `
    <fieldset [attr.aria-describedby]="error() ? errorId : (lowStockNote() ? noteId : null)" [attr.aria-invalid]="error() ? true : null">
      <legend class="type-label mb-3 text-fg-2">
        Size
        @if (selected(); as s) { <span class="text-fg">· {{ s }}</span> }
      </legend>
      <div class="flex flex-wrap gap-2">
        @for (v of variants(); track v.size) {
          <label class="size-chip">
            <input type="radio" [name]="name" [value]="v.size" [checked]="selected() === v.size"
                   [disabled]="v.stock < 1" (change)="selected.set(v.size)" />
            <span>{{ v.size }}@if (v.stock < 1) {<span class="visually-hidden">, sold out</span>}</span>
          </label>
        }
      </div>
      @if (error()) {
        <p [id]="errorId" class="mt-3 type-body-sm text-danger">{{ error() }}</p>
      } @else if (lowStockNote()) {
        <p [id]="noteId" class="mt-3 type-body-sm text-fg-2">{{ lowStockNote() }}</p>
      }
    </fieldset>
  `,
})
export class SizePickerComponent {
  readonly product = input.required<Product>();
  readonly selected = model<string | null>(null);
  readonly error = input<string | null>(null);

  readonly name = `size-${nextId++}`;
  readonly errorId = `${this.name}-error`;
  readonly noteId = `${this.name}-note`;

  readonly variants = computed(() => sizesOf(this.product()));
  readonly lowStockNote = computed(() => {
    const v = this.variants().find(x => x.size === this.selected());
    return v && v.stock > 0 && v.stock <= 3 ? `Only ${v.stock} left in ${v.size}.` : null;
  });

  /** Focus the first available size, e.g. after "Choose a size" fires. */
  focusFirst(host: HTMLElement): void {
    host.querySelector<HTMLInputElement>('input[type=radio]:not(:disabled)')?.focus();
  }
}
