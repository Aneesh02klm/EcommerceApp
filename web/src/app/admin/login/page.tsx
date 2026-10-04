'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Loader2, Lock } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { setAuth, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && (user?.roles?.some((r: any) => typeof r === 'string' ? r === 'Admin' : (r?.name === 'Admin' || r?.Name === 'Admin')))) {
      router.replace('/admin/dashboard');
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';
      const res = await fetch(`${API}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const json = await res.json();
      
      if (res.ok && json.success) {
        // Need to check if they have admin role
        const payloadBase64 = json.token.split('.')[1];
        const payload = JSON.parse(atob(payloadBase64));
        const roles = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || [];
        
        const hasAdmin = Array.isArray(roles) ? roles.includes('Admin') : roles === 'Admin';
        
        if (hasAdmin) {
          setAuth(json.user, json.token);
          router.replace('/admin/dashboard');
        } else {
          setError('Access denied. You do not have administrator privileges.');
        }
      } else {
        setError(json.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated && (user?.roles?.some((r: any) => typeof r === 'string' ? r === 'Admin' : (r?.name === 'Admin' || r?.Name === 'Admin')))) {
    return <div className="min-h-screen bg-[#f4f7f6] flex items-center justify-center"><Loader2 className="animate-spin text-amber-500" size={32} /></div>;
  }

  return (
    <div className="min-h-screen bg-[#f4f7f6] flex items-center justify-center p-4">
      <div className="w-full md:max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-100 p-8">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-[#0B192C] rounded-full flex items-center justify-center shadow-md">
            <Lock size={28} className="text-amber-400" />
          </div>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-[#0B192C] tracking-tight">Malieakal Control Panel</h1>
          <p className="text-gray-500 text-sm font-medium mt-1">Please log in to access the administrator dashboard.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded px-4 py-3 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm font-medium text-[#0B192C]"
              placeholder="admin@ecommerce.com"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded px-4 py-3 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm font-medium text-[#0B192C]"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0B192C] hover:bg-[#162a45] text-white font-extrabold text-sm uppercase tracking-widest py-4 rounded shadow-md transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Secure Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
