import React from 'react';
import Link from 'next/link';
import { ProductCard } from '@/components/ui/ProductCard';
import { FlashSaleCountdown } from '@/components/ui/FlashSaleCountdown';
import { Percent, Timer } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';
export const dynamic = 'force-dynamic';

export default async function DealsPage() {
  let allProducts = [];
  let brands = [];
  
  try {
      const res = await fetch(`${API}/api/v1/products?IsDeal=true&PageSize=100`, { cache: 'no-store' });
      const data = await res.json();
      allProducts = data.success ? data.data : (Array.isArray(data) ? data : (data.items || []));
    
      const brandsRes = await fetch(`${API}/api/v1/brands`, { cache: 'no-store' });
      const brandsData = await brandsRes.json();
      brands = brandsData.success ? brandsData.data : (Array.isArray(brandsData) ? brandsData : []);
  } catch (err) {}

  const mappedProducts = allProducts.map((p: any) => ({
      ...p,
      mrp: p.mrp ?? p.MRP ?? 0,
      finalprice: p.finalPrice ?? p.finalprice ?? 0,
      discount: p.discount ?? p.Discount ?? 0,
      appliedPromotionType: p.appliedPromotionType ?? p.AppliedPromotionType,
      imageurl: p.images?.[0]?.imageUrl || p.imageurl,
      brand: brands?.find((b: any) => b.id === p.brandId)?.name || p.brand
  }));

  // Distinct sets
  const flashSaleProducts = mappedProducts.filter((p: any) => p.appliedPromotionType === 'FLASH_SALE' || p.flashSaleEndTime);
  const catalogDeals = mappedProducts.filter((p: any) => p.appliedPromotionType === 'CATALOG_PROMOTION' || (p.discount >= 10 && p.appliedPromotionType === 'CATALOG_PROMOTION'));

  // Derive master timer from first flash sale product
  const masterFlashSale = flashSaleProducts.length > 0 ? flashSaleProducts[0] : null;

  return (
    <div className="bg-[#f8f9fa] min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Top Section: Live Flash Sales */}
        {flashSaleProducts.length > 0 && (
            <section className="mb-12 bg-red-600 rounded-2xl overflow-hidden shadow-2xl relative border-4 border-red-500">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                
                <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-red-500/50 bg-gradient-to-b from-red-600 to-red-700">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Timer size={32} className="text-amber-300 animate-pulse" />
                            <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">
                                {masterFlashSale.flashSaleName || 'Live Flash Sale'}
                            </h1>
                        </div>
                        <p className="text-red-100 font-bold text-sm md:text-lg tracking-wide">
                            Hurry! These exclusive deals will expire soon.
                        </p>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-xl shadow-inner text-white flex flex-col items-center min-w-[250px]">
                        <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest mb-2 text-center w-full block">Offer Ends In</span>
                        <div className="scale-125 md:scale-150 origin-center text-white">
                            <FlashSaleCountdown endTime={masterFlashSale.flashSaleEndTime} />
                        </div>
                    </div>
                </div>

                <div className="relative z-10 p-6 md:p-8 bg-red-50/95 backdrop-blur-sm">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
                        {flashSaleProducts.map((product: any) => (
                            <ProductCard key={product.id} {...product} />
                        ))}
                    </div>
                </div>
            </section>
        )}

        {/* Bottom Section: Top Deals / Catalog Promotions */}
        <section className="mb-12">
            <div className="flex items-center gap-3 mb-8">
                <div className="bg-amber-500 p-2.5 rounded-lg text-[#0B192C]">
                    <Percent size={24} strokeWidth={3} />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-[#0B192C] uppercase tracking-tight">Top Deals & Promotions</h2>
                    <p className="text-sm font-bold text-gray-500">Unbeatable discounts across standard catalog items</p>
                </div>
            </div>

            {catalogDeals.length === 0 ? (
                <div className="bg-white rounded-xl p-16 text-center border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-400">No active catalog promotions at the moment.</h3>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
                    {catalogDeals.map((product: any) => (
                        <ProductCard key={product.id} {...product} />
                    ))}
                </div>
            )}
        </section>

      </div>
    </div>
  );
}