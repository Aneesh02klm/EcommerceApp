'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { buildProductUrl } from '@/lib/buildProductUrl';
import { Heart, Loader2, Trash2, ShoppingCart } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function WishlistPage() {
  const { token } = useAuthStore();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, [token]);

  const fetchWishlist = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';
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
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';
      await fetch(`${API}/api/v1/wishlist/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchWishlist();
    } catch (err) {
      console.error(err);
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
        <Link href="/">Home</Link>
        <span>/</span>
        <span className="text-[#0B192C] font-extrabold">My Wishlist</span>
      </div>

      <h1 className="text-2xl font-extrabold text-[#0B192C] mb-6 pb-4 border-b border-gray-100">My Wishlist</h1>

      {items.length === 0 ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center text-center py-10 px-6 bg-gray-50 rounded-lg">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-5">
            <Heart size={32} className="text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-[#0B192C] mb-2">Your Wishlist is Empty</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-xs">
            Browse our products and save your favourites.
          </p>
          <Link
            href="/products"
            className="bg-amber-400 hover:bg-amber-300 text-[#0B192C] font-extrabold text-xs uppercase tracking-widest px-8 py-3.5 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
              <div>
                <Link href={buildProductUrl(item.product?.categorySlug, item.product?.brandSlug, item.product?.slug)}>
                  <h3 className="font-extrabold text-[#0B192C] mb-2 hover:text-amber-500 transition-colors line-clamp-2">{item.product?.name || 'Product'}</h3>
                </Link>
                {item.addedAt && (
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">
                    Added {new Date(item.addedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => removeWishlist(item.productId)}
                  className="flex-1 flex items-center justify-center py-2 text-xs font-bold text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 rounded transition-colors"
                >
                  <Trash2 size={14} className="mr-1.5" /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
