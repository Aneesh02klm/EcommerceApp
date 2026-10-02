
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';
import { Loader2, Plus, Edit2, Trash2, Image as ImageIcon, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import ReactCrop, { centerCrop, makeAspectCrop, Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import imageCompression from 'browser-image-compression';

interface Banner {
  id: number;
  imageUrl: string;
  linkUrl: string;
  displayStyle: string;
  isActive: boolean;
  categoryId?: number;
  brandId?: number;
  sortOrder: number;
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export default function AdminBannersPage() {
  const { token } = useAuthStore();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    imageUrl: '', imageFile: null as File | null,
    linkUrl: '',
    displayStyle: 'Slider',
    isActive: true,
    categoryId: '' as string | number,
    brandId: '' as string | number,
    sortOrder: 0
  });

  // Cropping States
  const [imgSrc, setImgSrc] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isCropping, setIsCropping] = useState(false);

  useEffect(() => {
    fetchBanners();
    fetchDropdowns();
  }, [token]);

  const fetchDropdowns = async () => {
    try {
      const [catRes, brandRes] = await Promise.all([
        fetch(`${API}/api/v1/categories`),
        fetch(`${API}/api/v1/brands`)
      ]);
      const [catData, brandData] = await Promise.all([catRes.json(), brandRes.json()]);
      setCategories(catData.data || []);
      setBrands(brandData.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/v1/banners/admin`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBanners(data.data.sort((a: any, b: any) => a.sortOrder - b.sortOrder));
      }
    } catch (error) {
      toast.error('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (banner?: Banner) => {
    setImgSrc('');
    setIsCropping(false);
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        imageUrl: banner.imageUrl || '',
        imageFile: null,
        linkUrl: banner.linkUrl || '',
        displayStyle: banner.displayStyle || 'Slider',
        isActive: banner.isActive,
        categoryId: banner.categoryId || '',
        brandId: banner.brandId || '',
        sortOrder: banner.sortOrder || 0
      });
    } else {
      setEditingBanner(null);
      setFormData({ imageUrl: '', imageFile: null, linkUrl: '', displayStyle: 'Slider', isActive: true, categoryId: '', brandId: '', sortOrder: 0 });
    }
    setIsModalOpen(true);
  };

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImgSrc(reader.result?.toString() || '');
        setIsCropping(true);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 21 / 9)); // Enforce 21:9 aspect ratio
  };

  const handleApplyCrop = async () => {
    if (!completedCrop || !imgRef.current) return;
    
    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY
    );

    // Compress cropped image
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], 'banner-cropped.jpg', { type: 'image/jpeg' });
      
      try {
        const options = {
          maxSizeMB: 0.5, // 500KB Max
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);
        const previewUrl = URL.createObjectURL(compressedFile);
        
        setFormData({ ...formData, imageFile: compressedFile, imageUrl: previewUrl });
        setIsCropping(false);
        setImgSrc('');
      } catch (error) {
        toast.error('Image compression failed');
      }
    }, 'image/jpeg', 0.95);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.imageFile && !formData.imageUrl) {
      toast.error('Image is required');
      return;
    }

    try {
      const payload = new FormData();
      if (formData.imageFile) payload.append('Image', formData.imageFile);
      if (formData.linkUrl) payload.append('LinkUrl', formData.linkUrl);
      payload.append('DisplayStyle', formData.displayStyle);
      payload.append('IsActive', String(formData.isActive));
      payload.append('SortOrder', String(formData.sortOrder));
      if (formData.categoryId) payload.append('CategoryId', String(formData.categoryId));
      if (formData.brandId) payload.append('BrandId', String(formData.brandId));

      const res = await fetch(`${API}/api/v1/banners/admin${editingBanner ? `/${editingBanner.id}` : ''}`, {
        method: editingBanner ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: payload
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Banner ${editingBanner ? 'updated' : 'created'} successfully`);
        setIsModalOpen(false);
        fetchBanners();
      } else {
        toast.error(data.message || 'Error saving banner');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    try {
      const res = await fetch(`${API}/api/v1/banners/admin/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Banner deleted');
        fetchBanners();
      }
    } catch (error) {
      toast.error('Error deleting banner');
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black text-[#0B192C]">Banners</h1>
          <p className="text-sm font-medium text-gray-500">Manage hero sliders and promotional graphics.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-[#0B192C] hover:bg-[#162a45] text-white font-bold text-[11px] uppercase tracking-widest px-6 py-3 rounded shadow-sm">
          <Plus size={16} /> ADD NEW BANNER
        </button>
      </header>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/80 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Image</th>
                <th className="px-6 py-4">Targeting</th>
                <th className="px-6 py-4">Style</th>
                <th className="px-6 py-4">Order</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {banners.map((banner) => (
                <tr key={banner.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="w-24 h-10 bg-gray-100 rounded border border-gray-200 overflow-hidden flex items-center justify-center">
                      {banner.imageUrl ? (
                        <img src={banner.imageUrl.startsWith('http') ? banner.imageUrl : `${API}${banner.imageUrl}`} alt="Banner" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={16} className="text-gray-400" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {banner.brandId && <span className="block text-amber-600 font-bold text-xs uppercase">Brand: {brands.find(b => b.id === banner.brandId)?.name || banner.brandId}</span>}
                    {banner.categoryId && <span className="block text-blue-600 font-bold text-xs uppercase">Category: {categories.find(c => c.id === banner.categoryId)?.name || banner.categoryId}</span>}
                    {!banner.brandId && !banner.categoryId && <span className="block text-gray-500 font-bold text-xs uppercase">Global (Default)</span>}
                  </td>
                  <td className="px-6 py-4">{banner.displayStyle}</td>
                  <td className="px-6 py-4">{banner.sortOrder}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      banner.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {banner.isActive ? 'Active' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleOpenModal(banner)} className="text-blue-500 hover:text-blue-700 p-2"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(banner.id)} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {banners.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No banners found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-black text-[#0B192C]">
                {isCropping ? 'Crop Banner Image' : (editingBanner ? 'Edit Banner' : 'Add New Banner')}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {isCropping ? (
                <div className="flex flex-col items-center">
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={21 / 9}
                    className="max-h-[50vh] mb-4 border border-gray-200 rounded"
                  >
                    <img ref={imgRef} src={imgSrc} alt="Crop preview" onLoad={onImageLoad} style={{ maxHeight: '50vh' }} />
                  </ReactCrop>
                  <p className="text-xs text-amber-600 font-bold mb-4 bg-amber-50 px-3 py-2 rounded">
                    Aspect ratio strictly locked at 21:9 for perfect storefront rendering.
                  </p>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setIsCropping(false)}>Cancel Crop</Button>
                    <Button onClick={handleApplyCrop} className="bg-blue-600 hover:bg-blue-700 text-white">Apply & Compress</Button>
                  </div>
                </div>
              ) : (
                <form id="bannerForm" onSubmit={handleSubmit} className="space-y-5">
                  
                  {/* Upload Zone */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1.5">Banner Image</label>
                    
                    <div className="relative group">
                      {formData.imageUrl ? (
                        <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-200 mb-2 group-hover:opacity-80 transition">
                           <img src={formData.imageUrl.startsWith('http') || formData.imageUrl.startsWith('blob:') ? formData.imageUrl : `${API}${formData.imageUrl}`} className="w-full h-full object-cover" />
                           <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-sm">
                             <span className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2"><UploadCloud size={16}/> Replace Image</span>
                           </div>
                        </div>
                      ) : (
                        <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-amber-400 hover:text-amber-500 transition cursor-pointer mb-2">
                           <UploadCloud size={24} className="mb-2" />
                           <span className="text-xs font-bold uppercase tracking-wider">Click or Drag Image Here</span>
                        </div>
                      )}
                      
                      {/* Hidden File Input covering the entire zone */}
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={onSelectFile} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                        title="Choose an image"
                      />
                    </div>
                    
                    <p className="text-[10px] text-gray-500">Auto-compressed below 500KB and cropped to 21:9 ratio.</p>
                  </div>

                  <hr className="border-gray-100" />

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1.5">Link URL (Optional)</label>
                    <input type="text" value={formData.linkUrl} onChange={e => setFormData({...formData, linkUrl: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none" placeholder="/products/electronics" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1.5">Category Target</label>
                      <select value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:border-amber-400 outline-none">
                        <option value="">None (Global)</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1.5">Brand Target</label>
                      <select value={formData.brandId} onChange={e => setFormData({...formData, brandId: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:border-amber-400 outline-none">
                        <option value="">None (Global)</option>
                        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1.5">Sort Order</label>
                      <input type="number" required value={formData.sortOrder} onChange={e => setFormData({...formData, sortOrder: parseInt(e.target.value) || 0})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:border-amber-400 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1.5">Display Style</label>
                      <select value={formData.displayStyle} onChange={e => setFormData({...formData, displayStyle: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:border-amber-400 outline-none">
                        <option value="Slider">Slider</option>
                        <option value="Static">Static</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 text-amber-500 rounded border-gray-300 focus:ring-amber-500" />
                    <label htmlFor="isActive" className="text-sm font-bold text-gray-800">Active (Visible on frontend)</label>
                  </div>

                </form>
              )}
            </div>
            
            {!isCropping && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" form="bannerForm" className="bg-[#0B192C] hover:bg-[#162a45] text-white">Save Banner</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
