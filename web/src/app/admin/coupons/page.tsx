"use client";

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';
import { Search, Loader2, Plus, Mail, Infinity as InfinityIcon, Edit2, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

export default function AdminCouponsPage() {
  const { token } = useAuthStore();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    code: '', discountType: 'Percentage', discountValue: 0,
    minOrderAmount: 0, maxDiscountAmount: '', expiryDate: '',
    isActive: true, assignedToEmail: '', usageLimit: '', usageLimitPerUser: ''
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
    } catch (e) {
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      const res = await fetch(`${API}/api/v1/coupons/admin/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        toast.success('Coupon status updated');
        fetchCoupons();
      }
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  const handleEdit = (c: any) => {
    setEditingCoupon(c);
    setFormData({
      code: c.code || '',
      discountType: c.discountType || 'Percentage',
      discountValue: c.discountValue || 0,
      minOrderAmount: c.minOrderAmount || 0,
      maxDiscountAmount: c.maxDiscountAmount || '',
      expiryDate: c.expiryDate ? new Date(c.expiryDate).toISOString().slice(0, 16) : '',
      isActive: c.isActive !== undefined ? c.isActive : true,
      assignedToEmail: c.assignedToEmail || '',
      usageLimit: c.usageLimit || '',
      usageLimitPerUser: c.usageLimitPerUser || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      const res = await fetch(`${API}/api/v1/coupons/admin/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Coupon deleted');
        fetchCoupons();
      }
    } catch (e) {
      toast.error('Error deleting coupon');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const payload = {
        ...formData,
        minOrderAmount: parseFloat(formData.minOrderAmount.toString()) || 0,
        maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount.toString()) : null,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit.toString()) : null,
        usageLimitPerUser: formData.usageLimitPerUser ? parseInt(formData.usageLimitPerUser.toString()) : null,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : null,
        assignedToEmail: formData.assignedToEmail || null
      };

      const url = editingCoupon 
        ? `${API}/api/v1/coupons/admin/${editingCoupon.id}`
        : `${API}/api/v1/coupons/admin`;
        
      const res = await fetch(url, {
        method: editingCoupon ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingCoupon ? 'Coupon Updated!' : 'Coupon Generated!');
        setIsModalOpen(false);
        fetchCoupons();
      } else {
        toast.error(data.message || 'Validation error');
      }
    } catch (error) {
      toast.error('Failed to save coupon');
    }
  };

  const filtered = coupons.filter(c => 
    c.code.toLowerCase().includes(search.toLowerCase()) || 
    (c.assignedToEmail && c.assignedToEmail.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black text-[#0B192C]">Coupons & Discounts</h1>
          <p className="text-sm font-medium text-gray-500">Create targetted marketing codes & walk-in customer discounts.</p>
        </div>
        <button onClick={() => { setFormData({ code: '', discountType: 'Percentage', discountValue: 0, minOrderAmount: 0, maxDiscountAmount: '', expiryDate: '', isActive: true, assignedToEmail: '', usageLimit: '1', usageLimitPerUser: '' }); setIsModalOpen(true); setEditingCoupon(null); }} className="flex items-center gap-2 bg-[#0B192C] hover:bg-[#162a45] text-white font-bold text-[11px] uppercase tracking-widest px-6 py-3 rounded shadow-sm">
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50/80 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Discount</th>
                  <th className="px-6 py-4">Restriction (Customer)</th>
                  <th className="px-6 py-4">Usage Limit</th>
                  <th className="px-6 py-4">Expiry</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
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
                      {c.timesUsed} / {c.usageLimit || <InfinityIcon size={14} className="inline-block text-gray-400" />}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-500">
                      {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                      const isExpired = c.expiryDate && new Date(c.expiryDate) < new Date();
                      const isExhausted = c.usageLimit !== null && c.usageLimit !== undefined && c.timesUsed >= c.usageLimit;
                      
                      if (isExpired) {
                        return <span className="text-gray-500 text-[10px] uppercase font-bold bg-gray-100 px-2 py-1 rounded">Expired</span>;
                      }
                      if (isExhausted) {
                        return <span className="text-gray-500 text-[10px] uppercase font-bold bg-gray-100 px-2 py-1 rounded">Limit Reached</span>;
                      }

                      return (
                        <button 
                          onClick={() => handleToggleStatus(c.id, c.isActive)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${c.isActive ? 'bg-amber-500' : 'bg-gray-200'}`}
                        >
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${c.isActive ? 'translate-x-4' : 'translate-x-1'}`} />
                        </button>
                      );
                    })()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleEdit(c)} className="text-blue-500 hover:text-blue-700 p-2"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No coupons found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-black text-[#0B192C]">{editingCoupon ? "Edit Coupon" : "Generate Coupon"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Coupon Code</label>
                  <input required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '')})} className="w-full border border-gray-200 rounded p-2 text-sm uppercase font-bold tracking-widest text-[#0B192C]" placeholder="e.g. WELCOME50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Type</label>
                  <select value={formData.discountType} onChange={e => setFormData({...formData, discountType: e.target.value})} className="w-full border border-gray-200 rounded p-2 text-sm font-bold text-[#0B192C]">
                    <option value="Percentage">Percentage (%)</option>
                    <option value="Flat">Flat Amount (₹)</option>
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
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Per User Limit</label>
                  <input type="number" value={formData.usageLimitPerUser} onChange={e => setFormData({...formData, usageLimitPerUser: e.target.value})} className="w-full border border-gray-200 rounded p-2 text-sm" placeholder="e.g. 1 (Once per user)" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Expiry Date</label>
                <input type="datetime-local" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className="w-full border border-gray-200 rounded p-2 text-sm text-gray-600" />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button variant="primary" type="submit">{editingCoupon ? "Save Changes" : "Generate & Assign"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
