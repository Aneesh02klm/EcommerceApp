'use client';

import { useState } from 'react';
import { ShoppingCart, Zap } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { toast } from './Toast';
import { useRouter } from 'next/navigation';

export function AddToCartWidget({ 
  product, 
  compact = false, 
  showBorder = true,
  showBuyNow = true 
}: { 
  product: any; 
  compact?: boolean; 
  showBorder?: boolean; 
  showBuyNow?: boolean;
}) {
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);
  const addItem = useCartStore(s => s.addItem);
  const router = useRouter();
  
  const inStock = product.stock > 0;

  const handleAdd = async () => {
    if (adding || !inStock) return;
    setAdding(true);
    try {
      await addItem(product.id, qty);
      toast.success(`${qty}x ${product.name.substring(0, 20)}... added to cart!`);
    } catch {
      toast.error('Failed to add to cart.');
    } finally {
      setAdding(false);
      setQty(1);
    }
  };

  const handleBuyNow = async () => {
    if (buying || !inStock) return;
    setBuying(true);
    try {
      await addItem(product.id, qty);
      router.push('/checkout');
    } catch {
      toast.error('Failed to initiate checkout.');
      setBuying(false);
    }
  };

  return (
    <div className={`w-full flex flex-col gap-3 ${showBorder ? 'pt-4 border-t border-gray-100' : ''}`}>
      {inStock ? (
        <div className={`flex items-center gap-2 sm:gap-3 w-full flex-wrap sm:flex-nowrap ${compact ? 'flex-row' : 'flex-col sm:flex-row'}`}>
          
          {/* Quantity Selector */}
          {!compact && (
            <div className="flex items-center border border-gray-200 rounded shrink-0 h-11 bg-white">
              <button 
                type="button"
                onClick={() => setQty(q => Math.max(1, q - 1))}
                className="px-3 py-2 text-gray-500 hover:text-[#0B192C] hover:bg-gray-50 transition-colors h-full flex items-center justify-center text-sm font-bold"
                aria-label="Decrease quantity"
              >
                -
              </button>
              <span className="w-8 text-center text-sm font-bold text-[#0B192C] select-none">{qty}</span>
              <button 
                type="button"
                onClick={() => setQty(q => Math.min(product.stock || 99, q + 1))}
                className="px-3 py-2 text-gray-500 hover:text-[#0B192C] hover:bg-gray-50 transition-colors h-full flex items-center justify-center text-sm font-bold"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          )}
          
          <div className="flex flex-1 gap-2 sm:gap-3 w-full">
            {/* Add to Cart */}
            <button 
              type="button"
              onClick={handleAdd}
              disabled={adding || buying}
              className={`flex-1 min-w-0 bg-white border-2 border-[#0B192C] text-[#0B192C] hover:bg-gray-50 disabled:opacity-50 font-extrabold uppercase tracking-widest text-xs rounded transition-all flex items-center justify-center gap-2 whitespace-nowrap h-11 px-2`}
            >
              <ShoppingCart size={15} className="shrink-0" />
              <span className="truncate">{adding ? 'Adding...' : 'Add to Cart'}</span>
            </button>

            {/* Buy Now */}
            {showBuyNow && (
              <button 
                type="button"
                onClick={handleBuyNow}
                disabled={adding || buying}
                className={`flex-1 min-w-0 bg-[#0B192C] text-white hover:bg-[#162a45] shadow-md shadow-[#0B192C]/15 disabled:opacity-50 font-extrabold uppercase tracking-widest text-xs rounded transition-all flex items-center justify-center gap-2 whitespace-nowrap h-11 px-2`}
              >
                <Zap size={15} className="shrink-0 text-amber-400" />
                <span className="truncate">{buying ? 'Redirecting...' : 'Buy Now'}</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <button 
          disabled
          className="w-full bg-gray-200 text-gray-500 font-extrabold uppercase tracking-widest text-xs py-3.5 rounded cursor-not-allowed"
        >
          Out of Stock
        </button>
      )}
    </div>
  );
}
