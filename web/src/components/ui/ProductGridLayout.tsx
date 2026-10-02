'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProductCard } from '@/components/ui/ProductCard';
import { SortDropdown } from '@/components/ui/SortDropdown';
import { SlidersHorizontal, List, Grid } from 'lucide-react';

interface ProductGridLayoutProps {
  title: string;
  products: any[];
  sort: string;
}

export function ProductGridLayout({ title, products, sort }: ProductGridLayoutProps) {
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedLayout = localStorage.getItem('layoutPreference');
    if (savedLayout === 'list' || savedLayout === 'grid') {
      setLayout(savedLayout);
    }
  }, []);

  const toggleLayout = () => {
    const newLayout = layout === 'grid' ? 'list' : 'grid';
    setLayout(newLayout);
    localStorage.setItem('layoutPreference', newLayout);
  };

  // Prevent hydration mismatch for icon by defaulting to a standard state until mounted,
  // or just let it render what server thinks (grid) and hydrate.
  
  return (
    <div className="flex-1 w-full flex flex-col">
      {/* Category Header & Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-4 rounded-lg border border-gray-100 shadow-sm mb-6">
        <div>
          <h1 className="text-xl font-serif font-black text-[#0B192C] mb-1">{title}</h1>
          <p className="text-xs text-gray-500 font-medium">Showing {products.length} Results</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 border border-gray-200 rounded-md px-3 py-2 bg-white cursor-pointer hover:border-gray-300">
            <span className="text-xs text-gray-500 font-medium">Sort By:</span>
            <SortDropdown currentSort={sort} />
          </div>
          <button 
            onClick={toggleLayout}
            className="p-2 border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors"
            title={layout === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}
          >
            {isMounted && layout === 'list' ? (
              <List size={16} className="text-gray-700" />
            ) : (
              <Grid size={16} className="text-gray-700" />
            )}
          </button>
        </div>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 py-24 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <SlidersHorizontal size={28} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-extrabold text-[#0B192C] mb-2">No Products Found</h3>
          <p className="text-sm text-gray-500 mb-6">Try adjusting your filters or search term.</p>
          <Link href="/products" className="bg-amber-400 hover:bg-amber-300 text-[#0B192C] font-extrabold text-xs uppercase tracking-widest px-6 py-3 transition-colors">
            Clear Filters
          </Link>
        </div>
      ) : (
        <div className={`grid gap-4 ${layout === 'list' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
          {products.map((p: any) => (
            <ProductCard key={p.id} {...p} layout={layout} />
          ))}
        </div>
      )}
    </div>
  );
}
