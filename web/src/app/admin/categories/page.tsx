'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Edit2, Trash2, Loader2, FolderTree } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  displayOrder: number;
}

export default function AdminCategoriesPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    isActive: true,
    displayOrder: 0
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/categories`);
      const json = await res.json();
      if (json.success) setCategories(json.data);
    } catch (err) {
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        isActive: category.isActive,
        displayOrder: category.displayOrder
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', slug: '', description: '', isActive: true, displayOrder: 0 });
    }
    setIsModalOpen(true);
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData({ ...formData, name, slug: generateSlug(name) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const method = editingCategory ? 'PUT' : 'POST';
      const url = editingCategory 
        ? `${API}/api/v1/categories/${editingCategory.id}` 
        : `${API}/api/v1/categories`;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        toast.success(`Category ${editingCategory ? 'updated' : 'created'} successfully`);
        setIsModalOpen(false);
        fetchCategories();
      } else {
        toast.error(data.message || 'Failed to save category');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category? This will affect products assigned to it.')) return;
    
    try {
      const res = await fetch(`${API}/api/v1/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        toast.success('Category deleted');
        fetchCategories();
      } else {
        toast.error(data.message || 'Failed to delete');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0B192C]">Category Management</h1>
          <p className="text-sm text-gray-500 font-semibold mt-1">Manage top-level product categories.</p>
        </div>
        <Button onClick={() => handleOpenModal()} variant="primary" className="font-extrabold uppercase tracking-widest shadow-lg shadow-[#0B192C]/20 flex items-center">
          <Plus size={18} className="mr-2" /> Add Category
        </Button>
      </div>

      <Card className="shadow-sm border-gray-200">
        <CardHeader className="bg-gray-50 border-b border-gray-200 rounded-t-lg">
          <CardTitle className="text-sm font-bold text-[#0B192C] flex items-center">
            <FolderTree size={18} className="mr-2 text-amber-500" /> All Categories
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
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Category Name</th>
                    <th className="px-6 py-4">Slug</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Order</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-400 font-semibold">
                        No categories found. Create your first category above.
                      </td>
                    </tr>
                  ) : (
                    categories.map((category) => (
                      <tr key={category.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-400">#{category.id}</td>
                        <td className="px-6 py-4 font-extrabold text-[#0B192C]">{category.name}</td>
                        <td className="px-6 py-4 font-medium text-gray-500 text-xs">{category.slug}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest rounded ${
                            category.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {category.isActive ? 'Active' : 'Hidden'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-600">{category.displayOrder}</td>
                        <td className="px-6 py-4 text-right space-x-3">
                          <button 
                            onClick={() => router.push(`/admin/categories/${category.id}/attributes`)}
                            className="text-blue-500 hover:text-blue-600 transition-colors font-bold text-xs mr-2"
                            title="Manage Attributes"
                          >
                            Attributes
                          </button>
                          <button 
                            onClick={() => handleOpenModal(category)}
                            className="text-amber-500 hover:text-amber-600 transition-colors"
                            title="Edit Category"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(category.id)} 
                            className="text-red-400 hover:text-red-600 transition-colors"
                            title="Delete Category"
                          >
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-extrabold text-[#0B192C]">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Category Name</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name}
                    onChange={handleNameChange}
                    className="w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm font-semibold text-[#0B192C]"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">URL Slug</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.slug}
                    onChange={(e) => setFormData({...formData, slug: e.target.value})}
                    className="w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm font-semibold text-gray-600"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Description</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm font-semibold text-[#0B192C] min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Status</label>
                    <select 
                      value={formData.isActive ? 'true' : 'false'}
                      onChange={(e) => setFormData({...formData, isActive: e.target.value === 'true'})}
                      className="w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm font-semibold text-[#0B192C]"
                    >
                      <option value="true">Active (Visible)</option>
                      <option value="false">Hidden</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Display Order</label>
                    <input 
                      type="number" 
                      value={formData.displayOrder}
                      onChange={(e) => setFormData({...formData, displayOrder: parseInt(e.target.value) || 0})}
                      className="w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm font-semibold text-[#0B192C]"
                    />
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="font-extrabold uppercase tracking-widest text-xs">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="font-extrabold uppercase tracking-widest shadow-lg shadow-[#0B192C]/20 text-xs">
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
