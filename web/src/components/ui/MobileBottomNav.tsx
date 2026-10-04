'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Grid, Heart, ShoppingBag, User } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

export function MobileBottomNav() {
  const pathname = usePathname();
  const cartItems = useCartStore(s => s.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Don't show bottom nav in admin area
  if (pathname?.startsWith('/admin')) return null;
  // Hide on Product Details Page to allow Sticky Add to Cart bar
  if (pathname?.includes('/product/') || pathname?.startsWith('/checkout')) return null;

  const navItems = [
    { label: 'Home', icon: Home, href: '/' },
    { label: 'Shop', icon: Grid, href: '/products' },
    { label: 'Wishlist', icon: Heart, href: '/wishlist' },
    { label: 'Cart', icon: ShoppingBag, href: '/cart', badge: cartCount },
    { label: 'Account', icon: User, href: '/account' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex justify-around items-center h-16 pb-safe pt-1 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
        return (
          <Link key={item.label} href={item.href} className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${isActive ? 'text-[#0B192C]' : 'text-gray-400'}`}>
            <div className="relative">
              <item.icon size={20} className={isActive ? 'fill-[#0B192C] text-[#0B192C]' : ''} />
              {item.badge != null && item.badge > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {item.badge}
                </span>
              )}
            </div>
            <span className={`text-[10px] font-bold tracking-tight ${isActive ? 'text-[#0B192C]' : 'text-gray-500'}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
