import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { CatalogService } from '../../service/catalog.service';
import { Look } from '../../ui/models';
import { LookSpreadComponent } from '../look-spread/look-spread.component';

@Component({
  selector: 'app-lookbook-page',
  imports: [RouterLink, LookSpreadComponent],
  template: `
    <div class="page pt-10 md:pt-16">
      <p class="type-label text-fg-3">Edition 01 · Autumn–Winter 2026</p>
      <h1 class="type-display-xl mt-3">Lookbook</h1>
      <p class="mt-6 type-body text-fg-2 measure">
        Six looks from the season, each one shoppable. Tap a tag on any photograph to see that piece.
      </p>
    </div>

    @switch (state()) {
      @case ('loading') {
        <div class="page section-y" aria-busy="true">
          <div class="aspect-[4/5] w-full animate-pulse bg-sunken motion-reduce:animate-none md:w-7/12"></div>
          <p class="visually-hidden" role="status">Loading the lookbook…</p>
        </div>
      }
      @case ('error') {
        <div class="page section-y">
          <p class="type-h2">We couldn't load the lookbook</p>
          <p class="mt-2 type-body text-fg-2">Check your connection, then try again.</p>
          <a routerLink="/shop" class="btn btn-solid mt-6">Browse the shop instead</a>
        </div>
      }
      @case ('ready') {
        <div class="page flex flex-col gap-32 py-20 md:gap-48 md:py-32">
          @for (look of looks(); track look._id; let i = $index; let odd = $odd) {
            <app-look-spread [look]="look" [flip]="odd" [priority]="i === 0" />
          }
        </div>
        <div class="page pb-32 text-center">
          <p class="type-h2">Everything in the lookbook is in the shop.</p>
          <a routerLink="/shop" class="btn btn-solid mt-8">Shop the edition</a>
        </div>
      }
    }
  `,
})
export class LookbookPageComponent {
  private catalog = inject(CatalogService);
  readonly looks = signal<Look[]>([]);
  readonly state = signal<'loading' | 'ready' | 'error'>('loading');

  constructor() {
    inject(Title).setTitle('Lookbook — KŌRA');
    this.catalog.looks().subscribe({
      next: looks => { this.looks.set(looks); this.state.set('ready'); },
      error: () => this.state.set('error'),
    });
  }
}
