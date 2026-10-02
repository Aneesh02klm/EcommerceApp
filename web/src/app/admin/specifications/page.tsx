'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';
import { Loader2, Plus, Edit2, Trash2, Settings2, ChevronDown, ChevronRight, Layers } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

export default function GlobalSpecificationsPage() {
  const { token } = useAuthStore();
  const [specs, setSpecs] = useState<any[]>([]);
  const [masterGroups, setMasterGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ id: 0, name: '', groupName: '', dataType: 'Text', isRequired: false, displayOrder: 0, isActive: true });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Accordion state
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [specsRes, groupsRes] = await Promise.all([
        fetch(`${API}/api/v1/specifications`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API}/api/v1/specifications/groups`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      const specsJson = await specsRes.json();
      const groupsJson = await groupsRes.json();
      
      if (specsJson.success) setSpecs(specsJson.data);
      if (groupsJson.success) setMasterGroups(groupsJson.data.map((g: any) => g.name));
    } catch (err) {
      toast.error('Failed to load specifications');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.groupName) {
      toast.error('Please select a group assignment.');
      return;
    }
    setIsSubmitting(true);
    try {
      const url = isEditing ? `${API}/api/v1/specifications/${formData.id}` : `${API}/api/v1/specifications`;
      const method = isEditing ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      
      if (json.success) {
        toast.success(isEditing ? 'Updated successfully' : 'Created successfully');
        setIsModalOpen(false);
        fetchData();
        // Auto-expand the group so the user can see their addition
        setExpandedGroups(prev => {
          const next = new Set(prev);
          next.add(formData.groupName);
          return next;
        });
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
    if (!confirm('Are you sure you want to delete this specification?')) return;
    try {
      const res = await fetch(`${API}/api/v1/specifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Deleted successfully');
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const openNew = (defaultGroup = '') => {
    setFormData({ id: 0, name: '', groupName: defaultGroup, dataType: 'Text', isRequired: false, displayOrder: 0, isActive: true });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEdit = (spec: any) => {
    setFormData({ ...spec });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  const toggleAll = () => {
    if (expandedGroups.size === masterGroups.length) {
      setExpandedGroups(new Set()); // Collapse all
    } else {
      setExpandedGroups(new Set(masterGroups)); // Expand all
    }
  };

  const addNewMasterGroup = async () => {
    const name = prompt('Enter the name of the new Master Group:');
    if (!name || !name.trim()) return;
    
    try {
      const res = await fetch(`${API}/api/v1/specifications/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim() })
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Group created');
        fetchData();
        setFormData(prev => ({ ...prev, groupName: name.trim() }));
      } else {
        toast.error(json.message || 'Failed to create group');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-amber-500" size={32} /></div>;

  const isAllExpanded = expandedGroups.size === masterGroups.length && masterGroups.length > 0;

  return (
    <div className="flex flex-col gap-6 max-w-7xl pb-20">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0B192C]">Specification Master</h1>
          <p className="text-sm font-medium text-gray-500">Manage all specification attributes and group them globally.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={toggleAll} variant="outline" className="text-xs font-bold uppercase tracking-widest">
            {isAllExpanded ? 'Collapse All' : 'Expand All'}
          </Button>
          <Button onClick={() => openNew('')} variant="primary" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
            <Plus size={16} /> New Attribute
          </Button>
        </div>
      </header>

      <div className="space-y-4">
        {masterGroups.map(group => {
          const isExpanded = expandedGroups.has(group);
          const groupSpecs = specs.filter(s => s.groupName === group);
          
          return (
            <div key={group} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-all">
              <div 
                className="bg-gray-50 px-6 py-3 flex items-center justify-between cursor-pointer select-none border-b border-transparent hover:bg-gray-100 transition-colors"
                onClick={() => toggleGroup(group)}
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
                  <h3 className="text-xs font-black text-[#0B192C] uppercase tracking-widest">{group}</h3>
                  <span className="ml-2 text-[10px] font-bold text-gray-400 bg-white px-2 py-0.5 rounded border border-gray-200">{groupSpecs.length} items</span>
                </div>
                <div className="flex items-center">
                  <button 
                    onClick={(e) => { e.stopPropagation(); openNew(group); }}
                    className="text-amber-500 hover:text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1 rounded flex items-center gap-1 text-[10px] font-black uppercase tracking-widest transition-colors"
                  >
                    <Plus size={12} /> Add
                  </button>
                </div>
              </div>
              
              {isExpanded && (
                <div className="border-t border-gray-100">
                  {groupSpecs.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 flex flex-col items-center">
                       <Layers size={32} className="mb-2 opacity-30" />
                       <p className="text-sm font-semibold">No attributes found in this group.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <tbody className="divide-y divide-gray-100">
                        {groupSpecs.map((spec: any) => (
                          <tr key={spec.id} className="hover:bg-gray-50 transition-colors group">
                            <td className="px-6 py-4 font-bold text-[#0B192C] w-1/3">{spec.name}</td>
                            <td className="px-6 py-4 text-gray-500 w-1/3">Type: <span className="font-semibold">{spec.dataType}</span></td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEdit(spec)} className="p-2 text-blue-500 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                                <button onClick={() => handleDelete(spec.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {masterGroups.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Settings2 size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-400">No master groups exist yet.</h3>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-[#0B192C] p-4 text-white flex justify-between items-center">
              <h2 className="font-bold flex items-center gap-2"><Settings2 size={18} /> {isEditing ? 'Edit' : 'New'} Attribute</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">&times;</button>
            </div>
            <form onSubmit={handleCreateOrEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Attribute Name</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none" placeholder="e.g. RAM, Screen Size" />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Group Assignment</label>
                <div className="flex gap-2">
                  <select required value={formData.groupName} onChange={e => setFormData({...formData, groupName: e.target.value})} className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none">
                    <option value="" disabled>-- Select a Master Group --</option>
                    {masterGroups.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                  <button type="button" onClick={addNewMasterGroup} className="bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 px-3 py-2 rounded text-sm font-bold transition-colors" title="Add New Master Group">
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Data Type</label>
                  <select value={formData.dataType} onChange={e => setFormData({...formData, dataType: e.target.value})} className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none">
                    <option value="Text">Text</option>
                    <option value="Number">Number</option>
                    <option value="Boolean">Boolean (Yes/No)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Display Order</label>
                  <input type="number" value={formData.displayOrder} onChange={e => setFormData({...formData, displayOrder: parseInt(e.target.value) || 0})} className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none" />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-sm font-bold text-gray-500 hover:text-gray-700">Cancel</button>
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 size={16} className="animate-spin mr-2 inline" /> : null} Save Attribute
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
