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
      <div ref={setNodeRef} style={style} className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 mb-4 flex gap-5 relative group">
        <div {...attributes} {...listeners} className="cursor-grab pt-2 text-gray-300 hover:text-amber-500 transition-colors">
          <GripVertical />
        </div>
        <div className="flex-1 space-y-6">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <h3 className="font-black text-lg text-[#0B192C] capitalize">{section.id.replace(/_\d+$/, '').replace(/_/g, ' ')} <span className="text-xs text-gray-400 font-bold ml-2 tracking-widest uppercase bg-gray-100 px-2 py-1 rounded">({section.type})</span></h3>
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input type="checkbox" className="sr-only" checked={section.isActive} onChange={e => updateSection(section.id, { isActive: e.target.checked })} />
                <div className={`block w-10 h-6 rounded-full transition-colors ${section.isActive ? 'bg-amber-500' : 'bg-gray-300'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${section.isActive ? 'transform translate-x-4' : ''}`}></div>
              </div>
              <span className="ml-3 text-[10px] font-extrabold tracking-widest uppercase text-gray-500">{section.isActive ? 'Active' : 'Hidden'}</span>
            </label>
          </div>
  
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] font-extrabold text-gray-700 uppercase tracking-widest mb-1.5">Main Title</label>
              <input type="text" value={section.title} onChange={e => updateSection(section.id, { title: e.target.value })} className="w-full border border-gray-300 rounded p-2.5 text-sm font-semibold focus:ring-1 focus:ring-amber-500 outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold text-gray-700 uppercase tracking-widest mb-1.5">Subtitle (Optional)</label>
              <input type="text" value={section.subtitle} onChange={e => updateSection(section.id, { subtitle: e.target.value })} className="w-full border border-gray-300 rounded p-2.5 text-sm font-semibold focus:ring-1 focus:ring-amber-500 outline-none" />
            </div>
          </div>
  
          {(section.type === 'HeroSlider' || section.type === 'DiscoverMore') && (
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
              <label className="block text-[10px] font-extrabold text-gray-700 uppercase tracking-widest mb-1.5">Background Image</label>
              <div className="flex items-center gap-4">
                  {section.imageUrl && (
                      <img src={section.imageUrl.startsWith('http') ? section.imageUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030'}${section.imageUrl}`} className="h-20 w-32 object-cover border border-gray-300 rounded shadow-sm bg-white" />
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
                  }} className="text-sm block w-full text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-bold file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300 cursor-pointer" />
              </div>
            </div>
          )}
  
          {section.type === 'ContentBlock' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              <div className="md:col-span-4 flex flex-col">
                <label className="block text-[10px] font-extrabold text-gray-700 uppercase tracking-widest mb-1.5">Featured Visual (Right Side)</label>
                <div className="flex-1 flex flex-col items-center gap-4 bg-gray-50 p-4 border border-gray-200 rounded-lg">
                    {section.imageUrl ? (
                        <div className="relative group w-full aspect-square max-h-48">
                          <img src={section.imageUrl.startsWith('http') ? section.imageUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030'}${section.imageUrl}`} className="w-full h-full object-cover border border-gray-300 rounded shadow-sm bg-white" />
                          <button onClick={() => updateSection(section.id, { imageUrl: '' })} className="absolute top-2 right-2 bg-red-500 text-white rounded p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow"><Trash2 size={16}/></button>
                        </div>
                    ) : (
                        <div className="w-full aspect-square max-h-48 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded bg-white text-gray-400 text-xs text-center p-4">
                          <span>No Image Provided</span>
                        </div>
                    )}
                    <div className="w-full mt-auto">
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
                      }} className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-bold file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300 cursor-pointer" />
                    </div>
                </div>
              </div>
              <div className="md:col-span-8 flex flex-col">
                <label className="block text-[10px] font-extrabold text-gray-700 uppercase tracking-widest mb-1.5">HTML Content</label>
                <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden min-h-[250px]">
                  <RichTextEditor value={section.htmlContent || ''} onChange={(val: string) => updateSection(section.id, { htmlContent: val })} />
                </div>
              </div>
            </div>
          )}
  
          {section.type === 'PreBookingForm' && (
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
              <label className="block text-[10px] font-extrabold text-gray-700 uppercase tracking-widest mb-1.5">Description</label>
              <textarea value={section.description || ''} onChange={e => updateSection(section.id, { description: e.target.value })} className="w-full border border-gray-300 rounded p-2.5 text-sm font-semibold focus:ring-1 focus:ring-amber-500 outline-none" rows={3}></textarea>
            </div>
          )}
  
          {section.type === 'FeaturedCategories' && (
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
              <label className="block text-[10px] font-extrabold text-gray-700 uppercase tracking-widest mb-1.5">Target Categories</label>
              <div className="flex gap-2 flex-wrap max-h-32 overflow-y-auto p-3 border border-gray-300 rounded bg-white shadow-inner custom-scrollbar">
                 {categories.map(c => (
                   <label key={c.id} className="flex items-center gap-2 text-xs font-semibold whitespace-nowrap bg-gray-50 px-2.5 py-1.5 rounded border border-gray-200 cursor-pointer hover:bg-gray-100">
                     <input type="checkbox" checked={(section.categoryIds || []).includes(c.id)} onChange={e => {
                       const ids = section.categoryIds || [];
                       updateSection(section.id, { categoryIds: e.target.checked ? [...ids, c.id] : ids.filter(i => i !== c.id) });
                     }} className="rounded text-amber-500 focus:ring-amber-500" /> {c.name}
                   </label>
                 ))}
              </div>
            </div>
          )}
  
          {section.type === 'BrandPartners' && (
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
              <label className="block text-[10px] font-extrabold text-gray-700 uppercase tracking-widest mb-1.5">Select Brands</label>
              <div className="flex gap-2 flex-wrap max-h-32 overflow-y-auto p-3 border border-gray-300 rounded bg-white shadow-inner custom-scrollbar">
                 {brands.map(b => (
                   <label key={b.id} className="flex items-center gap-2 text-xs font-semibold whitespace-nowrap bg-gray-50 px-2.5 py-1.5 rounded border border-gray-200 cursor-pointer hover:bg-gray-100">
                     <input type="checkbox" checked={(section.brandIds || []).includes(b.id)} onChange={e => {
                       const ids = section.brandIds || [];
                       updateSection(section.id, { brandIds: e.target.checked ? [...ids, b.id] : ids.filter(i => i !== b.id) });
                     }} className="rounded text-amber-500 focus:ring-amber-500" /> {b.name}
                   </label>
                 ))}
              </div>
            </div>
          )}
  
          {section.type === 'FlashSalesGrid' && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-center justify-center text-blue-500 font-bold">
                This block will automatically display the master Countdown Timer and products targeted by the Active Flash Sale.
              </div>
            )}

          {section.type === 'ProductGrid' && (() => {
              const t = (section.title || '').toLowerCase();
              const isLightning = t.includes('lightning') || t.includes('deal') || t.includes('offer');
              const isNewArrivals = t.includes('new') || t.includes('arrival');
              const isBestSellers = t.includes('best') || t.includes('seller') || t.includes('top');
              
              return (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  <div className="md:col-span-8 bg-amber-50 border border-amber-200 p-4 rounded-lg flex flex-col justify-center">
                    <label className="block text-[10px] font-extrabold text-gray-700 uppercase tracking-widest mb-2">Selection Mode ({isLightning ? 'Lightning Deals' : isNewArrivals ? 'New Arrivals' : isBestSellers ? 'Best Sellers' : 'Generic Grid'})</label>
                    <select value={section.queryType || 'Manual'} onChange={e => updateSection(section.id, { queryType: e.target.value, bestSellerLogic: '', minDiscountThreshold: 20, newArrivalsDate: '' })} className="w-full border border-gray-300 rounded p-2.5 text-sm bg-white focus:ring-1 outline-none font-bold text-[#0B192C]">
                      <option value="Manual">Manual Selection</option>
                      {isLightning && <option value="LightningDeals">Automated by Active Catalog Promotions</option>}
                      {isNewArrivals && <option value="NewArrivals">Automated by Date</option>}
                      {isBestSellers && <option value="BestSellers">Automated by Sales</option>}
                      {(!isLightning && !isNewArrivals && !isBestSellers) && (
                          <>
                              <option value="NewArrivals">Automated: New Arrivals</option>
                              <option value="BestSellers">Automated: Best Sellers</option>
                              <option value="LightningDeals">Automated: Active Promotions</option>
                          </>
                      )}
                    </select>
                  </div>
                  
                  {section.queryType && section.queryType !== 'Manual' && (
                    <div className="md:col-span-4 bg-gray-50 border border-gray-200 p-4 rounded-lg flex flex-col justify-center">
                      <label className="block text-[10px] font-extrabold text-gray-700 uppercase tracking-widest mb-2">Max Items</label>
                      <input type="number" min="1" max="24" value={section.maxItems || 4} onChange={e => updateSection(section.id, { maxItems: parseInt(e.target.value) || 4 })} className="w-full border border-gray-300 rounded p-2.5 text-sm bg-white focus:ring-1 outline-none font-bold" />
                    </div>
                  )}
                </div>
                
                
  
                {section.queryType === 'BestSellers' && isBestSellers && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                      <div className="md:col-span-8 bg-gray-50 border border-gray-200 p-4 rounded-lg">
                        <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-2">Best Seller Logic</label>
                        <select value={section.bestSellerLogic || 'Hybrid'} onChange={e => updateSection(section.id, { bestSellerLogic: e.target.value })} className="w-full border border-gray-300 rounded p-2.5 text-sm bg-white focus:ring-1 outline-none font-bold">
                          <option value="Manual Only">Manual Only (IsBestSeller Flag)</option>
                          <option value="Automated by Sales">Automated by Sales Volume</option>
                          <option value="Hybrid">Hybrid (Flag + Sales)</option>
                        </select>
                      </div>
                      {section.bestSellerLogic !== 'Manual Only' && (
                        <div className="md:col-span-4 bg-gray-50 border border-gray-200 p-4 rounded-lg">
                          <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-2">Min Sales Threshold</label>
                          <input type="number" min="0" value={section.minSalesThreshold ?? 50} onChange={e => updateSection(section.id, { minSalesThreshold: parseInt(e.target.value) || 0 })} className="w-full border border-gray-300 rounded p-2.5 text-sm bg-white focus:ring-1 outline-none font-bold" />
                        </div>
                      )}
                    </div>
                  )}
                  
                {(!section.queryType || section.queryType === 'Manual') && (
                    <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                      <label className="block text-[10px] font-extrabold text-gray-700 uppercase tracking-widest mb-2">Select Specific Products</label>
                      <div className="flex gap-2 flex-wrap max-h-48 overflow-y-auto p-3 border border-gray-300 rounded bg-white shadow-inner custom-scrollbar">
                         {products.map(p => (
                           <label key={p.id} className="flex items-center gap-2 text-xs font-semibold whitespace-nowrap bg-gray-50 px-3 py-1.5 rounded border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors shadow-sm">
                             <input type="checkbox" checked={(section.productIds || []).includes(p.id)} onChange={e => {
                               const ids = section.productIds || [];
                               updateSection(section.id, { productIds: e.target.checked ? [...ids, p.id] : ids.filter(i => i !== p.id) });
                             }} className="rounded text-amber-500 focus:ring-amber-500 w-3.5 h-3.5 cursor-pointer" /> {p.name.substring(0, 35)}{p.name.length > 35 ? '...' : ''}
                           </label>
                         ))}
                      </div>
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
      
      let fetchedSections = (confJson.success && confJson.data?.sections) ? confJson.data.sections : [];
        const defaultBlocks = [
          { id: 'hero_1', type: 'HeroSlider', isActive: true, order: 1, title: 'Welcome to Malieakal', subtitle: 'Premium Collection' },
          { id: 'flash_sales_1', type: 'FlashSalesGrid', isActive: true, order: 2, title: '⚡ WEEKEND MEGA SALE', subtitle: 'Hurry up! Offers end soon.' },
          { id: 'grid_lightning', type: 'ProductGrid', queryType: 'LightningDeals', isActive: true, order: 3, title: 'Lightning Deals', subtitle: 'Limited Time Offers' },
          { id: 'grid_bestsellers', type: 'ProductGrid', queryType: 'BestSellers', isActive: true, order: 4, title: 'Best Sellers', subtitle: 'Most Popular' },
          { id: 'grid_new', type: 'ProductGrid', queryType: 'NewArrivals', isActive: true, order: 5, title: 'New Arrivals', subtitle: 'Latest Additions' },
          { id: 'cats_1', type: 'FeaturedCategories', isActive: true, order: 6, title: 'Shop by Category', subtitle: 'Our Collections' },
          { id: 'brands_1', type: 'BrandPartners', isActive: true, order: 7, title: 'Top Brands', subtitle: 'Our Partners' },
          { id: 'discover_1', type: 'DiscoverMore', isActive: true, order: 8, title: 'Discover More', subtitle: 'General Catalog' }
        ];

        defaultBlocks.forEach(db => {
          if (!fetchedSections.find((fs: any) => fs.id === db.id || (fs.type === db.type && (fs.type !== 'ProductGrid' || fs.queryType === db.queryType)))) {
            fetchedSections.push({ ...db, isActive: false, order: fetchedSections.length + 1 });
          }
        });
        
        setSections(fetchedSections.sort((a: any, b: any) => a.order - b.order));
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

  
const addFlashSaleBlock = () => {
    const newBlock = {
        id: 'flash_sales_' + Date.now(),
        type: 'FlashSalesGrid',
        isActive: true,
        order: sections.length + 1,
        title: '⚡ WEEKEND MEGA SALE',
        subtitle: 'Hurry up! Offers end soon.'
    };
    setSections([...sections, newBlock]);
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
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
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
