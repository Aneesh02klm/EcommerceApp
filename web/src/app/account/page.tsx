'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import Image from 'next/image';
import Link from 'next/link';
import { Truck, ShieldCheck, Ticket, Phone, Package, Heart, Gift, Bell, Settings, MapPin, CreditCard, HelpCircle, FileText, Shield, LogOut, ChevronRight } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl md:rounded-md shadow-[0_8px_30px_rgb(0,0,0,0.04)] md:shadow-sm border border-gray-100/50 md:border-gray-100 p-6 md:p-6 flex flex-col md:flex-row items-center md:items-center justify-between text-center md:text-left gap-5 md:gap-0 relative overflow-hidden">
        {/* Mobile decorative background blob */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#FDF9F1] to-white md:hidden opacity-50 z-0"></div>
        
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-5 z-10 w-full">
          <div className="w-20 h-20 md:w-16 md:h-16 rounded-full overflow-hidden bg-gray-50 border-4 border-white shadow-sm flex-shrink-0">
            {user.avatarUrl ? (
              <img src={`http://localhost:5030${user.avatarUrl}`} alt={user.firstName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                <svg className="w-10 h-10 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
            )}
          </div>
          <div className="flex flex-col items-center md:items-start w-full">
            <h1 className="text-2xl md:text-xl font-extrabold text-[#0B192C]">{user.firstName} {user.lastName}</h1>
            <p className="text-xs text-gray-500 font-semibold mt-1">{user.email} <span className="hidden md:inline">|</span><span className="block md:hidden h-0.5"></span> {user.phone}</p>
            <div className="mt-3 md:mt-1.5 inline-flex md:block items-center justify-center px-3 py-1 md:p-0 bg-amber-50 md:bg-transparent rounded-full border border-amber-100 md:border-none">
              <p className="text-[10px] text-amber-600 font-extrabold uppercase tracking-wider">{user.memberTier} MEMBER SINCE {memberSince}</p>
            </div>
          </div>
        </div>
        <button className="w-full md:w-auto mt-2 md:mt-0 px-6 py-3 md:py-2 bg-white md:bg-transparent shadow-sm md:shadow-none border border-gray-200 rounded-xl md:rounded text-[11px] font-extrabold text-[#0B192C] hover:bg-gray-50 uppercase tracking-widest transition-colors z-10">
          Edit Profile
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-white rounded-xl md:rounded-md shadow-[0_4px_20px_rgb(0,0,0,0.03)] md:shadow-sm border border-gray-100/50 md:border-gray-100 p-4 md:p-5 flex flex-col justify-center items-center md:items-start text-center md:text-left">
          <p className="text-[11px] md:text-xs text-gray-500 font-bold mb-1 uppercase md:normal-case tracking-wider md:tracking-normal">Total Orders</p>
          <p className="text-3xl md:text-2xl font-black md:font-extrabold text-[#0B192C] mb-1">{stats.totalOrders}</p>
          <p className="text-[9px] md:text-[10px] text-gray-400 font-semibold hidden md:block">Lifetime orders placed</p>
        </div>
        <div className="bg-white rounded-xl md:rounded-md shadow-[0_4px_20px_rgb(0,0,0,0.03)] md:shadow-sm border border-gray-100/50 md:border-gray-100 p-4 md:p-5 flex flex-col justify-center items-center md:items-start text-center md:text-left">
          <p className="text-[11px] md:text-xs text-gray-500 font-bold mb-1 uppercase md:normal-case tracking-wider md:tracking-normal">Unused Coupons</p>
          <p className="text-3xl md:text-2xl font-black md:font-extrabold text-[#0B192C] mb-1">{stats.unusedCoupons}</p>
          <p className="text-[9px] md:text-[10px] text-gray-400 font-semibold hidden md:block">Redeem at checkout</p>
        </div>
        <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-[#0B192C] to-[#1a2b45] md:bg-none md:bg-white rounded-xl md:rounded-md shadow-[0_4px_20px_rgb(0,0,0,0.08)] md:shadow-sm border border-transparent md:border-gray-100 p-5 md:p-5 flex flex-col justify-center items-center md:items-start text-center md:text-left">
          <p className="text-[11px] md:text-xs text-gray-300 md:text-gray-500 font-bold mb-1 uppercase md:normal-case tracking-wider md:tracking-normal">Reward Points</p>
          <p className="text-3xl md:text-2xl font-black md:font-extrabold text-amber-400 md:text-[#0B192C] mb-1">0 <span className="text-sm font-bold opacity-75">pts</span></p>
          <p className="text-[10px] text-gray-400 font-semibold hidden md:block">Earn more by shopping</p>
        </div>
      </div>

      
      {/* Mobile Vertical Menu List */}
      <div className="md:hidden space-y-4">
        {/* Core Settings */}
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100/50 overflow-hidden">
          {[
            { name: 'My Orders', href: '/account/orders', icon: Package, color: 'text-blue-500' },
            { name: 'My Wishlist', href: '/wishlist', icon: Heart, color: 'text-rose-500' },
            { name: 'My Coupons', href: '/account/coupons', icon: Ticket, color: 'text-amber-500' },
            { name: 'My Rewards', href: '/account/rewards', icon: Gift, color: 'text-purple-500' }
          ].map((item, i) => (
            <Link key={i} href={item.href} className="flex items-center justify-between p-4 border-b border-gray-50 bg-white hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center ${item.color}`}>
                  <item.icon size={20} />
                </div>
                <span className="text-sm font-extrabold text-[#0B192C]">{item.name}</span>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </Link>
          ))}
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100/50 overflow-hidden">
          {[
            { name: 'Notifications', href: '/account/notifications', icon: Bell, color: 'text-indigo-500' },
            { name: 'Addresses', href: '/account/addresses', icon: MapPin, color: 'text-teal-500' },
            { name: 'Payment Methods', href: '/account/payments', icon: CreditCard, color: 'text-emerald-500' },
          ].map((item, i) => (
            <Link key={i} href={item.href} className="flex items-center justify-between p-4 border-b border-gray-50 bg-white hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center ${item.color}`}>
                  <item.icon size={20} />
                </div>
                <span className="text-sm font-extrabold text-[#0B192C]">{item.name}</span>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </Link>
          ))}
        </div>

        {/* Support & Logout */}
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100/50 overflow-hidden">
          {[
            { name: 'Support', href: '/account/support', icon: HelpCircle, color: 'text-gray-600' },
            { name: 'FAQ', href: '/account/faq', icon: FileText, color: 'text-gray-600' },
            { name: 'Privacy and Security', href: '/account/privacy', icon: Shield, color: 'text-gray-600' },
          ].map((item, i) => (
            <Link key={i} href={item.href} className="flex items-center justify-between p-4 border-b border-gray-50 bg-white hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center ${item.color}`}>
                  <item.icon size={20} />
                </div>
                <span className="text-sm font-extrabold text-[#0B192C]">{item.name}</span>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </Link>
          ))}
          <button onClick={() => {
            useAuthStore.getState().logout();
            window.location.href = '/login';
          }} className="w-full flex items-center justify-between p-4 bg-white hover:bg-red-50 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 group-hover:bg-red-100 transition-colors">
                <LogOut size={20} />
              </div>
              <span className="text-sm font-extrabold text-red-500">Logout</span>
            </div>
          </button>
        </div>
      </div>

      <div className="hidden md:block space-y-6">
      {/* Recent Orders Desktop Wrapper */}

      <div className="bg-white rounded-md shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-4">
          <h2 className="text-base font-extrabold text-[#0B192C]">Recent Orders</h2>
          <Link href="/account/orders" className="text-[10px] font-extrabold text-amber-500 uppercase tracking-widest hover:text-amber-600 transition-colors">View All Orders</Link>
        </div>
        
        <div className="space-y-3">
          {recentOrders.map((order, i) => (
            <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50/50 rounded border border-gray-100 gap-4">
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
          
          {recentOrders.length ===0 && (
            <div className="text-center py-6 text-sm text-gray-500 font-bold">No recent orders found.</div>
          )}
        </div>
      </div>

      {/* Quick Shortcuts */}
      <div>
        <h2 className="text-sm font-extrabold text-[#0B192C] mb-3">Quick Shortcuts</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <div className="bg-white rounded-xl md:rounded-md shadow-[0_4px_20px_rgb(0,0,0,0.03)] md:shadow-sm border border-gray-100/50 md:border-gray-100 p-4 md:p-5 flex flex-col items-center text-center md:items-start md:text-left hover:border-gray-300 transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-3 text-gray-600 border border-gray-200">
              <Truck size={20} />
            </div>
            <h3 className="text-[11px] font-extrabold text-[#0B192C] mb-1">Track Current Order</h3>
            <p className="text-[10px] text-gray-400 font-semibold leading-tight">Track shipment to Kollam</p>
          </div>
          <div className="bg-white rounded-xl md:rounded-md shadow-[0_4px_20px_rgb(0,0,0,0.03)] md:shadow-sm border border-gray-100/50 md:border-gray-100 p-4 md:p-5 flex flex-col items-center text-center md:items-start md:text-left hover:border-gray-300 transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-3 text-gray-600 border border-gray-200">
              <Ticket size={20} />
            </div>
            <h3 className="text-[11px] font-extrabold text-[#0B192C] mb-1">My Special Rewards</h3>
            <p className="text-[10px] text-gray-400 font-semibold leading-tight">Scratch &amp; Win coupons</p>
          </div>
          <div className="col-span-2 md:col-span-1 bg-white rounded-xl md:rounded-md shadow-[0_4px_20px_rgb(0,0,0,0.03)] md:shadow-sm border border-gray-100/50 md:border-gray-100 p-4 md:p-5 flex flex-col items-center text-center md:items-start md:text-left hover:border-gray-300 transition-colors cursor-pointer">
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
