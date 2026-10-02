'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useAuthStore } from '@/store/authStore';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
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
      <AdminSidebar />
      <main className="flex-1 ml-[260px] p-8">
        {children}
      </main>
    </div>
  );
}
