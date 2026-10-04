 "use client";
import React, { useState, useEffect } from 'react';
import { Timer, ArrowLeft, Check } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';
import SpecificProductsSelector from '@/components/admin/SpecificProductsSelector';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

export default function FlashSaleFormPage({ params }: { params?: any }) {
  const router = useRouter();
  const unwrappedParams = params instanceof Promise ? React.use(params) : params;
  const { id } = unwrappedParams || {};
  const isEdit = id && id !== 'new';
  const saleId = isEdit ? id : null;
  
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  const [formData, setFormData] = useState<any>({
    id: 0,
    title: '',
    startTime: '',
    endTime: '',
    isActive: true,
    discountValue: 0,
    targetType: 'Store',
    targetCategoryId: 0,
      targetBrandId: 0,
    specificProducts: []
  });

  useEffect(() => {
    fetchCategories();
      fetchBrands();
    if (isEdit) {
      fetchSale(saleId as string);
    }
  }, [saleId]);

  const fetchBrands = async () => {
    try {
      const res = await fetch(`${API}/api/v1/brands`);
      if (res.ok) {
        const json = await res.json();
        setBrands(json.data || json || []);
      }
    } catch (err) {}
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API}/api/v1/categories`);
      if (res.ok) { const json = await res.json(); setCategories(json.data || json || []); }
    } catch (err) {}
  };

  const fetchSale = async (fetchId: string) => {
    try {
      const res = await fetch(`${API}/api/v1/flash-sales/${fetchId}`);
      if (res.ok) {
        const data = await res.json();
        const sale = data.data;
        if (sale) {
          setFormData({
            id: sale.id,
            title: sale.title,
            startTime: sale.startTime ? sale.startTime.substring(0, 16) : '',
            endTime: sale.endTime ? sale.endTime.substring(0, 16) : '',
            isActive: sale.isActive,
            discountValue: sale.discountValue || 0,
            targetType: sale.targetType || 'Category',
            targetCategoryId: sale.targetCategoryId || 0,
              targetBrandId: sale.targetBrandId || 0,
            specificProducts: sale.specificProducts || []
          });
        }
      }
    } catch (err) {
      toast.error('Failed to load flash sale');
    } finally {
      setLoading(false);
    }
  };

  const hasPromoErrors = formData.targetType === 'SpecificProducts' && formData.specificProducts?.some((p: any) => p.error);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        targetCategoryId: parseInt(formData.targetCategoryId as any) || null,
          targetBrandId: (formData.targetType === 'Category' && parseInt(formData.targetBrandId as any)) ? parseInt(formData.targetBrandId as any) : null,
        discountValue: parseFloat(formData.discountValue as any) || 0,
        specificProducts: formData.targetType === 'SpecificProducts' ? formData.specificProducts : null
      };

      const url = formData.id ? `${API}/api/v1/flash-sales/${formData.id}` : `${API}/api/v1/flash-sales`;
      const method = formData.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(formData.id ? 'Flash Sale updated!' : 'Flash Sale created!');
        router.push('/admin/flash-sales');
      } else {
        toast.error('Failed to save flash sale');
      }
    } catch (err) {
      toast.error('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 font-bold text-gray-500">Loading...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.push('/admin/flash-sales')} className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-[#0B192C]">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-black text-[#0B192C] flex items-center gap-3">
            <Timer className="text-amber-500" size={32} />
            {isEdit ? 'Edit Flash Sale' : 'Create New Flash Sale'}
          </h1>
          <p className="text-gray-500 mt-1">Configure marketing campaigns and promotional discounts.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-8 space-y-8">
          {/* Section 1: Campaign Details */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4">Campaign Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Sale Title</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="e.g. Weekend Mega Sale" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Start Time</label>
                <input required type="datetime-local" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">End Time</label>
                <input required type="datetime-local" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
              </div>
            </div>
          </div>

          {/* Section 2: Target Rules */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4">Targeting & Discount</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Target Type</label>
                <select 
                    value={formData.targetType} 
                    onChange={e => setFormData({...formData, targetType: e.target.value, targetCategoryId: e.target.value === 'Category' ? formData.targetCategoryId : 0, targetBrandId: e.target.value === 'Category' ? formData.targetBrandId : 0})} 
                    className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                >
                    <option value="Store">Entire Store</option>
                    <option value="Category">Specific Category</option>
                    <option value="SpecificProducts">Specific Products (Manual Selection)</option>
                </select>
              </div>

              {formData.targetType === 'Category' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Select Category</label>
                    <select 
                        value={formData.targetCategoryId} 
                        onChange={e => setFormData({...formData, targetCategoryId: Number(e.target.value)})} 
                        className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                    >
                        <option value="0">-- Select Category --</option>
                        {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Brand (Optional)</label>
                    <select 
                        value={formData.targetBrandId || 0} 
                        onChange={e => setFormData({...formData, targetBrandId: Number(e.target.value)})} 
                        className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                    >
                        <option value="0">-- All Brands --</option>
                        {brands.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                  </div>
                </>
              )}

              {formData.targetType !== 'SpecificProducts' && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Global Discount (%)</label>
                  <div className="relative">
                    <input required type="number" min="0" max="100" step="0.01" value={formData.discountValue} onChange={e => setFormData({...formData, discountValue: parseFloat(e.target.value)})} className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none pl-10" />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Campaign Status</label>
                <div className="flex items-center h-[46px]">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    <span className="ml-3 text-sm font-bold text-gray-700">{formData.isActive ? 'Active' : 'Disabled'}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Specific Products (Full Width) */}
          {formData.targetType === 'SpecificProducts' && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4">Product Selection & Granular Discounts</h3>
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                <SpecificProductsSelector value={formData.specificProducts || []} onChange={val => setFormData({...formData, specificProducts: val})} />
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-50 px-8 py-5 border-t border-gray-200 flex justify-end gap-3">
          <button type="button" onClick={() => router.push('/admin/flash-sales')} className="px-6 py-2.5 rounded-lg font-bold text-gray-600 hover:bg-gray-200 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving || hasPromoErrors} className="bg-amber-500 hover:bg-amber-400 text-[#0B192C] font-black px-8 py-2.5 rounded-lg transition-colors flex items-center gap-2">
            <Check size={18} /> {saving ? 'Saving...' : (formData.id ? 'Save Changes' : 'Create Flash Sale')}
          </button>
        </div>
      </form>
    </div>
  );
}

