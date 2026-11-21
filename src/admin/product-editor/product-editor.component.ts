import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { HotToastService } from '@ngxpert/hot-toast';
import { AdminService, Meta, PLACEMENT_LABEL, Placement, ProductDraft, ProductImage, adminError } from '../admin.service';
import { formatValue } from '../charts';

const ROLES = [
  { id: 'model', label: 'On model' }, { id: 'front', label: 'Front' }, { id: 'back', label: 'Back' },
  { id: 'detail', label: 'Close-up' }, { id: 'flat', label: 'Flat lay' }, { id: 'look', label: 'Lookbook' },
];
const SIZE_PRESETS: { label: string; sizes: string[] }[] = [
  { label: 'Tops (S–XL)', sizes: ['S', 'M', 'L', 'XL'] },
  { label: 'Waist (28–36)', sizes: ['28', '30', '32', '34', '36'] },
  { label: 'One size', sizes: ['One size'] },
];
const PLACEMENT_HELP: Record<Placement, string> = {
  hero: 'The big cover at the top of the home page. Choosing this replaces the current hero.',
  featured: 'Shown in “The Edit” on the home page, and in the shop.',
  shop: 'In the shop and search only.',
  archived: 'Hidden from the store. Restore it any time.',
};

function emptyDraft(): ProductDraft {
  return {
    name: '', slug: '', subtitle: '', description: '', story: '', price: null, compareAtPrice: null,
    category: '', edition: '', images: [], variants: [],
    colorway: { name: '', swatch: '' },
    fabric: { composition: [{ fiber: '', percent: 100 }], weightGsm: null, weave: '', origin: '', care: [] },
    fit: { cut: 'regular', modelHeightCm: null, modelWears: '', notes: '' },
    tags: [], placement: 'shop',
  };
}

/** Add or edit a product. Saves straight to the live catalogue. */
@Component({
  selector: 'app-product-editor',
  imports: [RouterLink],
  templateUrl: './product-editor.component.html',
})
export class ProductEditorComponent {
  private admin = inject(AdminService);
  private toast = inject(HotToastService);
  private router = inject(Router);
  private title = inject(Title);

  readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id');
  readonly isNew = !this.id || this.id === 'new';
  readonly roles = ROLES;
  readonly presets = SIZE_PRESETS;
  readonly placements: Placement[] = ['hero', 'featured', 'shop', 'archived'];
  readonly placementLabel = PLACEMENT_LABEL;
  readonly placementHelp = PLACEMENT_HELP;

  readonly d = signal<ProductDraft>(emptyDraft());
  readonly meta = signal<Meta | null>(null);
  readonly state = signal<'loading' | 'ready' | 'missing'>(this.isNew ? 'ready' : 'loading');
  readonly saving = signal(false);
  readonly uploading = signal(0);
  readonly error = signal<{ message: string; field?: string } | null>(null);
  readonly slugTouched = signal(false);
  readonly careText = signal('');
  readonly tagText = signal('');

  readonly totalStock = computed(() => this.d().variants.reduce((n, v) => n + (Number(v.stock) || 0), 0));
  readonly preview = computed(() => this.d().images[0]?.url ?? null);
  readonly price = computed(() => (this.d().price ? formatValue(Number(this.d().price), 'inr') : '₹—'));

  constructor() {
    this.title.setTitle(`${this.isNew ? 'New product' : 'Edit product'} — KŌRA Studio`);
    this.admin.meta().subscribe({ next: m => this.meta.set(m) });
    if (!this.isNew) {
      this.admin.product(this.id!).subscribe({
        next: p => { this.d.set(this.fromProduct(p)); this.slugTouched.set(true); this.state.set('ready'); this.title.setTitle(`${p.name} — KŌRA Studio`); },
        error: () => this.state.set('missing'),
      });
    }
  }

  private fromProduct(p: any): ProductDraft {
    const e = emptyDraft();
    this.careText.set((p.fabric?.care ?? []).join('\n'));
    this.tagText.set((p.tags ?? []).join(', '));
    return {
      _id: p._id, name: p.name ?? '', slug: p.slug ?? '', subtitle: p.subtitle ?? '', description: p.description ?? '', story: p.story ?? '',
      price: p.price ?? null, compareAtPrice: p.compareAtPrice ?? null,
      category: p.category?._id ?? p.category ?? '', edition: p.edition?._id ?? p.edition ?? '',
      images: (p.images?.length ? p.images : p.image ? [{ url: p.image, alt: p.name, role: 'model' }] : []).map((i: ProductImage) => ({ ...i })),
      variants: (p.variants ?? []).map((v: any) => ({ size: v.size, sku: v.sku ?? '', stock: v.stock ?? 0 })),
      colorway: { name: p.colorway?.name ?? '', swatch: p.colorway?.swatch ?? '' },
      fabric: {
        composition: p.fabric?.composition?.length ? p.fabric.composition.map((c: any) => ({ ...c })) : e.fabric.composition,
        weightGsm: p.fabric?.weightGsm ?? null, weave: p.fabric?.weave ?? '', origin: p.fabric?.origin ?? '', care: p.fabric?.care ?? [],
      },
      fit: { cut: p.fit?.cut ?? 'regular', modelHeightCm: p.fit?.modelHeightCm ?? null, modelWears: p.fit?.modelWears ?? '', notes: p.fit?.notes ?? '' },
      tags: p.tags ?? [], placement: p.placement ?? 'shop',
    };
  }

  // --- Field helpers ----------------------------------------------------------
  set<K extends keyof ProductDraft>(key: K, value: ProductDraft[K]): void {
    this.d.update(d => ({ ...d, [key]: value }));
    if (key === 'name' && !this.slugTouched()) this.d.update(d => ({ ...d, slug: slugify(`${d.name} ${d.colorway.name}`) }));
    if (this.error()?.field === key) this.error.set(null);
  }
  setIn<K extends 'colorway' | 'fabric' | 'fit'>(group: K, key: string, value: unknown): void {
    this.d.update(d => ({ ...d, [group]: { ...d[group], [key]: value } }));
    if (group === 'colorway' && key === 'name' && !this.slugTouched()) this.d.update(d => ({ ...d, slug: slugify(`${d.name} ${d.colorway.name}`) }));
  }
  num(v: string): number | null { return v === '' ? null : Number(v); }
  bad(field: string): boolean { return this.error()?.field === field; }

  // --- Photos -------------------------------------------------------------------
  onFiles(e: Event): void {
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    for (const file of files) {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { this.toast.error(`${file.name} isn’t a JPG, PNG or WebP image.`); continue; }
      if (file.size > 8 * 1024 * 1024) { this.toast.error(`${file.name} is over 8 MB.`); continue; }
      this.uploading.update(n => n + 1);
      this.admin.upload(file).subscribe({
        next: r => {
          this.uploading.update(n => n - 1);
          this.d.update(d => ({ ...d, images: [...d.images, { url: r.url, alt: d.name || '', role: d.images.length ? 'detail' : 'model', width: r.width, height: r.height }] }));
          if (this.error()?.field === 'images') this.error.set(null);
        },
        error: err => { this.uploading.update(n => n - 1); this.toast.error(adminError(err, `${file.name} didn’t upload.`).message); },
      });
    }
  }
  setImage(i: number, key: 'alt' | 'role', value: string): void {
    this.d.update(d => ({ ...d, images: d.images.map((img, k) => (k === i ? { ...img, [key]: value } : img)) }));
  }
  moveImage(i: number, dir: -1 | 1): void {
    this.d.update(d => { const imgs = [...d.images]; const j = i + dir; if (j < 0 || j >= imgs.length) return d; [imgs[i], imgs[j]] = [imgs[j], imgs[i]]; return { ...d, images: imgs }; });
  }
  removeImage(i: number): void { this.d.update(d => ({ ...d, images: d.images.filter((_, k) => k !== i) })); }

  // --- Sizes --------------------------------------------------------------------
  usePreset(sizes: string[]): void {
    this.d.update(d => ({ ...d, variants: sizes.map(s => d.variants.find(v => v.size === s) ?? { size: s, sku: '', stock: 0 }) }));
  }
  addSize(): void { this.d.update(d => ({ ...d, variants: [...d.variants, { size: '', sku: '', stock: 0 }] })); }
  setSize(i: number, key: 'size' | 'sku' | 'stock', value: string): void {
    this.d.update(d => ({ ...d, variants: d.variants.map((v, k) => (k === i ? { ...v, [key]: key === 'stock' ? Math.max(0, Number(value) || 0) : value } : v)) }));
  }
  removeSize(i: number): void { this.d.update(d => ({ ...d, variants: d.variants.filter((_, k) => k !== i) })); }

  // --- Fabric -------------------------------------------------------------------
  setFiber(i: number, key: 'fiber' | 'percent', value: string): void {
    this.d.update(d => ({ ...d, fabric: { ...d.fabric, composition: d.fabric.composition.map((c, k) => (k === i ? { ...c, [key]: key === 'percent' ? Number(value) || 0 : value } : c)) } }));
  }
  addFiber(): void { this.d.update(d => ({ ...d, fabric: { ...d.fabric, composition: [...d.fabric.composition, { fiber: '', percent: 0 }] } })); }
  removeFiber(i: number): void { this.d.update(d => ({ ...d, fabric: { ...d.fabric, composition: d.fabric.composition.filter((_, k) => k !== i) } })); }

  // --- Save ---------------------------------------------------------------------
  save(): void {
    const draft: ProductDraft = {
      ...this.d(),
      fabric: { ...this.d().fabric, care: this.careText().split('\n').map(s => s.trim()).filter(Boolean) },
      tags: this.tagText().split(',').map(s => s.trim()).filter(Boolean),
    };
    // Quick checks before the round trip (the server checks everything again).
    const local = !draft.name.trim() ? { message: 'Give the product a name.', field: 'name' }
      : !(Number(draft.price) > 0) ? { message: 'Enter a price above ₹0.', field: 'price' }
      : !draft.description.trim() ? { message: 'Add a short description.', field: 'description' }
      : !draft.category ? { message: 'Choose a category.', field: 'category' }
      : !draft.images.length ? { message: 'Add at least one photo.', field: 'images' }
      : null;
    if (local) { this.fail(local); return; }

    this.saving.set(true);
    const req = this.isNew ? this.admin.createProduct(draft) : this.admin.updateProduct(this.id!, draft);
    req.subscribe({
      next: p => {
        this.saving.set(false);
        this.toast.success(`${p.name} saved${draft.placement === 'hero' ? ' as the home page hero' : ''}.`);
        if (this.isNew) this.router.navigate(['/admin/products', p._id]);
        else this.d.set(this.fromProduct(p));
      },
      error: e => { this.saving.set(false); this.fail(adminError(e, 'Couldn’t save the product.')); },
    });
  }

  private fail(e: { message: string; field?: string }): void {
    this.error.set(e);
    if (e.field) setTimeout(() => document.getElementById(`pe-${e.field}`)?.focus());
  }
}

function slugify(s: string): string {
  return s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}
