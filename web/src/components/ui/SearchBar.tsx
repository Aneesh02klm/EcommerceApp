'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const [query, setQuery] = useState(queryParam);
  
  // Sync state if URL changes externally (e.g. clicking Home)
  useEffect(() => {
    setQuery(queryParam);
  }, [queryParam]);

  // Debounced search logic
  useEffect(() => {
    // Only push if the query actually changed from what's in the URL
    if (query === queryParam) return;

    const timer = setTimeout(() => {
      const currentParams = new URLSearchParams(Array.from(searchParams.entries()));
      if (query) {
        currentParams.set('q', query);
      } else {
        currentParams.delete('q');
      }
      
      const newUrl = `/products?${currentParams.toString()}`;
      router.push(newUrl);
    }, 500);

    return () => clearTimeout(timer);
  }, [query, queryParam, router, searchParams]);

  return (
    <div className="relative w-full flex items-center border border-gray-300 rounded-md bg-white hover:border-gray-400 transition-colors">
      <div className="hidden sm:flex items-center pl-3 pr-2 border-r border-gray-200">
        <select className="bg-transparent text-[11px] font-semibold text-gray-600 focus:outline-none cursor-pointer uppercase tracking-wider">
          <option>All Categories</option>
          <option>Mobiles</option>
          <option>Appliances</option>
        </select>
      </div>
      <input
        type="text"
        className="flex-1 pl-4 pr-3 py-2 border-none bg-transparent placeholder-gray-400 focus:outline-none focus:ring-0 text-sm text-gray-900 font-medium"
        placeholder="Search for premium electronics, air conditioners..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="flex items-center pr-3 space-x-2 text-[#0B192C]">
        <button className="p-1 hover:bg-gray-100 rounded-full transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg></button>
        <button 
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          onClick={() => { if (query) router.push(`/products?q=${query}`); }}
        >
          <Search size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
