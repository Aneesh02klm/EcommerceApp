'use client';
import React from 'react';
import { Timer, Plus } from 'lucide-react';
export default function FlashSalesPage() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0B192C]">Flash Sales</h1>
          <p className="text-sm font-medium text-gray-500">Manage time-limited sales with countdown timers.</p>
        </div>
        <button className="flex items-center gap-2 bg-[#0B192C] text-white px-6 py-3 font-bold text-xs rounded"><Plus size={16}/> Create Sale</button>
      </header>
      <div className="bg-white p-12 text-center border border-gray-200 rounded-lg text-gray-400 font-bold"><Timer size={48} className="mx-auto mb-4 opacity-50"/>No active flash sales scheduled.</div>
    </div>
  );
}
