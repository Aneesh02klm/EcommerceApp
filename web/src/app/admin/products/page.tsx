'use client';

import React from 'react';
import { 
  Search, Bell, Plus, Filter, ChevronDown, Edit2, Trash2, 
  ChevronLeft, ChevronRight 
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminProducts() {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Top Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#0B192C]">Products</h1>
        <div className="flex items-center gap-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search orders, bills, customer IDs..." 
              className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-md text-sm w-[320px] focus:outline-none focus:ring-1 focus:ring-[#0B192C]"
            />
          </div>
          <div className="relative cursor-pointer">
            <Bell size={20} className="text-gray-600" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full border border-gray-50"></span>
          </div>
          <div className="flex items-center gap-3">
            <img src="https://i.pravatar.cc/150?u=admin" alt="Admin" className="w-9 h-9 rounded-full object-cover" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">System Owner</span>
              <span className="text-sm font-bold text-[#0B192C] leading-none">George Malieakal</span>
            </div>
          </div>
        </div>
      </header>

      {/* Page Title & Add Button */}
      <section className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-serif font-black text-[#0B192C] tracking-tight mb-1">Products Directory</h2>
          <p className="text-sm font-medium text-gray-500">Manage Malieakal Plaza physical & virtual premium inventory</p>
        </div>
        <button onClick={() => router.push('/admin/products/new')} className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-[#0B192C] font-bold text-[11px] uppercase tracking-widest px-6 py-3 rounded shadow-sm transition-colors">
          <Plus size={16} /> ADD NEW PRODUCT
        </button>
      </section>

      {/* Filters Bar */}
      <section className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Search by name, SKU, or specs..." 
            className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm w-full focus:outline-none focus:border-amber-400"
          />
        </div>
        
        <div className="flex items-center gap-4">
          <FilterDropdown label="Category: All" />
          <FilterDropdown label="Brand: All" />
          <FilterDropdown label="Status: Published" />
          <FilterDropdown label="Stock: All" />
        </div>
      </section>

      {/* Data Table */}
      <section className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-white">
                <th className="py-4 pl-6 pr-2 w-12"><input type="checkbox" className="rounded border-gray-300 text-[#0B192C] focus:ring-[#0B192C]" /></th>
                <th className="py-4 px-3">Image</th>
                <th className="py-4 px-3">Product Name</th>
                <th className="py-4 px-3">SKU</th>
                <th className="py-4 px-3">Category</th>
                <th className="py-4 px-3">Brand</th>
                <th className="py-4 px-3">MRP</th>
                <th className="py-4 px-3 text-[#0B192C]">Selling Price</th>
                <th className="py-4 px-3">Stock</th>
                <th className="py-4 px-3">Status</th>
                <th className="py-4 pr-6 pl-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[#0B192C] font-semibold divide-y divide-gray-50">
              <ProductRow 
                name="Inverter Split AC 3-S..." sku="AR18CY3ZAWK" category="Air Conditioners" 
                brand="Samsung" mrp="₹52,990" price="₹38,990" stock="45" status="Published" 
              />
              <ProductRow 
                name="Smart Inverter Doubl..." sku="GL-S292RDSY" category="Refrigerators" 
                brand="LG" mrp="₹32,990" price="₹24,490" stock="12" status="Published" 
              />
              <ProductRow 
                name="Bravia 55-inch 4K Ul..." sku="KD-55X74L" category="Televisions" 
                brand="Sony" mrp="₹74,900" price="₹54,990" stock="18" status="Published" 
              />
              <ProductRow 
                name="Front Load Fully Auto..." sku="WAJ28262IN" category="Washing Machines" 
                brand="Bosch" mrp="₹48,900" price="₹36,490" stock="8" status="Draft" 
              />
              <ProductRow 
                name="Galaxy S24 Ultra 5G..." sku="SM-S928B" category="Mobiles" 
                brand="Samsung" mrp="₹1,39,999" price="₹1,24,999" stock="22" status="Published" 
              />
            </tbody>
          </table>
        </div>
        
        {/* Footer Actions & Pagination */}
        <div className="bg-white border-t border-gray-100 p-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-sm font-medium text-gray-500">Selected: 0 items</span>
            <div className="flex items-center gap-3">
              <button className="text-xs font-bold text-[#0B192C] bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded shadow-sm transition-colors">Archive</button>
              <button className="text-xs font-bold text-[#0B192C] bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded shadow-sm transition-colors">Update Pricing</button>
              <button className="text-xs font-bold text-[#0B192C] bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded shadow-sm transition-colors">Export</button>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm font-medium text-gray-500">
            <span>Showing 1-20 of 1,847 products</span>
            <div className="flex items-center gap-1">
              <button className="p-1 border border-gray-200 rounded hover:bg-gray-50 text-gray-400 hover:text-[#0B192C]"><ChevronLeft size={16} /></button>
              <button className="p-1 border border-gray-200 rounded hover:bg-gray-50 text-gray-400 hover:text-[#0B192C]"><ChevronRight size={16} /></button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FilterDropdown({ label }: { label: string }) {
  return (
    <button className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 px-3 py-2 rounded text-[11px] font-bold text-[#0B192C] transition-colors">
      {label} <ChevronDown size={14} className="text-gray-400" />
    </button>
  );
}

function ProductRow({ name, sku, category, brand, mrp, price, stock, status }: any) {
  return (
    <tr className="hover:bg-gray-50 transition-colors group">
      <td className="py-4 pl-6 pr-2"><input type="checkbox" className="rounded border-gray-300 text-[#0B192C] focus:ring-[#0B192C]" /></td>
      <td className="py-4 px-3"><div className="w-10 h-10 bg-gray-100 rounded border border-gray-200"></div></td>
      <td className="py-4 px-3">{name}</td>
      <td className="py-4 px-3 text-gray-400 font-medium text-xs">{sku}</td>
      <td className="py-4 px-3 text-gray-500 font-medium">{category}</td>
      <td className="py-4 px-3">{brand}</td>
      <td className="py-4 px-3 text-gray-400 line-through font-medium text-xs">{mrp}</td>
      <td className="py-4 px-3 font-black text-[#0B192C]">{price}</td>
      <td className="py-4 px-3 text-gray-500 font-medium">{stock}</td>
      <td className="py-4 px-3">
        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
          status === 'Published' ? 'bg-[#e8f5ed] text-[#1a8b44]' : 'bg-amber-50 text-amber-600'
        }`}>
          {status}
        </span>
      </td>
      <td className="py-4 pr-6 pl-3 text-right">
        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="text-gray-400 hover:text-amber-500"><Edit2 size={16} /></button>
          <button className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
        </div>
      </td>
    </tr>
  );
}
