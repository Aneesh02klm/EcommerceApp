'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

const menuItems = [
  { name: 'My Profile', href: '/account' },
  { name: 'My Orders', href: '/account/orders' },
  { name: 'My Wishlist', href: '/wishlist' },
  { name: 'My Coupons', href: '/account/coupons' },
  { name: 'My Rewards', href: '/account/rewards' },
  { name: 'Notifications', href: '/account/notifications' },
  { name: 'Notification Settings', href: '/account/notification-settings' },
  { name: 'Addresses', href: '/account/addresses' },
  { name: 'Payment Methods', href: '/account/payments' },
  { name: 'Support', href: '/account/support' },
  { name: 'FAQ', href: '/account/faq' },
  { name: 'Privacy and Security', href: '/account/privacy' },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (mounted && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isAuthenticated, router]);

  if (!mounted || !isAuthenticated) {
    return <div className="min-h-screen bg-gray-50"></div>;
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="bg-gray-50 min-h-screen pt-0 md:pt-6 pb-24 md:pb-20">
      <div className="container mx-auto px-4 max-w-7xl md:mt-0">
        {/* Mobile Sub-page Header */}
        {pathname !== '/account' && (
          <div className="md:hidden bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 mb-4 sticky top-[68px] z-40 shadow-sm">
            <Link href="/account" className="p-2 -ml-2 text-[#0B192C] hover:bg-gray-50 rounded-full transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </Link>
            <h1 className="text-lg font-extrabold text-[#0B192C]">
              {menuItems.find(i => i.href === pathname)?.name || 'My Account'}
            </h1>
          </div>
        )}

        {/* Mobile Root Header */}
        {pathname === '/account' && (
          <div className="md:hidden bg-white border-b border-gray-100 px-5 py-4 flex items-center mb-4 sticky top-[68px] z-40 shadow-sm">
            <h1 className="text-2xl font-black text-[#0B192C]">My Account</h1>
          </div>
        )}

        
        <div className="hidden md:flex text-xs text-gray-500 font-semibold mb-6 gap-2">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/account">My Account</Link>
          <span>/</span>
          <span className="text-[#0B192C] font-extrabold">Profile Overview</span>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Desktop Sidebar Navigation */}
          <aside className="hidden md:block w-64 flex-shrink-0 mb-0">
            <div className="bg-white rounded-md shadow-sm border border-gray-100 py-3">
              <nav className="flex flex-col">
                {menuItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`px-6 py-3 text-sm transition-colors ${
                        isActive 
                          ? 'bg-[#FDF9F1] text-amber-500 font-extrabold border-l-2 border-amber-500' 
                          : 'text-[#0B192C] font-bold hover:bg-gray-50 border-l-2 border-transparent'
                      }`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
                
                <div className="mt-4">
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-6 py-3 text-sm font-bold text-red-500 hover:bg-gray-50 transition-colors border-l-2 border-transparent"
                  >
                    Logout
                  </button>
                </div>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
