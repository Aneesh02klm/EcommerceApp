'use client';
import React from 'react';
import { Settings, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0B192C]">Global Settings</h1>
          <p className="text-sm font-medium text-gray-500">Configure core store parameters.</p>
        </div>
      </header>
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Store Name</label>
            <input defaultValue="Malieakal Electronics" className="w-full border border-gray-200 rounded p-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Support Email</label>
            <input defaultValue="support@malieakal.com" className="w-full border border-gray-200 rounded p-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Free Shipping Threshold (â‚¹)</label>
            <input defaultValue="5000" type="number" className="w-full border border-gray-200 rounded p-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Maintenance Mode</label>
            <select className="w-full border border-gray-200 rounded p-2 text-sm"><option value="false">Disabled</option><option value="true">Active (Offline)</option></select>
          </div>
        </div>
        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <Button variant="primary" className="flex items-center gap-2"><Save size={16}/> Save Settings</Button>
        </div>
      </div>
    </div>
  );
}
