'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import { useAuthStore } from '@/store/authStore';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const router = useRouter();
  
  const { token, setAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Try to fetch order details to pre-fill name and email for guest registration
    if (orderId && !token && mounted) {
      // Guests don't have a token, but we can potentially fetch minimal order details if we expose a secure public endpoint.
      // For now, we'll just require them to enter their details or we can use local storage if we saved it.
      const savedCheckoutData = localStorage.getItem('guest_checkout_data');
      if (savedCheckoutData) {
        try {
          setOrderDetails(JSON.parse(savedCheckoutData));
        } catch (e) {}
      }
    }
  }, [orderId, token, mounted]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) {
      toast.error('Order ID missing.');
      return;
    }
    if (!orderDetails?.email) {
      toast.error('Email not found. Please log in normally.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API}/api/v1/auth/register-guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          firstName: orderDetails.firstName || 'Guest',
          lastName: orderDetails.lastName || 'User',
          email: orderDetails.email,
          password,
          phone: orderDetails.phone || ''
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create account');
      
      setAuth(data.user, data.token);
      setAccountCreated(true);
      toast.success('Account created successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Error creating account');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
        <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} />
        </div>
        
        <h1 className="text-3xl font-extrabold text-[#0B192C] mb-2 tracking-tight">Order Confirmed!</h1>
        <p className="text-gray-500 mb-6">Thank you for your purchase.</p>
        
        {orderId && (
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-8 inline-block">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Order ID</p>
            <p className="font-mono font-bold text-[#0B192C]">{orderId}</p>
          </div>
        )}

        {/* Post-purchase account creation for guests */}
        {!token && !accountCreated && orderDetails?.email && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8 text-left">
            <h3 className="font-extrabold text-[#0B192C] mb-2">Track your order easily</h3>
            <p className="text-xs text-gray-600 mb-4">Set a password to save your details for next time and track this order.</p>
            
            <form onSubmit={handleCreateAccount} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Email</label>
                <input 
                  type="email" 
                  value={orderDetails.email} 
                  disabled 
                  className="w-full border-gray-200 rounded-lg p-3 text-sm bg-gray-100/50 text-gray-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Set Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter a secure password"
                  required
                  minLength={6}
                  className="w-full border-gray-200 rounded-lg p-3 text-sm focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                />
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting || password.length < 6}
                className="w-full bg-[#0B192C] hover:bg-[#162a45] text-white font-extrabold py-3 rounded-xl transition-all disabled:opacity-50 mt-2 flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : 'Save Password'}
              </button>
            </form>
          </div>
        )}

        {accountCreated && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-8">
            <p className="text-sm text-green-700 font-bold">Your account is ready! You can now track your order in your account dashboard.</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {(token || accountCreated) && (
            <Link 
              href="/account/orders" 
              className="w-full border-2 border-[#0B192C] text-[#0B192C] font-extrabold py-3 rounded-xl transition-all hover:bg-gray-50 flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
            >
              View Orders <ArrowRight size={16} />
            </Link>
          )}
          <Link 
            href="/" 
            className="text-sm font-bold text-gray-500 hover:text-[#0B192C] transition-colors underline underline-offset-4"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}


export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-amber-500" size={32} /></div>}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
