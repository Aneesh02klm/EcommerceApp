'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useAuthStore } from '@/store/authStore';
import { Loader2, Menu } from 'lucide-react';
import { NotificationBell } from '@/components/ui/NotificationBell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !isLoginPage) {
      if (!isAuthenticated) {
        router.replace('/admin/login');
      } else if (!(user?.roles?.some((r: any) => typeof r === 'string' ? r === 'Admin' : (r?.name === 'Admin' || r?.Name === 'Admin')))) {
        router.replace('/');
      }
    }
  }, [mounted, isAuthenticated, user, router, isLoginPage]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-amber-500" size={32} />
      </div>
    );
  }

  // If login page, just render it without sidebar or protection
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Still verifying auth?
  if (!isAuthenticated || !(user?.roles?.some((r: any) => typeof r === 'string' ? r === 'Admin' : (r?.name === 'Admin' || r?.Name === 'Admin')))) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-amber-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 w-full md:ml-[260px] flex flex-col min-h-screen overflow-x-hidden">
        <div className="bg-white border-b border-gray-200 h-16 px-4 md:px-8 flex items-center justify-between md:justify-end sticky top-0 z-30">
          <button className="md:hidden p-2 text-gray-500 hover:text-black" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="flex items-center gap-3 border-l border-gray-100 pl-4">
              <img src={user?.avatarUrl || "https://i.pravatar.cc/150?u=admin"} alt="Admin" className="w-8 h-8 rounded-full object-cover" />
              <div className="flex flex-col hidden sm:flex">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{Array.isArray(user?.roles) ? user.roles.map((r: any) => typeof r === 'string' ? r : (r.name || '')).join(', ') : 'ADMIN'}</span>
                <span className="text-sm font-bold text-[#0B192C] leading-none">{typeof user?.firstName === 'string' ? user?.firstName : 'Admin'} {typeof user?.lastName === 'string' ? user?.lastName : ''}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 md:p-8 flex-1 w-full max-w-full">
          {children}
        </div>
      </main>

    </div>
  );
}
