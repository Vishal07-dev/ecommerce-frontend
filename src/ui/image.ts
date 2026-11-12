import { IMAGE_LOADER, ImageLoaderConfig } from '@angular/common';
import { Provider } from '@angular/core';

/**
 * Delivery URL for a Cloudinary image at a given width: automatic format and
 * quality, never upscaled. Any transformation already in the URL (such as a
 * detail crop made by the seed) is kept and the resize is chained after it.
 * Non-Cloudinary URLs are returned unchanged.
 */
export function cld(src: string, width?: number): string {
  if (!src || !src.includes('res.cloudinary.com') || !src.includes('/upload/')) return src;
  const delivery = ['f_auto', 'q_auto', ...(width ? [`w_${width}`, 'c_limit'] : [])].join(',');
  const [head, tail] = src.split('/upload/');
  const versionAt = tail.search(/(^|\/)v\d+\//);
  if (versionAt <= 0) return `${head}/upload/${delivery}/${tail}`; // no existing transformation
  const transforms = tail.slice(0, versionAt);
  const rest = tail.slice(versionAt + 1);
  return `${head}/upload/${transforms}/${delivery}/${rest}`;
}

/**
 * A 4:5 subject-aware crop for small thumbnails (bag lines, "Shop the look").
 * Besides the better framing, it gives a thumbnail its own URL, so it is never
 * mistaken for the full-size copy of the same photo on the page.
 */
export function thumb(src: string): string {
  if (!src || !src.includes('res.cloudinary.com') || !src.includes('/upload/')) return src;
  const [head, tail] = src.split('/upload/');
  return `${head}/upload/c_fill,ar_4:5,g_auto/${tail}`;
}

/** Lets NgOptimizedImage build srcsets straight from Cloudinary. */
export const provideCloudinaryLoader = (): Provider => ({
  provide: IMAGE_LOADER,
  useValue: (config: ImageLoaderConfig) => cld(config.src, config.width),
});
