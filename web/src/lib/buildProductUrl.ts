/**
 * Central helper for building product URLs.
 * Format: /products/[categorySlug]/[brandSlug]/[slug]
 *
 * Falls back gracefully when segments are missing so pages never render broken links.
 */
export function buildProductUrl(
  categorySlug: string | null | undefined,
  brandSlug: string | null | undefined,
  slug: string | null | undefined,
): string {
  const cat = slugify(categorySlug) || 'products';
  const brand = slugify(brandSlug) || 'brand';
  const s = slug || '';
  return `/products/${cat}/${brand}/${s}`;
}

function slugify(value: string | null | undefined): string {
  if (!value) return '';
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
