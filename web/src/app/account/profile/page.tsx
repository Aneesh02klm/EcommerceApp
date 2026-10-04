'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

export default function EditProfilePage() {
  const router = useRouter();
  const { user, token, setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !user) return;
    
    setLoading(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';
      const res = await fetch(`${API}/api/v1/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        // Optimistically update the auth store user object
        setAuth({ ...user, ...formData }, token);
        router.push('/account'); // Navigate back on success
      } else {
        console.error('Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-md shadow-sm border border-gray-100 p-6 md:p-8 max-w-2xl mx-auto">
      <h1 className="text-xl font-extrabold text-[#0B192C] mb-6">Edit Profile</h1>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">First Name</label>
            <input 
              type="text" 
              required
              value={formData.firstName}
              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-semibold"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Last Name</label>
            <input 
              type="text" 
              required
              value={formData.lastName}
              onChange={(e) => setFormData({...formData, lastName: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-semibold"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase">Phone Number</label>
          <input 
            type="tel" 
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-semibold"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase">Email Address (Non-editable)</label>
          <input 
            type="email" 
            value={user?.email || ''}
            disabled
            className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-md text-gray-500 text-sm font-semibold cursor-not-allowed"
          />
        </div>

        <div className="pt-4 flex flex-col md:flex-row items-center gap-3">
          <button 
            type="submit" 
            disabled={loading}
            className="w-full md:w-auto px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-sm rounded-md transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <button 
            type="button" 
            onClick={() => router.push('/account')}
            className="w-full md:w-auto px-8 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-[#0B192C] font-extrabold text-sm rounded-md transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
