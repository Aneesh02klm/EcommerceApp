'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export function HideOnAdmin({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  if (isAdminRoute) {
    return null;
  }
  
  return <>{children}</>;
}
