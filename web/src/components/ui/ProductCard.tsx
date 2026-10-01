'use client';

import Link from 'next/link';
import { buildProductUrl } from '@/lib/buildProductUrl';
import { ShoppingCart, Heart, Eye, Check, Layers, BarChart2, Star, ArrowLeftRight } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useCompareStore } from '@/store/compareStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useAuthStore } from '@/store/authStore';
import { useState } from 'react';
import { toast } from './Toast';
import { formatCurrency } from '@/lib/formatCurrency';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';
const MAX_COMPARE = 4;

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  mrp: number;
  finalprice: number;
  discount: number;
  imageurl?: string;
  rating?: number;
  brand?: string;
  stock?: number;
  categorySlug?: string;
  brandSlug?: string;
}

export function ProductCard({ id, name, slug, mrp, finalprice, discount, imageurl, rating = 4.5, brand, stock = 1, categorySlug, brandSlug }: ProductCardProps) {
  const addItem = useCartStore(s => s.addItem);
  const { addItem: addToCompare, removeItem: removeFromCompare, isComparing, items: compareItems } = useCompareStore();
  const token = useAuthStore(s => s.token);
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const wishlisted = isInWishlist(id);
  const [adding, setAdding] = useState(false);

  const saveAmount = Math.max(0, mrp - finalprice);
  const comparing = isComparing(id);
  const compareIsFull = compareItems.length >= MAX_COMPARE && !comparing;

  const productUrl = buildProductUrl(categorySlug, brandSlug || brand, slug);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (adding) return;
    setAdding(true);
    try {
      await addItem(id, 1);
      toast.success(`${name.split(' ').slice(0, 3).join(' ')} added to cart!`);
    } catch {
      toast.error('Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token) {
      toast.error('Please login to add to wishlist');
      return;
    }
    try {
      const added = await toggleWishlist(id, token);
      toast.success(added ? 'Added to wishlist' : 'Removed from wishlist');
    } catch {
      toast.error('Failed to update wishlist');
    }
  };

  const handleCompare = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      if (compareIsFull) {
        toast.error(`You can compare up to ${MAX_COMPARE} products at a time.`);
        return;
      }
      addToCompare({ id, name, slug, brandSlug, brand, finalprice, mrp, discount, imageurl, stock, categorySlug });
    } else {
      removeFromCompare(id);
    }
  };

    return (
    <div className="group relative flex flex-col bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 h-full">
      {/* Image Area */}
      <div className="relative bg-[#f4f4f4] pt-8 pb-8 px-4 flex items-center justify-center">
        {/* Top-Left Badge */}
        <div className="absolute top-3 left-3 z-10">
          <span className="bg-[#1a1a1a] text-white text-[9px] font-bold px-2 py-1 rounded shadow-sm uppercase tracking-wider">
            BEST SELLER
          </span>
        </div>
        
        {/* Top-Right Badge */}
        {discount > 0 && (
          <div className="absolute top-3 right-3 z-10">
            <span className="bg-[#1a8b44] text-white text-[9px] font-bold px-2 py-1 rounded shadow-sm uppercase tracking-wider">
              {discount}% OFF
            </span>
          </div>
        )}

        {/* Floating Actions (Bottom-Right of Image) */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-2 z-20">
          <button
            onClick={handleWishlist}
            className={`w-8 h-8 rounded-full flex items-center justify-center shadow transition-all ${wishlisted ? 'bg-red-50 text-red-500' : 'bg-white text-gray-500 hover:text-gray-900'}`}
            aria-label="Wishlist"
          >
            <Heart size={14} className={wishlisted ? 'fill-red-500' : ''} />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (comparing) removeFromCompare(id);
              else addToCompare({ id, name, slug, brandSlug, brand, finalprice, mrp, discount, imageurl, stock, categorySlug });
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center shadow transition-all ${comparing ? 'bg-amber-100 text-amber-600' : 'bg-white text-gray-500 hover:text-gray-900'}`}
            aria-label="Compare"
          >
            <ArrowLeftRight size={14} />
          </button>
        </div>

        {/* Product Image */}
        <Link href={productUrl} className="block relative h-48 w-full flex items-center justify-center mix-blend-multiply">
          {imageurl ? (
            <img src={`${API_URL}${imageurl}`} alt={name} className="max-h-full max-w-[85%] object-contain group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 text-[10px] font-bold uppercase tracking-widest">No Image</div>
          )}
        </Link>
      </div>

      {/* Details Area */}
      <div className="p-4 flex flex-col flex-1 bg-white">
        {brand && <span className="text-amber-500 text-[9px] font-bold uppercase tracking-widest mb-1 block">{brand}</span>}
        
        <Link href={productUrl} className="block mb-1">
          <h3 className="font-serif text-sm font-bold text-gray-900 leading-tight line-clamp-2 group-hover:text-amber-600 transition-colors">
            {name}
          </h3>
        </Link>

        <span className="text-[10px] text-gray-500 mb-2 block truncate">Model: {slug.split('-')[0].toUpperCase()}</span>

        <div className="flex items-center gap-1 mb-4">
          <div className="flex text-amber-400">
            <Star size={10} className="fill-amber-400" />
            <Star size={10} className="fill-amber-400" />
            <Star size={10} className="fill-amber-400" />
            <Star size={10} className="fill-amber-400" />
            <Star size={10} className="fill-gray-200 text-gray-200" />
          </div>
          <span className="text-[10px] font-bold text-gray-700 ml-1">4.7</span>
        </div>

        <div className="mt-auto">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-lg font-black text-gray-900 tracking-tight">{formatCurrency(finalprice)}</span>
            {discount > 0 && <span className="text-[11px] text-gray-400 line-through font-medium tracking-tight">MRP {formatCurrency(mrp)}</span>}
          </div>
          <div className="min-h-[16px] mb-4">
            {saveAmount > 0 && (
              <span className="text-[10px] text-green-600 font-bold">You Save: {formatCurrency(saveAmount)}</span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={adding || stock === 0}
            className="w-full bg-[#0B192C] hover:bg-[#162a45] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-[10px] font-bold uppercase tracking-widest py-3 flex items-center justify-center gap-2 transition-colors rounded shadow-sm"
          >
            <ShoppingCart size={14} className="shrink-0" />
            <span>{adding ? 'ADDING...' : stock === 0 ? 'OUT OF STOCK' : 'ADD TO CART'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
