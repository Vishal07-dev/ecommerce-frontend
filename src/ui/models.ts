// Shapes returned by the KŌRA API (back-end/models/*).

export type ImageRole = 'cutout' | 'front' | 'back' | 'model' | 'detail' | 'flat' | 'look';

export interface Credit { name: string; url: string; }

export interface ProductImage {
  url: string;
  alt: string;
  role: ImageRole;
  width?: number;
  height?: number;
  credit?: Credit;
}

export interface Variant { size: string; sku?: string; stock: number; }

export interface Measurement {
  size: string;
  chest?: number;
  length?: number;
  sleeve?: number;
  waist?: number;
  inseam?: number;
}

export interface Hotspot { x: number; y: number; label: string; detail: string; }

export interface EditionRef { _id: string; name: string; slug: string; season?: string; }

export interface Product {
  _id: string;
  slug?: string;
  name: string;
  subtitle?: string;
  description: string;
  story?: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  image?: string;
  images?: ProductImage[];
  variants?: Variant[];
  colorway?: { name: string; swatch: string };
  fabric?: {
    composition?: { fiber: string; percent: number }[];
    weightGsm?: number;
    weave?: string;
    origin?: string;
    care?: string[];
  };
  fit?: { cut?: string; modelHeightCm?: number; modelWears?: string; notes?: string };
  measurements?: Measurement[];
  hotspots?: Hotspot[];
  turntable?: string[];
  tags?: string[];
  category?: { _id: string; name: string };
  edition?: EditionRef;
}

export interface Edition {
  _id: string;
  name: string;
  slug: string;
  season?: string;
  intro?: string;
  cover?: { url: string; alt: string; credit?: Credit };
  productCount: number;
}

export interface Look {
  _id: string;
  slug: string;
  number: number;
  title: string;
  caption: string;
  image: { url: string; alt: string; width: number; height: number; credit?: Credit };
  items: { product: Product; x: number; y: number }[];
}

export interface Asset { url: string; alt: string; width: number; height: number; credit?: Credit; }

export interface ProductPage {
  page: number;
  pages: number;
  total: number;
  count: number;
  products: Product[];
}

// ---------------------------------------------------------------------------
// Helpers shared by cards, the PDP and the hero
// ---------------------------------------------------------------------------
export const ONE_SIZE = 'One size';

export function primaryImage(p: Product): ProductImage {
  const img = p.images?.find(i => i.role === 'model') ?? p.images?.find(i => i.role === 'flat') ?? p.images?.[0];
  return img ?? { url: p.image ?? '', alt: p.name, role: 'model' };
}

export function secondaryImage(p: Product): ProductImage | undefined {
  const first = primaryImage(p);
  return p.images?.find(i => i.url !== first.url && i.role !== 'look');
}

/** Sizes with stock. Products made in the admin form have no variants: one size. */
export function sizesOf(p: Product): Variant[] {
  return p.variants?.length ? p.variants : [{ size: ONE_SIZE, stock: p.stock ?? 0 }];
}

export function productLink(p: Product): string[] {
  return ['/product', p.slug ?? p._id];
}
