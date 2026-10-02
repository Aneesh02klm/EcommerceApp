'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';
import { Loader2, Plus, Edit2, Search, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

export default function AdminCouponsPage() {
  const { token } = useAuthStore();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    code: '', discountType: 'Percentage', discountValue: 0,
    minOrderAmount: 0, maxDiscountAmount: '', expiryDate: '',
    isActive: true, assignedToEmail: '', usageLimit: ''
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await fetch(`${API}/api/v1/coupons/admin`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setCoupons(json.data);
    } catch (err) {
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const payload = {
        ...formData,
        maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : null,
        assignedToEmail: formData.assignedToEmail || null
      };

      const res = await fetch(`${API}/api/v1/coupons/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Coupon generated successfully!');
        setIsModalOpen(false);
        fetchCoupons();
      } else {
        toast.error(json.message || 'Failed to generate coupon');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const filtered = coupons.filter(c => c.code.toLowerCase().includes(search.toLowerCase()) || (c.assignedToEmail && c.assignedToEmail.toLowerCase().includes(search.toLowerCase())));

  return (
    <div className="flex flex-col gap-6 max-w-7xl">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0B192C]">Coupons & Discounts</h1>
          <p className="text-sm font-medium text-gray-500">Create targetted marketing codes & walk-in customer discounts.</p>
        </div>
        <button onClick={() => { setFormData({ code: '', discountType: 'Percentage', discountValue: 0, minOrderAmount: 0, maxDiscountAmount: '', expiryDate: '', isActive: true, assignedToEmail: '', usageLimit: '1' }); setIsModalOpen(true); }} className="flex items-center gap-2 bg-[#0B192C] hover:bg-[#162a45] text-white font-bold text-[11px] uppercase tracking-widest px-6 py-3 rounded shadow-sm">
          <Plus size={16} /> GENERATE COUPON
        </button>
      </header>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-amber-500" size={32} /></div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
             <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="text" placeholder="Search codes, emails..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-md text-sm w-[300px] outline-none" />
            </div>
          </div>
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Discount</th>
                <th className="px-6 py-4">Restriction (Customer)</th>
                <th className="px-6 py-4">Usage Limit</th>
                <th className="px-6 py-4">Expiry</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-extrabold text-[#0B192C] tracking-widest">{c.code}</td>
                  <td className="px-6 py-4 font-bold text-green-600">
                    {c.discountType === 'Percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`}
                  </td>
                  <td className="px-6 py-4">
                    {c.assignedToEmail ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded"><Mail size={12}/> {c.assignedToEmail}</span>
                    ) : <span className="text-gray-400 text-xs">Public</span>}
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-gray-500">
                    {c.timesUsed} / {c.usageLimit || 'âˆž'}
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-gray-500">
                    {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4">
                    {c.isActive ? <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded">Active</span> : <span className="text-red-500 text-xs font-bold bg-red-50 px-2 py-1 rounded">Inactive</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="text-lg font-extrabold text-[#0B192C]">Generate Coupon</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">âœ•</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Coupon Code</label>
                  <input required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '')})} className="w-full border border-gray-200 rounded p-2 text-sm uppercase font-bold tracking-widest text-[#0B192C]" placeholder="e.g. WELCOME50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Type</label>
                  <select value={formData.discountType} onChange={e => setFormData({...formData, discountType: e.target.value})} className="w-full border border-gray-200 rounded p-2 text-sm font-bold text-[#0B192C]">
                    <option value="Percentage">Percentage (%)</option>
                    <option value="Flat">Flat Amount (â‚¹)</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Discount Value</label>
                  <input required type="number" step="0.01" value={formData.discountValue} onChange={e => setFormData({...formData, discountValue: parseFloat(e.target.value)})} className="w-full border border-gray-200 rounded p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Max Discount (for %)</label>
                  <input type="number" step="0.01" value={formData.maxDiscountAmount} onChange={e => setFormData({...formData, maxDiscountAmount: e.target.value})} className="w-full border border-gray-200 rounded p-2 text-sm" placeholder="Optional cap limit" />
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg space-y-3">
                <h3 className="text-sm font-extrabold text-blue-900 flex items-center gap-2"><Mail size={16}/> Customer Assignment (Optional)</h3>
                <p className="text-xs text-blue-700">Restrict this coupon to a specific walk-in customer or loyal user.</p>
                <div>
                  <input type="email" value={formData.assignedToEmail} onChange={e => setFormData({...formData, assignedToEmail: e.target.value})} className="w-full border border-blue-200 rounded p-2 text-sm outline-none focus:border-blue-400" placeholder="customer@email.com" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Usage Limit</label>
                  <input type="number" value={formData.usageLimit} onChange={e => setFormData({...formData, usageLimit: e.target.value})} className="w-full border border-gray-200 rounded p-2 text-sm" placeholder="e.g. 1 (Single use)" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Expiry Date</label>
                  <input type="datetime-local" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className="w-full border border-gray-200 rounded p-2 text-sm text-gray-600" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button variant="primary" type="submit">Generate & Assign</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
