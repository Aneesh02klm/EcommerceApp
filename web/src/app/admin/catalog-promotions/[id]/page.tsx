 "use client";
import React, { useState, useEffect } from 'react';
import { Tag, ArrowLeft, Eye, EyeOff, Check } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';
import SpecificProductsSelector from '@/components/admin/SpecificProductsSelector';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';
const formatCurrency = (val: number) => '₹' + val.toLocaleString('en-IN');

export default function CatalogPromotionFormPage({ params }: { params?: any }) {
  const router = useRouter();
  const unwrappedParams = params instanceof Promise ? React.use(params) : params;
  const { id } = unwrappedParams || {};
  const isEdit = id && id !== 'new';
  const promoId = isEdit ? id : null;

  const { token } = useAuthStore();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  const [formData, setFormData] = useState<any>({
    id: 0,
    name: '',


    discountValue: 0,
    discountType: 'Percentage',

    targetType: 'Store',
    targetCategoryId: null,
    targetBrandId: null,
    specificProducts: [],
    startDate: '',
    endDate: '',
    isActive: true
  });

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>({ count: 0, products: [] });

  useEffect(() => {
    fetchCategories();
    fetchBrands();
    if (isEdit) {
      fetchPromo(promoId as string);
    }
  }, [promoId]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API}/api/v1/categories`);
      if (res.ok) { const json = await res.json(); setCategories(json.data || json || []); }
    } catch (err) {}
  };

  const fetchBrands = async () => {
    try {
      const res = await fetch(`${API}/api/v1/brands`);
      if (res.ok) { const json = await res.json(); setBrands(json.data || json || []); }
    } catch (err) {}
  };

  const fetchPromo = async (fetchId: string) => {
    try {
      const res = await fetch(`${API}/api/v1/catalog-promotions/${fetchId}`);
      if (res.ok) {
        const data = await res.json();
        const promo = data.data;
        if (promo) {
          setFormData({
            id: promo.id,
            name: promo.name,
            description: promo.description || '',
            discountType: promo.discountType || 'Percentage',
            discountValue: promo.discountValue || 0,
            targetType: promo.targetType || 'Store',
            targetCategoryId: promo.targetCategoryId,
            targetBrandId: promo.targetBrandId,
            specificProducts: promo.specificProducts || [],
            startDate: promo.startDate ? promo.startDate.substring(0, 10) : '',
            endDate: promo.endDate ? promo.endDate.substring(0, 10) : '',
            isActive: promo.isActive
          });
        }
      }
    } catch (err) {
      toast.error('Failed to load promotion');
    } finally {
      setLoading(false);
    }
  };

  const loadPreview = async (e: React.MouseEvent) => {
    e.preventDefault();
    setPreviewOpen(true);
    setPreviewLoading(true);
    try {
      const qs = new URLSearchParams();
      if (formData.targetType === 'Category' && formData.targetCategoryId) qs.append('categoryId', formData.targetCategoryId);
      if (formData.targetType === 'Brand' && formData.targetBrandId) qs.append('brandId', formData.targetBrandId);
      qs.append('limit', '50');
      
      const res = await fetch(`${API}/api/v1/products?${qs.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setPreviewData({
          count: json.totalCount,
          products: json.data || []
        });
      }
    } catch (err) {
      toast.error('Failed to load preview');
    } finally {
      setPreviewLoading(false);
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
//
      if (payload.targetType !== 'Category') payload.targetCategoryId = null;
      // Brand is now selected alongside Category, we clear it if not Category
        if (payload.targetType !== 'Category') payload.targetBrandId = null;
      if (payload.targetType === 'SpecificProducts') {
        // payload.specificProducts is already an array, do nothing
      } else {
        payload.specificProducts = [];
      }
      
      const url = formData.id ? `${API}/api/v1/catalog-promotions/${formData.id}` : `${API}/api/v1/catalog-promotions`;
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
        toast.success(formData.id ? 'Promotion updated!' : 'Promotion created!');
        router.push('/admin/catalog-promotions');
      } else {
        toast.error('Failed to save promotion');
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
        <button onClick={() => router.push('/admin/catalog-promotions')} className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-[#0B192C]">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-black text-[#0B192C] flex items-center gap-3">
            <Tag className="text-amber-500" size={32} />
            {isEdit ? 'Edit Catalog Promotion' : 'Create New Catalog Promotion'}
          </h1>
          <p className="text-gray-500 mt-1">Configure automated discounts for specific segments of your inventory.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-8 space-y-8">
          {/* Details */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4">Promotion Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Internal Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="e.g. Summer Appliances Deal" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none h-20" placeholder="Internal notes about this promotion..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Start Date</label>
                <input required type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">End Date</label>
                <input required type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
              </div>
            </div>
          </div>

          {/* Targeting */}
          <div>
            <div className="flex justify-between items-center border-b pb-2 mb-4">
              <h3 className="text-lg font-bold text-gray-900">Targeting Rules</h3>
              {formData.targetType !== 'SpecificProducts' && formData.targetType !== 'Store' && (
                <button onClick={loadPreview} className="text-xs flex items-center gap-1 font-bold text-amber-600 hover:text-amber-500 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 transition-colors">
                  <Eye size={14}/> Preview Targets
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Target Type</label>
                <select 
                  value={formData.targetType} 
                  onChange={e => setFormData({...formData, targetType: e.target.value})} 
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
                      required value={String(formData.targetCategoryId || '')} 
                      onChange={e => setFormData({...formData, targetCategoryId: e.target.value})} 
                      className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                    >
                      <option value="">-- Select --</option>
                      {categories.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Brand (Optional)</label>
                    <select 
                      value={String(formData.targetBrandId || '')} 
                      onChange={e => setFormData({...formData, targetBrandId: e.target.value})} 
                      className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                    >
                      <option value="">-- All Brands --</option>
                      {brands.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
                    </select>
                  </div>
                </>
              )}

              

              {formData.targetType !== 'SpecificProducts' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Global Discount Type</label>
                    <select 
                      value={formData.discountType} 
                      onChange={e => setFormData({...formData, discountType: e.target.value})} 
                      className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                    >
                      <option value="Percentage">Percentage (%)</option>
                      <option value="Flat">Flat Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Discount Value</label>
                    <input 
                      required type="number" step="0.01" min={0} 
                      value={formData.discountValue} 
                      onChange={e => setFormData({...formData, discountValue: parseFloat(e.target.value) || 0})} 
                      className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none" 
                    />
                  </div>
                </>
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

          {/* Granular Matrix */}
          {formData.targetType === 'SpecificProducts' && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4">Product Selection & Granular Discounts</h3>
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                <SpecificProductsSelector value={formData.specificProducts || []} onChange={val => setFormData({...formData, specificProducts: val})} templateFilename="catalog_promotion_template.csv" />
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-50 px-8 py-5 border-t border-gray-200 flex justify-end gap-3">
          <button type="button" onClick={() => router.push('/admin/catalog-promotions')} className="px-6 py-2.5 rounded-lg font-bold text-gray-600 hover:bg-gray-200 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving || hasPromoErrors} className="bg-amber-500 hover:bg-amber-400 text-[#0B192C] font-black px-8 py-2.5 rounded-lg transition-colors flex items-center gap-2">
            <Check size={18} /> {saving ? 'Saving...' : (formData.id ? 'Save Changes' : 'Create Promotion')}
          </button>
        </div>
      </form>

      {previewOpen && (
        <div className="fixed inset-0 bg-[#0B192C]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#0B192C] p-5 flex justify-between items-center text-white shrink-0 rounded-t-xl">
              <h2 className="font-bold text-lg flex items-center gap-2"><Eye size={20}/> Preview Affected Products</h2>
              <button type="button" onClick={() => setPreviewOpen(false)} className="text-gray-400 hover:text-white transition-colors"><EyeOff size={20}/></button>
            </div>
            
            <div className="p-4 bg-amber-50 border-b border-amber-100 flex justify-between items-center shrink-0">
              <span className="text-sm font-bold text-amber-900 uppercase tracking-widest">Total Matched Inventory:</span>
              <span className="text-xl font-black text-amber-700">{previewLoading ? '...' : previewData.count} Items</span>
            </div>
            
            <div className="p-0 overflow-y-auto flex-1 custom-scrollbar">
              {previewLoading ? (
                <div className="text-center py-12 text-gray-400 text-sm font-bold tracking-widest uppercase">Fetching inventory data...</div>
              ) : previewData.products.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm font-bold tracking-widest uppercase">No products match this targeting criteria.</div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 font-extrabold sticky top-0">
                    <tr>
                      <th className="px-6 py-4">Product Name</th>
                      <th className="px-6 py-4">SKU</th>
                      <th className="px-6 py-4 text-right">Base MRP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {previewData.products.map((p: any) => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-[#0B192C] truncate max-w-[250px]" title={p.name}>{p.name}</td>
                        <td className="px-6 py-4 text-xs text-gray-500 font-mono">{p.sku}</td>
                        <td className="px-6 py-4 text-right font-bold text-gray-900">{formatCurrency(p.mrp)}</td>
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

