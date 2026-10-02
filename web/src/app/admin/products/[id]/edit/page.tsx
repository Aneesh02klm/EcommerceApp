'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SmartImageUpload } from '@/components/ui/SmartImageUpload';
import { ArrowLeft, Save, Plus, Package, Image as ImageIcon, Layers, Bot, Sparkles, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';
import { Loader2 } from 'lucide-react';
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

import { useParams } from 'next/navigation';
export default function EditProductPage() {
  const params = useParams();
  const productId = params?.id as string;
  const [loadingProduct, setLoadingProduct] = useState(true);
  const router = useRouter();
  const { token } = useAuthStore();
  
  const [categories, setCategories] = useState<{id: number, name: string, specificationTemplate?: string}[]>([]);
  const [brands, setBrands] = useState<{id: number, name: string}[]>([]);
  
  const [specDefinitions, setSpecDefinitions] = useState<any[]>([]);
  const [specValues, setSpecValues] = useState<Record<number, string>>({});
  const [images, setImages] = useState<string[]>(['']);
  const [imageFiles, setImageFiles] = useState<(File|null)[]>([null]);

  const [variants, setVariants] = useState([{ name: '', attributesJSON: '{}', additionalPrice: 0, stock: 0 }]);
  const [richMedia, setRichMedia] = useState([{ type: 'Image', mediaUrl: '', title: '', description: '', displayOrder: 0 }]);
  const [richMediaFiles, setRichMediaFiles] = useState<(File|null)[]>([]);


  
  useEffect(() => {
    if (!productId) return;
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${API}/api/v1/products/${productId}`);
        const json = await res.json();
        if (json.success && json.data) {
          const p = json.data;
          setFormData({
            name: p.name,
            slug: p.slug,
            sku: p.sku || '',
            categoryId: p.categoryId,
            brandId: p.brandId,
            mrp: p.mrp,
            discount: p.discount || 0,
            stock: p.stock,
            description: p.description || '',
            features: p.features || '',
            highlights: p.highlights || '',
            isActive: p.isActive
          });
          
          if (p.images && p.images.length > 0) {
            setImages(p.images.map((i: any) => i.imageUrl));
            setImageFiles(p.images.map(() => null));
          }
          
          if (p.variants && p.variants.length > 0) {
             setVariants(p.variants.map((v: any) => ({
                 name: v.name,
                 attributesJSON: typeof v.attributesJSON === 'string' ? v.attributesJSON : JSON.stringify(v.attributesJSON || {}),
                 additionalPrice: v.additionalPrice,
                 stock: v.stock
             })));
          }
          
          // Wait for categories to load spec definitions, then apply specs
          setTimeout(() => {
              if (p.specificationJson) {
                try {
                  const specObj = typeof p.specificationJson === 'string' ? JSON.parse(p.specificationJson) : p.specificationJson;
                  const newSpecs: any = {};
                  // The definitions are flat in specDefinitions. We need to map group/name back to def.id
                  setSpecDefinitions(defs => {
                      defs.forEach(def => {
                          if (specObj[def.groupName] && specObj[def.groupName][def.name]) {
                              newSpecs[def.id] = specObj[def.groupName][def.name];
                          }
                      });
                      setSpecValues(newSpecs);
                      return defs;
                  });
                } catch(e) {}
              }
          }, 500);
        }
      } catch(err) {
        toast.error('Failed to load product');
      } finally {
        setLoadingProduct(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    sku: '',
    categoryId: 0,
    brandId: 0,
    mrp: 0,
    discount: 0,
    stock: 0,
    description: '',
    features: '',
    highlights: '',
    isActive: true
  });

  useEffect(() => {
    const fetchCoreData = async () => {
      try {
        const catRes = await fetch(`${API}/api/v1/categories`);
        const catJson = await catRes.json();
        if (catJson.success) setCategories(catJson.data);

        // Fetch brands if endpoint exists, otherwise mock
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

  const finalPrice = Math.max(0, formData.mrp - formData.discount);

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

    const formattedVariants = variants.filter(v => v.name.trim() !== '');
    const formattedRichMedia = richMedia.filter(r => r.mediaUrl.trim() !== '');

    const payload = {
      ...formData,
      finalPrice,
      specificationJson: JSON.stringify(groupedSpecs),
      
      images: formattedImages,
      variants: formattedVariants,
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
      const res = await fetch(`${API}/api/v1/products/${productId}`, {
        method: 'PUT',
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
              Edit Product
            </h1>
            <p className="text-sm text-gray-500 font-semibold mt-1">Update existing item in the catalog.</p>
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
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Slug</label>
                  <input type="text" required value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded bg-gray-50 outline-none text-sm font-semibold text-gray-600" />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">SKU</label>
                  <input type="text" value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 outline-none text-sm font-semibold" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Description</label>
                <textarea rows={4} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 outline-none text-sm font-semibold" />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Features (HTML allowed)</label>
                  <textarea rows={3} value={formData.features} onChange={(e) => setFormData({...formData, features: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded outline-none text-sm font-semibold" />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Highlights (Bullet points)</label>
                  <textarea rows={3} value={formData.highlights} onChange={(e) => setFormData({...formData, highlights: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded outline-none text-sm font-semibold" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-200">
            <CardHeader className="bg-gray-50 border-b border-gray-200 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-[#0B192C]">Images</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={() => { setImages([...images, '']); setImageFiles([...imageFiles, null]); }} className="h-8 px-2 text-xs font-bold">
                <Plus size={14} className="mr-1" /> Add Image
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((img, i) => (
                  <div key={i} className="relative">
                    <SmartImageUpload 
                       initialUrl={img} 
                       onFileSelect={(f) => { 
                          const newF = [...imageFiles]; newF[i] = f; setImageFiles(newF); 
                          if (!f) { const nI = [...images]; nI[i] = ''; setImages(nI); }
                       }} 
                       aspectRatio={1} 
                       label={i === 0 ? "Primary Image" : "Gallery Image"} 
                    />
                    {i > 0 && (
                        <button type="button" onClick={() => {
                            const newI = images.filter((_, idx) => idx !== i);
                            const newF = imageFiles.filter((_, idx) => idx !== i);
                            setImages(newI); setImageFiles(newF);
                        }} className="absolute -top-2 -right-2 bg-white rounded-full p-1.5 shadow text-red-500 hover:text-red-700 z-10"><Trash2 size={14}/></button>
                    )}
                  </div>
                ))}
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
                        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                          {specsForGroup.map((spec: any) => (
                            <div key={spec.id}>
                              <label className="flex justify-between text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">
                                <span>{spec.name} {spec.isRequired && <span className="text-red-500">*</span>}</span>
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


          {/* Variants */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="bg-gray-50 border-b border-gray-200 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-[#0B192C] flex items-center">
                <Layers size={18} className="mr-2 text-amber-500" /> 
                Product Variants
              </CardTitle>
              <button type="button" onClick={() => setVariants([...variants, { name: '', attributesJSON: '{}', additionalPrice: 0, stock: 0 }])} className="text-xs font-bold text-amber-600 uppercase tracking-widest flex items-center"><Plus size={14} className="mr-1"/> Add Variant</button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {variants.map((v, i) => (
                <div key={i} className="flex gap-4 items-end border-b border-gray-100 pb-4">
                  <div className="flex-1">
                    <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Variant Name (e.g., Graphite / 256GB)</label>
                    <input type="text" value={v.name} onChange={e => { const nv = [...variants]; nv[i].name = e.target.value; setVariants(nv); }} className="w-full p-2.5 border border-gray-300 rounded text-sm" />
                  </div>
                  <div className="w-24">
                    <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">+ Price</label>
                    <input type="number" value={v.additionalPrice} onChange={e => { const nv = [...variants]; nv[i].additionalPrice = parseFloat(e.target.value); setVariants(nv); }} className="w-full p-2.5 border border-gray-300 rounded text-sm" />
                  </div>
                  <div className="w-24">
                    <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Stock</label>
                    <input type="number" value={v.stock} onChange={e => { const nv = [...variants]; nv[i].stock = parseInt(e.target.value); setVariants(nv); }} className="w-full p-2.5 border border-gray-300 rounded text-sm" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

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
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-200">
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <CardTitle className="text-sm font-bold text-[#0B192C]">Pricing & Inventory</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">MRP (INR)</label>
                <input type="number" required min={0} value={formData.mrp} onChange={(e) => setFormData({...formData, mrp: parseFloat(e.target.value) || 0})} className="w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 outline-none text-sm font-semibold text-[#0B192C]" />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Discount Amount (INR)</label>
                <input type="number" required min={0} value={formData.discount} onChange={(e) => setFormData({...formData, discount: parseFloat(e.target.value) || 0})} className="w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 outline-none text-sm font-semibold text-[#0B192C]" />
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
