'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Trash2, Minus, Plus, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { buildProductUrl } from '@/lib/buildProductUrl';
import { useCartStore } from '@/store/cartStore';
import { formatCurrency } from '@/lib/formatCurrency';
import { PromoCodeInput } from '@/components/ui/PromoCodeInput';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  const { items, totalMRP, finalTotal, discount, updateItemQuantity, removeItem, clearCart, promoCode, promoDiscount, syncPrices } = useCartStore();

  useEffect(() => {
    setMounted(true);
    syncPrices();
  }, []);

  if (!mounted) return <div className="min-h-screen"></div>;

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl min-h-screen">
      <h1 className="text-3xl font-extrabold text-[#0B192C] mb-8 flex items-center">
        <ShoppingBag className="mr-3" size={32} />
        Your Shopping Cart
      </h1>

      {items.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-gray-200 text-center shadow-sm">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
            <ShoppingBag size={40} />
          </div>
          <h2 className="text-2xl font-extrabold text-[#0B192C] mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto">Looks like you haven't added anything to your cart yet.</p>
          <Link href="/products">
            <Button variant="primary" size="lg" className="px-8 font-extrabold tracking-widest uppercase">Start Shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">{items.length} {items.length === 1 ? 'Item' : 'Items'}</span>
              <button onClick={clearCart} className="text-xs font-bold text-red-500 hover:text-red-600 uppercase tracking-widest">
                Clear Cart
              </button>
            </div>
            
            {items.map((item) => (
              <div key={item.productId} className="flex gap-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative group">
                <button 
                  onClick={() => removeItem(item.productId)}
                  className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors bg-white p-1 rounded-full shadow-sm opacity-0 group-hover:opacity-100"
                  aria-label="Remove item"
                >
                  <Trash2 size={18} />
                </button>
                
                <div className="w-28 h-28 bg-gray-50 rounded-lg flex-shrink-0 flex items-center justify-center border border-gray-100 p-2">
                  {item.imageUrl ? (
                    <img src={`${API}${item.imageUrl}`} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                  ) : (
                    <span className="text-xs text-gray-400 font-bold uppercase">No Image</span>
                  )}
                </div>
                
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <Link href={buildProductUrl(item.categorySlug, item.brandSlug, item.slug || item.productId)}>
                      <h3 className="font-extrabold text-[#0B192C] text-lg pr-8 hover:text-amber-500 transition-colors leading-tight">
                        {item.name}
                      </h3>
                    </Link>
                    <div className="flex items-center space-x-3 mt-2">
                      <span className="font-extrabold text-xl text-[#0B192C]">{formatCurrency(item.price)}</span>
                      {item.originalPrice > item.price && (
                        <span className="text-gray-400 line-through text-sm font-semibold">{formatCurrency(item.originalPrice)}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 mt-4">
                    <div className="flex items-center border border-gray-300 rounded overflow-hidden">
                      <button 
                        onClick={() => updateItemQuantity(item.productId, item.quantity - 1)}
                        className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 hover:text-[#0B192C] transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="px-4 py-1.5 font-bold text-sm bg-gray-50 border-x border-gray-300">{item.quantity}</span>
                      <button 
                        onClick={() => updateItemQuantity(item.productId, item.quantity + 1)}
                        className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 hover:text-[#0B192C] transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="text-xs text-green-600 font-bold uppercase tracking-wider">In Stock</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="w-full lg:w-96">
            <div className="bg-white p-6 rounded-xl border border-gray-200 sticky top-8 shadow-sm">
              <h2 className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-4 border-b border-gray-100 pb-4">Order Summary</h2>
              
              <div className="space-y-4 mb-6 text-sm font-semibold">
                <div className="flex justify-between text-gray-600">
                  <span>Total MRP</span>
                  <span>{formatCurrency(totalMRP)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount on MRP</span>
                    <span>- {formatCurrency(discount)}</span>
                  </div>
                )}
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon Discount ({promoCode})</span>
                    <span>- {formatCurrency(promoDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Charges</span>
                  <span className="text-green-600">Free</span>
                </div>
              </div>

              <PromoCodeInput />

              <div className="border-t border-dashed border-gray-200 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-base font-extrabold text-[#0B192C]">Total Amount</span>
                  <span className="text-2xl font-extrabold text-[#0B192C]">{formatCurrency(finalTotal - (promoDiscount || 0))}</span>
                </div>
                {discount > 0 && (
                  <div className="bg-green-50 text-green-700 text-xs font-bold uppercase tracking-widest p-2 rounded mt-3 text-center">
                    You will save {formatCurrency(discount)} on this order
                  </div>
                )}
              </div>

              <Link href="/checkout" className="block w-full">
                <Button variant="primary" size="lg" className="w-full font-extrabold uppercase tracking-widest shadow-lg shadow-[#0B192C]/20">
                  Proceed to Checkout
                </Button>
              </Link>
              
              <div className="mt-4 text-center">
                <Link href="/products" className="text-gray-500 font-bold text-xs hover:text-amber-500 uppercase tracking-widest transition-colors">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
