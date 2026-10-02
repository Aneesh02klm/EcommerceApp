'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export function HideOnAdmin({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  
  const isAdminRoute = pathname?.startsWith('/admin');

  // Hard-stop condition: Admin users should not be on customer pages.
  useEffect(() => {
    if (isAuthenticated && user?.roles) {
      // Handle both string array ["Admin"] and object array [{name: "Admin"}] safely
      const hasAdminRole = user.roles.some((r: any) => 
        (typeof r === 'string' && r === 'Admin') || 
        (typeof r === 'object' && r !== null && r.name === 'Admin') ||
        (typeof r === 'object' && r !== null && r.Name === 'Admin')
      );
      
      if (hasAdminRole && !isAdminRoute) {
        router.replace('/admin/dashboard');
      }
    }
  }, [pathname, isAuthenticated, user, router, isAdminRoute]);

  if (isAdminRoute) {
    return null;
  }
  
  return <>{children}</>;
}
