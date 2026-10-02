'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';
import { ArrowLeft, Plus, Trash2, Save, Loader2, GripVertical, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

type SpecificationTemplate = Record<string, string[]>;

export default function CategoryAttributesPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { token } = useAuthStore();

  const [category, setCategory] = useState<any>(null);
  const [template, setTemplate] = useState<SpecificationTemplate>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  useEffect(() => {
    fetchCategory();
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedCategory = {
        ...category,
        specificationTemplate: JSON.stringify(template)
      };

      const res = await fetch(`${API}/api/v1/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedCategory)
      });
      
      const json = await res.json();
      if (json.success) {
        toast.success('Category attributes saved securely.');
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
    const name = newGroupName.trim();
    if (!name) return;
    if (template[name]) {
      toast.error('Group already exists');
      return;
    }
    setTemplate({ ...template, [name]: [] });
    setNewGroupName('');
  };

  const deleteGroup = (group: string) => {
    if (window.confirm(`Are you sure you want to remove the entire '${group}' group and its attributes?`)) {
      const newTemplate = { ...template };
      delete newTemplate[group];
      setTemplate(newTemplate);
    }
  };

  const addAttribute = (group: string) => {
    const attr = window.prompt(`Enter new attribute name for '${group}':`);
    if (attr && attr.trim()) {
      if (template[group].includes(attr.trim())) {
        toast.error('Attribute already exists in this group');
        return;
      }
      setTemplate({
        ...template,
        [group]: [...template[group], attr.trim()]
      });
    }
  };

  const removeAttribute = (group: string, attrIndex: number) => {
    const newAttrs = [...template[group]];
    newAttrs.splice(attrIndex, 1);
    setTemplate({
      ...template,
      [group]: newAttrs
    });
  };

  if (loading) {
    return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="animate-spin text-amber-500" size={32} /></div>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      {/* Header */}
      <header className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div>
          <button 
            onClick={() => router.push('/admin/categories')}
            className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-[#0B192C] uppercase tracking-widest mb-3 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Categories
          </button>
          <h1 className="text-2xl font-serif font-black text-[#0B192C]">
            Manage Attributes: <span className="text-amber-500">{category?.name}</span>
          </h1>
          <p className="text-sm font-medium text-gray-500 mt-1 max-w-2xl">
            Configure dynamic specification templates. These attribute groups act as the source of truth for product entry forms and frontend filters.
          </p>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#0B192C] hover:bg-[#162a45] text-white font-bold text-[11px] uppercase tracking-widest px-6 py-3 rounded shadow-md transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save Template
        </button>
      </header>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left Column: Form to Add Group */}
        <div className="md:col-span-1 flex flex-col gap-6">
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4 text-[#0B192C]">
                <Settings2 size={18} className="text-amber-500" />
                <h3 className="font-bold">Add Attribute Group</h3>
              </div>
              <p className="text-xs text-gray-500 mb-4 font-medium leading-relaxed">
                Groups categorize technical specifications. Examples: "Processor & Memory", "Display Features", "Dimensions & Warranty".
              </p>
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="e.g. Dimensions"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addGroup()}
                  className="flex-1 p-2 border border-gray-300 rounded text-sm font-semibold text-[#0B192C] focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
                <button 
                  onClick={addGroup}
                  className="bg-amber-400 hover:bg-amber-300 text-[#0B192C] px-3 rounded flex items-center justify-center transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 shadow-sm bg-amber-50/30">
            <CardContent className="p-5">
              <h4 className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-2">Architectural Rules</h4>
              <ul className="text-xs text-gray-600 font-medium space-y-2 list-disc pl-4">
                <li>Changes here immediately affect Product creation forms.</li>
                <li>Do not rename existing attributes if products rely on them for filters.</li>
                <li>Group order determines display order on the product detail page.</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Template Editor */}
        <div className="md:col-span-2 flex flex-col gap-4">
          {Object.keys(template).length === 0 ? (
            <div className="bg-white border border-gray-200 border-dashed rounded-lg p-12 text-center flex flex-col items-center justify-center">
              <Settings2 size={32} className="text-gray-300 mb-3" />
              <h3 className="text-gray-400 font-bold mb-1">No Attributes Configured</h3>
              <p className="text-xs text-gray-400 font-medium max-w-sm">
                Add your first attribute group on the left to start building the specification schema for {category?.name}.
              </p>
            </div>
          ) : (
            Object.entries(template).map(([group, attributes]) => (
              <div key={group} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                {/* Group Header */}
                <div className="bg-gray-50 border-b border-gray-100 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GripVertical size={16} className="text-gray-400 cursor-grab" />
                    <h3 className="font-extrabold text-[#0B192C]">{group}</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => addAttribute(group)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center gap-1 transition-colors"
                    >
                      <Plus size={12} /> Add Field
                    </button>
                    <button 
                      onClick={() => deleteGroup(group)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Attributes List */}
                <div className="p-4">
                  {attributes.length === 0 ? (
                    <p className="text-xs text-gray-400 font-semibold italic pl-7">No fields added to this group yet.</p>
                  ) : (
                    <ul className="space-y-2 pl-7">
                      {attributes.map((attr, idx) => (
                        <li key={idx} className="flex items-center justify-between group/attr bg-white border border-gray-100 rounded px-3 py-2 hover:border-amber-200 transition-colors">
                          <span className="text-sm font-semibold text-gray-700">{attr}</span>
                          <button 
                            onClick={() => removeAttribute(group, idx)}
                            className="text-gray-300 hover:text-red-500 opacity-0 group-hover/attr:opacity-100 transition-opacity"
                          >
                            <Trash2 size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
