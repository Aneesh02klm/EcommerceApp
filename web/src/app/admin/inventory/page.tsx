'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';
import { Loader2, Search, Edit2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

export default function AdminInventoryPage() {
  const { token } = useAuthStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState(0);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await fetch(`${API}/api/v1/products?limit=1000`);
      const json = await res.json();
      if (json.success) setProducts(json.data);
    } catch (err) {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStock = async (product: any) => {
    if (!token) return;
    try {
      const updatedProduct = { ...product, stock: editStock };
      const res = await fetch(`${API}/api/v1/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedProduct)
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Stock updated for ${product.name}`);
        setEditingId(null);
        fetchInventory();
      } else {
        toast.error('Failed to update stock');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.modelNumber?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col gap-6 max-w-7xl">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0B192C]">Inventory Management</h1>
          <p className="text-sm font-medium text-gray-500">Track and adjust stock levels in real-time.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Search SKUs, models..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-md text-sm w-[320px] focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-amber-500" size={32} /></div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">SKU / Model</th>
                  <th className="px-6 py-4 text-center">Total Stock (Available)</th>
                  <th className="px-6 py-4 text-center">Reserved (In Carts)</th>
                  <th className="px-6 py-4 text-center">Sold (Lifetime)</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(p => {
                  const isLow = p.stock > 0 && p.stock <= 5;
                  const isOut = p.stock === 0;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={p.imageUrl} alt={p.name} className="w-10 h-10 object-contain rounded border border-gray-100" />
                          <div className="font-bold text-[#0B192C] whitespace-normal w-[250px] line-clamp-2 leading-tight">{p.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">{p.modelNumber || 'N/A'}</td>
                      
                      <td className="px-6 py-4 text-center">
                        {editingId === p.id ? (
                          <input 
                            type="number" 
                            min="0"
                            value={editStock}
                            onChange={e => setEditStock(parseInt(e.target.value) || 0)}
                            className="w-20 border border-amber-400 rounded p-1 text-center font-bold text-[#0B192C] outline-none"
                          />
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <span className={`font-black text-base ${isOut ? 'text-red-500' : isLow ? 'text-amber-500' : 'text-green-600'}`}>{p.stock}</span>
                            {isOut && <span className="bg-red-100 text-red-600 text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded">Out of Stock</span>}
                            {isLow && <AlertCircle size={14} className="text-amber-500" />}
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 text-center font-bold text-gray-400">{p.reservedStock || 0}</td>
                      <td className="px-6 py-4 text-center font-bold text-gray-400">{p.soldStock || 0}</td>
                      
                      <td className="px-6 py-4 text-right">
                        {editingId === p.id ? (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingId(null)} className="text-xs font-bold text-gray-500 hover:text-gray-700">Cancel</button>
                            <button onClick={() => handleSaveStock(p)} className="text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">Save</button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditingId(p.id); setEditStock(p.stock); }} className="text-amber-500 hover:text-amber-600 font-bold text-xs uppercase tracking-wider flex items-center justify-end gap-1 w-full"><Edit2 size={14}/> Adjust</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
