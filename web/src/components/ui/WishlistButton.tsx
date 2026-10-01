'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { toast } from './Toast';

export function WishlistButton({ productId }: { productId: string }) {
  const [wishlisted, setWishlisted] = useState(false);
  const handleClick = () => {
    setWishlisted(w => !w);
    toast.info(wishlisted ? 'Removed from wishlist' : 'Added to wishlist');
  };
  return (
    <button onClick={handleClick} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
      <Heart size={16} className={wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
    </button>
  );
}
