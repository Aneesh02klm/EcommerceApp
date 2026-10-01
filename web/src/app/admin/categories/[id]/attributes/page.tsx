'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Edit2, Trash2, ArrowLeft, Loader2, Settings2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

interface SpecificationDefinition {
  id: number;
  categoryId: number;
  name: string;
  dataType: string;
  isRequired: boolean;
  unit: string | null;
  allowedValues: string | null;
  isFilterable: boolean;
  isSearchable: boolean;
  isComparable: boolean;
  displayOrder: number;
  isActive: boolean;
  groupName: string;
}

interface Category {
  id: number;
  name: string;
}

export default function CategoryAttributesPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = parseInt(params.id as string, 10);
  const { token } = useAuthStore();
  
  const [category, setCategory] = useState<Category | null>(null);
  const [specs, setSpecs] = useState<SpecificationDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSpec, setEditingSpec] = useState<SpecificationDefinition | null>(null);
  const [formData, setFormData] = useState<Partial<SpecificationDefinition>>({
    categoryId: categoryId,
    name: '',
    dataType: 'Text',
    isRequired: false,
    unit: '',
    allowedValues: '',
    isFilterable: false,
    isSearchable: false,
    isComparable: false,
    displayOrder: 0,
    isActive: true,
    groupName: 'General'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch category details
      const catRes = await fetch(`${API}/api/v1/categories/${categoryId}`);
      const catJson = await catRes.json();
      if (catJson.success) setCategory(catJson.data);

      // Fetch specifications
      const specRes = await fetch(`${API}/api/v1/categories/${categoryId}/specifications`);
      const specJson = await specRes.json();
      if (specJson.success) setSpecs(specJson.data);
    } catch (err) {
      toast.error('Failed to fetch attributes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (categoryId) fetchData();
  }, [categoryId]);

  const handleOpenModal = (spec?: SpecificationDefinition) => {
    if (spec) {
      setEditingSpec(spec);
      setFormData({
        ...spec,
        unit: spec.unit || '',
        allowedValues: spec.allowedValues || ''
      });
    } else {
      setEditingSpec(null);
      setFormData({
        categoryId: categoryId,
        name: '',
        dataType: 'Text',
        isRequired: false,
        unit: '',
        allowedValues: '',
        isFilterable: false,
        isSearchable: false,
        isComparable: false,
        displayOrder: 0,
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const method = editingSpec ? 'PUT' : 'POST';
      const url = editingSpec 
        ? `${API}/api/v1/specifications/${editingSpec.id}` 
        : `${API}/api/v1/specifications`;

      // Clean empty strings to null for DB
      const payload = {
        ...formData,
        unit: formData.unit?.trim() || null,
        allowedValues: formData.allowedValues?.trim() || null
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        toast.success(`Attribute ${editingSpec ? 'updated' : 'created'} successfully`);
        setIsModalOpen(false);
        fetchData();
      } else {
        toast.error(data.message || 'Failed to save attribute');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this attribute? This may affect products using it.')) return;
    
    try {
      const res = await fetch(`${API}/api/v1/specifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        toast.success('Attribute deleted');
        fetchData();
      } else {
        toast.error(data.message || 'Failed to delete');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 mb-2">
        <button onClick={() => router.push('/admin/categories')} className="text-gray-400 hover:text-[#0B192C] transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-[#0B192C] flex items-center">
            {category ? `${category.name} Attributes` : 'Loading...'}
          </h1>
          <p className="text-sm text-gray-500 font-semibold mt-1">Manage dynamic specifications for this category.</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => handleOpenModal()} variant="primary" className="font-extrabold uppercase tracking-widest shadow-lg shadow-[#0B192C]/20 flex items-center">
          <Plus size={18} className="mr-2" /> Add Attribute
        </Button>
      </div>

      <Card className="shadow-sm border-gray-200">
        <CardHeader className="bg-gray-50 border-b border-gray-200 rounded-t-lg">
          <CardTitle className="text-sm font-bold text-[#0B192C] flex items-center">
            <Settings2 size={18} className="mr-2 text-amber-500" /> Defined Specifications
          </CardTitle>
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
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Group</th>
                    <th className="px-6 py-4">Type / Unit</th>
                    <th className="px-6 py-4">Rules</th>
                    <th className="px-6 py-4">Filterable</th>
                    <th className="px-6 py-4">Order</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {specs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-400 font-semibold">
                        No attributes defined. Add your first specification.
                      </td>
                    </tr>
                  ) : (
                    specs.map((spec) => (
                      <tr key={spec.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-extrabold text-[#0B192C]">{spec.name}</td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded">{spec.groupName || '—'}</span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-500">
                          {spec.dataType} {spec.unit && <span className="bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded text-xs ml-1">{spec.unit}</span>}
                        </td>
                        <td className="px-6 py-4">
                          {spec.isRequired && <span className="px-2 py-1 text-[9px] font-extrabold uppercase bg-red-50 text-red-600 rounded mr-1">Required</span>}
                        </td>
                        <td className="px-6 py-4">
                          {spec.isFilterable && <span className="px-2 py-1 text-[9px] font-extrabold uppercase bg-amber-50 text-amber-600 rounded">Yes</span>}
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-600">{spec.displayOrder}</td>
                        <td className="px-6 py-4 text-right space-x-3">
                          <button 
                            onClick={() => handleOpenModal(spec)}
                            className="text-amber-500 hover:text-amber-600 transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(spec.id)} className="text-red-400 hover:text-red-600 transition-colors">
                            <Trash2 size={16} />
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0B192C]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-gray-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-extrabold text-[#0B192C]">
                {editingSpec ? 'Edit Attribute' : 'Define New Attribute'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
            </div>
            
            <div className="overflow-y-auto p-6">
              <form id="spec-form" onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Attribute Name</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.name || ''}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. Battery Capacity"
                      className="w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm font-semibold text-[#0B192C]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Group Name</label>
                    <input 
                      type="text" 
                      value={formData.groupName || 'General'}
                      onChange={(e) => setFormData({...formData, groupName: e.target.value})}
                      placeholder="e.g. General, Display Features, Connectivity"
                      className="w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm font-semibold text-[#0B192C]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Data Type</label>
                    <select 
                      value={formData.dataType}
                      onChange={(e) => setFormData({...formData, dataType: e.target.value})}
                      className="w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm font-semibold text-[#0B192C]"
                    >
                      <option value="Text">Text</option>
                      <option value="Number">Number</option>
                      <option value="Decimal">Decimal</option>
                      <option value="Boolean">Boolean</option>
                      <option value="Select">Single Select</option>
                      <option value="MultiSelect">Multi Select</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Unit (Optional)</label>
                    <input 
                      type="text" 
                      value={formData.unit || ''}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      placeholder="e.g. mAh, GB, cm"
                      className="w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm font-semibold text-[#0B192C]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Allowed Values</label>
                    <input 
                      type="text" 
                      value={formData.allowedValues || ''}
                      onChange={(e) => setFormData({...formData, allowedValues: e.target.value})}
                      placeholder="Comma separated (e.g. Red, Blue, Green)"
                      disabled={formData.dataType !== 'Select' && formData.dataType !== 'MultiSelect'}
                      className="w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm font-semibold text-[#0B192C] disabled:bg-gray-100 disabled:text-gray-400"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-[10px] font-extrabold text-[#0B192C] uppercase tracking-widest mb-3">Configuration & Behavior</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" checked={formData.isRequired} onChange={(e) => setFormData({...formData, isRequired: e.target.checked})} className="rounded text-amber-500 focus:ring-amber-500" />
                      <span className="text-sm font-semibold text-gray-600">Required Field</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" checked={formData.isFilterable} onChange={(e) => setFormData({...formData, isFilterable: e.target.checked})} className="rounded text-amber-500 focus:ring-amber-500" />
                      <span className="text-sm font-semibold text-gray-600">Use in Sidebar Filters</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" checked={formData.isSearchable} onChange={(e) => setFormData({...formData, isSearchable: e.target.checked})} className="rounded text-amber-500 focus:ring-amber-500" />
                      <span className="text-sm font-semibold text-gray-600">Include in Search</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" checked={formData.isComparable} onChange={(e) => setFormData({...formData, isComparable: e.target.checked})} className="rounded text-amber-500 focus:ring-amber-500" />
                      <span className="text-sm font-semibold text-gray-600">Use in Comparisons</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Status</label>
                    <select 
                      value={formData.isActive ? 'true' : 'false'}
                      onChange={(e) => setFormData({...formData, isActive: e.target.value === 'true'})}
                      className="w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm font-semibold text-[#0B192C]"
                    >
                      <option value="true">Active</option>
                      <option value="false">Hidden</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Display Order</label>
                    <input 
                      type="number" 
                      value={formData.displayOrder || 0}
                      onChange={(e) => setFormData({...formData, displayOrder: parseInt(e.target.value) || 0})}
                      className="w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm font-semibold text-[#0B192C]"
                    />
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3 shrink-0">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="font-extrabold uppercase tracking-widest text-xs">
                Cancel
              </Button>
              <Button form="spec-form" type="submit" variant="primary" className="font-extrabold uppercase tracking-widest shadow-lg shadow-[#0B192C]/20 text-xs">
                {editingSpec ? 'Save Changes' : 'Create Attribute'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
