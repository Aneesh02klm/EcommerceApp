'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { buildProductUrl } from '@/lib/buildProductUrl';
import { Heart, Loader2, Trash2, ShoppingCart, Star } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { formatCurrency } from '@/lib/formatCurrency';
import { toast } from '@/components/ui/Toast';

export default function WishlistPage() {
  const { token } = useAuthStore();
  const addItem = useCartStore(s => s.addItem);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingCartId, setAddingCartId] = useState<string | null>(null);

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

  useEffect(() => {
    fetchWishlist();
  }, [token]);

  const fetchWishlist = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API}/api/v1/wishlist`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setItems(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const removeWishlist = async (productId: string) => {
    try {
      await fetch(`${API}/api/v1/wishlist/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast.success('Removed from wishlist');
      fetchWishlist();
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove from wishlist');
    }
  };

  const handleAddToCart = async (productId: string, productName: string) => {
    if (addingCartId) return;
    setAddingCartId(productId);
    try {
      await addItem(productId, 1);
      toast.success(`${productName.split(' ').slice(0, 3).join(' ')} added to cart!`);
    } catch (err) {
      toast.error('Failed to add to cart');
    } finally {
      setAddingCartId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex justify-center items-center">
        <Loader2 className="animate-spin text-amber-500" size={32} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-xs text-gray-500 font-semibold mb-6 flex gap-2">
        <Link href="/" className="hover:text-amber-500 transition-colors">Home</Link>
        <span>/</span>
        <span className="text-[#0B192C] font-extrabold">My Wishlist</span>
      </div>

      <h1 className="text-2xl font-extrabold text-[#0B192C] mb-6 pb-4 border-b border-gray-100">
        My Wishlist <span className="text-gray-400 text-lg font-medium ml-2">({items.length})</span>
      </h1>

      {items.length === 0 ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center text-center py-10 px-6 bg-white border border-gray-100 rounded-lg shadow-sm">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-5">
            <Heart size={32} className="text-red-400" />
          </div>
          <h2 className="text-xl font-black text-[#0B192C] mb-2">Your Wishlist is Empty</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-xs">
            Browse our products and save your favourites for later.
          </p>
          <Link
            href="/products"
            className="bg-[#0B192C] hover:bg-[#162a45] text-white font-extrabold text-xs uppercase tracking-widest px-8 py-3.5 transition-colors rounded shadow-sm"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item, index) => {
            const p = item.product;
            if (!p) return null;
            
            const productUrl = buildProductUrl(p.categorySlug, p.brandSlug, p.slug);
            const saveAmount = Math.max(0, (p.mrp ?? p.MRP ?? 0) - (p.finalPrice ?? p.FinalPrice ?? p.finalprice ?? 0));
            
            return (
              <div key={index} className="group relative flex flex-col bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 h-full">
                {/* Image Area */}
                <div className="relative bg-[#f4f4f4] pt-8 pb-8 px-4 flex items-center justify-center h-48 flex-shrink-0">
                  <Link href={productUrl} className="block w-full h-full relative mix-blend-multiply flex items-center justify-center">
                    {(p.imageUrl ?? p.ImageUrl ?? p.imageurl) ? (
                      <img src={`${API}${(p.imageUrl ?? p.ImageUrl ?? p.imageurl)}`} alt={(p.name ?? p.Name ?? "Product")} className="max-h-full max-w-[85%] object-contain group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 text-[9px] font-bold uppercase tracking-widest">No Image</div>
                    )}
                  </Link>
                  {(p.discount ?? p.Discount ?? 0) > 0 && (
                    <div className="absolute top-3 right-3 z-10">
                      <span className="bg-[#1a8b44] text-white text-[9px] font-bold px-2 py-1 rounded shadow-sm uppercase tracking-wider">
                        {(p.discount ?? p.Discount ?? 0)}% OFF
                      </span>
                    </div>
                  )}
                </div>

                {/* Details Area */}
                <div className="p-4 flex flex-col flex-1 bg-white">
                  {(p.brand ?? p.Brand ?? "") && <span className="text-amber-500 text-[9px] font-bold uppercase tracking-widest mb-1 block">{(p.brand ?? p.Brand ?? "")}</span>}
                  
                  <Link href={productUrl} className="block mb-1">
                    <h3 className="font-serif text-sm font-bold text-gray-900 leading-tight line-clamp-2 group-hover:text-amber-600 transition-colors">
                      {(p.name ?? p.Name ?? "Product")}
                    </h3>
                  </Link>
                  
                  <span className="text-[10px] text-gray-500 mb-2 block truncate">Model: {p.slug.split('-')[0].toUpperCase()}</span>
                  
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
                      <span className="text-lg font-black text-gray-900 tracking-tight">{formatCurrency((p.finalPrice ?? p.FinalPrice ?? p.finalprice ?? 0))}</span>
                      {(p.discount ?? p.Discount ?? 0) > 0 && <span className="text-[11px] text-gray-400 line-through font-medium tracking-tight">MRP {formatCurrency((p.mrp ?? p.MRP ?? 0))}</span>}
                    </div>
                    <div className="min-h-[16px] mb-4">
                      {saveAmount > 0 && (
                        <span className="text-[10px] text-green-600 font-bold block">You Save: {formatCurrency(saveAmount)}</span>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => handleAddToCart(p.id, (p.name ?? p.Name ?? "Product"))}
                        disabled={addingCartId === p.id || p.stock === 0}
                        className="w-full bg-[#0B192C] hover:bg-[#162a45] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-[10px] font-bold uppercase tracking-widest py-3 flex items-center justify-center gap-2 transition-colors rounded shadow-sm"
                      >
                        <ShoppingCart size={14} className="shrink-0" />
                        {p.stock === 0 ? 'Out of Stock' : (addingCartId === p.id ? 'Adding...' : 'Add to Cart')}
                      </button>
                      
                      <button
                        onClick={() => removeWishlist(p.id)}
                        className="w-full flex items-center justify-center gap-2 py-3 text-[10px] font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded transition-colors uppercase tracking-widest"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}