import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../../service/catalog.service';

@Component({
  selector: 'app-site-footer',
  imports: [RouterLink],
  templateUrl: './site-footer.component.html',
})
export class SiteFooterComponent {
  private catalog = inject(CatalogService);
  readonly editions = toSignal(this.catalog.editions(), { initialValue: [] });
  readonly credits = toSignal(this.catalog.credits(), { initialValue: [] });
  readonly year = new Date().getFullYear();
}
