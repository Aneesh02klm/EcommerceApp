'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';
import { Loader2, Plus, Edit2, Trash2, Settings2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

export default function SpecificationGroupsPage() {
  const { token } = useAuthStore();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ id: 0, name: '', displayOrder: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (token) fetchGroups();
  }, [token]);

  const fetchGroups = async () => {
    try {
      const res = await fetch(`${API}/api/v1/specifications/groups`, { headers: { 'Authorization': `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setGroups(json.data);
    } catch (err) {
      toast.error('Failed to load specification groups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Group name is required');
      return;
    }
    setIsSubmitting(true);
    try {
      const url = isEditing ? `${API}/api/v1/specifications/groups/${formData.id}` : `${API}/api/v1/specifications/groups`;
      const method = isEditing ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      
      if (json.success) {
        toast.success(isEditing ? 'Group updated successfully' : 'Group created successfully');
        setIsModalOpen(false);
        fetchGroups();
      } else {
        toast.error(json.message || 'Failed to save');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this master group?')) return;
    try {
      const res = await fetch(`${API}/api/v1/specifications/groups/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message || 'Group deleted successfully');
        fetchGroups();
      } else {
        toast.error(json.message || 'Failed to delete');
      }
    } catch (err) {
      toast.error('Network error. Failed to delete');
    }
  };

  const openNew = () => {
    setFormData({ id: 0, name: '', displayOrder: 0 });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEdit = (group: any) => {
    setFormData({ ...group });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-amber-500" size={32} /></div>;

  return (
    <div className="flex flex-col gap-6 max-w-4xl pb-20">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0B192C]">Master Groups</h1>
          <p className="text-sm font-medium text-gray-500">Manage top-level specification categories (e.g. Display, Performance).</p>
        </div>
        <Button onClick={openNew} variant="primary" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
          <Plus size={16} /> New Master Group
        </Button>
      </header>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {groups.length === 0 ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center">
             <Settings2 size={32} className="mb-2 opacity-30" />
             <p className="text-sm font-semibold">No master groups exist yet.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#f8f9fc] border-b border-gray-200 text-[10px] uppercase font-black tracking-widest text-gray-500">
              <tr>
                <th className="py-4 px-6">Group Name</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {groups.map((g: any) => (
                <tr key={g.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <GripVertical size={16} className="text-gray-300 cursor-move opacity-50" />
                      <span className="font-black text-[#0B192C] uppercase tracking-widest text-xs">{g.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(g)} className="p-2 text-blue-500 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(g.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-[#0B192C] p-4 text-white flex justify-between items-center">
              <h2 className="font-bold flex items-center gap-2"><Settings2 size={18} /> {isEditing ? 'Rename' : 'New'} Master Group</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">&times;</button>
            </div>
            <form onSubmit={handleCreateOrEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Group Name</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none" placeholder="e.g. General, Display Features" />
                <p className="text-xs text-gray-400 mt-2">Note: Renaming a group will cascade update all attributes currently assigned to it.</p>
              </div>
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-sm font-bold text-gray-500 hover:text-gray-700">Cancel</button>
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 size={16} className="animate-spin mr-2 inline" /> : null} Save Group
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
