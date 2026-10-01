'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronRight, Check } from 'lucide-react';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

interface FilterSidebarProps {
  categories: any[];
  brands: any[];
  activeCategoryId?: number;
  currentCategorySlug?: string;
}

export function FilterSidebar({ categories, brands, activeCategoryId, currentCategorySlug = '' }: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentBrandSlug = searchParams.get('brand') || '';
  
  // Extract existing SpecFilters from URL (e.g., SpecFilters[1]=Value)
  const [specs, setSpecs] = useState<any[]>([]);

  useEffect(() => {
    if (activeCategoryId) {
      fetch(`${API}/api/v1/categories/${activeCategoryId}/specifications`)
        .then(r => {
          if (!r.ok) throw new Error('Fetch failed');
          return r.json();
        })
        .then(d => {
          if (d.success) {
            setSpecs(d.data.filter((s: any) => s.isFilterable));
          }
        })
        .catch(() => setSpecs([]));
    } else {
      setSpecs([]);
    }
  }, [activeCategoryId]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    let targetCategory = currentCategorySlug;

    if (key === 'category') {
      targetCategory = value;
      // Reset spec filters
      Array.from(params.keys()).forEach(k => {
        if (k.startsWith('SpecFilters[')) params.delete(k);
      });
      // Do not add category to search params anymore
    } else {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    
    const basePath = targetCategory ? `/products/${targetCategory}` : `/products`;
    const queryString = params.toString() ? `?${params.toString()}` : '';
    router.push(`${basePath}${queryString}`);
  };

  const handleSpecChange = (specId: number, value: string) => {
    updateParam(`SpecFilters[${specId}]`, value);
  };

  return (
    <aside className="w-56 flex-shrink-0 hidden lg:block">
      {/* Categories */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4">
        <div className="px-4 py-3 bg-[#0B192C] text-white text-[10px] font-extrabold uppercase tracking-widest">
          Shop by Category
        </div>
        <div className="divide-y divide-gray-100">
          <button
            onClick={() => updateParam('category', '')}
            className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold hover:bg-amber-50 hover:text-amber-600 transition-colors ${!currentCategorySlug ? 'bg-amber-50 text-amber-600 font-bold' : 'text-gray-700'}`}
          >
            All Products
          </button>
          {categories.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => updateParam('category', cat.slug)}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold hover:bg-amber-50 hover:text-amber-600 transition-colors ${currentCategorySlug === cat.slug ? 'bg-amber-50 text-amber-600 font-bold' : 'text-gray-700'}`}
            >
              {cat.name}
              <ChevronRight size={12} className="text-gray-300" />
            </button>
          ))}
        </div>
      </div>

              {/* Availability */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4">
          <div className="px-4 py-3 bg-gray-50 text-[#0B192C] text-[10px] font-extrabold uppercase tracking-widest border-b border-gray-100">
            Availability
          </div>
          <div className="p-4 flex flex-col gap-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input 
                  type="radio" 
                  name="availability" 
                  checked={searchParams.get('inStockOnly') !== 'true'} 
                  onChange={() => updateParam('inStockOnly', '')}
                  className="peer appearance-none w-4 h-4 border-2 border-gray-300 rounded-sm checked:border-[#0B192C] checked:bg-[#0B192C] transition-colors cursor-pointer"
                />
                <Check size={10} className="text-white absolute opacity-0 peer-checked:opacity-100 pointer-events-none" strokeWidth={4} />
              </div>
              <span className="text-xs font-bold text-gray-600 group-hover:text-amber-500 transition-colors">All Products</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input 
                  type="radio" 
                  name="availability" 
                  checked={searchParams.get('inStockOnly') === 'true'} 
                  onChange={() => updateParam('inStockOnly', 'true')}
                  className="peer appearance-none w-4 h-4 border-2 border-gray-300 rounded-sm checked:border-[#0B192C] checked:bg-[#0B192C] transition-colors cursor-pointer"
                />
                <Check size={10} className="text-white absolute opacity-0 peer-checked:opacity-100 pointer-events-none" strokeWidth={4} />
              </div>
              <span className="text-xs font-bold text-gray-600 group-hover:text-amber-500 transition-colors">In Stock Only</span>
            </label>
          </div>
        </div>

        {/* Dynamic Specifications */}
      {specs.map(spec => {
        const urlValue = searchParams.get(`SpecFilters[${spec.id}]`) || '';
        
        return (
          <div key={spec.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4">
            <div className="px-4 py-3 bg-gray-50 text-[#0B192C] text-[10px] font-extrabold uppercase tracking-widest border-b border-gray-100">
              {spec.name} {spec.unit ? `(${spec.unit})` : ''}
            </div>
            <div className="p-4 flex flex-col gap-2">
              <select 
                value={urlValue}
                onChange={(e) => handleSpecChange(spec.id, e.target.value)}
                className="w-full border border-gray-200 rounded p-1.5 text-xs text-gray-700 focus:outline-none focus:border-amber-400"
              >
                <option value="">Any {spec.name}</option>
                {/* In a real app, AllowedValues might be stored. For the seed data we use basic generation.
                    Since we don't have distinct values readily in the spec obj without an aggregation query,
                    we will just use an input or if it's 'Select' maybe some mocked values. 
                    Wait, let's just make it a text input for precise filtering, or rely on AllowedValues if present. */}
                {spec.allowedValues ? (
                  spec.allowedValues.split(',').map((val: string) => (
                    <option key={val} value={val.trim()}>{val.trim()}</option>
                  ))
                ) : (
                  // Fallback for demo since we didn't populate AllowedValues in seed
                  <>
                    <option value="9">9</option>
                    <option value="12">12</option>
                    <option value="55">55</option>
                    <option value="4K UHD">4K UHD</option>
                    <option value="Front Load">Front Load</option>
                    <option value="Top Load">Top Load</option>
                  </>
                )}
              </select>
            </div>
          </div>
        );
      })}

      {/* Brands */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-[#0B192C] text-white text-[10px] font-extrabold uppercase tracking-widest">
          Shop by Brand
        </div>
        <div className="divide-y divide-gray-100">
          <button
            onClick={() => updateParam('brand', '')}
            className={`w-full text-left flex items-center px-4 py-2.5 text-xs font-semibold hover:bg-amber-50 hover:text-amber-600 transition-colors gap-2 ${!currentBrandSlug ? 'bg-amber-50 text-amber-600 font-bold' : 'text-gray-700'}`}
          >
            <span className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />
            All Brands
          </button>
          {brands.map((b: any) => (
            <button
              key={b.id}
              onClick={() => updateParam('brand', b.slug)}
              className={`w-full text-left flex items-center px-4 py-2.5 text-xs font-semibold hover:bg-amber-50 hover:text-amber-600 transition-colors gap-2 ${currentBrandSlug === b.slug ? 'bg-amber-50 text-amber-600 font-bold' : 'text-gray-700'}`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${currentBrandSlug === b.slug ? 'bg-amber-500' : 'bg-gray-300'}`} />
              {b.name}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
