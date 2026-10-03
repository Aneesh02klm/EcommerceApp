'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, ChevronRight } from 'lucide-react';

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
  
  const facetBrands = facets?.brands || [];
  const facetSpecs = facets?.specs || [];
  const facetPrice = facets?.priceRange || { min: 0, max: 100000 };
  
  const ABSOLUTE_MIN = facetPrice.min || 0;
  const ABSOLUTE_MAX = facetPrice.max || 100000;

  const [priceRange, setPriceRange] = useState({ 
    min: minPrice ? parseInt(minPrice) : ABSOLUTE_MIN, 
    max: maxPrice ? parseInt(maxPrice) : ABSOLUTE_MAX 
  });

  // Sync state if URL changes without slider interaction
  useEffect(() => {
    setPriceRange({
      min: minPrice ? parseInt(minPrice) : ABSOLUTE_MIN, 
      max: maxPrice ? parseInt(maxPrice) : ABSOLUTE_MAX 
    });
  }, [minPrice, maxPrice, ABSOLUTE_MIN, ABSOLUTE_MAX]);

  const handleClearAll = () => {
    router.push(`/products${currentCategorySlug ? '/' + currentCategorySlug : ''}`);
  };

  const applyPrice = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (priceRange.min > ABSOLUTE_MIN) params.set('minPrice', priceRange.min.toString());
    else params.delete('minPrice');
    
    if (priceRange.max < ABSOLUTE_MAX) params.set('maxPrice', priceRange.max.toString());
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

  const handleSpecChange = (specId: number, value: string, isChecked: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    const key = `SpecFilters[${specId}]`;
    let current = params.get(key) ? params.get(key)!.split(',') : [];
    
    if (!isChecked) {
        // user unchecked it, remove it
        current = current.filter(v => v !== value);
    } else {
        // user checked it, add it
        if (!current.includes(value)) current.push(value);
    }
    
    if (current.length > 0) {
        updateParam(key, current.join(','));
    } else {
        updateParam(key, ''); // empty string will be deleted by updateParam
    }
  };

  // Helper for slider percent
  const getPercent = (value: number) => Math.round(((value - ABSOLUTE_MIN) / (ABSOLUTE_MAX - ABSOLUTE_MIN)) * 100) || 0;

  return (
    <aside className="w-56 flex-shrink-0 hidden lg:block bg-white p-6 rounded-lg border border-gray-100 shadow-sm self-start">
      <style dangerouslySetInnerHTML={{__html: `
        .dual-slider::-webkit-slider-thumb {
          pointer-events: auto;
          appearance: none;
          width: 16px;
          height: 16px;
          background: #fff;
          border: 2px solid #fbbf24;
          border-radius: 50%;
          cursor: pointer;
        }
        .dual-slider::-moz-range-thumb {
          pointer-events: auto;
          width: 16px;
          height: 16px;
          background: #fff;
          border: 2px solid #fbbf24;
          border-radius: 50%;
          cursor: pointer;
        }
      `}} />

      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-serif font-black text-gray-900 tracking-tight">Filters</h3>
        <button onClick={handleClearAll} className="text-[11px] font-bold text-amber-500 hover:text-amber-600 underline-offset-2 hover:underline transition-colors">Clear All</button>
      </div>

      {/* Global View: Only Show Categories */}
      {!currentCategorySlug ? (
        <div className="mb-6">
          <h4 className="text-sm font-bold text-gray-900 mb-4">Shop by Category</h4>
          <div className="flex flex-col gap-2">
            {categories.map((c: any) => (
              <button 
                key={c.id}
                onClick={() => updateParam('category', c.slug)}
                className="flex items-center justify-between w-full text-left group px-3 py-2.5 rounded-md hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700 group-hover:text-[#0B192C]">{c.name}</span>
                <ChevronRight size={14} className="text-gray-400 group-hover:text-amber-500" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Contextual Filters: Show only if category is selected */}
          
          {/* Price Range with Dual Slider */}
          <div className="mb-6">
            <h4 className="text-sm font-bold text-gray-900 mb-4">Price Range (₹)</h4>
            
            <div className="relative h-10 flex items-center mb-1">
              <div className="absolute w-full h-1.5 bg-gray-200 rounded-full"></div>
              <div 
                className="absolute h-1.5 bg-amber-400 rounded-full" 
                style={{ left: `${getPercent(priceRange.min)}%`, right: `${100 - getPercent(priceRange.max)}%` }}
              ></div>
              <input 
                type="range" 
                min={ABSOLUTE_MIN} 
                max={ABSOLUTE_MAX} 
                value={priceRange.min} 
                onChange={e => setPriceRange({...priceRange, min: Math.min(Number(e.target.value), priceRange.max - 1)})}
                className="dual-slider absolute w-full appearance-none bg-transparent pointer-events-none z-20"
              />
              <input 
                type="range" 
                min={ABSOLUTE_MIN} 
                max={ABSOLUTE_MAX} 
                value={priceRange.max} 
                onChange={e => setPriceRange({...priceRange, max: Math.max(Number(e.target.value), priceRange.min + 1)})}
                className="dual-slider absolute w-full appearance-none bg-transparent pointer-events-none z-20"
              />
            </div>
            
            <div className="flex justify-between text-[11px] text-gray-500 font-medium mb-3">
              <span>₹{ABSOLUTE_MIN.toLocaleString('en-IN')}</span>
              <span>₹{ABSOLUTE_MAX.toLocaleString('en-IN')}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                value={priceRange.min} 
                onChange={e => setPriceRange({...priceRange, min: Number(e.target.value)})} 
                className="w-full border border-gray-200 rounded p-1.5 text-[10px] focus:outline-none focus:border-amber-400 font-bold text-gray-700" 
              />
              <span className="text-gray-300">-</span>
              <input 
                type="number" 
                value={priceRange.max} 
                onChange={e => setPriceRange({...priceRange, max: Number(e.target.value)})} 
                className="w-full border border-gray-200 rounded p-1.5 text-[10px] focus:outline-none focus:border-amber-400 font-bold text-gray-700" 
              />
            </div>
            <button onClick={applyPrice} className="w-full mt-3 bg-gray-100 hover:bg-[#0B192C] hover:text-white text-gray-700 text-[10px] font-bold uppercase tracking-widest py-2 rounded transition-colors shadow-sm">Apply Price</button>
          </div>

          <hr className="border-gray-100 my-6" />

          {/* Brands */}
          {facetBrands.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-bold text-gray-900 mb-4">Brand</h4>
              <div className="flex flex-col gap-3">
                {facetBrands.map((fb: any) => {
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
          )}

          {/* Dynamic Specs from Facets */}
          {facetSpecs.map((specFacet: any) => {
            const urlValue = searchParams.get(`SpecFilters[${specFacet.specId}]`) || '';
            return (
              <div key={specFacet.specId} className="mb-6">
                <hr className="border-gray-100 my-6" />
                <h4 className="text-sm font-bold text-gray-900 mb-4">{specFacet.name}</h4>
                <div className="flex flex-col gap-3">
                  {specFacet.values.map((valObj: any) => {
                    const isChecked = urlValue.split(',').includes(valObj.value);
                    return (
                      <label key={valObj.value} className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-3">
                            <div className="relative flex items-center justify-center">
                              <input 
                                type="checkbox" 
                                checked={isChecked}
                                onChange={() => handleSpecChange(specFacet.specId, valObj.value, !isChecked)}
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
        </>
      )}
    </aside>
  );
}
