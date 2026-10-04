'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Truck, ShieldCheck, Ticket, Phone, Package, Heart, Gift, Bell, Settings, MapPin, CreditCard, HelpCircle, FileText, Shield, LogOut, ChevronRight, Pencil } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';

interface DashboardData {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    avatarUrl: string | null;
    memberTier: string | null;
    createdAt: string;
  };
  stats: {
    totalOrders: number;
    activeWarranties: number;
    unusedCoupons: number;
    openComplaints: number;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    createdAt: string;
    totalAmount: number;
    status: string;
  }>;
}

export default function ProfilePage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';
        const res = await fetch(`${API}/api/v1/account/dashboard`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const json = await res.json();
          setData(json.data);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard', err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchDashboard();
    }
  }, [token]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500 font-bold">Loading Profile...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-red-500 font-bold">Failed to load profile data.</div>;
  }

  const { user, stats, recentOrders } = data;
  const memberSince = new Date(user.createdAt).getFullYear();

  const getStatusBadge = (status: string) => {
    if (status === 'Delivered') return <span className="px-2 py-1 bg-green-50 text-green-600 text-[10px] font-extrabold rounded-sm">{status}</span>;
    if (status === 'Processing') return <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-extrabold rounded-sm">{status}</span>;
    if (status === 'In Transit') return <span className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-extrabold rounded-sm">{status}</span>;
    return <span className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-extrabold rounded-sm">{status}</span>;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-0 md:space-y-6 bg-gray-50 md:bg-transparent -mx-4 px-4 md:mx-0 md:px-0">
      
      {/* ========================================== */}
      {/* MOBILE COMPACT VIEW (Visible only < 768px) */}
      {/* ========================================== */}
      <div className="md:hidden flex flex-col mb-4">
        
        {/* Compact Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center justify-between mb-4 mt-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border-2 border-white shadow-sm flex-shrink-0">
              {user.avatarUrl ? (
                <img src={`http://localhost:5030${user.avatarUrl}`} alt={user.firstName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <h1 className="text-base font-black text-[#0B192C] leading-tight">{user.firstName} {user.lastName}</h1>
              <p className="text-[10px] text-gray-500 font-semibold">{user.email}</p>
              <div className="mt-1 inline-flex items-center">
                <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-[8px] font-extrabold uppercase tracking-wider">
                  {user.memberTier} MEMBER
                </span>
              </div>
            </div>
          </div>
          <button onClick={() => router.push('/account/profile')} className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
            <Pencil size={14} />
          </button>
        </div>

        {/* Compact Stats Row */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 grid grid-cols-3 divide-x divide-gray-50 mb-4 overflow-hidden">
          <div className="p-3 flex flex-col items-center justify-center text-center bg-gray-50/30">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Orders</span>
            <span className="text-lg font-black text-[#0B192C] leading-none">{stats.totalOrders}</span>
          </div>
          <div className="p-3 flex flex-col items-center justify-center text-center bg-gray-50/30">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Coupons</span>
            <span className="text-lg font-black text-[#0B192C] leading-none">{stats.unusedCoupons}</span>
          </div>
          <div className="p-3 flex flex-col items-center justify-center text-center bg-[#0B192C]">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Points</span>
            <span className="text-lg font-black text-amber-400 leading-none">0</span>
          </div>
        </div>

        {/* Ultra-Compact Vertical Menu */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="flex flex-col">
            {[
              { name: 'My Orders', href: '/account/orders', icon: Package, color: 'text-blue-500' },
              { name: 'My Wishlist', href: '/wishlist', icon: Heart, color: 'text-rose-500' },
              { name: 'My Coupons', href: '/account/coupons', icon: Ticket, color: 'text-amber-500' },
              { name: 'My Rewards', href: '/account/rewards', icon: Gift, color: 'text-purple-500' },
              { isDivider: true },
              { name: 'Notifications', href: '/account/notifications', icon: Bell, color: 'text-indigo-500' },
              { name: 'Addresses', href: '/account/addresses', icon: MapPin, color: 'text-teal-500' },
              { name: 'Payment Methods', href: '/account/payments', icon: CreditCard, color: 'text-emerald-500' },
              { isDivider: true },
              { name: 'Support', href: '/account/support', icon: HelpCircle, color: 'text-gray-500' },
              { name: 'FAQ', href: '/account/faq', icon: FileText, color: 'text-gray-500' },
              { name: 'Privacy', href: '/account/privacy', icon: Shield, color: 'text-gray-500' },
            ].map((item, i) => {
              if (item.isDivider) return <div key={i} className="h-2 bg-gray-50 border-y border-gray-100/50"></div>;
              const Icon = item.icon as any;
              return (
                <Link key={i} href={item.href as string} className="flex items-center justify-between p-3.5 border-b border-gray-50 last:border-b-0 active:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 flex justify-center ${item.color}`}>
                      <Icon size={18} strokeWidth={2.5} />
                    </div>
                    <span className="text-[13px] font-extrabold text-[#0B192C]">{item.name}</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-300" />
                </Link>
              );
            })}
            <div className="h-2 bg-gray-50 border-y border-gray-100/50"></div>
            <button onClick={() => { useAuthStore.getState().logout(); window.location.href = '/login'; }} className="flex items-center justify-between p-3.5 active:bg-red-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-6 flex justify-center text-red-500">
                  <LogOut size={18} strokeWidth={2.5} />
                </div>
                <span className="text-[13px] font-extrabold text-red-500">Logout</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* DESKTOP ORIGINAL VIEW (Visible >= 768px)  */}
      {/* ========================================== */}
      <div className="hidden md:flex flex-col space-y-6">
        
        {/* Profile Header Card */}
        <div className="bg-white rounded-md shadow-sm border border-gray-100 p-6 flex flex-row items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
              {user.avatarUrl ? (
                <img src={`http://localhost:5030${user.avatarUrl}`} alt={user.firstName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </div>
              )}
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#0B192C]">{user.firstName} {user.lastName}</h1>
              <p className="text-xs text-gray-500 font-semibold mt-0.5">{user.email} | {user.phone}</p>
              <p className="text-[10px] text-amber-600 font-extrabold mt-1.5 uppercase tracking-wider">{user.memberTier} MEMBER SINCE {memberSince}</p>
            </div>
          </div>
          <button onClick={() => router.push('/account/profile')} className="px-4 py-2 border border-gray-200 rounded text-[11px] font-extrabold text-[#0B192C] hover:bg-gray-50 uppercase tracking-widest transition-colors">
            Edit Profile
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-md shadow-sm border border-gray-100 p-5">
            <p className="text-xs text-gray-500 font-bold mb-1">Total Orders</p>
            <p className="text-2xl font-extrabold text-[#0B192C] mb-1">{stats.totalOrders}</p>
            <p className="text-[10px] text-gray-400 font-semibold">Lifetime orders placed</p>
          </div>
          <div className="bg-white rounded-md shadow-sm border border-gray-100 p-5">
            <p className="text-xs text-gray-500 font-bold mb-1">Unused Coupons</p>
            <p className="text-2xl font-extrabold text-[#0B192C] mb-1">{stats.unusedCoupons} Available</p>
            <p className="text-[10px] text-gray-400 font-semibold">Redeem at checkout</p>
          </div>
          <div className="bg-white rounded-md shadow-sm border border-gray-100 p-5">
            <p className="text-xs text-gray-500 font-bold mb-1">Reward Points</p>
            <p className="text-2xl font-extrabold text-[#0B192C] mb-1">0 pts</p>
            <p className="text-[10px] text-gray-400 font-semibold">Earn more by shopping</p>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-md shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-4">
            <h2 className="text-base font-extrabold text-[#0B192C]">Recent Orders</h2>
            <Link href="/account/orders" className="text-[10px] font-extrabold text-amber-500 uppercase tracking-widest hover:text-amber-600 transition-colors">View All Orders</Link>
          </div>
          
          <div className="space-y-3">
            {recentOrders.map((order, i) => (
              <div key={i} className="flex flex-row items-center justify-between p-4 bg-gray-50/50 rounded border border-gray-100 gap-4">
                <div>
                  <p className="text-sm font-extrabold text-[#0B192C]">#{order.orderNumber}</p>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Placed on: {formatDate(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-sm font-extrabold text-[#0B192C]">{formatCurrency(order.totalAmount)}</span>
                  <div className="w-20 flex justify-end">
                    {getStatusBadge(order.status)}
                  </div>
                  <button onClick={() => window.location.href = `/account/orders?track=${order.id}`} className="px-4 py-1.5 border border-[#0B192C] rounded text-[11px] font-extrabold text-[#0B192C] hover:bg-[#0B192C] hover:text-white transition-colors">
                    Track
                  </button>
                </div>
              </div>
            ))}
            {recentOrders.length === 0 && (
              <div className="text-center py-6 text-sm text-gray-500 font-bold">No recent orders found.</div>
            )}
          </div>
        </div>

        {/* Quick Shortcuts */}
        <div>
          <h2 className="text-sm font-extrabold text-[#0B192C] mb-3">Quick Shortcuts</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-md shadow-sm border border-gray-100 p-5 flex flex-col items-start hover:border-gray-300 transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-3 text-gray-600 border border-gray-200">
                <Truck size={20} />
              </div>
              <h3 className="text-[11px] font-extrabold text-[#0B192C] mb-1">Track Current Order</h3>
              <p className="text-[10px] text-gray-400 font-semibold leading-tight">Track shipment to Kollam</p>
            </div>
            <div className="bg-white rounded-md shadow-sm border border-gray-100 p-5 flex flex-col items-start hover:border-gray-300 transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-3 text-gray-600 border border-gray-200">
                <Ticket size={20} />
              </div>
              <h3 className="text-[11px] font-extrabold text-[#0B192C] mb-1">My Special Rewards</h3>
              <p className="text-[10px] text-gray-400 font-semibold leading-tight">Scratch &amp; Win coupons</p>
            </div>
            <div className="bg-white rounded-md shadow-sm border border-gray-100 p-5 flex flex-col items-start hover:border-gray-300 transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-3 text-gray-600 border border-gray-200">
                <Phone size={20} />
              </div>
              <h3 className="text-[11px] font-extrabold text-[#0B192C] mb-1">Contact Malieakal Plaza</h3>
              <p className="text-[10px] text-gray-400 font-semibold leading-tight">Call store support specialists</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
