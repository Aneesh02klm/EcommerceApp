'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';
import { Search, Plus, Edit2, Trash2, Tag } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

export default function CatalogPromotions() {
  const token = useAuthStore(s => s.token);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({
    name: '', targetType: 'Store', targetId: '', discountType: 'Percentage', discountValue: 0,
    startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0], isActive: true
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    if (token) {
      fetchPromotions();
      fetchMetadata();
    }
  }, [token]);

  const fetchPromotions = async () => {
    const res = await fetch(`${API}/api/v1/catalog-promotions`, { headers: { 'Authorization': `Bearer ${token}` } });
    const json = await res.json();
    if (json.success) setPromotions(json.data);
  };

  const fetchMetadata = async () => {
    const resCat = await fetch(`${API}/api/v1/categories`);
    const jsonCat = await resCat.json();
    if (jsonCat.success) setCategories(jsonCat.data);

    const resBrand = await fetch(`${API}/api/v1/brands`);
    const jsonBrand = await resBrand.json();
    if (jsonBrand.success) setBrands(jsonBrand.data);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      targetId: formData.targetType === 'Store' ? null : parseInt(formData.targetId || '0'),
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
    };

    const url = editingId ? `${API}/api/v1/catalog-promotions/${editingId}` : `${API}/api/v1/catalog-promotions`;
    const method = editingId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    
    if (res.ok) {
      toast.success('Promotion saved!');
      setIsModalOpen(false);
      fetchPromotions();
    } else {
      toast.error('Failed to save promotion');
    }
  };

  const toggleStatus = async (id: number) => {
    await fetch(`${API}/api/v1/catalog-promotions/${id}/status`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` } });
    fetchPromotions();
  };

  const deletePromo = async (id: number) => {
    if(!confirm('Are you sure?')) return;
    await fetch(`${API}/api/v1/catalog-promotions/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    fetchPromotions();
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#0B192C]">Marketing &gt; Catalog Promotions</h1>
        <button onClick={() => { setEditingId(null); setFormData({name: '', targetType: 'Store', targetId: '', discountType: 'Percentage', discountValue: 0, startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0], isActive: true}); setIsModalOpen(true); }} className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-[#0B192C] font-bold text-[11px] uppercase tracking-widest px-6 py-3 rounded shadow-sm">
          <Plus size={16} /> Create Promotion
        </button>
      </header>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-extrabold">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Target</th>
              <th className="px-6 py-4">Discount</th>
              <th className="px-6 py-4">Duration</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {promotions.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-semibold text-[#0B192C]">{p.name}</td>
                <td className="px-6 py-4">
                  <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-bold uppercase">{p.targetType}</span>
                </td>
                <td className="px-6 py-4 font-bold text-amber-600">
                  {p.discountType === 'Percentage' ? `${p.discountValue}% OFF` : `₹${p.discountValue} OFF`}
                </td>
                <td className="px-6 py-4 text-xs text-gray-500">
                  {new Date(p.startDate).toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'})} - {new Date(p.endDate).toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'})}
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => toggleStatus(p.id)} className={`px-3 py-1 rounded text-xs font-bold uppercase ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4 flex gap-3 justify-end">
                  <button onClick={() => { setEditingId(p.id); setFormData({...p, startDate: new Date(p.startDate).toISOString().split('T')[0], endDate: new Date(p.endDate).toISOString().split('T')[0]}); setIsModalOpen(true); }} className="text-gray-400 hover:text-amber-500"><Edit2 size={16} /></button>
                  <button onClick={() => deletePromo(p.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl w-[500px] overflow-hidden">
            <div className="bg-[#0B192C] p-4 flex justify-between items-center text-white">
              <h2 className="font-bold text-lg">{editingId ? 'Edit Promotion' : 'New Promotion'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Promotion Name</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border border-gray-300 rounded focus:ring-1 outline-none text-sm" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Target Type</label>
                  <select value={formData.targetType} onChange={e => setFormData({...formData, targetType: e.target.value})} className="w-full p-2 border border-gray-300 rounded focus:ring-1 outline-none text-sm">
                    <option value="Store">Entire Store</option>
                    <option value="Category">Specific Category</option>
                    <option value="Brand">Specific Brand</option>
                  </select>
                </div>
                {formData.targetType !== 'Store' && (
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Select {formData.targetType}</label>
                    <select required value={formData.targetId} onChange={e => setFormData({...formData, targetId: e.target.value})} className="w-full p-2 border border-gray-300 rounded focus:ring-1 outline-none text-sm">
                      <option value="">-- Select --</option>
                      {formData.targetType === 'Category' && categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      {formData.targetType === 'Brand' && brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Discount Value</label>
                  <input type="number" step="0.01" required min={0} value={formData.discountValue} onChange={e => setFormData({...formData, discountValue: parseFloat(e.target.value) || 0})} className="w-full p-2 border border-gray-300 rounded focus:ring-1 outline-none text-sm" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Discount Type</label>
                  <select value={formData.discountType} onChange={e => setFormData({...formData, discountType: e.target.value})} className="w-full p-2 border border-gray-300 rounded focus:ring-1 outline-none text-sm">
                    <option value="Percentage">Percentage (%)</option>
                    <option value="Flat">Flat Amount (₹)</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Start Date</label>
                  <input type="date" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full p-2 border border-gray-300 rounded focus:ring-1 outline-none text-sm" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">End Date</label>
                  <input type="date" required value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full p-2 border border-gray-300 rounded focus:ring-1 outline-none text-sm" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-500 uppercase tracking-widest">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-[#0B192C] text-sm font-bold uppercase tracking-widest rounded">Save Promotion</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
