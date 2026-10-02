'use client';
import React from 'react';
import { ShieldCheck, Plus } from 'lucide-react';
export default function WarrantyPage() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0B192C]">Warranty Claims</h1>
          <p className="text-sm font-medium text-gray-500">Track and approve RMA and Warranty requests.</p>
        </div>
      </header>
      <div className="bg-white p-12 text-center border border-gray-200 rounded-lg text-gray-400 font-bold"><ShieldCheck size={48} className="mx-auto mb-4 opacity-50"/>No active warranty claims.</div>
    </div>
  );
}
