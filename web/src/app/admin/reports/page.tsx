'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';
import { Loader2, TrendingUp, Users, ShoppingBag, BarChart2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

export default function AdminReportsDashboard() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('lifetime');

  useEffect(() => {
    if (token) fetchDashboard();
  }, [token, period]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/admin/reports/dashboard?period=${period}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

  const reports = [
    { id: 'sales-by-date', name: 'Sales by Date', desc: 'Granular view of revenue, discounts, and order volumes over time.' },
    { id: 'inventory-valuation', name: 'Inventory Valuation', desc: 'Real-time calculation of capital locked in current warehouse stock.' },
    { id: 'coupon-usage', name: 'Coupon Usage', desc: 'Analyze the impact of targeted discounts on overall margins.' },
    { id: 'product-performance', name: 'Product Performance', desc: 'Identify top sellers, slow movers, and category leaders.' },
    { id: 'low-stock-inventory', name: 'Low Stock Inventory', desc: 'Actionable list of products approaching depletion.' },
    { id: 'warranty-metrics', name: 'Warranty & Complaints', desc: 'Track open issues, resolution times, and RMAs.' },
    { id: 'campaign-roi', name: 'Campaign & Notification ROI', desc: 'Track open rates and revenue from promotional campaigns.' },
    { id: 'tax-discount-summary', name: 'Tax & Discount Summary', desc: 'Detailed breakdown of applied discounts for accounting.' }
  ];

  return (
    <div className="flex flex-col gap-8 max-w-7xl pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
        <div>
          <h1 className="text-2xl font-black text-[#0B192C]">Analytics & Reports</h1>
          <p className="text-sm font-medium text-gray-500">Macro-level business metrics and granular standard reports.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {['today', 'week', 'month', '6months', 'year', 'lifetime'].map(p => (
            <button 
              key={p} 
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 text-xs font-bold capitalize rounded-md transition-all ${period === p ? 'bg-white shadow-sm text-amber-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {p === '6months' ? '6 Months' : p}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-amber-500" size={32} /></div>
      ) : data?.summary ? (
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Revenue</p>
              <h3 className="text-2xl font-black text-green-600">{formatCurrency(data.summary.lifetimerevenue)}</h3>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600"><TrendingUp /></div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Orders</p>
              <h3 className="text-2xl font-black text-[#0B192C]">{data.summary.totalorders}</h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600"><ShoppingBag /></div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Customers</p>
              <h3 className="text-2xl font-black text-[#0B192C]">{data.summary.totalcustomers}</h3>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-500"><Users /></div>
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="text-lg font-bold text-[#0B192C] mb-4">Standard Report Bundles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {reports.map(r => (
            <div key={r.id} onClick={() => router.push(`/admin/reports/${r.id}`)} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm cursor-pointer hover:border-amber-400 hover:shadow-md transition-all group flex items-start justify-between">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-gray-50 rounded flex items-center justify-center text-gray-500 group-hover:bg-amber-50 group-hover:text-amber-500 transition-colors">
                  <BarChart2 size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#0B192C] mb-1">{r.name}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{r.desc}</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-gray-300 group-hover:text-amber-500 mt-2" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
