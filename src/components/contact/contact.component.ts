import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { environment } from '../../environment/environment';
import { DELIVERY_FEE, FREE_DELIVERY_FROM } from '../../service/cartService/cart.service';
import { formatInr } from '../../ui/price.pipe';
import { RevealDirective } from '../../ui/reveal.directive';

type Field = 'firstName' | 'lastName' | 'email' | 'subject' | 'message';

const SUBJECTS = ['An order or delivery', 'Sizing and fit', 'Fabric and care', 'Something else'];

/** Field ids in the order they appear, for moving focus to the first problem. */
const ORDER: Field[] = ['firstName', 'lastName', 'email', 'subject', 'message'];

@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule, RouterLink, RevealDirective],
  templateUrl: './contact.component.html',
})
export class ContactComponent {
  private http = inject(HttpClient);
  private sentHeading = viewChild<ElementRef<HTMLElement>>('sentHeading');

  readonly subjects = SUBJECTS;
  readonly freeFrom = formatInr(FREE_DELIVERY_FROM);
  readonly fee = formatInr(DELIVERY_FEE);

  readonly form = inject(FormBuilder).nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    subject: ['', Validators.required],
    message: ['', [Validators.required, Validators.minLength(10)]],
  });

  readonly submitted = signal(false);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly sentTo = signal<string | null>(null);

  constructor() { inject(Title).setTitle('Contact — KŌRA'); }

  invalid(name: Field): boolean {
    return this.submitted() && this.form.controls[name].invalid;
  }

  onSubmit(): void {
    this.submitted.set(true);
    this.error.set(null);
    if (this.form.invalid) {
      const first = ORDER.find(f => this.form.controls[f].invalid);
      if (first) document.getElementById(`contact-${first}`)?.focus();
      return;
    }
    this.busy.set(true);
    const data = this.form.getRawValue();
    this.http.post(`${environment.apiUrl}/contact/send-email`, data).subscribe({
      next: () => {
        this.busy.set(false);
        this.sentTo.set(data.email);
        this.form.reset();
        this.submitted.set(false);
        // The form is replaced by a confirmation; move focus to it.
        setTimeout(() => this.sentHeading()?.nativeElement.focus());
      },
      error: () => {
        this.busy.set(false);
        this.error.set('Your message didn’t send. Check your connection and try again. What you wrote is still here.');
      },
    });
  }

  writeAnother(): void {
    this.sentTo.set(null);
    setTimeout(() => document.getElementById('contact-firstName')?.focus());
  }
}
