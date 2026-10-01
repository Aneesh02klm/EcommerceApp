import React from 'react';
import Link from 'next/link';
import { ProductCard } from '@/components/ui/ProductCard';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';
export const dynamic = 'force-dynamic';

export default async function DealsPage() {
  const res = await fetch(`${API}/api/v1/products`, { cache: 'no-store' });
  const data = await res.json();
  const allProducts = data.success ? data.data : data;

  const brandsRes = await fetch(`${API}/api/v1/brands`, { cache: 'no-store' });
  const brandsData = await brandsRes.json();
  const brands = brandsData.success ? brandsData.data : brandsData;

  // Filter deals (discount > 15%)
  const deals = allProducts
    .map((p: any) => ({
      ...p,
      mrp: p.mrp ?? p.MRP ?? 0,
      finalprice: p.finalPrice ?? p.finalprice ?? 0,
      discount: p.discount ?? p.Discount ?? 0,
      imageurl: p.images?.[0]?.imageUrl || p.imageurl,
      brand: brands?.find((b: any) => b.id === p.brandId)?.name || p.brand
    }))
    .filter((p: any) => p.discount >= 15);

  return (
    <div className="bg-[#f8f9fa] min-h-screen py-10">
      <div className="container mx-auto px-6">
        <div className="bg-[#0B192C] text-white p-8 rounded-2xl mb-8 flex items-center justify-between shadow-lg">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">Exclusive Deals & Offers</h1>
            <p className="text-amber-400 font-medium">Handpicked discounts on premium electronics. Limited time only!</p>
          </div>
          <div className="hidden md:block">
            <span className="bg-amber-500 text-black px-4 py-2 rounded-full font-bold text-sm tracking-widest uppercase">Up to 50% Off</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {deals.length > 0 ? (
            deals.map((product: any) => (
              <ProductCard key={product.id} {...product} />
            ))
          ) : (
            <div className="col-span-full py-16 text-center text-gray-500">
              No active deals right now. Check back later!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
