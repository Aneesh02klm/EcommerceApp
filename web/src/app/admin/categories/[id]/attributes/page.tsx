'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';
import { ArrowLeft, Plus, Trash2, Save, Loader2, GripVertical, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

type SpecificationTemplate = Record<string, string[]>;

export default function CategoryAttributesPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { token } = useAuthStore();

  const [category, setCategory] = useState<any>(null);
  const [template, setTemplate] = useState<SpecificationTemplate>({});
  
  const [masterSpecs, setMasterSpecs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  useEffect(() => {
    fetchCategory();
    fetchMasterSpecs();
  }, [id]);

  const fetchCategory = async () => {
    try {
      const res = await fetch(`${API}/api/v1/categories/${id}`);
      const json = await res.json();
      if (json.success) {
        setCategory(json.data);
        const parsed = json.data.specificationTemplate ? JSON.parse(json.data.specificationTemplate) : {};
        setTemplate(parsed);
      } else {
        toast.error('Category not found');
        router.push('/admin/categories');
      }
    } catch (err) {
      toast.error('Failed to load category');
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterSpecs = async () => {
    try {
      const res = await fetch(`${API}/api/v1/specifications`, { headers: { 'Authorization': `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setMasterSpecs(json.data);
    } catch(err) {}
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedCategory = {
        ...category,
        specificationTemplate: JSON.stringify(template)
      };

      const res = await fetch(`${API}/api/v1/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updatedCategory)
      });
      
      const json = await res.json();
      if (json.success) {
        toast.success('Category attributes mapped securely.');
        setCategory(json.data);
      } else {
        toast.error(json.message || 'Failed to save');
      }
    } catch (err) {
      toast.error('Network error during save');
    } finally {
      setSaving(false);
    }
  };

  const addGroup = () => {
    if (!newGroupName.trim() || template[newGroupName.trim()]) return;
    const groupName = newGroupName.trim();
    // Auto-fill from master if available
    const masterGroupSpecs = masterSpecs.filter(s => s.groupName === groupName).map(s => s.name);
    setTemplate(prev => ({ ...prev, [groupName]: masterGroupSpecs }));
    setNewGroupName('');
  };

  const removeGroup = (group: string) => {
    const next = { ...template };
    delete next[group];
    setTemplate(next);
  };

  const removeAttribute = (group: string, idx: number) => {
    const next = { ...template };
    next[group] = next[group].filter((_, i) => i !== idx);
    setTemplate(next);
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-amber-500" size={32} /></div>;

  const masterGroups = Array.from(new Set(masterSpecs.map(s => s.groupName)));

  return (
    <div className="flex flex-col gap-6 max-w-4xl pb-20">
      <header className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => router.push('/admin/categories')} className="text-gray-400 hover:text-[#0B192C]">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-[#0B192C]">Attribute Mapping</h1>
            <p className="text-sm font-medium text-gray-500">Link Specification Groups to <span className="font-bold text-[#0B192C]">{category?.name}</span></p>
          </div>
        </div>
        <Button onClick={handleSave} variant="primary" className="flex items-center gap-2">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Mapping
        </Button>
      </header>

      <section className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-sm font-black text-[#0B192C] mb-4">Add Master Group</h3>
        <div className="flex gap-2">
          <select value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className="flex-1 border border-gray-200 rounded px-4 py-2 text-sm font-medium">
            <option value="">-- Select Group from Master List --</option>
            {masterGroups.map(g => (
              <option key={g as string} value={g as string}>{g as string}</option>
            ))}
          </select>
          <Button onClick={addGroup} variant="outline" className="flex items-center gap-2" disabled={!newGroupName}>
            <Plus size={16} /> Add Group
          </Button>
        </div>
      </section>

      <div className="space-y-6">
        {Object.keys(template).length === 0 ? (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-lg border-dashed">
            <Settings2 size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-400">No attribute groups mapped yet.</h3>
          </div>
        ) : (
          Object.entries(template).map(([group, attributes]) => (
            <div key={group} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h4 className="text-sm font-black text-[#0B192C] uppercase tracking-widest">{group}</h4>
                <button onClick={() => removeGroup(group)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>
              </div>
              <div className="p-4 space-y-2">
                {attributes.length === 0 && <p className="text-xs text-gray-400">No attributes. Add them in the Master List.</p>}
                {attributes.map((attr, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded p-2">
                    <GripVertical size={16} className="text-gray-300 cursor-move" />
                    <span className="flex-1 text-sm font-bold text-gray-700">{attr}</span>
                    <button onClick={() => removeAttribute(group, idx)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
