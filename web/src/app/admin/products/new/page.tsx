'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SmartImageUpload } from '@/components/ui/SmartImageUpload';
import { ArrowLeft, Save, Plus, Package, Image as ImageIcon, Layers, Bot, Sparkles, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';
import { VariantProductSelectorModal } from '@/components/admin/VariantProductSelectorModal';
import { CheckCircle2 } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { formatCurrency } from '@/lib/formatCurrency';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

interface SpecificationDefinition {
  id: number;
  name: string;
  dataType: string;
  isRequired: boolean;
  unit: string | null;
  allowedValues: string | null;
}

export default function CreateProductPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  
  const [categories, setCategories] = useState<{id: number, name: string, specificationTemplate?: string}[]>([]);
  const [brands, setBrands] = useState<{id: number, name: string}[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  
  const [specDefinitions, setSpecDefinitions] = useState<any[]>([]);
  const [specValues, setSpecValues] = useState<Record<number, string>>({});
  const [images, setImages] = useState<string[]>(['']);
  const [imageFiles, setImageFiles] = useState<(File|null)[]>([null]);

  
  const [variantSelectorOpen, setVariantSelectorOpen] = useState(false);
  const [activeVariantIndex, setActiveVariantIndex] = useState<number | null>(null);
  

  const [variants, setVariants] = useState<{groupName: string, optionName: string, linkedProductId: string}[]>([{ groupName: '', optionName: '', linkedProductId: '' }]);
  const [richMediaFiles, setRichMediaFiles] = useState<(File|null)[]>([]);
  const [richMedia, setRichMedia] = useState([{ type: 'Image', mediaUrl: '', title: '', description: '', displayOrder: 0 }]);


  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    sku: '',
      familyCode: '',
    categoryId: 0,
    brandId: 0,
    mrp: 0,
    discount: 0,
    discountType: 'Flat',
    stock: 0,
    description: '',
    features: '',
    highlights: '',
    isActive: true,
    isBestSeller: false
  });

  // Smart Options Derivation
  const availableGroups = React.useMemo(() => {
      const groups = new Set<string>();
      specDefinitions.forEach(def => groups.add(def.name));
      allProducts.forEach(p => {
          if (p.categoryId === Number(formData.categoryId)) {
              const specs = typeof p.specificationJson === 'string' ? JSON.parse(p.specificationJson) : (p.specificationJson || {});
              for (const g in specs) {
                  for (const k in specs[g]) {
                      groups.add(k);
                  }
              }
          }
      });
      return Array.from(groups);
  }, [specDefinitions, allProducts, formData.categoryId]);

  const getAvailableOptions = React.useCallback((groupName: string) => {
      if (!groupName) return [];
      const opts = new Set<string>();
      allProducts.forEach(p => {
          if (p.categoryId === Number(formData.categoryId) && p.brandId === Number(formData.brandId)) {
              const specs = typeof p.specificationJson === 'string' ? JSON.parse(p.specificationJson) : (p.specificationJson || {});
              for (const g in specs) {
                  if (specs[g][groupName]) {
                      opts.add(specs[g][groupName]);
                  }
              }
          }
      });
      return Array.from(opts);
  }, [allProducts, formData.categoryId, formData.brandId]);


  useEffect(() => {
    const fetchCoreData = async () => {
      try {
        const catRes = await fetch(`${API}/api/v1/categories`);
        const catJson = await catRes.json();
        if (catJson.success) setCategories(catJson.data);

        // Fetch brands if endpoint exists, otherwise mock
        const prodRes = await fetch(`${API}/api/v1/products?pageSize=1000`).catch(() => null);
        if (prodRes && prodRes.ok) {
          const prodJson = await prodRes.json();
          if (prodJson.success) {
            setAllProducts(prodJson.data.items || prodJson.data || []);
          }
        }
        
        const brandRes = await fetch(`${API}/api/v1/brands`).catch(() => null);
        if (brandRes && brandRes.ok) {
          const brandJson = await brandRes.json();
          if (brandJson.success) setBrands(brandJson.data);
        } else {
          setBrands([{id: 1, name: 'Samsung'}, {id: 2, name: 'Sony'}, {id: 3, name: 'Apple'}]); // Fallback
        }
      } catch (err) {
        toast.error('Failed to load initial data');
      }
    };
    fetchCoreData();
  }, []);

  // When Category changes, fetch specifications
  useEffect(() => {
    if (!formData.categoryId) {
      setSpecDefinitions([]);
      setSpecValues({});
      return;
    }
    
    const cat = categories.find(c => c.id === Number(formData.categoryId));
    if (cat && cat.specificationTemplate) {
        try {
            const template = JSON.parse(cat.specificationTemplate);
            const definitions: any[] = [];
            let fakeId = 1;
            for (const group in template) {
                for (const key of template[group]) {
                    definitions.push({
                        id: fakeId++, 
                        name: key,
                        groupName: group,
                        dataType: 'Text',
                        isRequired: false,
                        unit: ''
                    });
                }
            }
            setSpecDefinitions(definitions);
            const initialVals: Record<number, string> = {};
            definitions.forEach((d: any) => initialVals[d.id] = '');
            setSpecValues(initialVals);
        } catch(e) {
            setSpecDefinitions([]);
        }
    } else {
        setSpecDefinitions([]);
    }
  }, [formData.categoryId, categories]);

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData({ ...formData, name, slug: generateSlug(name) });
  };

  const finalPrice = Math.max(0, formData.discountType === 'Percentage' ? formData.mrp - (formData.mrp * (formData.discount / 100)) : formData.mrp - formData.discount);

  
  const isKeyFeature = (keyName: string) => {
    return Boolean(formData.highlights && formData.highlights.split('|').includes(keyName));
  };

  const toggleKeyFeature = (keyName: string) => {
    const current = formData.highlights ? formData.highlights.split('|') : [];
    if (current.includes(keyName)) {
        setFormData({...formData, highlights: current.filter(k => k !== keyName).join('|')});
    } else {
        setFormData({...formData, highlights: [...current, keyName].join('|')});
    }
  };
    
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!formData.categoryId || !formData.brandId) {
      toast.error('Please select Category and Brand');
      return;
    }

    const groupedSpecs: any = {};
    Object.entries(specValues).forEach(([id, val]) => {
      if (val.trim() === '') return;
      const def = specDefinitions.find(d => d.id === parseInt(id, 10));
      if (def) {
        if (!groupedSpecs[def.groupName]) groupedSpecs[def.groupName] = {};
        groupedSpecs[def.groupName][def.name] = val;
      }
    });

    const formattedImages = images
      .filter(url => url.trim() !== '')
      .map((url, idx) => ({
        imageUrl: url,
        isPrimary: idx === 0,
        displayOrder: idx
      }));

    const formattedVariants = variants.filter(v => v.groupName.trim() !== '' && v.optionName.trim() !== '');
    const formattedRichMedia = richMedia.filter(r => r.mediaUrl.trim() !== '');

    const payload = {
      ...formData,
      finalPrice,
      specificationJson: JSON.stringify(groupedSpecs),
      
      images: formattedImages,
      
      richMedia: formattedRichMedia
    };

    const fd = new FormData();
    fd.append('productData', JSON.stringify(payload));
    imageFiles.forEach((file: any, i: number) => {
        if (file) fd.append(`primary_${i}`, file);
    });
    richMediaFiles.forEach((file: any, i: number) => {
        if (file) fd.append(`richMedia_${i}`, file);
    });

    try {
      const res = await fetch(`${API}/api/v1/products?pageSize=1000`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: fd
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        toast.success('Product created successfully');
        router.push('/admin/products');
      } else {
        toast.error(data.message || 'Failed to create product');
      }
    } catch (err) {
      toast.error('Network error occurred.');
    }
  };


  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const generateWithAI = async () => {
    if (!formData.name) {
      toast.error('Please enter at least a Product Name or Model to generate details.');
      return;
    }
    
    setIsGeneratingAI(true);
    toast.success('AI is researching this product...');
    
    try {
      const res = await fetch(`${API}/api/v1/admin/ai/generate-product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ prompt: formData.name })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setFormData(prev => ({
          ...prev,
          description: json.data.description || prev.description,
          mrp: json.data.mrp || prev.mrp,
          discount: (json.data.mrp || prev.mrp) - (json.data.price || prev.mrp),
          sku: json.data.sku || prev.sku
        }));
        
        // Auto-map specs based on name loosely
        if (json.data.specifications) {
           const newSpecs = { ...specValues };
           specDefinitions.forEach(def => {
             const key = Object.keys(json.data.specifications).find(k => def.name.toLowerCase().includes(k.toLowerCase()));
             if (key) {
               newSpecs[def.id] = json.data.specifications[key];
             }
           });
           setSpecValues(newSpecs);
        }
        
        toast.success('Product details generated successfully!');
      } else {
        toast.error('AI generation failed.');
      }
    } catch (err) {
      toast.error('Network error during AI generation.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const updateSpecValue = (id: number, val: string) => {

    setSpecValues(prev => ({ ...prev, [id]: val }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-4">
          <button type="button" onClick={() => router.push('/admin/products')} className="text-gray-400 hover:text-[#0B192C] transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold text-[#0B192C] flex items-center">
              Create Product
            </h1>
            <p className="text-sm text-gray-500 font-semibold mt-1">Add a new item to the catalog.</p>
          </div>
        
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" onClick={generateWithAI} disabled={isGeneratingAI} className="bg-amber-100 text-amber-600 hover:bg-amber-200 font-extrabold tracking-widest shadow-sm flex items-center">
            {isGeneratingAI ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Sparkles size={18} className="mr-2" />} 
            Generate AI
          </Button>
          <Button type="submit" variant="primary" className="font-extrabold uppercase tracking-widest shadow-lg shadow-[#0B192C]/20 flex items-center">
            <Save size={18} className="mr-2" /> Save Product
          </Button>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <CardTitle className="text-sm font-bold text-[#0B192C]">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Product Name</label>
                <input type="text" required value={formData.name} onChange={handleNameChange} className="w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 outline-none text-sm font-semibold" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Slug</label>
                  <input type="text" required value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded bg-gray-50 outline-none text-sm font-semibold text-gray-600" />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">SKU</label>
                  <input type="text" value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 outline-none text-sm font-semibold" />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Family Code</label>
                  <input type="text" value={formData.familyCode} onChange={(e) => setFormData({...formData, familyCode: e.target.value})} placeholder="e.g. GALAXY-S23" className="w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 outline-none text-sm font-semibold" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Description</label>
                <RichTextEditor value={formData.description} onChange={(val) => setFormData(prev => val !== prev.description ? { ...prev, description: val } : prev)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Features (HTML allowed)</label>
                  <RichTextEditor value={formData.features || ""} onChange={(val) => setFormData(prev => val !== prev.features ? { ...prev, features: val } : prev)} />
                </div>
                
              </div>
            </CardContent>
          </Card>

          
          
          {/* Dynamic Specifications */}
          {formData.categoryId > 0 && (
            <Card className="shadow-sm border-gray-200 border-t-4 border-t-amber-500">
              <CardHeader className="bg-gray-50 border-b border-gray-200">
                <CardTitle className="text-sm font-bold text-[#0B192C] flex items-center">
                  <Package size={18} className="mr-2 text-amber-500" /> 
                  Category Specifications
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {specDefinitions.length === 0 ? (
                  <p className="text-sm font-semibold text-gray-500">This category has no dynamic attributes configured.</p>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(
                      specDefinitions.reduce((acc: any, spec: any) => {
                        const group = spec.groupName || 'General';
                        if (!acc[group]) acc[group] = [];
                        acc[group].push(spec);
                        return acc;
                      }, {})
                    ).map(([group, specsForGroup]: [string, any]) => (
                      <div key={group}>
                        <h4 className="text-xs font-extrabold text-[#0B192C] uppercase tracking-widest mb-4 pb-2 border-b border-gray-100">{group}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                          {specsForGroup.map((spec: any) => (
                            <div key={spec.id}>
                              <label className="flex items-center justify-between text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">
                                <span>{spec.name} {spec.isRequired && <span className="text-red-500">*</span>}</span> <label className="flex items-center gap-1.5 cursor-pointer text-[#0B192C] hover:text-amber-600 transition-colors bg-white rounded shadow-sm border border-gray-100 px-2 py-0.5 ml-auto"><input type="checkbox" className="w-3 h-3 accent-amber-500 cursor-pointer" checked={isKeyFeature(spec.name)} onChange={() => toggleKeyFeature(spec.name)} /><span className="text-[9px] font-extrabold uppercase mt-0.5">Key Feature</span></label>
                                {spec.unit && <span className="text-amber-600 bg-amber-50 px-1 rounded">{spec.unit}</span>}
                              </label>
                              
                              {spec.dataType === 'Boolean' ? (
                                <select 
                                  required={spec.isRequired}
                                  value={specValues[spec.id] || ''}
                                  onChange={(e) => updateSpecValue(spec.id, e.target.value)}
                                  className="w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 outline-none text-sm font-semibold"
                                >
                                  <option value="">Select...</option>
                                  <option value="Yes">Yes</option>
                                  <option value="No">No</option>
                                </select>
                              ) : spec.dataType === 'Select' && spec.allowedValues ? (
                                <select 
                                  required={spec.isRequired}
                                  value={specValues[spec.id] || ''}
                                  onChange={(e) => updateSpecValue(spec.id, e.target.value)}
                                  className="w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 outline-none text-sm font-semibold"
                                >
                                  <option value="">Select...</option>
                                  {spec.allowedValues.split(',').map((val: string) => (
                                    <option key={val.trim()} value={val.trim()}>{val.trim()}</option>
                                  ))}
                                </select>
                              ) : (
                                <input 
                                  type={spec.dataType === 'Number' || spec.dataType === 'Decimal' ? 'number' : 'text'}
                                  step={spec.dataType === 'Decimal' ? '0.01' : '1'}
                                  required={spec.isRequired}
                                  value={specValues[spec.id] || ''}
                                  onChange={(e) => updateSpecValue(spec.id, e.target.value)}
                                  className="w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 outline-none text-sm font-semibold"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}


          

          {/* Rich Media (A+ Content) */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="bg-gray-50 border-b border-gray-200 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-[#0B192C] flex items-center">
                <ImageIcon size={18} className="mr-2 text-amber-500" /> 
                A+ Content / Description Images
              </CardTitle>
              <button type="button" onClick={() => { setRichMedia([...richMedia, { type: 'Image', mediaUrl: '', title: '', description: '', displayOrder: richMedia.length }]); setRichMediaFiles([...richMediaFiles, null]); }} className="text-xs font-bold text-amber-600 uppercase tracking-widest flex items-center"><Plus size={14} className="mr-1"/> Add Media</button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {richMedia.map((rm, i) => (
                <div key={i} className="flex gap-4 border-b border-gray-100 pb-4 relative">
                  <div className="w-48 flex-shrink-0">
                    <SmartImageUpload 
                       initialUrl={rm.mediaUrl}
                       onFileSelect={(f) => { 
                          const newF = [...richMediaFiles]; newF[i] = f; setRichMediaFiles(newF); 
                          if (!f) { const nrm = [...richMedia]; nrm[i].mediaUrl = ''; setRichMedia(nrm); }
                       }}
                       aspectRatio={16/9}
                       label="A+ Banner (16:9)"
                    />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Title (Optional)</label>
                      <input type="text" value={rm.title || ''} onChange={e => { const nm = [...richMedia]; nm[i].title = e.target.value; setRichMedia(nm); }} className="w-full p-2.5 border border-gray-300 rounded text-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Description (Optional)</label>
                      <input type="text" value={rm.description || ''} onChange={e => { const nm = [...richMedia]; nm[i].description = e.target.value; setRichMedia(nm); }} className="w-full p-2.5 border border-gray-300 rounded text-sm" />
                    </div>
                  </div>
                  <button type="button" onClick={() => {
                        const newR = richMedia.filter((_, idx) => idx !== i);
                        const newF = richMediaFiles.filter((_, idx) => idx !== i);
                        setRichMedia(newR); setRichMediaFiles(newF);
                  }} className="absolute top-0 right-0 bg-white rounded-full p-1.5 shadow text-red-500 hover:text-red-700 z-10"><Trash2 size={14}/></button>
                </div>
              ))}
            </CardContent>
          </Card>

        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <CardTitle className="text-sm font-bold text-[#0B192C]">Organization</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Category</label>
                <select required value={formData.categoryId} onChange={(e) => setFormData({...formData, categoryId: parseInt(e.target.value)})} className="w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 outline-none text-sm font-semibold text-[#0B192C]">
                  <option value={0}>Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Brand</label>
                <select required value={formData.brandId} onChange={(e) => setFormData({...formData, brandId: parseInt(e.target.value)})} className="w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 outline-none text-sm font-semibold text-[#0B192C]">
                  <option value={0}>Select Brand</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Status</label>
                <select value={formData.isActive ? 'true' : 'false'} onChange={(e) => setFormData({...formData, isActive: e.target.value === 'true'})} className="w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 outline-none text-sm font-semibold text-[#0B192C]">
                  <option value="true">Active (Visible)</option>
                  <option value="false">Hidden (Draft)</option>
                </select>
              </div>
              <div className="flex items-center gap-3 mt-6">
                <input 
                  type="checkbox" 
                  id="isBestSeller" 
                  checked={formData.isBestSeller || false} 
                  onChange={(e) => setFormData({...formData, isBestSeller: e.target.checked})}
                  className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500 border-gray-300"
                />
                <label htmlFor="isBestSeller" className="text-sm font-bold text-[#0B192C]">Mark as Best Seller</label>
              </div>

            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-200">
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <CardTitle className="text-sm font-bold text-[#0B192C]">Pricing & Inventory</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">MRP (INR)</label>
                <input type="number" step="0.01" required min={0} value={formData.mrp} onChange={(e) => setFormData({...formData, mrp: parseFloat(e.target.value) || 0})} className="w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 outline-none text-sm font-semibold text-[#0B192C]" />
              </div>
              <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Discount Value</label>
                    <input type="number" step="0.01" required min={0} value={formData.discount} onChange={(e) => setFormData({...formData, discount: parseFloat(e.target.value) || 0})} className="w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 outline-none text-sm font-semibold text-[#0B192C]" />
                  </div>
                  <div className="w-1/3">
                    <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Type</label>
                    <select value={formData.discountType} onChange={(e) => setFormData({...formData, discountType: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 outline-none text-sm font-semibold text-[#0B192C]">
                      <option value="Flat">Flat (₹)</option>
                      <option value="Percentage">Percentage (%)</option>
                    </select>
                  </div>
                </div>
              <div className="bg-green-50 p-3 rounded-lg border border-green-100 flex justify-between items-center">
                <span className="text-xs font-bold text-green-700 uppercase tracking-widest">Final Price</span>
                <span className="text-lg font-extrabold text-green-700">{formatCurrency(finalPrice)}</span>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Stock Quantity</label>
                <input type="number" required min={0} value={formData.stock} onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value) || 0})} className="w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 outline-none text-sm font-semibold text-[#0B192C]" />
              </div>
            </CardContent>
          </Card>
        </div>
        
      </div>
    </form>
  );
}
