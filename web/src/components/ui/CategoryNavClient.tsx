'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface Category {
  id: number;
  name: string;
  slug: string;
}

export function CategoryNavClient({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCategoryClick = (slug: string) => {
    setOpen(false);
    router.push(`/products/${slug}`);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 py-3 hover:text-amber-500 transition-colors text-xs font-bold text-[#0B192C] uppercase tracking-wide"
      >
        All Categories <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 bg-white border border-gray-200 rounded shadow-xl z-50 w-64 py-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.slug)}
              className="w-full text-left px-4 py-2.5 text-xs font-semibold text-[#0B192C] hover:bg-amber-50 hover:text-amber-600 transition-colors"
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
