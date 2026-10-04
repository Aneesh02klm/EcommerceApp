'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Filter, Edit2, Trash2, Loader2, Package, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmProvider';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

// Debounce hook
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function AdminProducts() {
  const { confirm } = useConfirm();
  const router = useRouter();
  const { token } = useAuthStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [keyword, setKeyword] = useState('');
  const debouncedKeyword = useDebounce(keyword, 400);
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [status, setStatus] = useState(''); // 'true' or 'false' or ''
  const [stock, setStock] = useState(''); // 'in-stock' or ''

  // Lookups for filters
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchLookups();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [debouncedKeyword, categoryId, brandId, status, stock]);

  const fetchLookups = async () => {
    try {
      const [cRes, bRes] = await Promise.all([
        fetch(`${API}/api/v1/categories`),
        fetch(`${API}/api/v1/brands`)
      ]);
      const cJson = await cRes.json();
      const bJson = await bRes.json();
      if (cJson.success) setCategories(cJson.data);
      if (bJson.success) setBrands(bJson.data);
    } catch(err) {}
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedKeyword) params.append('Keyword', debouncedKeyword);
      if (categoryId) params.append('CategoryId', categoryId);
      if (brandId) params.append('BrandId', brandId);
      if (status) params.append('IsActive', status);
      if (stock === 'in-stock') params.append('InStockOnly', 'true');

      const res = await fetch(`${API}/api/v1/products?${params.toString()}`);
      const json = await res.json();
      if (json.success) setProducts(json.data);
    } catch(err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    confirm({
      title: 'Confirm Deletion',
      message: 'Are you sure you want to delete this product?',
      confirmText: 'Delete',
      onConfirm: async () => {
    try {
      const res = await fetch(`${API}/api/v1/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Product deleted');
        fetchProducts();
      }
    } catch(err) {}
      }
    });
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif font-black text-[#0B192C] tracking-tight mb-1">Products Directory</h2>
          <p className="text-sm font-medium text-gray-500">Manage Malieakal Plaza physical & virtual premium inventory</p>
        </div>
        <button onClick={() => router.push('/admin/products/new')} className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-[#0B192C] font-bold text-[11px] uppercase tracking-widest px-6 py-3 rounded shadow-sm transition-colors">
          <Plus size={16} /> ADD NEW PRODUCT
        </button>
      </header>

      <section className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-4 flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="Search by SKU, Model, Name..." 
              className="w-full bg-gray-50 border border-gray-200 rounded-md py-2.5 pl-10 pr-4 text-sm font-semibold text-[#0B192C] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all" 
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded transition-colors ${showFilters ? 'bg-gray-200 text-gray-800' : 'text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100'}`}>
            <Filter size={16} /> {showFilters ? 'Hide Filters' : 'Filters'}
          </button>
        </div>

        {showFilters && (
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center gap-4 flex-wrap">
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="border border-gray-200 rounded-md px-3 py-2 text-sm font-semibold bg-white">
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            
            <select value={brandId} onChange={e => setBrandId(e.target.value)} className="border border-gray-200 rounded-md px-3 py-2 text-sm font-semibold bg-white">
              <option value="">All Brands</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>

            <select value={status} onChange={e => setStatus(e.target.value)} className="border border-gray-200 rounded-md px-3 py-2 text-sm font-semibold bg-white">
              <option value="">Any Status</option>
              <option value="true">Published (Active)</option>
              <option value="false">Draft (Inactive)</option>
            </select>

            <select value={stock} onChange={e => setStock(e.target.value)} className="border border-gray-200 rounded-md px-3 py-2 text-sm font-semibold bg-white">
              <option value="">All Inventory</option>
              <option value="in-stock">In Stock Only</option>
            </select>

            {(categoryId || brandId || status || stock) && (
              <button onClick={() => { setCategoryId(''); setBrandId(''); setStatus(''); setStock(''); }} className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-700 p-2">
                <X size={14} /> Clear All
              </button>
            )}
          </div>
        )}
      </section>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
           <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-amber-500" size={32} /></div>
        ) : products.length === 0 ? (
           <div className="p-20 text-center text-gray-400 font-bold flex flex-col items-center">
             <Package size={48} className="mb-4 opacity-30" /> 
             No products match your criteria.
           </div>
        ) : (
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#f8f9fc] border-b border-gray-200 text-[10px] uppercase font-black tracking-widest text-gray-500">
              <tr>
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-3">SKU</th>
                <th className="py-4 px-3">Stock</th>
                <th className="py-4 px-3">Status</th>
                <th className="py-4 pr-6 pl-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[#0B192C] font-semibold divide-y divide-gray-50">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="py-4 px-6">{p.name}</td>
                  <td className="py-4 px-3 text-gray-400 font-medium text-xs">{p.sku}</td>
                  <td className="py-4 px-3 font-black text-[#0B192C]">
                    <span className={p.stock < 5 ? 'text-red-500' : ''}>{p.stock}</span>
                  </td>
                  <td className="py-4 px-3">
                    <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-widest rounded-sm ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.isActive ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="py-4 pr-6 pl-3 text-right">
                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => router.push(`/admin/products/${p.id}/edit`)} className="text-gray-400 hover:text-amber-500"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(p.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
