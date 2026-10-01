'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useWishlistStore } from '@/store/wishlistStore';

export function WishlistNavBadge() {
  const [mounted, setMounted] = useState(false);
  const items = useWishlistStore(s => s.items);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Link href="/wishlist" className="flex flex-col items-center gap-0.5 text-[#0B192C] hover:text-amber-500 transition-colors relative">
      <Heart size={21} />
      <span className="text-[9px] font-bold uppercase tracking-wider">Wishlist</span>
      {mounted && items.length > 0 && (
        <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
          {items.length}
        </span>
      )}
    </Link>
  );
}
