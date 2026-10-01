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
    <div className="bg-gray-50 min-h-screen pt-6 pb-20">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Breadcrumb */}
        <div className="text-xs text-gray-500 font-semibold mb-6 flex gap-2">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/account">My Account</Link>
          <span>/</span>
          <span className="text-[#0B192C] font-extrabold">Profile Overview</span>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <aside className="w-full md:w-64 flex-shrink-0">
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
