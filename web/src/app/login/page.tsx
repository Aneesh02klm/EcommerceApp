'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';
import { UserCircle } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      if (useAuthStore.getState().user?.roles?.some((r: any) => typeof r === 'string' ? r === 'Admin' : (r?.name === 'Admin' || r?.Name === 'Admin'))) {
        router.push('/admin/dashboard');
      } else {
        router.push('/account');
      }
    }
  }, [isAuthenticated, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setAuth(data.user, data.token);
        toast.success('Successfully logged in!');
        if (data.user?.roles?.some((r: any) => typeof r === 'string' ? r === 'Admin' : (r?.name === 'Admin' || r?.Name === 'Admin'))) {
          router.push('/admin/dashboard');
        } else {
          router.push('/account');
        }
      } else {
        toast.error(data.message || 'Invalid credentials');
      }
    } catch (err) {
      toast.error('Network error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center py-12 px-4">
      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mb-4">
            <UserCircle size={32} />
          </div>
          <h1 className="text-2xl font-extrabold text-[#0B192C]">Welcome Back</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your Malieakal account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Email Address</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded focus:ring-1 focus:ring-[#0B192C] focus:border-[#0B192C] outline-none text-sm font-medium transition-all"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Password</label>
              <Link href="/forgot-password" className="text-xs font-bold text-amber-600 hover:underline tracking-wide">Forgot Password?</Link>
            </div>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded focus:ring-1 focus:ring-[#0B192C] focus:border-[#0B192C] outline-none text-sm font-medium transition-all"
              placeholder="Enter your password"
            />
          </div>
          
          <Button 
            type="submit" 
            variant="primary" 
            size="lg" 
            fullWidth 
            disabled={loading}
            className="font-extrabold uppercase tracking-widest shadow-lg shadow-[#0B192C]/20 mt-2"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-600 font-medium">
            New to Malieakal Electronics?{' '}
            <Link href="/register" className="text-[#0B192C] font-extrabold hover:text-amber-500 transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
