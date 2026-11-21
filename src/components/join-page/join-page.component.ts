import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { environment } from '../../environment/environment';
import { AuthService } from '../../service/auth.service';

interface InviteInfo { role: 'owner' | 'admin' | 'staff'; expiresAt: string; invitedBy: string; }
const ROLE_LABEL = { owner: 'Owner', admin: 'Admin', staff: 'Staff' } as const;
const ROLE_HELP = {
  owner: 'You’ll be able to manage everything in Studio, including the team.',
  admin: 'You’ll run the store: products, orders, customers and categories.',
  staff: 'You’ll handle orders and see the store overview.',
} as const;

/** /join/:token — accept an invite to KŌRA Studio. */
@Component({
  selector: 'app-join-page',
  imports: [RouterLink, DatePipe],
  template: `
    <div class="page grid min-h-[calc(100dvh-4rem)] place-items-center py-16">
      <div class="w-full max-w-md">
        @switch (state()) {
          @case ('loading') { <p class="type-body text-fg-3" role="status">Checking your invite…</p> }
          @case ('invalid') {
            <p class="type-label text-fg-3">KŌRA Studio</p>
            <h1 class="type-h1 mt-2">This invite doesn’t work any more</h1>
            <p class="mt-3 type-body text-fg-2">{{ problem() }}</p>
            <a routerLink="/" class="btn btn-quiet mt-8">Go to the shop</a>
          }
          @case ('done') {
            <p class="type-label text-fg-3">KŌRA Studio</p>
            <h1 class="type-h1 mt-2">You’re in</h1>
            <p class="mt-3 type-body text-fg-2" role="status">Signing you in to Studio…</p>
          }
          @default {
            @if (info(); as i) {
              <p class="type-label text-fg-3">KŌRA Studio</p>
              <h1 class="type-h1 mt-2">Join as {{ label[i.role] }}</h1>
              <p class="mt-3 type-body text-fg-2">{{ cap(i.invitedBy) }} invited you. {{ help[i.role] }}</p>
              <p class="mt-1 type-body-sm text-fg-3">This link works until {{ i.expiresAt | date: 'd MMM, h:mm a' }}.</p>

              <div class="mt-8 studio-seg" role="group" aria-label="Do you have a KŌRA account?">
                <button type="button" [attr.aria-pressed]="mode() === 'new'" (click)="setMode('new')">Create an account</button>
                <button type="button" [attr.aria-pressed]="mode() === 'existing'" (click)="setMode('existing')">I already have one</button>
              </div>

              <form class="mt-6 flex flex-col gap-5" (submit)="$event.preventDefault(); submit(name.value, email.value, pw.value)" novalidate>
                @if (error(); as e) { <p class="type-body-sm text-danger" role="alert">{{ e }}</p> }
                <div class="flex flex-col gap-1.5" [hidden]="mode() === 'existing'">
                  <label for="join-name" class="type-body-sm font-medium">Your name</label>
                  <input #name id="join-name" class="field" autocomplete="name" [attr.aria-invalid]="field() === 'name' || null" />
                </div>
                <div class="flex flex-col gap-1.5">
                  <label for="join-email" class="type-body-sm font-medium">Email</label>
                  <input #email id="join-email" type="email" class="field" autocomplete="email" inputmode="email" [attr.aria-invalid]="field() === 'email' || null" />
                </div>
                <div class="flex flex-col gap-1.5">
                  <label for="join-pw" class="type-body-sm font-medium">{{ mode() === 'new' ? 'Choose a password' : 'Your password' }}</label>
                  <input #pw id="join-pw" type="password" class="field" [attr.autocomplete]="mode() === 'new' ? 'new-password' : 'current-password'"
                         [attr.aria-invalid]="field() === 'password' || null" [attr.aria-describedby]="mode() === 'new' ? 'join-pw-hint' : null" />
                  @if (mode() === 'new') { <p id="join-pw-hint" class="type-body-sm text-fg-3">At least 8 characters.</p> }
                </div>
                <button type="submit" class="btn btn-solid w-full" [disabled]="busy()">{{ busy() ? 'Joining…' : 'Join KŌRA Studio' }}</button>
              </form>
            }
          }
        }
      </div>
    </div>
  `,
})
export class JoinPageComponent {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private token = inject(ActivatedRoute).snapshot.paramMap.get('token') ?? '';
  private api = `${environment.apiUrl}/team/invite/${encodeURIComponent(this.token)}`;

  readonly label = ROLE_LABEL;
  readonly help = ROLE_HELP;
  readonly state = signal<'loading' | 'ready' | 'invalid' | 'done'>('loading');
  readonly info = signal<InviteInfo | null>(null);
  readonly problem = signal('');
  readonly mode = signal<'new' | 'existing'>('new');
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly field = signal<string | null>(null);

  constructor() {
    inject(Title).setTitle('Join KŌRA Studio');
    this.http.get<InviteInfo>(this.api).subscribe({
      next: i => { this.info.set(i); this.state.set('ready'); },
      error: e => { this.problem.set(e?.error?.message ?? 'Ask the person who invited you for a new link.'); this.state.set('invalid'); },
    });
  }

  setMode(m: 'new' | 'existing'): void { this.mode.set(m); this.error.set(null); this.field.set(null); }
  cap(s: string): string { return s.replace(/\b\p{L}/gu, c => c.toUpperCase()); }

  submit(name: string, email: string, password: string): void {
    this.error.set(null); this.field.set(null);
    if (this.mode() === 'new' && !name.trim()) return this.fail('Enter your name.', 'name');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return this.fail('Enter an email address like name@example.com.', 'email');
    if (!password) return this.fail('Enter a password.', 'password');
    this.busy.set(true);
    this.http.post<{ email: string }>(`${this.api}/accept`, { mode: this.mode(), name: name.trim(), email: email.trim(), password }).subscribe({
      next: () => {
        this.state.set('done');
        // Sign in; AuthService takes team members straight to Studio.
        this.auth.login(email.trim(), password).subscribe({ error: () => { this.busy.set(false); this.state.set('ready'); this.fail('You’ve joined, but signing in failed. Sign in from the sign-in page.'); } });
      },
      error: e => { this.busy.set(false); this.fail(e?.error?.message ?? 'Couldn’t join. Try again.', e?.error?.field); },
    });
  }

  private fail(message: string, field?: string): void {
    this.error.set(message);
    this.field.set(field ?? null);
    if (field) setTimeout(() => document.getElementById(`join-${field === 'password' ? 'pw' : field}`)?.focus());
  }
}
