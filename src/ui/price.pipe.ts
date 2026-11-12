import { Pipe, PipeTransform } from '@angular/core';

const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

/** Every price on the site goes through this: "₹9,800". Stripe charges INR. */
@Pipe({ name: 'inr' })
export class InrPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return value == null || Number.isNaN(value) ? '' : INR.format(value);
  }
}

export const formatInr = (value: number) => INR.format(value);
