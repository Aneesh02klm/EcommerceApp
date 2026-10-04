'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Edit2, Trash2, Loader2, FolderTree, GripVertical } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useConfirm } from '@/components/ui/ConfirmProvider';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  showInTopNav: boolean;
  displayOrder: number;
}

function SortableRow({ category, router, handleOpenModal, handleDelete }: { category: Category, router: any, handleOpenModal: any, handleDelete: any }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging ? { position: 'relative' as any, zIndex: 9999, backgroundColor: '#fef3c7', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' } : {})
  };
  
  return (
    <tr ref={setNodeRef} style={style} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors group bg-white">
      <td className="px-4 py-4 w-10">
        <div {...attributes} {...listeners} className="cursor-grab text-gray-300 hover:text-amber-500 transition-colors">
          <GripVertical size={18} />
        </div>
      </td>
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
      <td className="px-6 py-4">
        {category.showInTopNav ? <span className="text-amber-500 font-bold text-xs">★ Top Nav</span> : <span className="text-gray-400 font-semibold text-xs">-</span>}
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
  );
}

export default function AdminCategoriesPage() {
  const { confirm } = useConfirm();
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
    showInTopNav: false
  });

  const sensors = useSensors(useSensor(PointerSensor));

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/categories`);
      const json = await res.json();
      if (json.success) setCategories(json.data.sort((a: Category, b: Category) => a.displayOrder - b.displayOrder));
    } catch (err) {
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = categories.findIndex(c => c.id === active.id);
      const newIndex = categories.findIndex(c => c.id === over.id);
      
      const newArray = arrayMove(categories, oldIndex, newIndex);
      // Optimistically update displayOrder on UI
      const updatedArray = newArray.map((item, index) => ({ ...item, displayOrder: index + 1 }));
      setCategories(updatedArray);

      try {
        const orderedIds = updatedArray.map(c => c.id);
        const res = await fetch(`${API}/api/v1/categories/reorder`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(orderedIds)
        });
        
        if (res.ok) {
          toast.success('Category order updated');
        } else {
          toast.error('Failed to sync new order with server');
          fetchCategories(); // revert
        }
      } catch (err) {
        toast.error('Network error during reorder');
        fetchCategories(); // revert
      }
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!editingCategory) {
      setFormData({
        ...formData,
        name: val,
        slug: val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      });
    } else {
      setFormData({...formData, name: val});
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingCategory ? 'PUT' : 'POST';
      const url = editingCategory ? `${API}/api/v1/categories/${editingCategory.id}` : `${API}/api/v1/categories`;
      
      const payload = {
          ...formData,
          displayOrder: editingCategory ? editingCategory.displayOrder : categories.length + 1
      };
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const json = await res.json();
      if (json.success) {
        toast.success(editingCategory ? 'Category updated' : 'Category created');
        setIsModalOpen(false);
        fetchCategories();
      } else {
        toast.error(json.message || 'Error saving category');
      }
    } catch (err) {
      toast.error('Failed to save category');
    }
  };

  const handleDelete = (id: number) => {
    confirm({
      title: 'Confirm Deletion',
      message: 'Are you sure you want to delete this category?',
      confirmText: 'Delete',
      onConfirm: async () => {
    try {
      const res = await fetch(`${API}/api/v1/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Category deleted');
        fetchCategories();
      } else {
        toast.error('Failed to delete');
      }
    } catch (err) {
      toast.error('Failed to delete category');
    }
      }
    });
  };

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        isActive: category.isActive,
        showInTopNav: category.showInTopNav
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        isActive: true,
        showInTopNav: false
      });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
        <div>
          <h1 className="text-2xl font-black text-[#0B192C]">Categories</h1>
          <p className="text-sm font-medium text-gray-500">Drag and drop rows to reorder navigation hierarchy.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-amber-400 hover:bg-amber-500 text-[#0B192C] font-extrabold uppercase tracking-widest text-xs gap-2">
          <Plus size={16} /> Add Category
        </Button>
      </header>

      <Card className="border-gray-200 shadow-sm rounded-xl overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin text-amber-500" size={32} /></div>
          ) : categories.length === 0 ? (
            <div className="text-center p-12 text-gray-400 font-semibold">No categories found. Create one above!</div>
          ) : (
            <div className="overflow-x-auto">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-[#0B192C] text-white text-[10px] uppercase tracking-widest">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg w-10"></th>
                      <th className="px-6 py-3">ID</th>
                      <th className="px-6 py-3">Category Name</th>
                      <th className="px-6 py-3">URL Slug</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Menu</th>
                      <th className="px-6 py-3">Order</th>
                      <th className="px-6 py-3 text-right rounded-tr-lg">Actions</th>
                    </tr>
                  </thead>
                  <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    <tbody>
                      {categories.map(category => (
                        <SortableRow key={category.id} category={category} router={router} handleOpenModal={handleOpenModal} handleDelete={handleDelete} />
                      ))}
                    </tbody>
                  </SortableContext>
                </table>
              </DndContext>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Top Navigation</label>
                    <label className="flex items-center space-x-2 mt-3 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={formData.showInTopNav}
                        onChange={(e) => setFormData({...formData, showInTopNav: e.target.checked})}
                        className="w-4 h-4 text-amber-500 focus:ring-amber-500 border-gray-300 rounded cursor-pointer"
                      />
                      <span className="text-sm font-semibold text-gray-700">Show in Top Menu</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="font-extrabold uppercase tracking-widest text-xs">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="font-extrabold uppercase tracking-widest shadow-lg shadow-[#0B192C]/20 text-xs bg-amber-500 hover:bg-amber-600">
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
