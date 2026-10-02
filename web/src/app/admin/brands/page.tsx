'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';
import { Loader2, Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

interface Brand {
  id: number;
  name: string;
  slug: string;
  logoUrl?: string;
}

export default function AdminBrandsPage() {
  const { token } = useAuthStore();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  
  const [formData, setFormData] = useState({ name: '', slug: '', logoUrl: '' });

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const res = await fetch(`${API}/api/v1/brands`);
      const json = await res.json();
      if (json.success) setBrands(json.data);
    } catch (err) {
      toast.error('Failed to load brands');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (b?: Brand) => {
    if (b) {
      setEditingBrand(b);
      setFormData({ name: b.name, slug: b.slug, logoUrl: b.logoUrl || '' });
    } else {
      setEditingBrand(null);
      setFormData({ name: '', slug: '', logoUrl: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    try {
      const url = editingBrand ? `${API}/api/v1/brands/${editingBrand.id}` : `${API}/api/v1/brands`;
      const method = editingBrand ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const json = await res.json();
      if (json.success) {
        toast.success(`Brand ${editingBrand ? 'updated' : 'created'} successfully!`);
        setIsModalOpen(false);
        fetchBrands();
      } else {
        toast.error(json.message || 'Action failed');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this brand? This may break products tied to it.')) return;
    try {
      const res = await fetch(`${API}/api/v1/brands/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Brand deleted');
        fetchBrands();
      }
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0B192C]">Brands Directory</h1>
          <p className="text-sm font-medium text-gray-500">Manage globally available brands.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-[#0B192C] hover:bg-[#162a45] text-white font-bold text-[11px] uppercase tracking-widest px-6 py-3 rounded shadow-sm">
          <Plus size={16} /> ADD BRAND
        </button>
      </header>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-amber-500" size={32} /></div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Logo</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Slug</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {brands.map(b => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-400">#{b.id}</td>
                  <td className="px-6 py-4">
                    {b.logoUrl ? <img src={b.logoUrl} alt={b.name} className="h-8 object-contain" /> : <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-xs font-bold text-gray-400">{b.name[0]}</div>}
                  </td>
                  <td className="px-6 py-4 font-extrabold text-[#0B192C]">{b.name}</td>
                  <td className="px-6 py-4 text-gray-500 font-medium">{b.slug}</td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button onClick={() => handleOpenModal(b)} className="text-amber-500 hover:text-amber-600"><Edit2 size={16}/></button>
                    <button onClick={() => handleDelete(b.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="text-lg font-extrabold text-[#0B192C]">{editingBrand ? 'Edit Brand' : 'New Brand'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400">âœ•</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Brand Name</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} className="w-full border border-gray-200 rounded p-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Slug</label>
                <input required value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="w-full border border-gray-200 rounded p-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Logo URL</label>
                <input value={formData.logoUrl} onChange={e => setFormData({...formData, logoUrl: e.target.value})} className="w-full border border-gray-200 rounded p-2 text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button variant="primary" type="submit">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
