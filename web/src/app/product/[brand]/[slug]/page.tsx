import { redirect } from 'next/navigation';

/**
 * Old route: /product/[brand]/[slug]
 * Permanently redirects to the new canonical format.
 */
export default async function OldProductRedirect({
  params,
}: {
  params: Promise<{ brand: string; slug: string }>;
}) {
  const { slug } = await params;
  // Fetch product to get its categorySlug and brandSlug for the full canonical URL
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';
  try {
    const res = await fetch(`${API}/api/v1/products/slug/${slug}`, { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        const p = json.data;
        const cat = p.categorySlug || 'products';
        const brand = p.brandSlug || 'brand';
        redirect(`/products/${cat}/${brand}/${slug}`, 308 as any);
      }
    }
  } catch {
    // fall through
  }
  redirect('/products');
}
