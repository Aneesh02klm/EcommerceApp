'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';
import { Loader2, GripVertical, Save, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import dynamic from 'next/dynamic';


const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

interface SectionConfig {
  id: string;
  type: string;
  isActive: boolean;
  order: number;
  title: string;
  subtitle: string;
  description?: string;
  htmlContent?: string;
  categoryIds?: number[];
  brandIds?: number[];
  productIds?: string[];
  bestSellerLogic?: string;
  minSalesThreshold?: number;
  minDiscountThreshold?: number;
  newArrivalsDate?: string;
  queryType?: string;
  maxItems?: number;
  imageUrl?: string;
  productTags?: string[];
}

interface SortableItemProps {
  section: SectionConfig;
  updateSection: (id: string, updates: Partial<SectionConfig>) => void;
  categories: any[];
  brands: any[];
  products: any[];
}

function SortableSection({ section, updateSection, categories, brands, products }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-4 flex gap-4 relative">
      <div {...attributes} {...listeners} className="cursor-grab pt-2 text-gray-400 hover:text-gray-600">
        <GripVertical />
      </div>
      <div className="flex-1 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-[#0B192C] capitalize">{section.id.replace('_', ' ')} <span className="text-xs text-gray-400 font-normal ml-2">({section.type})</span></h3>
          <label className="flex items-center cursor-pointer">
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={section.isActive} onChange={e => updateSection(section.id, { isActive: e.target.checked })} />
              <div className={`block w-10 h-6 rounded-full transition-colors ${section.isActive ? 'bg-amber-500' : 'bg-gray-300'}`}></div>
              <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${section.isActive ? 'transform translate-x-4' : ''}`}></div>
            </div>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Main Title</label>
            <input type="text" value={section.title} onChange={e => updateSection(section.id, { title: e.target.value })} className="w-full border border-gray-200 rounded p-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Subtitle</label>
            <input type="text" value={section.subtitle} onChange={e => updateSection(section.id, { subtitle: e.target.value })} className="w-full border border-gray-200 rounded p-2 text-sm" />
          </div>
        </div>

                {(section.type === 'HeroSlider' || section.type === 'DiscoverMore') && (
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Background Image</label>
            <div className="flex items-center gap-4">
                {section.imageUrl && (
                    <img src={section.imageUrl.startsWith('http') ? section.imageUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030'}${section.imageUrl}`} className="h-20 w-32 object-cover border rounded" />
                )}
                <input type="file" accept="image/*" onChange={async e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const formData = new FormData();
                    formData.append('file', file);
                    try {
                        const token = localStorage.getItem('token');
                        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030'}/api/v1/upload`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${token}` },
                            body: formData
                        });
                        const json = await res.json();
                        if (json.success) {
                            updateSection(section.id, { imageUrl: json.data.url });
                        }
                    } catch (err) {
                        console.error('Upload failed', err);
                    }
                }} className="text-sm" />
            </div>
          </div>
        )}

        {section.type === 'ContentBlock' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Featured Visual (Right Side Image)</label>
              <div className="flex items-center gap-4 bg-gray-50 p-4 border border-gray-200 rounded">
                  {section.imageUrl ? (
                      <div className="relative group">
                        <img src={section.imageUrl.startsWith('http') ? section.imageUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030'}${section.imageUrl}`} className="h-32 w-32 object-cover border rounded bg-white shadow-sm" />
                        <button onClick={() => updateSection(section.id, { imageUrl: '' })} className="absolute top-1 right-1 bg-red-500 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                      </div>
                  ) : (
                      <div className="h-32 w-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded bg-white text-gray-400 text-xs text-center p-2">
                        <span>No Image</span>
                      </div>
                  )}
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-gray-500 mb-2">Upload a high-quality visual to feature alongside your content.</span>
                    <input type="file" accept="image/*" onChange={async e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const formData = new FormData();
                        formData.append('file', file);
                        try {
                            const token = localStorage.getItem('token');
                            const uploadUrl = new URL(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030'}/api/v1/upload`);
                            if (section.imageUrl) uploadUrl.searchParams.append('oldUrl', section.imageUrl);
                            
                            const res = await fetch(uploadUrl.toString(), {
                                method: 'POST',
                                headers: { 'Authorization': `Bearer ${token}` },
                                body: formData
                            });
                            const json = await res.json();
                            if (json.success) {
                                updateSection(section.id, { imageUrl: json.data.url });
                            }
                        } catch (err) {
                            console.error('Upload failed', err);
                        }
                    }} className="text-sm block w-full text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer" />
                  </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">HTML Content</label>
              <RichTextEditor value={section.htmlContent || ''} onChange={(val: string) => updateSection(section.id, { htmlContent: val })} />
            </div>
          </div>
        )}

        {section.type === 'PreBookingForm' && (
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Description</label>
            <textarea value={section.description || ''} onChange={e => updateSection(section.id, { description: e.target.value })} className="w-full border border-gray-200 rounded p-2 text-sm" rows={3}></textarea>
          </div>
        )}

        {section.type === 'FeaturedCategories' && (
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Select Categories</label>
            <div className="flex gap-2 flex-wrap max-h-32 overflow-y-auto p-2 border border-gray-200 rounded">
               {categories.map(c => (
                 <label key={c.id} className="flex items-center gap-2 text-sm whitespace-nowrap bg-gray-50 px-2 py-1 rounded border">
                   <input type="checkbox" checked={(section.categoryIds || []).includes(c.id)} onChange={e => {
                     const ids = section.categoryIds || [];
                     updateSection(section.id, { categoryIds: e.target.checked ? [...ids, c.id] : ids.filter(i => i !== c.id) });
                   }} /> {c.name}
                 </label>
               ))}
            </div>
          </div>
        )}

        {section.type === 'BrandPartners' && (
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Select Brands</label>
            <div className="flex gap-2 flex-wrap max-h-32 overflow-y-auto p-2 border border-gray-200 rounded">
               {brands.map(b => (
                 <label key={b.id} className="flex items-center gap-2 text-sm whitespace-nowrap bg-gray-50 px-2 py-1 rounded border">
                   <input type="checkbox" checked={(section.brandIds || []).includes(b.id)} onChange={e => {
                     const ids = section.brandIds || [];
                     updateSection(section.id, { brandIds: e.target.checked ? [...ids, b.id] : ids.filter(i => i !== b.id) });
                   }} /> {b.name}
                 </label>
               ))}
            </div>
          </div>
        )}

        {section.type === 'ProductGrid' && (() => {
            const t = (section.title || '').toLowerCase();
            const isLightning = t.includes('lightning') || t.includes('deal') || t.includes('offer');
            const isNewArrivals = t.includes('new') || t.includes('arrival');
            const isBestSellers = t.includes('best') || t.includes('seller') || t.includes('top');
            
            return (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                <label className="block text-[11px] font-extrabold text-gray-700 uppercase tracking-widest mb-1.5">Selection Mode ({isLightning ? 'Lightning Deals' : isNewArrivals ? 'New Arrivals' : isBestSellers ? 'Best Sellers' : 'Generic Grid'})</label>
                <select value={section.queryType || 'Manual'} onChange={e => updateSection(section.id, { queryType: e.target.value, bestSellerLogic: '', minDiscountThreshold: 20, newArrivalsDate: '' })} className="w-full border border-gray-300 rounded p-2 text-sm bg-white focus:ring-1 outline-none font-semibold text-[#0B192C]">
                  <option value="Manual">Manual Selection</option>
                  {isLightning && <option value="LightningDeals">Automated by Discount Percentage</option>}
                  {isNewArrivals && <option value="NewArrivals">Automated by Date</option>}
                  {isBestSellers && <option value="BestSellers">Automated by Sales</option>}
                  {(!isLightning && !isNewArrivals && !isBestSellers) && (
                      <>
                          <option value="NewArrivals">Automated: New Arrivals</option>
                          <option value="BestSellers">Automated: Best Sellers</option>
                          <option value="LightningDeals">Automated: Lightning Deals</option>
                      </>
                  )}
                </select>
              </div>
              
              {section.queryType === 'LightningDeals' && isLightning && (
                  <div className="flex gap-4 bg-gray-50 p-3 rounded border border-gray-200 mt-2">
                    <div className="w-1/2">
                      <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Minimum Discount Threshold (%)</label>
                      <input type="number" min="0" max="100" value={section.minDiscountThreshold ?? 20} onChange={e => updateSection(section.id, { minDiscountThreshold: parseInt(e.target.value) || 0 })} className="w-full border border-gray-300 rounded p-2 text-sm bg-white focus:ring-1 outline-none" />
                    </div>
                  </div>
              )}

              {section.queryType === 'NewArrivals' && isNewArrivals && (
                  <div className="flex gap-4 bg-gray-50 p-3 rounded border border-gray-200 mt-2">
                    <div className="w-1/2">
                      <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Products Added After (Date)</label>
                      <input type="date" value={section.newArrivalsDate || ''} onChange={e => updateSection(section.id, { newArrivalsDate: e.target.value })} className="w-full border border-gray-300 rounded p-2 text-sm bg-white focus:ring-1 outline-none" />
                    </div>
                  </div>
              )}

              {section.queryType === 'BestSellers' && isBestSellers && (
                  <div className="flex gap-4 bg-gray-50 p-3 rounded border border-gray-200 mt-2">
                    <div className="flex-1">
                      <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Best Seller Logic</label>
                      <select value={section.bestSellerLogic || 'Hybrid'} onChange={e => updateSection(section.id, { bestSellerLogic: e.target.value })} className="w-full border border-gray-300 rounded p-2 text-sm bg-white focus:ring-1 outline-none">
                        <option value="Manual Only">Manual Only (IsBestSeller Flag)</option>
                        <option value="Automated by Sales">Automated by Sales Volume</option>
                        <option value="Hybrid">Hybrid (Flag + Sales)</option>
                      </select>
                    </div>
                    {section.bestSellerLogic !== 'Manual Only' && (
                      <div className="w-1/3">
                        <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Min Sales Threshold</label>
                        <input type="number" min="0" value={section.minSalesThreshold ?? 50} onChange={e => updateSection(section.id, { minSalesThreshold: parseInt(e.target.value) || 0 })} className="w-full border border-gray-300 rounded p-2 text-sm bg-white focus:ring-1 outline-none" />
                      </div>
                    )}
                  </div>
                )}
                
              {(!section.queryType || section.queryType === 'Manual') ? (
                  <div>
                    <label className="block text-[10px] font-extrabold text-gray-700 uppercase tracking-widest mb-1.5">Select Products</label>
                    <div className="flex gap-2 flex-wrap max-h-48 overflow-y-auto p-2 border border-gray-200 rounded bg-white">
                       {products.map(p => (
                         <label key={p.id} className="flex items-center gap-2 text-xs whitespace-nowrap bg-gray-50 px-2 py-1 rounded border">
                           <input type="checkbox" checked={(section.productIds || []).includes(p.id)} onChange={e => {
                             const ids = section.productIds || [];
                             updateSection(section.id, { productIds: e.target.checked ? [...ids, p.id] : ids.filter(i => i !== p.id) });
                           }} /> {p.name.substring(0, 30)}...
                         </label>
                       ))}
                    </div>
                  </div>
              ) : (
                  <div>
                    <label className="block text-[10px] font-extrabold text-gray-700 uppercase tracking-widest mb-1.5">Max Items to Display</label>
                    <input type="number" min="1" max="24" value={section.maxItems || 4} onChange={e => updateSection(section.id, { maxItems: parseInt(e.target.value) || 4 })} className="w-full border border-gray-300 rounded p-2 text-sm bg-white" />
                  </div>
              )}
            </div>
            );
          })()}
      </div>

    </div>
  );
}

export default function AdminStorefrontPage() {
  const { token } = useAuthStore();
  const [sections, setSections] = useState<SectionConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);

  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [confRes, catRes, brandRes, prodRes] = await Promise.all([
        fetch(`${API}/api/v1/storefront/admin/config`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API}/api/v1/categories`),
        fetch(`${API}/api/v1/brands`),
        fetch(`${API}/api/v1/products`)
      ]);
      
      const confJson = await confRes.json();
      const catJson = await catRes.json();
      const brandJson = await brandRes.json();
      const prodJson = await prodRes.json();
      
      if (confJson.success && confJson.data?.sections) {
        setSections(confJson.data.sections.sort((a: any, b: any) => a.order - b.order));
      }
      if (catJson.success) setCategories(catJson.data);
      if (brandJson.success) setBrands(brandJson.data);
      if (prodJson.success) setProducts(prodJson.data);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        const newArray = arrayMove(items, oldIndex, newIndex);
        return newArray.map((item, index) => ({ ...item, order: index + 1 }));
      });
    }
  };

  const updateSection = (id: string, updates: Partial<SectionConfig>) => {
    setSections(items => items.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const publishConfig = async () => {
    try {
      // Save draft first
      await fetch(`${API}/api/v1/storefront/admin/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ sections })
      });
      // Then publish
      const res = await fetch(`${API}/api/v1/storefront/admin/publish`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Storefront published live successfully!');
      } else {
        toast.error('Failed to publish storefront.');
      }
    } catch (err) {
      toast.error('An error occurred while publishing.');
    }
  };

  const saveConfig = async () => {
    try {
      const res = await fetch(`${API}/api/v1/storefront/admin/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ sections })
      });
      const json = await res.json();
      if (json.success) toast.success('Draft saved successfully!');
      else toast.error('Failed to save config');
    } catch (err) {
      toast.error('Network error');
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0B192C]">Storefront CMS</h1>
          <p className="text-sm font-medium text-gray-500">Drag and drop to reorder homepage sections.</p>
        </div>
        <div className="flex gap-2">
            <Button onClick={() => setPreviewOpen(true)} variant="outline" className="text-gray-700 font-bold border-gray-300 gap-2">
              Preview
            </Button>
            <Button onClick={saveConfig} disabled={loading} variant="outline" className="text-amber-600 border-amber-500 hover:bg-amber-50 font-bold gap-2">
              <Save size={16} /> Save Draft
            </Button>
            <Button onClick={publishConfig} disabled={loading} variant="primary" className="bg-amber-500 hover:bg-amber-600 text-[#0B192C] font-bold gap-2">
              <Save size={16} /> Save & Publish
            </Button>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-amber-500" size={32} /></div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
            {sections.map(section => (
              <SortableSection key={section.id} section={section} updateSection={updateSection} categories={categories} brands={brands} products={products} />
            ))}
          </SortableContext>
        </DndContext>
      )}

      {previewOpen && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col">
          <div className="bg-[#0B192C] text-white p-3 flex justify-between items-center shadow-md z-10">
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-widest text-amber-500 uppercase">Storefront Preview Mode</span>
              <span className="text-xs text-gray-400">Viewing Draft Configuration</span>
            </div>
            <button onClick={() => setPreviewOpen(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded transition-colors text-white flex items-center gap-2 text-sm font-bold">
              <X size={16} /> Close Preview
            </button>
          </div>
          <iframe src="/?mode=draft" className="w-full flex-1 border-none bg-gray-50" />
        </div>
      )}
    </div>
  );
}
