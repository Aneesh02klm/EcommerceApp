'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Search, Plus, Loader2, Edit2, PackageOpen } from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import { formatCurrency } from '@/lib/formatCurrency';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

interface Product {
  id: string;
  name: string;
  sku: string;
  finalPrice: number;
  stock: number;
  isActive: boolean;
  categoryName?: string;
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');

  const fetchProducts = async (search = '') => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/products?keyword=${encodeURIComponent(search)}`);
      const json = await res.json();
      if (json.success) setProducts(json.data);
    } catch (err) {
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(keyword);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0B192C]">Products</h1>
          <p className="text-sm text-gray-500 font-semibold mt-1">Manage catalog inventory and pricing.</p>
        </div>
        <Button onClick={() => router.push('/admin/products/new')} variant="primary" className="font-extrabold uppercase tracking-widest shadow-lg shadow-[#0B192C]/20 flex items-center">
          <Plus size={18} className="mr-2" /> Add Product
        </Button>
      </div>

      <Card className="shadow-sm border-gray-200">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <form onSubmit={handleSearch} className="flex items-center space-x-4 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Search products by name, SKU..." 
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 outline-none text-sm font-semibold text-[#0B192C]"
              />
            </div>
            <Button type="submit" variant="outline" className="font-extrabold uppercase tracking-widest text-xs h-[42px]">
              Search
            </Button>
          </form>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="animate-spin text-amber-500" size={32} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4">Product Name</th>
                    <th className="px-6 py-4">SKU</th>
                    <th className="px-6 py-4">Final Price</th>
                    <th className="px-6 py-4">Stock</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <PackageOpen size={48} className="mx-auto text-gray-200 mb-3" />
                        <p className="text-gray-400 font-semibold">No products found.</p>
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-extrabold text-[#0B192C] max-w-[300px] truncate">{p.name}</td>
                        <td className="px-6 py-4 font-semibold text-gray-500 text-xs">{p.sku || '-'}</td>
                        <td className="px-6 py-4 font-bold text-amber-600">{formatCurrency(p.finalPrice)}</td>
                        <td className="px-6 py-4">
                          <span className={`font-bold ${p.stock > 10 ? 'text-green-600' : p.stock > 0 ? 'text-amber-500' : 'text-red-500'}`}>
                            {p.stock}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest rounded ${
                            p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {p.isActive ? 'Active' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-3">
                          <button 
                            className="text-amber-500 hover:text-amber-600 transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
