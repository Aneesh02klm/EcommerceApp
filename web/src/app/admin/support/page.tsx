'use client';
import React from 'react';
import { Headphones, Filter } from 'lucide-react';
export default function SupportPage() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0B192C]">Support Tickets</h1>
          <p className="text-sm font-medium text-gray-500">Respond to customer inquiries and service requests.</p>
        </div>
      </header>
      <div className="bg-white p-12 text-center border border-gray-200 rounded-lg text-gray-400 font-bold"><Headphones size={48} className="mx-auto mb-4 opacity-50"/>Inbox Zero. No open tickets.</div>
    </div>
  );
}
