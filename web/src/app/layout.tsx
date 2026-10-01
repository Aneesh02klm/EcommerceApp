import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { Suspense } from 'react';
import { SearchBar } from '@/components/ui/SearchBar';
import { CategoryNavClient } from '@/components/ui/CategoryNavClient';
import { UserNavClient } from '@/components/ui/UserNavClient';
import { CartNavBadge } from '@/components/ui/CartNavBadge';
import { AppInitializer } from '@/components/ui/AppInitializer';
import { ToastContainer } from '@/components/ui/Toast';
import { CompareBar } from '@/components/ui/CompareBar';
import { WishlistNavBadge } from '@/components/ui/WishlistNavBadge';
import { ShoppingBag, User, MapPin, Clock, Phone, Heart, ChevronDown } from 'lucide-react';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Malieakal Electronics — Trusted Partner Since 1979',
  description: 'Shop premium electronics, home appliances, washing machines, refrigerators, ACs and more at Malieakal Electronics, Kerala.',
};

async function fetchCategories() {
  try {
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';
    const res = await fetch(`${API}/api/v1/categories`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    return json.success ? json.data : [];
  } catch {
    return [];
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const categories = await fetchCategories();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className={`${inter.className} bg-gray-50 text-gray-800 flex flex-col min-h-screen`}>

        {/* ─── TOP BAR ─────────────────────────────────────────── */}
        <div className="bg-[#0f172a] hidden md:block">
          <div className="container mx-auto px-6 h-9 flex items-center justify-between">
            <div className="flex items-center gap-6 text-[11px] text-gray-400">
              <span className="flex items-center gap-1.5">
                <MapPin size={11} className="text-amber-400" />
                Malieakal Plaza, MG Road, Kollam — 691001
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={11} className="text-amber-400" />
                Open Daily: 10:00 AM – 8:00 PM
              </span>
            </div>
            <div className="flex items-center gap-6 text-[11px]">
              <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <Phone size={11} /> 1800-123-4567 (Toll Free)
              </span>
              <Link
                href="/track"
                className="flex items-center gap-1.5 text-green-400 hover:text-green-300 font-semibold transition-colors"
              >
                ● Order Status
              </Link>
            </div>
          </div>
        </div>

        {/* ─── MAIN HEADER ──────────────────────────────────────── */}
        <header className="bg-white sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-6 h-[68px] flex items-center gap-8">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0 flex flex-col leading-none select-none">
              <span className="text-[22px] font-extrabold tracking-tight text-[#0B192C]">MALIEAKAL</span>
              <span className="text-amber-500 text-[7px] font-extrabold tracking-[0.3em] uppercase mt-0.5">
                TRUSTED PARTNER SINCE 1979
              </span>
            </Link>

            {/* Search */}
            <div className="flex-1 max-w-2xl hidden md:block">
              <Suspense fallback={<div className="h-10 bg-gray-100 rounded-md animate-pulse" />}>
                <SearchBar />
              </Suspense>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-6 ml-auto flex-shrink-0">
              <Link href="/stores" className="flex flex-col items-center gap-0.5 text-[#0B192C] hover:text-amber-500 transition-colors group">
                <MapPin size={21} />
                <span className="text-[9px] font-bold uppercase tracking-wider">Stores</span>
              </Link>

              <WishlistNavBadge />

              <CartNavBadge />

              <UserNavClient />
            </div>
          </div>

          {/* SUB-NAVIGATION */}
          <div className="border-t border-gray-100 hidden md:block bg-white">
            <div className="container mx-auto px-6 flex items-center justify-between">
              <div className="flex items-center gap-7">
                <Link
                  href="/"
                  className="py-2.5 text-[11px] font-extrabold text-amber-500 border-b-2 border-amber-400 uppercase tracking-wider"
                >
                  Home
                </Link>

                <Suspense fallback={<div className="w-36 h-9 animate-pulse bg-gray-100" />}>
                  <CategoryNavClient categories={categories} />
                </Suspense>

                {['Televisions', 'Washing Machines', 'Refrigerators', 'Air Conditioners'].map(name => {
                  const slug = name.toLowerCase().replace(/ /g, '-');
                  return (
                    <Link
                      key={slug}
                      href={`/products/${slug}`}
                      className="py-2.5 text-[11px] font-bold text-gray-600 hover:text-amber-500 uppercase tracking-wider transition-colors whitespace-nowrap"
                    >
                      {name}
                    </Link>
                  );
                })}
              </div>

              <div className="flex items-center gap-5 border-l border-gray-100 pl-7">
                <Link
                  href="/products?deal=true"
                  className="bg-amber-400 hover:bg-amber-300 text-[#0B192C] text-[10px] font-extrabold uppercase tracking-wider px-3 py-1.5 transition-colors"
                >
                  Offers
                </Link>
                <Link href="/products?sort=Newest" className="text-[11px] font-bold text-gray-600 hover:text-amber-500 uppercase tracking-wider transition-colors">
                  New Arrivals
                </Link>
                <Link href="/service" className="text-[11px] font-bold text-gray-600 hover:text-amber-500 uppercase tracking-wider transition-colors">
                  Service
                </Link>
                <Link href="/story" className="text-[11px] font-bold text-gray-600 hover:text-amber-500 uppercase tracking-wider transition-colors">
                  Our Story
                </Link>
              </div>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden px-4 py-2 border-t border-gray-100">
            <Suspense fallback={<div className="h-10 bg-gray-100 rounded animate-pulse" />}>
              <SearchBar />
            </Suspense>
          </div>
        </header>

        <main className="flex-1 bg-white">
          {children}
        </main>

        {/* ─── FOOTER ───────────────────────────────────────────── */}
        <footer className="bg-[#0B192C] text-gray-400 border-t-4 border-amber-400 pt-16 pb-8">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">

              {/* Brand Column */}
              <div className="lg:col-span-2 space-y-5">
                <div>
                  <div className="text-white text-2xl font-extrabold tracking-tight">MALIEAKAL</div>
                  <div className="text-amber-400 text-[7px] font-extrabold tracking-[0.3em] uppercase mt-0.5">
                    TRUSTED PARTNER SINCE 1979
                  </div>
                </div>
                <p className="text-xs leading-relaxed max-w-sm">
                  Kerala's premier destination for premium home appliances, consumer electronics, and IT products — providing uncompromising quality for over four decades.
                </p>
                <div className="flex gap-2.5">
                  {['f', 'tw', 'in', 'yt'].map(s => (
                    <a
                      key={s}
                      href="#"
                      className="w-8 h-8 rounded-full bg-gray-800 hover:bg-amber-400 hover:text-[#0B192C] flex items-center justify-center text-[10px] font-extrabold uppercase transition-colors"
                    >
                      {s}
                    </a>
                  ))}
                </div>
              </div>

              {/* Departments */}
              <div>
                <h4 className="text-white text-xs font-extrabold uppercase tracking-widest mb-5">Departments</h4>
                <ul className="space-y-3 text-[11px]">
                  {[
                    ['Televisions', 'televisions'],
                    ['Refrigerators', 'refrigerators'],
                    ['Washing Machines', 'washing-machines'],
                    ['Air Conditioners', 'air-conditioners'],
                    ['Kitchen Appliances', 'kitchen-appliances'],
                    ['Mobile Phones', 'mobile-phones'],
                    ['Tablets', 'tablets'],
                  ].map(([name, slug]) => (
                    <li key={slug}>
                      <Link href={`/products/${slug}`} className="hover:text-amber-400 transition-colors">
                        {name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Customer Care */}
              <div>
                <h4 className="text-white text-xs font-extrabold uppercase tracking-widest mb-5">Customer Care</h4>
                <ul className="space-y-3 text-[11px]">
                  {[
                    ['Help Center & FAQ', '/support'],
                    ['Track Your Order', '/track'],
                    ['Returns & Refunds', '/returns'],
                    ['Warranty Registration', '/warranty'],
                    ['EMI & Financing', '/emi'],
                    ['Store Locator', '/stores'],
                  ].map(([name, href]) => (
                    <li key={href}>
                      <Link href={href} className="hover:text-amber-400 transition-colors">{name}</Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Visit Us */}
              <div>
                <h4 className="text-white text-xs font-extrabold uppercase tracking-widest mb-5">Visit Our Store</h4>
                <ul className="space-y-4 text-[11px]">
                  <li className="flex items-start gap-2.5">
                    <MapPin size={13} className="text-amber-400 mt-0.5 flex-shrink-0" />
                    <span>Malieakal Plaza<br />MG Road, Kollam<br />Kerala — 691001</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Phone size={13} className="text-amber-400 flex-shrink-0" />
                    <span>1800-123-4567 (Toll Free)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Clock size={13} className="text-amber-400 flex-shrink-0" />
                    <span>Daily: 10:00 AM – 8:00 PM</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-[10px] text-gray-600 uppercase tracking-wider">
              <p>© {new Date().getFullYear()} Malieakal Electronics Pvt. Ltd. All Rights Reserved.</p>
              <div className="flex gap-6">
                {[['Privacy Policy', '/privacy'], ['Terms of Service', '/terms'], ['Sitemap', '/sitemap']].map(([n, h]) => (
                  <Link key={h} href={h} className="hover:text-gray-400 transition-colors">{n}</Link>
                ))}
              </div>
            </div>
          </div>
        </footer>

        <CompareBar />
        <ToastContainer />
        <AppInitializer />
      </body>
    </html>
  );
}
