'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { KeyRound, ArrowRight } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone: email })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        toast.success(data.message || 'OTP sent successfully');
        setStep(2);
      } else {
        toast.error(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      toast.error('Network error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !newPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone: email, otp, newPassword })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        toast.success(data.message || 'Password updated successfully!');
        router.push('/login');
      } else {
        toast.error(data.message || 'Failed to reset password');
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
            <KeyRound size={32} />
          </div>
          <h1 className="text-2xl font-extrabold text-[#0B192C]">Reset Password</h1>
          <p className="text-sm text-gray-500 mt-1 text-center">
            {step === 1 ? 'Enter your email address to receive an OTP' : 'Enter the OTP and your new password'}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-5">
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
            
            <Button 
              type="submit" 
              variant="primary" 
              size="lg" 
              fullWidth 
              disabled={loading}
              className="font-extrabold uppercase tracking-widest shadow-lg shadow-[#0B192C]/20 mt-2 flex items-center justify-center gap-2"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
              {!loading && <ArrowRight size={18} />}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">OTP</label>
              <input 
                type="text" 
                required 
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded focus:ring-1 focus:ring-[#0B192C] focus:border-[#0B192C] outline-none text-sm font-medium transition-all text-center tracking-widest"
                placeholder="123456"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">New Password</label>
              <input 
                type="password" 
                required 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded focus:ring-1 focus:ring-[#0B192C] focus:border-[#0B192C] outline-none text-sm font-medium transition-all"
                placeholder="Enter new password"
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
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </Button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-600 font-medium">
            Remembered your password?{' '}
            <Link href="/login" className="text-[#0B192C] font-extrabold hover:text-amber-500 transition-colors">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
