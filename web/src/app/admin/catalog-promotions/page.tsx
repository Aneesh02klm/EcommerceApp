'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';
import { Search, Plus, Edit2, Trash2, Eye, Tag } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

export default function CatalogPromotions() {
  const token = useAuthStore(s => s.token);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({
    name: '', targetType: 'Store', targetCategoryId: '', targetBrandId: '', discountType: 'Percentage', discountValue: 0,
    startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0], isActive: true
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{count: number, products: any[]}>({ count: 0, products: [] });
  const [previewLoading, setPreviewLoading] = useState(false);

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
      targetCategoryId: formData.targetType === 'Category' ? (parseInt(formData.targetCategoryId) || null) : null,
      targetBrandId: (formData.targetType === 'Brand' || formData.targetType === 'Category') ? (parseInt(formData.targetBrandId) || null) : null,
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

  const openPreview = async (id: number) => {
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewData({ count: 0, products: [] });
    
    try {
      const res = await fetch(`${API}/api/v1/catalog-promotions/${id}/products`, { headers: { 'Authorization': `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setPreviewData(json.data);
    } catch(e) {}
    
    setPreviewLoading(false);
  };

  const getTargetLabel = (p: any) => {
    if (p.targetType === 'Store') return 'Store-wide';
    if (p.targetType === 'Brand') return `Brand: ${brands.find(b => b.id === p.targetBrandId)?.name || p.targetBrandId}`;
    if (p.targetType === 'Category') {
      let str = `Cat: ${categories.find(c => c.id === p.targetCategoryId)?.name || p.targetCategoryId}`;
      if (p.targetBrandId) str += ` (+ Brand: ${brands.find(b => b.id === p.targetBrandId)?.name || p.targetBrandId})`;
      return str;
    }
    return p.targetType;
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#0B192C]">Marketing &gt; Catalog Promotions</h1>
        <button onClick={() => { setEditingId(null); setFormData({name: '', targetType: 'Store', targetCategoryId: '', targetBrandId: '', discountType: 'Percentage', discountValue: 0, startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0], isActive: true}); setIsModalOpen(true); }} className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-[#0B192C] font-bold text-[11px] uppercase tracking-widest px-6 py-3 rounded shadow-sm">
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
                  <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-[11px] font-bold uppercase">{getTargetLabel(p)}</span>
                </td>
                <td className="px-6 py-4 font-bold text-amber-600">
                  {p.discountType === 'Percentage' ? `${p.discountValue}% OFF` : `₹${p.discountValue} OFF`}
                </td>
                <td className="px-6 py-4 text-xs text-gray-500">
                  {new Date(p.startDate).toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'})} - {new Date(p.endDate).toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'})}
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => toggleStatus(p.id)} className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4 flex gap-3 justify-end items-center">
                  <button onClick={() => openPreview(p.id)} title="Preview Affected Products" className="text-gray-400 hover:text-blue-500"><Eye size={16} /></button>
                  <button onClick={() => { setEditingId(p.id); setFormData({...p, targetCategoryId: p.targetCategoryId || '', targetBrandId: p.targetBrandId || '', startDate: new Date(p.startDate).toISOString().split('T')[0], endDate: new Date(p.endDate).toISOString().split('T')[0]}); setIsModalOpen(true); }} className="text-gray-400 hover:text-amber-500"><Edit2 size={16} /></button>
                  <button onClick={() => deletePromo(p.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl w-[600px] overflow-hidden">
            <div className="bg-[#0B192C] p-4 flex justify-between items-center text-white">
              <h2 className="font-bold text-lg">{editingId ? 'Edit Promotion' : 'New Promotion'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white text-xl">&times;</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-gray-700 uppercase tracking-widest mb-1.5">Promotion Name</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 outline-none text-sm font-semibold" />
              </div>
              
              <div className="flex gap-4 p-4 bg-gray-50 rounded border border-gray-200">
                <div className="flex-1">
                  <label className="block text-[11px] font-extrabold text-gray-700 uppercase tracking-widest mb-1.5">Target Type</label>
                  <select value={formData.targetType} onChange={e => setFormData({...formData, targetType: e.target.value, targetCategoryId: '', targetBrandId: ''})} className="w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 outline-none text-sm font-semibold">
                    <option value="Store">Entire Store</option>
                    <option value="Category">Specific Category</option>
                    <option value="Brand">Specific Brand</option>
                  </select>
                </div>
                
                {formData.targetType === 'Category' && (
                  <>
                    <div className="flex-1">
                      <label className="block text-[11px] font-extrabold text-gray-700 uppercase tracking-widest mb-1.5">Category</label>
                      <select required value={String(formData.targetCategoryId || '')} onChange={e => setFormData({...formData, targetCategoryId: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 outline-none text-sm font-semibold">
                        <option value="">-- Select --</option>
                        {categories.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-[11px] font-extrabold text-gray-700 uppercase tracking-widest mb-1.5">Brand (Optional)</label>
                      <select value={String(formData.targetBrandId || '')} onChange={e => setFormData({...formData, targetBrandId: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 outline-none text-sm font-semibold">
                        <option value="">-- Any Brand --</option>
                        {brands.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
                      </select>
                    </div>
                  </>
                )}
                
                {formData.targetType === 'Brand' && (
                  <div className="flex-1">
                    <label className="block text-[11px] font-extrabold text-gray-700 uppercase tracking-widest mb-1.5">Brand</label>
                    <select required value={String(formData.targetBrandId || '')} onChange={e => setFormData({...formData, targetBrandId: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 outline-none text-sm font-semibold">
                      <option value="">-- Select --</option>
                      {brands.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[11px] font-extrabold text-gray-700 uppercase tracking-widest mb-1.5">Discount Value</label>
                  <input type="number" step="0.01" required min={0} value={formData.discountValue} onChange={e => setFormData({...formData, discountValue: parseFloat(e.target.value) || 0})} className="w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 outline-none text-sm font-semibold" />
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] font-extrabold text-gray-700 uppercase tracking-widest mb-1.5">Discount Type</label>
                  <select value={formData.discountType} onChange={e => setFormData({...formData, discountType: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 outline-none text-sm font-semibold">
                    <option value="Percentage">Percentage (%)</option>
                    <option value="Flat">Flat Amount (\u20B9)</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[11px] font-extrabold text-gray-700 uppercase tracking-widest mb-1.5">Start Date</label>
                  <input type="date" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 outline-none text-sm font-semibold" />
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] font-extrabold text-gray-700 uppercase tracking-widest mb-1.5">End Date</label>
                  <input type="date" required value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 outline-none text-sm font-semibold" />
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-gray-50 p-4 border border-gray-200 rounded">
                <label className="text-[11px] font-extrabold text-gray-700 uppercase tracking-widest flex-1">Promotion Status</label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input type="checkbox" className="sr-only" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${formData.isActive ? 'bg-amber-500' : 'bg-gray-300'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.isActive ? 'transform translate-x-4' : ''}`}></div>
                    </div>
                  </label>
                  <span className="text-xs font-bold w-16" style={{ color: formData.isActive ? '#f59e0b' : '#9ca3af' }}>{formData.isActive ? 'ACTIVE' : 'DISABLED'}</span>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-500 uppercase tracking-widest">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-[#0B192C] text-sm font-extrabold uppercase tracking-widest rounded shadow-sm">Save Promotion</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl w-[700px] max-h-[80vh] flex flex-col">
            <div className="bg-[#0B192C] p-4 flex justify-between items-center text-white shrink-0">
              <h2 className="font-bold text-lg flex items-center gap-2"><Eye size={18}/> Preview Affected Products</h2>
              <button onClick={() => setPreviewOpen(false)} className="text-gray-400 hover:text-white text-xl">&times;</button>
            </div>
            
            <div className="p-4 bg-amber-50 border-b border-amber-100 flex justify-between items-center shrink-0">
              <span className="text-sm font-bold text-amber-900 uppercase tracking-widest">Total Matched Inventory:</span>
              <span className="text-xl font-black text-amber-700">{previewLoading ? '...' : previewData.count} Items</span>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
              {previewLoading ? (
                <div className="text-center py-10 text-gray-400 text-sm font-bold tracking-widest uppercase">Fetching inventory data...</div>
              ) : previewData.products.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm font-bold tracking-widest uppercase">No products match this targeting criteria.</div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 font-extrabold">
                    <tr>
                      <th className="px-4 py-3">Product Name</th>
                      <th className="px-4 py-3">SKU</th>
                      <th className="px-4 py-3 text-right">Base MRP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {previewData.products.map((p: any) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold text-[#0B192C] truncate max-w-[250px]" title={p.name}>{p.name}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{p.sku}</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(p.mrp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}