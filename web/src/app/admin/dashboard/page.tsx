'use client';

import React, { useEffect, useState } from 'react';
import { 
  Search, Bell, Calendar, Plus, Percent, Tag, Megaphone, Image as ImageIcon, 
  ShoppingCart, TrendingUp, TrendingDown, Loader2
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user, token } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dateRange, setDateRange] = useState('last30days');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  // Calculate dates based on preset
  useEffect(() => {
    const d = new Date();
    const end = new Date();
    if (dateRange === 'today') {
      setStartDate(d.toISOString().split('T')[0]);
      setEndDate(d.toISOString().split('T')[0]);
    } else if (dateRange === 'yesterday') {
      d.setDate(d.getDate() - 1);
      setStartDate(d.toISOString().split('T')[0]);
      setEndDate(d.toISOString().split('T')[0]);
    } else if (dateRange === 'last7days') {
      d.setDate(d.getDate() - 7);
      setStartDate(d.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    } else if (dateRange === 'last30days') {
      d.setDate(d.getDate() - 30);
      setStartDate(d.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    } else if (dateRange === 'thismonth') {
      d.setDate(1);
      setStartDate(d.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    }
  }, [dateRange]);

  useEffect(() => {
    async function fetchMetrics() {
      if (!token) return;
      try {
        setIsRefreshing(true);
        
        
        let url = `${API}/api/v1/admin/dashboard?range=${dateRange}`;
        if (dateRange === 'custom') {
          if (!startDate || !endDate) {
            setIsRefreshing(false);
            return;
          }
          url += `&start=${startDate}&end=${endDate}`;
        }
        
        const res = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
    fetchMetrics();
  }, [token, dateRange, startDate, endDate]);

  if (loading) {
    return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="animate-spin text-amber-500" size={32} /></div>;
  }

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  const formatNumber = (val: number) => new Intl.NumberFormat('en-IN').format(val || 0);
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Top Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#0B192C]">Dashboard</h1>
        <div className="flex items-center gap-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search orders, bills, customer IDs..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  router.push(`/admin/orders?search=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
              className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-md text-sm w-[320px] focus:outline-none focus:ring-1 focus:ring-[#0B192C]"
            />
          </div>
          <div className="relative cursor-pointer">
            <Bell size={20} className="text-gray-600" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full border border-gray-50"></span>
          </div>
          <div className="flex items-center gap-3">
            <img src={user?.avatarUrl || "https://i.pravatar.cc/150?u=admin"} alt="Admin" className="w-9 h-9 rounded-full object-cover" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{Array.isArray(user?.roles) ? user.roles.map((r: any) => typeof r === 'string' ? r : (r.name || '')).join(', ') : 'ADMIN'}</span>
              <span className="text-sm font-bold text-[#0B192C] leading-none">{typeof user?.firstName === 'string' ? user?.firstName : 'Admin'} {typeof user?.lastName === 'string' ? user?.lastName : ''}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Welcome Section */}
      <section className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-serif font-black text-[#0B192C] tracking-tight mb-1">Welcome back, {user?.firstName}</h2>
          <p className="text-sm font-medium text-gray-500">Malieakal Electronics • Operational Management Dashboard</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded shadow-sm text-sm font-bold text-[#0B192C]">
          <Calendar size={16} className="text-amber-500" />
          <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="bg-transparent outline-none cursor-pointer pr-2">
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7days">Last 7 Days</option>
            <option value="last30days">Last 30 Days</option>
            <option value="thismonth">This Month</option>
            <option value="custom">Custom Range</option>
          </select>
          {dateRange === 'custom' && (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-200">
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent outline-none cursor-pointer text-xs" />
              <span className="text-gray-400 text-xs">to</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent outline-none cursor-pointer text-xs" />
            </div>
          )}
        </div>
      </section>

      {/* Metric Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard isLoading={isRefreshing} title="PERIOD SALES" value={formatCurrency(data?.periodSales)} />
        <MetricCard isLoading={isRefreshing} title="PERIOD ORDERS" value={formatNumber(data?.periodOrders)} />
        <MetricCard isLoading={isRefreshing} title="NEW CUSTOMERS" value={formatNumber(data?.activeCustomers)} />
        <MetricCard isLoading={isRefreshing} title="PENDING ORDERS" value={formatNumber(data?.pendingOrders)} />
        
        <MetricCard isLoading={isRefreshing} title="PERIOD REVENUE" value={formatCurrency(data?.periodRevenue)} />
        <MetricCard isLoading={isRefreshing} title="PRODUCTS IN STOCK" value={formatNumber(data?.productsInStock)} />
        <MetricCard isLoading={isRefreshing} title="LOW STOCK ALERTS" value={formatNumber(data?.lowStockAlerts)} badge={`${data?.lowStockAlerts || 0} Items Low`} badgeType="warning" />
        <MetricCard isLoading={isRefreshing} title="OPEN COMPLAINTS" value={formatNumber(data?.openComplaints)} badge="Needs Review" badgeType="warning" />
      </section>

      {/* Middle Section (Chart + Quick Actions) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-[#0B192C]">Revenue Trend (Last 30 Days)</h3>
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">ACTUAL SCALE</span>
          </div>
          <div className="h-[220px] relative w-full flex items-end">
            <svg viewBox="0 0 800 200" className="w-full h-full overflow-visible">
              <path d="M 0 170 L 80 140 L 160 180 L 240 110 L 320 160 L 400 50 L 480 90 L 560 30 L 640 80 L 720 20 L 800 60" 
                fill="none" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              {[0, 80, 160, 240, 320, 400, 480, 560, 640, 720, 800].map((x, i) => {
                const points = [170, 140, 180, 110, 160, 50, 90, 30, 80, 20, 60];
                return <circle key={i} cx={x} cy={points[i]} r="6" fill="#0B192C" stroke="#fbbf24" strokeWidth="2" />;
              })}
              <line x1="0" y1="200" x2="800" y2="200" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />
              <text x="-20" y="204" fontSize="10" fill="#9ca3af" className="font-bold">1L</text>
              <line x1="0" y1="100" x2="800" y2="100" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />
              <text x="-20" y="104" fontSize="10" fill="#9ca3af" className="font-bold">2L</text>
              <line x1="0" y1="0" x2="800" y2="0" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />
              <text x="-20" y="4" fontSize="10" fill="#9ca3af" className="font-bold">3L</text>
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#0B192C] mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <QuickAction icon={Plus} label="Add Product" onClick={() => router.push('/admin/products/new')} />
            <QuickAction icon={Percent} label="Create Sale" onClick={() => router.push('/admin/campaigns')} />
            <QuickAction icon={Tag} label="Create Coupon" onClick={() => router.push('/admin/campaigns')} />
            <QuickAction icon={Megaphone} label="Create Campaign" onClick={() => router.push('/admin/campaigns')} />
            <QuickAction icon={ImageIcon} label="Add Banner" onClick={() => router.push('/admin/banners')} />
            <QuickAction icon={ShoppingCart} label="View Orders" onClick={() => router.push('/admin/orders')} />
          </div>
        </div>
      </section>

      {/* Low Stock Alerts Section */}
      <section className="bg-red-50 border border-red-200 rounded-lg p-6 shadow-sm flex items-center justify-between">
        <div>
           <div className="flex items-center gap-2 text-red-600 mb-1">
             <TrendingDown size={20} />
             <h3 className="text-lg font-black tracking-tight">Low Stock Alerts Active</h3>
           </div>
           <p className="text-sm font-semibold text-red-800">You have items in your catalog approaching depletion. Please restock immediately to avoid losing sales.</p>
        </div>
        <button onClick={() => router.push('/admin/reports/low-stock-inventory')} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded text-sm font-bold shadow-md transition-colors whitespace-nowrap">
          View Low Stock Report
        </button>
      </section>


      {/* Bottom Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6 shadow-sm overflow-x-auto">
          <h3 className="text-lg font-bold text-[#0B192C] mb-6">Recent Placement Activity</h3>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="pb-3 pr-4">Order ID</th>
                <th className="pb-3 px-4">Customer</th>
                <th className="pb-3 px-4">Product Amount</th>
                <th className="pb-3 px-4">Status</th>
                <th className="pb-3 pl-4">Date</th>
              </tr>
            </thead>
            <tbody className="text-[#0B192C] font-semibold divide-y divide-gray-50">
              {data?.recentOrders?.map((o: any, i: number) => (
                <OrderRow key={i} id={o.id} customer={o.customer || 'Guest User'} product="Products" amount={formatCurrency(o.amount)} status={o.status} date={formatDate(o.date)} />
              ))}
              {(!data?.recentOrders || data.recentOrders.length === 0) && (
                <tr><td colSpan={5} className="py-8 text-center text-gray-400">No recent orders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#0B192C] mb-6">Top Selling Products</h3>
            <div className="space-y-4">
              {data?.topProducts?.map((p: any, i: number) => (
                <TopSellingItem key={i} name={p.name} stats={`${formatNumber(p.unitssold)} units sold • ${formatCurrency(p.revenue)}`} />
              ))}
              {(!data?.topProducts || data.topProducts.length === 0) && (
                <p className="text-gray-400 text-sm">No sales data available yet.</p>
              )}
            </div>
          </div>
          
          <div className="bg-[#0B192C] rounded-lg p-6 shadow-md text-white relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl"></div>
            <div className="inline-block bg-amber-400 text-[#0B192C] text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded mb-3">
              ACTIVE PROMOTION
            </div>
            <h3 className="text-xl font-serif font-bold text-white mb-1">{data?.activePromotion?.title || 'No Active Campaigns'}</h3>
            <p className="text-xs text-gray-400 mb-6">{data?.activePromotion ? `${data.activePromotion.discountvalue} ${data.activePromotion.discounttype === 'Percentage' ? '%' : '₹'} Off` : 'Activate a coupon or flash sale'}</p>
            
            <div className="flex justify-between items-end border-t border-white/10 pt-4">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Status</p>
                <p className="text-sm font-bold text-white">{data?.activePromotion ? 'Live' : 'Inactive'}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Conversions</p>
                <p className="text-sm font-bold text-amber-400">{data?.activePromotion?.conversions || 0} Sales</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ title, value, badge, badgeType, isLoading }: any) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex flex-col justify-between">
      <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">{title}</h3>
      <div className="flex items-end justify-between">
        {isLoading ? <Loader2 className="animate-spin text-amber-500" size={24} /> : <span className="text-2xl font-black text-[#0B192C]">{value}</span>}
        {badge && (
          <span className={`text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1 ${
            badgeType === 'positive' ? 'bg-[#e8f5ed] text-[#1a8b44]' : 
            badgeType === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-600'
          }`}>
            {badgeType === 'positive' && <TrendingUp size={10} />}
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, onClick }: any) {
  return (
    <button className="flex flex-col items-center justify-center gap-3 p-4 border border-gray-100 rounded-lg bg-gray-50 hover:bg-amber-50 hover:border-amber-200 transition-colors group" onClick={onClick}>
      <Icon size={20} className="text-amber-500 group-hover:scale-110 transition-transform" />
      <span className="text-xs font-bold text-[#0B192C]">{label}</span>
    </button>
  );
}

function OrderRow({ id, customer, product, amount, status, date }: any) {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="py-4 pr-4 font-bold text-xs">{id}</td>
      <td className="py-4 px-4">{customer}</td>
      <td className="py-4 px-4 text-gray-500 font-medium">{product} <span className="text-[#0B192C] font-bold ml-1">{amount}</span></td>
      <td className="py-4 px-4">
        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
          status === 'Delivered' ? 'bg-[#e8f5ed] text-[#1a8b44]' :
          status === 'Processing' ? 'bg-amber-50 text-amber-600' :
          status === 'Dispatched' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'
        }`}>
          {status}
        </span>
      </td>
      <td className="py-4 pl-4 text-gray-400 font-medium text-xs">{date}</td>
    </tr>
  );
}

function TopSellingItem({ name, stats }: any) {
  return (
    <div className="flex items-center gap-4 group cursor-pointer">
      <div className="w-12 h-12 bg-gray-100 rounded flex-shrink-0"></div>
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-bold text-[#0B192C] group-hover:text-amber-600 transition-colors truncate">{name}</h4>
        <p className="text-xs text-gray-500 font-medium mt-0.5">{stats}</p>
      </div>
    </div>
  );
}
