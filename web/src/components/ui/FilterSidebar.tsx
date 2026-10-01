'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check } from 'lucide-react';

interface FilterSidebarProps {
  categories: any[];
  brands: any[];
  activeCategoryId?: number;
  currentCategorySlug?: string;
  facets?: any;
}

export function FilterSidebar({ categories, brands, activeCategoryId, currentCategorySlug = '', facets }: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentBrandSlug = searchParams.get('brand') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  
  const [priceRange, setPriceRange] = useState({ min: minPrice, max: maxPrice });

  // Use facets or default
  const facetBrands = facets?.brands || [];
  const facetSpecs = facets?.specs || [];
  const facetPrice = facets?.priceRange || { min: 5000, max: 80000 };

  const handleClearAll = () => {
    router.push(`/products${currentCategorySlug ? '/' + currentCategorySlug : ''}`);
  };

  const applyPrice = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (priceRange.min) params.set('minPrice', priceRange.min);
    else params.delete('minPrice');
    
    if (priceRange.max) params.set('maxPrice', priceRange.max);
    else params.delete('maxPrice');
    
    router.push(`/products${currentCategorySlug ? '/' + currentCategorySlug : ''}?${params.toString()}`);
  };

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    let targetCategory = currentCategorySlug;

    if (key === 'category') {
      targetCategory = value;
      Array.from(params.keys()).forEach(k => {
        if (k.startsWith('SpecFilters[')) params.delete(k);
      });
    } else {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    
    const basePath = targetCategory ? `/products/${targetCategory}` : `/products`;
    const queryString = params.toString() ? `?${params.toString()}` : '';
    router.push(`${basePath}${queryString}`);
  };

  const handleSpecChange = (specId: number, value: string) => {
    updateParam(`SpecFilters[${specId}]`, value);
  };

  return (
    <aside className="w-56 flex-shrink-0 hidden lg:block bg-white p-6 rounded-lg border border-gray-100 shadow-sm self-start">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-serif font-black text-gray-900 tracking-tight">Filters</h3>
        <button onClick={handleClearAll} className="text-[11px] font-bold text-amber-500 hover:text-amber-600 underline-offset-2 hover:underline transition-colors">Clear All</button>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <h4 className="text-sm font-bold text-gray-900 mb-4">Price Range (₹)</h4>
        <div className="relative h-1.5 bg-gray-200 rounded-full mb-3">
          <div className="absolute left-[10%] right-[30%] h-full bg-amber-400 rounded-full"></div>
        </div>
        <div className="flex justify-between text-[11px] text-gray-500 font-medium mb-3">
          <span>₹{facetPrice.min.toLocaleString('en-IN')}</span>
          <span>₹{facetPrice.max.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex items-center gap-2">
          <input type="number" placeholder="Min" value={priceRange.min} onChange={e => setPriceRange({...priceRange, min: e.target.value})} className="w-full border border-gray-200 rounded p-1.5 text-[10px] focus:outline-none focus:border-amber-400" />
          <input type="number" placeholder="Max" value={priceRange.max} onChange={e => setPriceRange({...priceRange, max: e.target.value})} className="w-full border border-gray-200 rounded p-1.5 text-[10px] focus:outline-none focus:border-amber-400" />
        </div>
        <button onClick={applyPrice} className="w-full mt-2 bg-gray-100 hover:bg-[#0B192C] hover:text-white text-gray-600 text-[9px] font-bold uppercase tracking-widest py-1.5 rounded transition-colors">Apply Price</button>
      </div>

      <hr className="border-gray-100 my-6" />

      {/* Brands */}
      <div className="mb-6">
        <h4 className="text-sm font-bold text-gray-900 mb-4">Brand</h4>
        <div className="flex flex-col gap-3">
          {facetBrands.map((fb: any) => {
            // lookup slug
            const brandObj = brands.find(b => b.id === fb.id);
            if (!brandObj) return null;
            const isChecked = currentBrandSlug === brandObj.slug;
            return (
              <label key={fb.id} className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      onChange={() => updateParam('brand', isChecked ? '' : brandObj.slug)}
                      className="peer appearance-none w-4 h-4 border border-gray-300 rounded-[3px] checked:border-[#0B192C] checked:bg-[#0B192C] transition-colors cursor-pointer"
                    />
                    <Check size={10} className="text-white absolute opacity-0 peer-checked:opacity-100 pointer-events-none" strokeWidth={4} />
                  </div>
                  <span className="text-sm text-gray-700 font-medium group-hover:text-[#0B192C] transition-colors">{fb.name}</span>
                </div>
                <span className="text-[11px] text-gray-400">({fb.count})</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Dynamic Specs from Facets */}
      {facetSpecs.map((specFacet: any) => {
        const urlValue = searchParams.get(`SpecFilters[${specFacet.specId}]`) || '';
        
        return (
          <div key={specFacet.specId} className="mb-6">
            <hr className="border-gray-100 my-6" />
            <h4 className="text-sm font-bold text-gray-900 mb-4">{specFacet.name}</h4>
            <div className="flex flex-col gap-3">
              {specFacet.values.map((valObj: any) => {
                const isChecked = urlValue === valObj.value;
                return (
                  <label key={valObj.value} className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-3">
                        <div className="relative flex items-center justify-center">
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={() => handleSpecChange(specFacet.specId, isChecked ? '' : valObj.value)}
                            className="peer appearance-none w-4 h-4 border border-gray-300 rounded-[3px] checked:border-[#0B192C] checked:bg-[#0B192C] transition-colors cursor-pointer"
                          />
                          <Check size={10} className="text-white absolute opacity-0 peer-checked:opacity-100 pointer-events-none" strokeWidth={4} />
                        </div>
                        <span className="text-sm text-gray-700 font-medium group-hover:text-[#0B192C] transition-colors">{valObj.value}</span>
                    </div>
                    <span className="text-[11px] text-gray-400">({valObj.count})</span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </aside>
  );
}
