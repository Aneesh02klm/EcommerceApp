'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutGrid, Package, ShoppingCart, Users, Box, Megaphone, LogOut, 
  FileText, ShieldCheck, Headphones, BarChart2, Settings, ChevronDown, ChevronUp
, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const menuStructure = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutGrid },
  { 
    name: 'Products', href: '/admin/products', icon: Package, 
    children: [
      { name: 'All Products', href: '/admin/products' },
      { name: 'Categories', href: '/admin/categories' },
      { name: 'Brands', href: '/admin/brands' },
      { name: 'Specification Groups', href: '/admin/specification-groups' },
        { name: 'Specifications', href: '/admin/specifications' }
    ]
  },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Staff Management', href: '/admin/staff', icon: ShieldCheck },
  { name: 'Inventory', href: '/admin/inventory', icon: Box },
  { 
    name: 'Marketing', href: '/admin/marketing', icon: Megaphone,
    children: [
      { name: 'Campaigns', href: '/admin/campaigns' },
      { name: 'Flash Sales', href: '/admin/flash-sales' },
      { name: 'Catalog Promotions', href: '/admin/catalog-promotions' },
      { name: 'Coupons', href: '/admin/coupons' },
      { name: 'Scratch & Win', href: '/admin/scratch-win' },
      { name: 'Banners', href: '/admin/banners' },
      { name: 'Notifications', href: '/admin/notifications' }
    ]
  },
  { name: 'Storefront CMS', href: '/admin/storefront', icon: LayoutDashboard },
  { name: 'Content', href: '/admin/content', icon: FileText },
  { name: 'Warranty', href: '/admin/warranty', icon: ShieldCheck },
  { name: 'Support', href: '/admin/support', icon: Headphones },
  { name: 'Reports', href: '/admin/reports', icon: BarChart2 },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar({ isOpen, onClose }: { isOpen?: boolean, onClose?: () => void }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<string[]>(['Products', 'Marketing']);

  const toggleExpand = (name: string) => {
    setExpanded(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-opacity" 
          onClick={onClose} 
        />
      )}
      <aside className={`w-[260px] bg-[#0B1526] text-[#A0AABF] flex flex-col h-screen fixed top-0 left-0 border-r border-[#1a2639] overflow-y-auto custom-scrollbar z-50 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
      
      {/* Brand Header */}
      <div className="p-6 pb-8 border-b border-[#1a2639]">
        <h1 className="text-xl font-serif font-black text-white tracking-widest uppercase mb-1">Malieakal</h1>
        <div className="flex items-center text-[8px] font-black uppercase tracking-widest text-[#fbbf24]">
          <span>Control Panel</span>
          <span className="mx-1.5">•</span>
          <span>Est. 1979</span>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 py-6 space-y-1">
        {menuStructure.map((item) => {
          const isActiveExact = pathname === item.href;
          const hasActiveChild = item.children?.some(child => pathname.startsWith(child.href));
          const isParentActive = isActiveExact || hasActiveChild;
          const isExpanded = expanded.includes(item.name);
          const Icon = item.icon;
          
          return (
            <div key={item.name} className="px-3">
              {item.children ? (
                <div>
                  <button 
                    onClick={() => toggleExpand(item.name)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-md transition-colors text-sm font-semibold ${isParentActive ? 'text-white' : 'hover:bg-white/5 hover:text-white'}`}
                  >
                    <div className="flex items-center gap-3 flex-1 overflow-hidden pr-2">
                      <Icon size={18} className={isParentActive ? 'text-[#fbbf24] flex-shrink-0' : 'text-gray-400 flex-shrink-0'} strokeWidth={isParentActive ? 2.5 : 2} />
                      <span className="truncate text-left">{item.name}</span>
                    </div>
                    {isExpanded ? <ChevronUp size={14} className="text-gray-500 flex-shrink-0" /> : <ChevronDown size={14} className="text-gray-500 flex-shrink-0" />}
                  </button>
                  
                  {isExpanded && (
                    <div className="mt-1 mb-2 ml-10 space-y-1 border-l border-[#1a2639] pl-3 py-1">
                      {item.children.map(child => {
                        const childActive = pathname === child.href;
                        return (
                          <Link 
                            key={child.name} 
                            href={child.href}
                            onClick={onClose}
                            className={`block px-3 py-2 rounded-md text-xs font-medium transition-colors truncate ${childActive ? 'bg-white/10 text-white font-bold' : 'text-[#8a96ac] hover:text-white'}`}
                          >
                            {child.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-md transition-colors text-sm font-semibold ${isActiveExact ? 'bg-white/5 text-white border-l-[3px] border-[#fbbf24]' : 'hover:bg-white/5 hover:text-white'}`}
                >
                  <div className="flex items-center gap-3 flex-1 overflow-hidden">
                    <Icon size={18} className={isActiveExact ? 'text-[#fbbf24] flex-shrink-0' : 'text-gray-400 flex-shrink-0'} strokeWidth={isActiveExact ? 2.5 : 2} />
                    <span className="truncate text-left">{item.name}</span>
                  </div>
                </Link>
              )}
            </div>
          );
        })}
      </nav>

            {/* Footer */}
      <div className="p-6 mt-auto border-t border-[#1a2639]">
        <button onClick={() => { useAuthStore.getState().logout(); window.location.href = '/admin/login'; }} className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-3 rounded-md transition-colors text-xs font-bold uppercase tracking-widest mb-4">
          <LogOut size={14} /> Logout
        </button>
        <p className="text-[10px] text-[#5e6b82] font-medium text-center">v2.6.4 â€¢ Kollam Hub</p>
      </div>
    </aside>
    </>
  );
}
