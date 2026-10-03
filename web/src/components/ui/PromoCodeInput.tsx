'use client';
import React, { useState, useEffect } from 'react';
import { useCartStore } from '@/store/cartStore';
import { Button } from './Button';
import { toast } from './Toast';
import { Loader2, Tag, CheckCircle2, XCircle } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

export function PromoCodeInput() {
  const { promoCode, promoDiscount, setPromo, addPromo, removePromo, finalTotal, appliedCoupons = [] } = useCartStore();
  const [inputCode, setInputCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [fetchingCoupons, setFetchingCoupons] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setFetchingCoupons(true);
      const res = await fetch(`${API}/api/v1/coupons`);
      if (res.ok) {
        const json = await res.json();
        setAvailableCoupons(json.data || []);
      }
    } catch {
      // ignore silently
    } finally {
      setFetchingCoupons(false);
    }
  };

  const applyPromo = async (code: string) => {
    if (!code.trim()) return;
    try {
      setIsLoading(true);
      const res = await fetch(`${API}/api/v1/coupons/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, existingCodes: appliedCoupons.map(c => c.code) })
      });
      const json = await res.json();
      
      if (!res.ok || !json.success) {
        toast.error(json.message || 'Invalid coupon code');
        return;
      }
      
      const coupon = json.data;
      if (finalTotal < coupon.minOrderAmount) {
        toast.error(`Minimum order amount for this coupon is ₹${coupon.minOrderAmount}`);
        return;
      }

      if (appliedCoupons.some(c => c.code === coupon.code)) {
           toast.error('Coupon is already applied.');
           return;
      }

      let discount = 0;
      if (coupon.discountType === 'Percentage') {
        discount = finalTotal * (coupon.discountValue / 100);
        if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
          discount = coupon.maxDiscountAmount;
        }
      } else {
        discount = coupon.discountValue;
      }

      if (discount > finalTotal) discount = finalTotal;

      addPromo({ code: coupon.code, discountAmount: discount, cannotBeCombined: coupon.cannotBeCombined || false });
      setInputCode('');
      toast.success(`Coupon ${coupon.code} applied successfully!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to apply coupon');
    } finally {
      setIsLoading(false);
    }
  };

  const appliedCoupon = promoCode ? availableCoupons.find(c => c.code === promoCode) : null;

  return (
    <div className="space-y-4 mb-6">
      {appliedCoupons.length > 0 && (
        <div className="space-y-2 mb-4">
          {appliedCoupons.map(c => {
             const appliedCoupon = availableCoupons.find(ac => ac.code === c.code);
             return (
               <div key={c.code} className="bg-green-50 border border-green-200 p-3 rounded-lg flex justify-between items-center">
                 <div className="flex items-center text-green-700">
                   <CheckCircle2 size={16} className="mr-2 flex-shrink-0" />
                   <span className="text-xs font-bold uppercase tracking-wider">
                     {c.code} Applied
                     {appliedCoupon && (
                       <span className="lowercase block mt-0.5 text-[10px] text-green-600 font-semibold tracking-normal">
                         {appliedCoupon.discountType === 'Percentage' ? `${appliedCoupon.discountValue}% OFF` : `Flat ₹${appliedCoupon.discountValue} OFF`}
                         {appliedCoupon.maxDiscountAmount ? ` (Up to ₹${appliedCoupon.maxDiscountAmount})` : ''}
                       </span>
                     )}
                   </span>
                 </div>
                 <button onClick={() => removePromo(c.code)} className="text-gray-400 hover:text-red-500 transition-colors ml-2">
                   <XCircle size={16} />
                 </button>
               </div>
             );
          })}
        </div>
      )}
      
      {(!appliedCoupons.length || !appliedCoupons.some(c => c.cannotBeCombined)) && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="Enter Promo Code"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-[#0B192C] focus:border-[#0B192C] outline-none text-sm font-semibold uppercase placeholder:normal-case placeholder:font-normal"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => applyPromo(inputCode)}
              disabled={!inputCode.trim() || isLoading}
              className="px-4 text-xs font-extrabold uppercase tracking-widest border-2"
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
            </Button>
          </div>

          {availableCoupons.length > 0 && (
            <div className="mt-2 space-y-2">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Available Coupons</p>
              {availableCoupons.map((c) => (
                <div key={c.code} className="bg-gray-50 border border-dashed border-gray-200 p-2 rounded flex justify-between items-center hover:border-amber-400 hover:bg-amber-50/50 transition-colors cursor-pointer" onClick={() => applyPromo(c.code)}>
                  <div className="flex flex-col">
                    <span className="text-xs font-extrabold text-[#0B192C]">{c.code}</span>
                    <span className="text-[10px] text-gray-500">
                      {c.discountType === 'Percentage' ? `${c.discountValue}% OFF` : `Flat ₹${c.discountValue} OFF`}
                      {c.maxDiscountAmount ? ` (Up to ₹${c.maxDiscountAmount})` : ''}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-600 uppercase">Apply</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
