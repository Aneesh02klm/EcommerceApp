import Link from 'next/link';
import { ProductCard } from '@/components/ui/ProductCard';
import { ArrowRight } from 'lucide-react';
import { PreBookingClientForm } from '@/components/ui/PreBookingClientForm';
import { DiscoverMoreClient } from '@/components/ui/DiscoverMoreClient';
import { SignalRListener } from '@/components/ui/SignalRListener';
import { StorefrontRenderer } from '@/components/ui/StorefrontRenderer';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

async function get<T = any>(path: string): Promise<T> {
  try {
    const res = await fetch(`${API}${path}`, { cache: 'no-store' });
    if (!res.ok) return [] as T;
    const json = await res.json();
    return json.success !== undefined ? json.data : json;
  } catch (err) {
    return [] as T;
  }
}

export default async function Home({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const params = await searchParams;
  const modeParam = params?.mode === 'draft' ? '?mode=draft' : '';
  const [config, banners, allProducts, allCategories, allBrands] = await Promise.all([
    get(`/api/v1/storefront/homepage-config${modeParam}`),
    get('/api/cms/banners'),
    get('/api/v1/products'),
    get('/api/v1/categories'),
    get('/api/v1/brands')
  ]);

  const mapProduct = (p: any) => ({
    ...p,
    mrp: p.mrp ?? p.MRP ?? 0,
    finalprice: p.finalPrice ?? p.finalprice ?? 0,
    discount: p.discount ?? p.Discount ?? 0,
    stock: p.stock ?? p.Stock ?? 0,
    imageurl: p.images?.[0]?.imageUrl || p.imageurl,
    brand: allBrands?.find((b: any) => b.id === p.brandId)?.name || p.brand,
    categorySlug: allCategories?.find((c: any) => c.id === p.categoryId)?.slug,
    brandSlug: p.brandSlug
  });

  
  const mapProductPayload = {
    banners, allCategories, allBrands
  };

  return (
    <>
      <SignalRListener />
      <StorefrontRenderer 
        initialConfig={config} 
        banners={banners} 
        API={API} 
        mapProductPayload={mapProductPayload} 
      />
    </>
  );
}
