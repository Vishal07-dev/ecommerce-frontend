import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../environment/environment';
import { Asset, Credit, Edition, Look, Product, ProductPage } from '../ui/models';

export interface ProductQuery {
  edition?: string;
  category?: string;
  size?: string;
  sortBy?: string;
  featured?: boolean;
  exclude?: string;
  limit?: number;
}

/** Read-only storefront data. Editorial content is cached for the session. */
@Injectable({ providedIn: 'root' })
export class CatalogService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  private editions$?: Observable<Edition[]>;
  private looks$?: Observable<Look[]>;
  private assets$?: Observable<Record<string, Asset>>;
  private credits$?: Observable<Credit[]>;
  private hero$?: Observable<Product>;

  products(query: ProductQuery = {}): Observable<ProductPage> {
    let params = new HttpParams().set('limit', String(query.limit ?? 48));
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '' && key !== 'limit') params = params.set(key, String(value));
    }
    return this.http.get<ProductPage>(`${this.api}/product/list`, { params });
  }

  /** Accepts a slug or a Mongo id, so old /product/:id links keep working. */
  product(slugOrId: string): Observable<Product> {
    return this.http.get<Product>(`${this.api}/product/single/${encodeURIComponent(slugOrId)}`);
  }

  hero(): Observable<Product> {
    return this.hero$ ??= this.http.get<Product>(`${this.api}/editorial/hero`).pipe(shareReplay(1));
  }

  editions(): Observable<Edition[]> {
    return this.editions$ ??= this.http.get<Edition[]>(`${this.api}/editorial/collections`).pipe(shareReplay(1));
  }

  looks(): Observable<Look[]> {
    return this.looks$ ??= this.http.get<Look[]>(`${this.api}/editorial/looks`).pipe(shareReplay(1));
  }

  assets(): Observable<Record<string, Asset>> {
    return this.assets$ ??= this.http.get<Record<string, Asset>>(`${this.api}/editorial/assets`).pipe(shareReplay(1));
  }

  credits(): Observable<Credit[]> {
    return this.credits$ ??= this.http.get<Credit[]>(`${this.api}/editorial/credits`).pipe(shareReplay(1));
  }
}
