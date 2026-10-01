'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, FolderTree, Tags, Users, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const menuItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Products', href: '/admin/products', icon: ShoppingBag },
  { name: 'Categories', href: '/admin/categories', icon: FolderTree },
  { name: 'Brands', href: '/admin/brands', icon: Tags },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { name: 'Logistics', href: '/admin/logistics', icon: Tags }, // Using Tags icon, can change later
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  const { logout } = useAuthStore();
  
  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <aside className="w-64 bg-[#0B192C] text-white flex flex-col h-screen fixed top-0 left-0">
      <div className="p-6">
        <h2 className="text-xl font-bold tracking-tight text-amber-500">Malieakal CPANEL</h2>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (pathname.startsWith(`${item.href}/`) && item.href !== '/admin');
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${
                isActive 
                  ? 'bg-white/10 text-amber-500 font-extrabold border-l-4 border-amber-500' 
                  : 'text-gray-300 hover:bg-white/5 hover:text-white font-semibold'
              }`}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button onClick={handleLogout} className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white transition-colors w-full text-left font-bold">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
