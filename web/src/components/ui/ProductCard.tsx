'use client';

import Link from 'next/link';
import { buildProductUrl } from '@/lib/buildProductUrl';
import { ShoppingCart, Heart, Eye, Check } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useCompareStore } from '@/store/compareStore';
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
  const [wishlisted, setWishlisted] = useState(false);
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

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlisted(w => !w);
    toast.info(wishlisted ? 'Removed from wishlist' : 'Added to wishlist');
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
    <div className="group relative flex flex-col bg-white border border-gray-100 rounded-lg overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-gray-300 transition-all duration-300 h-full">

      {/* Image */}
      <Link href={productUrl} className="block relative bg-gray-50/50 pt-6 pb-2">
        <div className="relative flex items-center justify-center h-44 overflow-hidden mix-blend-multiply">
          {imageurl ? (
            <img
              src={`${API_URL}${imageurl}`}
              alt={name}
              className="max-h-full max-w-[80%] object-contain group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">No Image</span>
            </div>
          )}
        </div>
        {/* Quick view overlay */}
        <div className="absolute inset-0 bg-[#0B192C]/0 group-hover:bg-[#0B192C]/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <span className="bg-white/90 backdrop-blur-sm text-[#0B192C] text-[10px] font-bold px-4 py-2 rounded-full shadow-lg uppercase tracking-widest flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-all">
            <Eye size={12} /> Quick View
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        
        {/* 1st: Price Block */}
        <div className="mb-3">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-base font-black text-[#0B192C] tracking-tight">{formatCurrency(finalprice)}</span>
            {discount > 0 && (
              <span className="text-[11px] text-gray-400 line-through font-semibold">{formatCurrency(mrp)}</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {discount > 0 && (
              <span className="bg-green-100 text-green-700 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                {discount}% OFF
              </span>
            )}
            {saveAmount > 0 && (
              <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                Save {formatCurrency(saveAmount)}
              </span>
            )}
          </div>
        </div>

        {/* 2nd: Brand Name */}
        {brand && (
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.2em] mb-1.5 block">{brand}</span>
        )}

        {/* 3rd: Product Title */}
        <Link href={productUrl} className="flex-1 block mb-3">
          <h3 className="text-xs font-bold text-gray-800 line-clamp-2 leading-relaxed group-hover:text-amber-500 transition-colors">
            {name}
          </h3>
        </Link>

        <div className="mt-auto">
          {/* Stock & Compare Row */}
          <div className="flex items-center justify-between mb-3 border-t border-gray-100 pt-3">
            <span className={`text-[9px] font-black tracking-widest uppercase ${stock > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stock > 0 ? 'IN STOCK' : 'OUT OF STOCK'}
            </span>
            
            <label className={`flex items-center gap-1.5 cursor-pointer group/cmp ${compareIsFull ? 'opacity-40 cursor-not-allowed' : ''}`}>
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={comparing}
                  onChange={handleCompare}
                  disabled={compareIsFull}
                  className="peer appearance-none w-3.5 h-3.5 border border-gray-300 rounded-sm checked:border-amber-500 checked:bg-amber-500 transition-colors cursor-pointer disabled:cursor-not-allowed"
                />
                <Check size={9} className="text-white absolute opacity-0 peer-checked:opacity-100 pointer-events-none" strokeWidth={4} />
              </div>
              <span className="text-[10px] font-bold text-gray-500 group-hover/cmp:text-[#0B192C] transition-colors">Compare</span>
            </label>
          </div>

          {/* Add to Cart & Wishlist */}
          <div className="flex gap-2">
            <button
              onClick={handleWishlist}
              className={`w-10 h-10 shrink-0 border rounded flex items-center justify-center transition-colors ${wishlisted ? 'bg-red-50 border-red-200 text-red-500' : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-red-200 hover:bg-red-50 hover:text-red-500'}`}
              aria-label="Wishlist"
            >
              <Heart size={16} className={wishlisted ? 'fill-red-500' : ''} />
            </button>
            <button
              onClick={handleAddToCart}
              disabled={adding || stock === 0}
              className="flex-1 bg-[#0B192C] hover:bg-[#162a45] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-[10px] font-bold uppercase tracking-widest py-2.5 flex items-center justify-center gap-2 transition-colors rounded border border-transparent"
            >
              <ShoppingCart size={14} />
              <span className="truncate">{adding ? 'Adding...' : stock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
