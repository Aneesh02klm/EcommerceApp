'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/Toast';
import { Plus, Edit2, Trash2, Eye, Tag } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';
import { useConfirm } from '@/components/ui/ConfirmProvider';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

export default function CatalogPromotions() {
  const router = useRouter();
  const { confirm } = useConfirm();
  const token = useAuthStore(s => s.token);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  
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

  const deletePromo = (id: number) => {
    confirm({
      title: 'Confirm Deletion',
      message: 'Are you sure?',
      confirmText: 'Delete',
      onConfirm: async () => {
        await fetch(`${API}/api/v1/catalog-promotions/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        fetchPromotions();
      }
    });
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
        <button onClick={() => router.push('/admin/catalog-promotions/new')} className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-[#0B192C] font-bold text-[11px] uppercase tracking-widest px-6 py-3 rounded shadow-sm">
          <Plus size={16} /> Create Promotion
        </button>
      </header>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-extrabold">
            <tr>
              <th className="px-6 py-4">Promotion Name</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Targeting</th>
              <th className="px-6 py-4">Discount</th>
              <th className="px-6 py-4">Duration</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {promotions.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-bold text-[#0B192C] flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-400"><Tag size={16}/></div>
                  {p.name}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest rounded-full ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.isActive ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-[11px] font-bold uppercase">{getTargetLabel(p)}</span>
                </td>
                <td className="px-6 py-4 font-bold text-amber-600">
                  {p.discountType === 'Percentage' ? `${p.discountValue}% OFF` : `₹${p.discountValue} OFF`}
                </td>
                <td className="px-6 py-4 text-xs text-gray-500">
                  {new Date(p.startDate).toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'})} - {new Date(p.endDate).toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'})}
                </td>
                <td className="px-6 py-4 flex gap-3 justify-end items-center">
                  <button onClick={() => openPreview(p.id)} title="Preview Affected Products" className="text-gray-400 hover:text-blue-500"><Eye size={16} /></button>
                  <button onClick={() => router.push(`/admin/catalog-promotions/${p.id}`)} className="text-gray-400 hover:text-amber-500"><Edit2 size={16} /></button>
                  <button onClick={() => deletePromo(p.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
