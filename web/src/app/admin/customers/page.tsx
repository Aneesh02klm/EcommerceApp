'use client';

import React, { useEffect, useState } from 'react';
import { 
  Search, Bell, Filter, User, Calendar, Loader2 
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

export default function AdminCustomers() {
  const { user, token } = useAuthStore();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) fetchCustomers();
  }, [token]);

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`${API}/api/v1/admin/customers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setCustomers(json.data);
    } catch (err) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

  return (
    <div className="flex flex-col gap-8 pb-10 max-w-[1400px]">
      {/* Top Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#0B192C]">Customers</h1>
        <div className="flex items-center gap-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search customers..." 
              className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-md text-sm w-[320px] focus:outline-none focus:ring-1 focus:ring-[#0B192C]"
            />
          </div>
          <div className="relative cursor-pointer">
            <Bell size={20} className="text-gray-600" />
          </div>
          <div className="flex items-center gap-3">
            <img src={user?.avatarUrl || "https://i.pravatar.cc/150?u=admin"} alt="Admin" className="w-9 h-9 rounded-full object-cover" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{user?.roles?.join(', ')}</span>
              <span className="text-sm font-bold text-[#0B192C] leading-none">{user?.firstName} {user?.lastName}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Page Title */}
      <section className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-serif font-black text-[#0B192C] tracking-tight mb-1">Customer Directory</h2>
          <p className="text-sm font-medium text-gray-500">Manage user accounts and view lifetime purchase history.</p>
        </div>
      </section>

      {/* Data Table */}
      <section className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2 text-[#0B192C] font-bold text-sm">
            <User size={18} className="text-amber-500" />
            Total Registered Customers: {customers.length}
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="animate-spin text-amber-500" size={32} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-white">
                  <th className="py-4 pl-6 pr-3">Customer Info</th>
                  <th className="py-4 px-3">Contact</th>
                  <th className="py-4 px-3">Tier</th>
                  <th className="py-4 px-3">Joined Date</th>
                  <th className="py-4 px-3 text-center">Total Orders</th>
                  <th className="py-4 px-3 text-right">Lifetime Spend</th>
                </tr>
              </thead>
              <tbody className="text-[#0B192C] font-semibold divide-y divide-gray-50">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      No customers found.
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 pl-6 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                            {c.firstname?.[0]}{c.lastname?.[0]}
                          </div>
                          <span className="font-extrabold text-[#0B192C]">{c.firstname} {c.lastname}</span>
                        </div>
                      </td>
                      <td className="py-4 px-3">
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500">{c.email}</span>
                          <span className="text-xs text-gray-500">{c.phone || '-'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-3">
                        <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider ${
                          c.membertier === 'Standard' ? 'bg-gray-100 text-gray-600' :
                          c.membertier === 'Gold' ? 'bg-yellow-100 text-yellow-700' :
                          c.membertier === 'Platinum' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {c.membertier}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-xs text-gray-500 font-medium">
                        {new Date(c.createdat).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-4 px-3 text-center font-bold">
                        {c.totalorders}
                      </td>
                      <td className="py-4 px-3 text-right font-extrabold text-green-600">
                        {formatCurrency(c.lifetimespend)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
