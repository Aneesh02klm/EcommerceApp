import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ProductDetailClient } from '@/components/ui/ProductDetailClient';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';
export const dynamic = 'force-dynamic';

async function getProduct(slug: string) {
  try {
    const res = await fetch(`${API}/api/v1/products/slug/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

async function getCategories() {
  try {
    const res = await fetch(`${API}/api/v1/categories`, { cache: 'no-store' });
    const json = await res.json();
    return json.success ? json.data : [];
  } catch {
    return [];
  }
}

async function getBrands() {
  try {
    const res = await fetch(`${API}/api/v1/brands`, { cache: 'no-store' });
    const json = await res.json();
    return json.success ? json.data : [];
  } catch {
    return [];
  }
}

async function getRelatedProducts(categoryId: number) {
  try {
    const res = await fetch(`${API}/api/v1/products?CategoryId=${categoryId}&PageSize=12`, { cache: 'no-store' });
    const json = await res.json();
    if (!json.success) return [];
    return json.data.map((p: any) => ({
      ...p,
      mrp: p.mrp ?? p.MRP ?? 0,
      finalprice: p.finalPrice ?? p.finalprice ?? 0,
      discount: p.discount ?? p.Discount ?? 0,
      stock: p.stock ?? p.Stock ?? 0,
      imageurl: p.images?.[0]?.imageUrl || p.imageurl,
      brand: p.brand,
      brandSlug: p.brandSlug,
      categorySlug: p.categorySlug,
    }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categorySlug: string; brand: string; slug: string }>;
}): Promise<Metadata> {
  const p = await params;
  const product = await getProduct(p.slug);
  if (!product) return { title: 'Product Not Found | Malieakal' };
  return {
    title: `${product.name} | Malieakal Electronics`,
    description: product.description?.substring(0, 160),
    openGraph: {
      title: product.name,
      description: product.description?.substring(0, 160),
      images: product.images?.[0]?.imageUrl ? [`${API}${product.images[0].imageUrl}`] : [],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ categorySlug: string; brand: string; slug: string }>;
}) {
  const p = await params;
  const product = await getProduct(p.slug);

  if (!product) notFound();

  const [categories, brands, relatedRaw] = await Promise.all([
    getCategories(),
    getBrands(),
    getRelatedProducts(product.categoryId),
  ]);

  const category = categories.find((c: any) => c.id === product.categoryId);
  const brand = brands.find((b: any) => b.id === product.brandId);
  const relatedProducts = relatedRaw.filter((r: any) => r.id !== product.id).slice(0, 8);

  return (
    <ProductDetailClient
      product={product}
      category={category}
      brand={brand}
      specifications={[]}
      relatedProducts={relatedProducts}
      API={API}
    />
  );
}
