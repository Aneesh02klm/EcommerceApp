'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export function UserNavClient() {
  const [mounted, setMounted] = useState(false);
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-2.5 pl-5 border-l border-gray-200 text-[#0B192C]">
        <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 animate-pulse"></div>
        <div className="hidden sm:block leading-none">
          <div className="h-2 w-10 bg-gray-100 rounded mb-1 animate-pulse"></div>
          <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={isAuthenticated ? "/account" : "/login"}
      className="flex items-center gap-2.5 pl-5 border-l border-gray-200 text-[#0B192C] hover:text-amber-500 transition-colors"
    >
      <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
        <User size={17} className={isAuthenticated ? "text-amber-500" : "text-gray-500"} />
      </div>
      <div className="hidden sm:block leading-none">
        <p className="text-[9px] text-gray-400 font-semibold">{isAuthenticated ? 'Welcome back' : 'Welcome'}</p>
        <p className="text-xs font-extrabold uppercase tracking-widest mt-0.5">
          {isAuthenticated ? user?.firstName : 'Sign In'}
        </p>
      </div>
    </Link>
  );
}
