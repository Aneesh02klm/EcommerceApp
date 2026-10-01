'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

export function CartNavBadge() {
  const [mounted, setMounted] = useState(false);
  const items = useCartStore((state) => state.items);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <Link 
      href="/cart" 
      className="relative flex flex-col items-center gap-0.5 text-[#0B192C] hover:text-amber-500 transition-colors group"
      aria-label={`Shopping Cart with ${mounted ? totalCount : 0} items`}
    >
      <div className="relative">
        <ShoppingBag size={21} className="transition-transform group-hover:scale-105" />
        <span 
          className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-amber-400 text-[#0B192C] text-[9px] font-extrabold rounded-full flex items-center justify-center transition-all shadow-sm"
        >
          {mounted ? totalCount : 0}
        </span>
      </div>
      <span className="text-[9px] font-bold uppercase tracking-wider">Cart</span>
    </Link>
  );
}
