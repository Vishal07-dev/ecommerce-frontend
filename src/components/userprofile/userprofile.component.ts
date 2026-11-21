import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, NgOptimizedImage } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { AuthService } from '../../service/auth.service';
import { Account, AccountOrder, AccountService, Address, readError } from '../../service/account.service';
import { InrPipe } from '../../ui/price.pipe';
import { SplitLinesDirective } from '../../ui/split-lines';
import { thumb } from '../../ui/image';

type Section = 'orders' | 'details' | 'addresses' | 'password';

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'orders', label: 'Orders' },
  { id: 'details', label: 'Your details' },
  { id: 'addresses', label: 'Addresses' },
  { id: 'password', label: 'Password' },
];

export const INDIAN_STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
  'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

const STATUS_LABEL: Record<AccountOrder['status'], string> = {
  paid: 'Paid', packed: 'Being packed', shipped: 'On its way', delivered: 'Delivered', cancelled: 'Cancelled',
};

@Component({
  selector: 'app-userprofile',
  imports: [ReactiveFormsModule, RouterLink, DatePipe, NgOptimizedImage, InrPipe, SplitLinesDirective],
  templateUrl: './userprofile.component.html',
})
export class UserprofileComponent {
  private account = inject(AccountService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder).nonNullable;

  readonly sections = SECTIONS;
  readonly states = INDIAN_STATES;
  readonly statusLabel = STATUS_LABEL;
  readonly thumb = thumb;

  readonly section = toSignal(inject(ActivatedRoute).queryParamMap.pipe(
    map(p => (SECTIONS.some(s => s.id === p.get('tab')) ? p.get('tab') : 'orders') as Section),
  ), { initialValue: 'orders' as Section });

  // --- Data -------------------------------------------------------------------
  readonly me = signal<Account | null>(null);
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  readonly orders = signal<AccountOrder[] | null>(null);
  readonly ordersError = signal(false);
  readonly firstName = computed(() => (this.me()?.name ?? '').split(' ')[0]);

  // --- Details ----------------------------------------------------------------
  readonly details = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    currentPassword: [''],
  });
  readonly detailsStatus = signal<{ kind: 'ok' | 'error'; text: string; field?: string } | null>(null);
  readonly detailsBusy = signal(false);
  readonly emailChanged = signal(false);

  // --- Password ---------------------------------------------------------------
  readonly password = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirm: ['', Validators.required],
  });
  readonly passwordStatus = signal<{ kind: 'ok' | 'error'; text: string; field?: string } | null>(null);
  readonly passwordBusy = signal(false);
  readonly passwordSubmitted = signal(false);

  // --- Addresses --------------------------------------------------------------
  readonly addressForm = this.fb.group({
    fullName: ['', Validators.required],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]{7,20}$/)]],
    line1: ['', Validators.required],
    line2: [''],
    city: ['', Validators.required],
    state: ['', Validators.required],
    pincode: ['', [Validators.required, Validators.pattern(/^[1-9][0-9]{5}$/)]],
    isDefault: [false],
  });
  /** null = list; 'new' = adding; an id = editing that address. */
  readonly editing = signal<string | null>(null);
  readonly addressSubmitted = signal(false);
  readonly addressBusy = signal(false);
  readonly addressError = signal<{ text: string; field?: string } | null>(null);
  readonly confirmRemove = signal<string | null>(null);
  readonly addressNotice = signal<string | null>(null);

  // --- Receipts ---------------------------------------------------------------
  readonly downloading = signal<string | null>(null);
  readonly receiptError = signal<string | null>(null);

  constructor() {
    inject(Title).setTitle('Your account — KŌRA');
    this.load();
    this.details.controls.email.valueChanges.subscribe(v =>
      this.emailChanged.set(!!this.me() && v.trim().toLowerCase() !== this.me()!.email));
  }

  load(): void {
    this.loadState.set('loading');
    this.account.me().subscribe({
      next: me => { this.setMe(me); this.loadState.set('ready'); },
      error: () => this.loadState.set('error'),
    });
    this.ordersError.set(false);
    this.account.orders().subscribe({
      next: o => this.orders.set(o),
      error: () => { this.orders.set([]); this.ordersError.set(true); },
    });
  }

  private setMe(me: Account): void {
    this.me.set(me);
    this.details.reset({ name: me.name, email: me.email, phone: me.phone ?? '', currentPassword: '' });
    this.emailChanged.set(false);
  }

  signOut(): void { this.auth.logout(); }

  /** Same short reference the server, receipt and Studio use (# + last 8). */
  orderRef(id: string): string { return id.slice(-8).toUpperCase(); }
  itemCount(o: AccountOrder): number { return o.items.reduce((n, i) => n + (i.quantity ?? 1), 0); }

  /** Field-level error helpers for the templates. */
  bad(form: 'details' | 'password' | 'address', name: string): boolean {
    const group: FormGroup = form === 'details' ? this.details : form === 'password' ? this.password : this.addressForm;
    const submitted = form === 'details' ? this.detailsStatus() !== null || this.details.touched : form === 'password' ? this.passwordSubmitted() : this.addressSubmitted();
    const ctrl = group.get(name);
    return !!ctrl && ctrl.invalid && (submitted || ctrl.touched);
  }

  private focusFirstInvalid(prefix: string, names: string[], isBad: (n: string) => boolean): void {
    const first = names.find(isBad);
    if (first) setTimeout(() => document.getElementById(`${prefix}-${first}`)?.focus());
  }

  // --- Details ----------------------------------------------------------------
  saveDetails(): void {
    this.details.markAllAsTouched();
    this.detailsStatus.set(null);
    if (this.emailChanged() && !this.details.controls.currentPassword.value) {
      this.detailsStatus.set({ kind: 'error', text: 'Enter your current password to change your email.', field: 'currentPassword' });
      document.getElementById('details-currentPassword')?.focus();
      return;
    }
    if (this.details.invalid) {
      this.focusFirstInvalid('details', ['name', 'email', 'phone'], n => this.details.get(n)!.invalid);
      return;
    }
    const v = this.details.getRawValue();
    this.detailsBusy.set(true);
    this.account.update({
      name: v.name, phone: v.phone, email: v.email,
      ...(this.emailChanged() ? { currentPassword: v.currentPassword } : {}),
    }).subscribe({
      next: me => {
        this.detailsBusy.set(false);
        this.setMe(me);
        this.detailsStatus.set({ kind: 'ok', text: 'Saved. Your details are up to date.' });
      },
      error: err => {
        this.detailsBusy.set(false);
        const e = readError(err, 'We couldn’t save your details. Try again.');
        this.detailsStatus.set({ kind: 'error', text: e.message, field: e.field });
        if (e.field) document.getElementById(`details-${e.field}`)?.focus();
      },
    });
  }

  // --- Password ---------------------------------------------------------------
  passwordsDiffer(): boolean {
    const v = this.password.getRawValue();
    return !!v.confirm && v.newPassword !== v.confirm;
  }

  savePassword(): void {
    this.passwordSubmitted.set(true);
    this.passwordStatus.set(null);
    if (this.password.invalid || this.passwordsDiffer()) {
      this.focusFirstInvalid('pw', ['currentPassword', 'newPassword', 'confirm'],
        n => this.password.get(n)!.invalid || (n === 'confirm' && this.passwordsDiffer()));
      return;
    }
    const v = this.password.getRawValue();
    this.passwordBusy.set(true);
    this.account.changePassword(v.currentPassword, v.newPassword).subscribe({
      next: () => {
        this.passwordBusy.set(false);
        this.password.reset();
        this.passwordSubmitted.set(false);
        this.passwordStatus.set({ kind: 'ok', text: 'Password changed. Use the new one next time you sign in.' });
      },
      error: err => {
        this.passwordBusy.set(false);
        const e = readError(err, 'We couldn’t change your password. Try again.');
        this.passwordStatus.set({ kind: 'error', text: e.message, field: e.field });
        if (e.field) document.getElementById(`pw-${e.field}`)?.focus();
      },
    });
  }

  // --- Addresses --------------------------------------------------------------
  startAddress(a?: Address): void {
    this.addressSubmitted.set(false);
    this.addressError.set(null);
    this.addressNotice.set(null);
    this.confirmRemove.set(null);
    const me = this.me();
    this.addressForm.reset(a
      ? { fullName: a.fullName, phone: a.phone, line1: a.line1, line2: a.line2 ?? '', city: a.city, state: a.state, pincode: a.pincode, isDefault: a.isDefault }
      : { fullName: me?.name ?? '', phone: me?.phone ?? '', line1: '', line2: '', city: '', state: '', pincode: '', isDefault: !me?.addresses.length });
    this.editing.set(a ? a._id : 'new');
    setTimeout(() => document.getElementById('addr-fullName')?.focus());
  }

  cancelAddress(): void {
    const was = this.editing();
    this.editing.set(null);
    setTimeout(() => document.getElementById(was && was !== 'new' ? `addr-edit-${was}` : 'addr-add')?.focus());
  }

  saveAddress(): void {
    this.addressSubmitted.set(true);
    this.addressError.set(null);
    if (this.addressForm.invalid) {
      this.focusFirstInvalid('addr', ['fullName', 'phone', 'line1', 'city', 'state', 'pincode'], n => this.addressForm.get(n)!.invalid);
      return;
    }
    const id = this.editing();
    const body = this.addressForm.getRawValue();
    this.addressBusy.set(true);
    const call = id && id !== 'new' ? this.account.updateAddress(id, body) : this.account.addAddress(body);
    call.subscribe({
      next: me => {
        this.addressBusy.set(false);
        this.me.set(me);
        this.editing.set(null);
        this.addressNotice.set(id === 'new' ? 'Address added.' : 'Address updated.');
        setTimeout(() => document.getElementById('addr-add')?.focus());
      },
      error: err => {
        this.addressBusy.set(false);
        const e = readError(err, 'We couldn’t save that address. Try again.');
        this.addressError.set({ text: e.message, field: e.field });
        if (e.field) document.getElementById(`addr-${e.field}`)?.focus();
      },
    });
  }

  makeDefault(a: Address): void {
    const { _id, ...rest } = a;
    this.account.updateAddress(_id, { ...rest, isDefault: true }).subscribe({
      next: me => { this.me.set(me); this.addressNotice.set(`${a.line1} is now your default address.`); },
      error: err => this.addressNotice.set(readError(err, 'We couldn’t change your default address.').message),
    });
  }

  removeAddress(a: Address): void {
    this.account.removeAddress(a._id).subscribe({
      next: me => {
        this.me.set(me);
        this.confirmRemove.set(null);
        this.addressNotice.set('Address removed.');
        setTimeout(() => document.getElementById('addr-add')?.focus());
      },
      error: err => this.addressNotice.set(readError(err, 'We couldn’t remove that address.').message),
    });
  }

  // --- Receipts ---------------------------------------------------------------
  downloadReceipt(o: AccountOrder): void {
    this.downloading.set(o._id);
    this.receiptError.set(null);
    this.account.receipt(o._id).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kora-receipt-${this.orderRef(o._id)}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.downloading.set(null);
      },
      error: () => { this.downloading.set(null); this.receiptError.set(o._id); },
    });
  }
}
