'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';
import { UserPlus } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/account');
    }
  }, [isAuthenticated, router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, phone, password })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        toast.success('Account created successfully! Please sign in.');
        router.push('/login');
      } else {
        toast.error(data.message || 'Registration failed');
      }
    } catch (err) {
      toast.error('Network error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center py-12 px-4">
      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm w-full max-w-lg">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mb-4">
            <UserPlus size={32} />
          </div>
          <h1 className="text-2xl font-extrabold text-[#0B192C]">Create Account</h1>
          <p className="text-sm text-gray-500 mt-1">Join Malieakal Electronics today</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">First Name</label>
              <input 
                type="text" 
                required 
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded focus:ring-1 focus:ring-[#0B192C] focus:border-[#0B192C] outline-none text-sm font-medium transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Last Name</label>
              <input 
                type="text" 
                required 
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded focus:ring-1 focus:ring-[#0B192C] focus:border-[#0B192C] outline-none text-sm font-medium transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Email Address</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded focus:ring-1 focus:ring-[#0B192C] focus:border-[#0B192C] outline-none text-sm font-medium transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Phone Number (Optional)</label>
            <input 
              type="tel" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded focus:ring-1 focus:ring-[#0B192C] focus:border-[#0B192C] outline-none text-sm font-medium transition-all"
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Password</label>
            <input 
              type="password" 
              required 
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded focus:ring-1 focus:ring-[#0B192C] focus:border-[#0B192C] outline-none text-sm font-medium transition-all"
            />
            <p className="text-[10px] text-gray-400 mt-1">Must be at least 6 characters long.</p>
          </div>
          
          <Button 
            type="submit" 
            variant="primary" 
            size="lg" 
            fullWidth 
            disabled={loading}
            className="font-extrabold uppercase tracking-widest shadow-lg shadow-[#0B192C]/20 mt-2"
          >
            {loading ? 'Creating...' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-600 font-medium">
            Already have an account?{' '}
            <Link href="/login" className="text-[#0B192C] font-extrabold hover:text-amber-500 transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
