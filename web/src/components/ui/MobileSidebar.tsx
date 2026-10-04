'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronRight, User, MapPin, Clock, Phone, Mail } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { usePathname } from 'next/navigation';

export function MobileSidebar({ navCategories = [] }: { navCategories?: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const pathname = usePathname();

  // Close on navigate
  React.useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 -ml-2 text-[#0B192C] hover:bg-gray-100 rounded-md transition-colors"
        aria-label="Open Menu"
      >
        <Menu size={24} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <aside className="absolute top-0 left-0 bottom-0 w-[280px] bg-white flex flex-col shadow-2xl animate-in slide-in-from-left-full duration-300">
            {/* Header */}
            <div className="bg-[#0B192C] text-white p-5 flex justify-between items-start shrink-0">
              {isAuthenticated ? (
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-[#0B192C] font-black text-lg">
                    {user?.firstName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h3 className="font-bold leading-tight">{user?.firstName} {user?.lastName}</h3>
                    <p className="text-[10px] text-gray-300">{user?.email}</p>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="font-bold text-lg mb-1">Welcome!</h3>
                  <div className="flex gap-2 text-xs font-semibold">
                    <Link href="/login" className="text-amber-400 hover:underline">Login</Link>
                    <span className="text-gray-500">|</span>
                    <Link href="/register" className="text-amber-400 hover:underline">Register</Link>
                  </div>
                </div>
              )}
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white p-1">
                <X size={20} />
              </button>
            </div>

            {/* Menu */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50">
              <div className="bg-white mb-2 shadow-sm border-b border-gray-100">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-5 py-3">Shop Categories</h4>
                <div className="flex flex-col">
                  {navCategories.map((cat: any) => (
                    <Link 
                      key={cat.id} 
                      href={`/products/${cat.slug}`}
                      className="flex items-center justify-between px-5 py-3.5 border-t border-gray-50 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-amber-600 transition-colors"
                    >
                      {cat.name}
                      <ChevronRight size={16} className="text-gray-300" />
                    </Link>
                  ))}
                  <Link href="/products" className="px-5 py-3 text-sm font-bold text-amber-600 bg-amber-50/50 hover:bg-amber-50 transition-colors">
                    View All Categories â†’
                  </Link>
                </div>
              </div>

              {isAuthenticated && (
                <div className="bg-white mb-2 shadow-sm border-y border-gray-100">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-5 py-3">My Account</h4>
                  <div className="flex flex-col text-sm font-medium text-gray-700">
                    <Link href="/account/orders" className="px-5 py-3 border-t border-gray-50 flex items-center gap-3">
                      Orders
                    </Link>
                    <Link href="/wishlist" className="px-5 py-3 border-t border-gray-50 flex items-center gap-3">
                      Wishlist
                    </Link>
                    <Link href="/account" className="px-5 py-3 border-t border-gray-50 flex items-center gap-3">
                      Profile Details
                    </Link>
                    <button onClick={logout} className="px-5 py-3 border-t border-gray-50 text-left text-red-500 font-bold">
                      Logout
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-white shadow-sm border-y border-gray-100 mb-8">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-5 py-3">Contact Us</h4>
                <div className="flex flex-col text-xs text-gray-600 font-medium px-5 pb-5 gap-4 mt-2">
                  <p className="flex items-start gap-3">
                    <MapPin size={16} className="text-amber-500 shrink-0" />
                    <span>Malieakal Plaza, MG Road<br/>Kollam â€” 691001</span>
                  </p>
                  <p className="flex items-center gap-3">
                    <Phone size={16} className="text-amber-500 shrink-0" />
                    1800-123-4567
                  </p>
                  <p className="flex items-center gap-3">
                    <Clock size={16} className="text-amber-500 shrink-0" />
                    10:00 AM â€“ 8:00 PM Daily
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
