'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Edit2, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

interface Banner {
  id: number;
  imageUrl: string;
  linkUrl: string | null;
  displayStyle: string;
  isActive: boolean;
  categoryId: number | null;
  brandId: number | null;
  sortOrder: number;
}

export default function AdminBannersPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    imageUrl: '',
    linkUrl: '',
    displayStyle: 'Slider',
    isActive: true,
    categoryId: '',
    brandId: '',
    sortOrder: 0
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bRes, cRes, brRes] = await Promise.all([
        fetch(`${API}/api/v1/banners/admin`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API}/api/v1/categories`),
        fetch(`${API}/api/v1/brands`)
      ]);
      const [bJson, cJson, brJson] = await Promise.all([bRes.json(), cRes.json(), brRes.json()]);
      
      if (bJson.success) setBanners(bJson.data);
      if (cJson.success) setCategories(cJson.data);
      if (brJson.success) setBrands(brJson.data);
    } catch (err) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const handleOpenModal = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        imageUrl: banner.imageUrl || '',
        linkUrl: banner.linkUrl || '',
        displayStyle: banner.displayStyle || 'Slider',
        isActive: banner.isActive,
        categoryId: banner.categoryId ? banner.categoryId.toString() : '',
        brandId: banner.brandId ? banner.brandId.toString() : '',
        sortOrder: banner.sortOrder || 0
      });
    } else {
      setEditingBanner(null);
      setFormData({ imageUrl: '', linkUrl: '', displayStyle: 'Slider', isActive: true, categoryId: '', brandId: '', sortOrder: 0 });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const payload = {
        imageUrl: formData.imageUrl,
        linkUrl: formData.linkUrl || null,
        displayStyle: formData.displayStyle,
        isActive: formData.isActive,
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
        brandId: formData.brandId ? parseInt(formData.brandId) : null,
        sortOrder: formData.sortOrder
      };

      const url = editingBanner 
        ? `${API}/api/v1/banners/admin/${editingBanner.id}`
        : `${API}/api/v1/banners/admin`;
        
      const method = editingBanner ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (json.success) {
        toast.success(editingBanner ? 'Banner updated successfully' : 'Banner created successfully');
        setIsModalOpen(false);
        fetchData();
      } else {
        toast.error(json.message || 'Failed to save banner');
      }
    } catch (err) {
      toast.error('An error occurred');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    try {
      const res = await fetch(`${API}/api/v1/banners/admin/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Banner deleted');
        fetchData();
      } else {
        toast.error(json.message || 'Failed to delete banner');
      }
    } catch (err) {
      toast.error('An error occurred');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-amber-500" size={48} /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-[#0B192C] tracking-tight">Banners</h1>
          <p className="text-gray-500 text-sm mt-1">Manage dynamic PLP banners</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-[#0B192C] hover:bg-[#162a45] text-white font-bold gap-2">
          <Plus size={18} /> Add Banner
        </Button>
      </div>

      <Card className="border-0 shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4">Image</th>
                <th className="px-6 py-4">Target</th>
                <th className="px-6 py-4">Style</th>
                <th className="px-6 py-4">Order</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {banners.map((banner) => (
                <tr key={banner.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="w-24 h-10 bg-gray-100 rounded border border-gray-200 overflow-hidden flex items-center justify-center">
                      {banner.imageUrl ? (
                        <img src={banner.imageUrl.startsWith('http') ? banner.imageUrl : `${API}${banner.imageUrl}`} alt="Banner" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={16} className="text-gray-400" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {banner.brandId && <span className="block text-amber-600 font-bold text-xs uppercase">Brand: {brands.find(b => b.id === banner.brandId)?.name || banner.brandId}</span>}
                    {banner.categoryId && <span className="block text-blue-600 font-bold text-xs uppercase">Category: {categories.find(c => c.id === banner.categoryId)?.name || banner.categoryId}</span>}
                    {!banner.brandId && !banner.categoryId && <span className="block text-gray-500 font-bold text-xs uppercase">Global (Default)</span>}
                  </td>
                  <td className="px-6 py-4">{banner.displayStyle}</td>
                  <td className="px-6 py-4">{banner.sortOrder}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      banner.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {banner.isActive ? 'Active' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleOpenModal(banner)} className="text-blue-500 hover:text-blue-700 p-2"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(banner.id)} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {banners.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No banners found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-black text-[#0B192C]">{editingBanner ? 'Edit Banner' : 'Add New Banner'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="bannerForm" onSubmit={handleSubmit} className="space-y-4">
                
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1.5">Image URL</label>
                  <input required type="text" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none" placeholder="/images/banner1.jpg or https://..." />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1.5">Link URL (Optional)</label>
                  <input type="text" value={formData.linkUrl} onChange={e => setFormData({...formData, linkUrl: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none" placeholder="/products/electronics" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1.5">Category Target</label>
                    <select value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:border-amber-400 outline-none">
                      <option value="">None (Global)</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1.5">Brand Target</label>
                    <select value={formData.brandId} onChange={e => setFormData({...formData, brandId: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:border-amber-400 outline-none">
                      <option value="">None (Global)</option>
                      {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1.5">Sort Order</label>
                    <input type="number" required value={formData.sortOrder} onChange={e => setFormData({...formData, sortOrder: parseInt(e.target.value) || 0})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:border-amber-400 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1.5">Display Style</label>
                    <select value={formData.displayStyle} onChange={e => setFormData({...formData, displayStyle: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:border-amber-400 outline-none">
                      <option value="Slider">Slider</option>
                      <option value="Static">Static</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 text-amber-500 rounded border-gray-300 focus:ring-amber-500" />
                  <label htmlFor="isActive" className="text-sm font-bold text-gray-700">Active (Visible on frontend)</label>
                </div>

              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" form="bannerForm" className="bg-[#0B192C] hover:bg-[#162a45] text-white">Save Banner</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
