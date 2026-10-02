'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Settings2, ArrowRight } from 'lucide-react';
import { toast } from '@/components/ui/Toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

export default function AdminSpecificationsRedirectPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API}/api/v1/categories`);
      const json = await res.json();
      if (json.success) setCategories(json.data);
    } catch (err) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0B192C]">Specifications Engine</h1>
          <p className="text-sm font-medium text-gray-500">Dynamic product specifications are managed per Category.</p>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-amber-500" size={32} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(c => (
            <div key={c.id} onClick={() => router.push(`/admin/categories/${c.id}/attributes`)} className="bg-white border border-gray-200 rounded-lg p-5 cursor-pointer hover:border-amber-400 hover:shadow-md transition-all group flex flex-col justify-between h-[120px]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-50 rounded flex items-center justify-center text-amber-500 group-hover:bg-amber-50 transition-colors">
                  <Settings2 size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#0B192C]">{c.name}</h3>
                  <p className="text-xs text-gray-500">{c.slug}</p>
                </div>
              </div>
              <div className="flex items-center justify-end text-[10px] font-bold text-amber-500 uppercase tracking-widest gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Configure Attributes <ArrowRight size={12} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
