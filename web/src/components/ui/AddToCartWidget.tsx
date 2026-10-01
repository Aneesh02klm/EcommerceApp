'use client';

import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { toast } from './Toast';

export function AddToCartWidget({ 
  product, 
  compact = false, 
  showBorder = true 
}: { 
  product: any; 
  compact?: boolean; 
  showBorder?: boolean; 
}) {
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const addItem = useCartStore(s => s.addItem);
  
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
      setQty(1); // FIX: reset qty to 1 so subsequent adds start fresh
    }
  };

  return (
    <div className={`w-full flex flex-col gap-3 ${showBorder ? 'pt-4 border-t border-gray-100' : ''}`}>
      {inStock ? (
        <div className={`flex items-center gap-2 sm:gap-3 w-full ${compact ? 'flex-row' : 'flex-col sm:flex-row'}`}>
          {!compact && (
            <div className="flex items-center border border-gray-200 rounded shrink-0 h-10 bg-white">
              <button 
                type="button"
                onClick={() => setQty(q => Math.max(1, q - 1))}
                className="px-3 py-2 text-gray-500 hover:text-[#0B192C] hover:bg-gray-50 transition-colors h-full flex items-center justify-center text-sm font-bold"
                aria-label="Decrease quantity"
              >
                -
              </button>
              <span className="w-8 text-center text-xs font-bold text-[#0B192C] select-none">{qty}</span>
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
          
          <button 
            type="button"
            onClick={handleAdd}
            disabled={adding}
            className={`w-full min-w-0 bg-[#0B192C] hover:bg-[#162a45] disabled:bg-gray-300 text-white font-extrabold uppercase tracking-widest text-xs rounded shadow-md shadow-[#0B192C]/15 transition-all flex items-center justify-center gap-2 whitespace-nowrap ${compact ? 'py-2.5 px-3' : 'py-3.5 px-4 flex-1'}`}
          >
            <ShoppingCart size={15} className="shrink-0" />
            <span className="truncate">{adding ? 'Adding...' : 'Add to Cart'}</span>
          </button>
        </div>
      ) : (
        <button 
          disabled
          className="w-full bg-gray-200 text-gray-500 font-extrabold uppercase tracking-widest text-xs py-3 rounded cursor-not-allowed"
        >
          Out of Stock
        </button>
      )}
    </div>
  );
}
