import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private auth = inject(AuthService);
  readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  readonly submitted = signal(false);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  constructor() { inject(Title).setTitle('Sign in — KŌRA'); }

  invalid(name: 'email' | 'password'): boolean {
    return this.submitted() && this.form.controls[name].invalid;
  }

  onSubmit(): void {
    this.submitted.set(true);
    this.error.set(null);
    if (this.form.invalid) {
      // Move focus to the first field that needs attention.
      const first = this.form.controls.email.invalid ? 'login-email' : 'login-password';
      document.getElementById(first)?.focus();
      return;
    }
    this.busy.set(true);
    const { email, password } = this.form.getRawValue();
    // AuthService routes on success: back to checkout if the shopper came from
    // the bag, the admin area for admins, otherwise home.
    this.auth.login(email, password).subscribe({
      error: (err: { status?: number }) => {
        this.busy.set(false);
        this.error.set(err?.status && err.status < 500
          ? 'That email and password don\'t match an account. Check both and try again.'
          : 'We couldn\'t reach the shop. Check your connection and try again.');
      },
    });
  }
}
