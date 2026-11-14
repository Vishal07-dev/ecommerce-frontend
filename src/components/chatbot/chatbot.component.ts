import { Component, ElementRef, HostListener, effect, inject, signal, viewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { environment } from '../../environment/environment';
import { InrPipe } from '../../ui/price.pipe';
import { thumb } from '../../ui/image';

interface ChatProduct { _id: string; name: string; slug?: string; price: number; colorway?: string; image?: string; }
interface ChatMessage { from: 'user' | 'bot'; text: string; products?: ChatProduct[]; error?: boolean; }

const STORE_KEY = 'kora.chat';
const MAX_LEN = 500;
const SUGGESTIONS = [
  'What’s warm enough for winter?',
  'How does the Long Coat fit?',
  'How much is delivery?',
  'Which tees do you make?',
];

/**
 * "Ask KŌRA": a small shopping assistant. Answers come from the API, which
 * gives the model the live catalogue, so replies name real pieces; any piece
 * a reply names comes back as a tappable card.
 */
@Component({
  selector: 'app-chatbot',
  imports: [RouterLink, NgOptimizedImage, InrPipe],
  templateUrl: './chatbot.component.html',
})
export class ChatbotComponent {
  private http = inject(HttpClient);
  private log = viewChild<ElementRef<HTMLElement>>('log');
  private input = viewChild<ElementRef<HTMLTextAreaElement>>('input');
  private launcher = viewChild.required<ElementRef<HTMLButtonElement>>('launcher');

  readonly suggestions = SUGGESTIONS;
  readonly maxLen = MAX_LEN;
  readonly thumb = thumb;

  readonly open = signal(false);
  readonly busy = signal(false);
  readonly unread = signal(false);
  readonly draft = signal('');
  readonly messages = signal<ChatMessage[]>(this.restore());
  private lastQuestion = '';

  constructor() {
    // Keep the conversation for this browser tab, and keep the newest line in view.
    effect(() => {
      const msgs = this.messages();
      this.busy();
      try { sessionStorage.setItem(STORE_KEY, JSON.stringify(msgs.slice(-30))); } catch { /* storage blocked */ }
      setTimeout(() => { const el = this.log()?.nativeElement; if (el) el.scrollTop = el.scrollHeight; });
    });
  }

  toggle(): void { this.open() ? this.close() : this.show(); }

  show(): void {
    this.open.set(true);
    this.unread.set(false);
    setTimeout(() => {
      this.input()?.nativeElement.focus();
      const el = this.log()?.nativeElement; if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }

  close(): void {
    this.open.set(false);
    // After the panel is gone (the button is hidden under it on phones).
    setTimeout(() => this.launcher().nativeElement.focus());
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { if (this.open()) this.close(); }

  /** On phones the panel covers the page; close it when a product is opened. */
  onCardClick(): void { if (matchMedia('(max-width: 639px)').matches) this.open.set(false); }

  onInput(e: Event): void {
    const el = e.target as HTMLTextAreaElement;
    this.draft.set(el.value);
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`; // grows to about four lines
  }

  onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); this.send(); }
  }

  send(text = this.draft()): void {
    const message = text.trim().slice(0, MAX_LEN);
    if (!message || this.busy()) return;
    const history = this.messages().filter(m => !m.error).map(({ from, text }) => ({ from, text }));
    this.messages.update(m => [...m, { from: 'user', text: message }]);
    this.draft.set('');
    const el = this.input()?.nativeElement;
    if (el) { el.value = ''; el.style.height = 'auto'; }
    this.lastQuestion = message;
    this.ask(message, history);
  }

  retry(): void {
    if (!this.lastQuestion || this.busy()) return;
    this.messages.update(m => m.filter(x => !x.error));
    const history = this.messages().slice(0, -1).map(({ from, text }) => ({ from, text }));
    this.ask(this.lastQuestion, history);
  }

  clear(): void {
    this.messages.set([]);
    this.input()?.nativeElement.focus();
  }

  private ask(message: string, history: { from: string; text: string }[]): void {
    this.busy.set(true);
    this.http.post<{ reply: string; products?: ChatProduct[] }>(`${environment.apiUrl}/chat`, { message, history }).subscribe({
      next: res => {
        this.busy.set(false);
        this.messages.update(m => [...m, { from: 'bot', text: res.reply, products: res.products ?? [] }]);
        if (!this.open()) this.unread.set(true);
      },
      error: err => {
        this.busy.set(false);
        const text = err?.error?.error ?? (err?.status === 0
          ? 'We couldn’t reach the shop. Check your connection.'
          : 'The assistant isn’t available right now.');
        this.messages.update(m => [...m, { from: 'bot', text, error: true }]);
      },
    });
  }

  private restore(): ChatMessage[] {
    try { return JSON.parse(sessionStorage.getItem(STORE_KEY) ?? '[]') as ChatMessage[]; } catch { return []; }
  }
}
