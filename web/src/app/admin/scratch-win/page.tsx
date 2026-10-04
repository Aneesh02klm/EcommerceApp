'use client';
import React from 'react';
import { Gift, Plus } from 'lucide-react';
export default function ScratchWinPage() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
        <div>
          <h1 className="text-2xl font-black text-[#0B192C]">Scratch & Win Engine</h1>
          <p className="text-sm font-medium text-gray-500">Configure post-purchase reward pools and logic.</p>
        </div>
        <button className="flex items-center gap-2 bg-[#0B192C] text-white px-6 py-3 font-bold text-xs rounded"><Plus size={16}/> Configure Pool</button>
      </header>
      <div className="bg-white p-12 text-center border border-gray-200 rounded-lg text-gray-400 font-bold"><Gift size={48} className="mx-auto mb-4 opacity-50"/>No reward pools configured.</div>
    </div>
  );
}
