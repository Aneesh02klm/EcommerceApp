'use client';
import React from 'react';
import { FileText, Plus } from 'lucide-react';
export default function ContentPage() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0B192C]">Content Management (CMS)</h1>
          <p className="text-sm font-medium text-gray-500">Manage Blogs, FAQs, and static marketing copy.</p>
        </div>
        <button className="flex items-center gap-2 bg-[#0B192C] text-white px-6 py-3 font-bold text-xs rounded"><Plus size={16}/> Create Post</button>
      </header>
      <div className="bg-white p-12 text-center border border-gray-200 rounded-lg text-gray-400 font-bold"><FileText size={48} className="mx-auto mb-4 opacity-50"/>No content records found.</div>
    </div>
  );
}
