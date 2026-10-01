'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ShoppingCart, Package, Users, DollarSign, AlertTriangle, FileText } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { formatCurrency } from '@/lib/formatCurrency';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

interface DashboardMetrics {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
}

export default function AdminDashboard() {
  const { token } = useAuthStore();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        
        const [metricsRes, ordersRes, stockRes] = await Promise.all([
          fetch(`${API}/api/v1/admin/dashboard/metrics`, { headers }),
          fetch(`${API}/api/v1/admin/dashboard/recent-orders`, { headers }),
          fetch(`${API}/api/v1/admin/dashboard/low-stock`, { headers })
        ]);

        const [metricsJson, ordersJson, stockJson] = await Promise.all([
          metricsRes.json(), ordersRes.json(), stockRes.json()
        ]);

        if (metricsJson.success) setMetrics(metricsJson.data);
        if (ordersJson.success) setRecentOrders(ordersJson.data);
        if (stockJson.success) setLowStock(stockJson.data);
      } catch (err) {
        console.error('Failed to load dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const displayMetrics = [
    { title: 'Total Revenue', value: metrics ? formatCurrency(metrics.totalRevenue) : '...', icon: DollarSign },
    { title: 'Orders', value: metrics ? metrics.totalOrders.toLocaleString('en-IN') : '...', icon: ShoppingCart },
    { title: 'Products', value: metrics ? metrics.totalProducts.toLocaleString('en-IN') : '...', icon: Package },
    { title: 'Active Customers', value: metrics ? metrics.totalCustomers.toLocaleString('en-IN') : '...', icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-extrabold text-[#0B192C]">Dashboard Overview</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {displayMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title} className="shadow-sm border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-500">{metric.title}</CardTitle>
                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-amber-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-[#0B192C]">{loading ? 'Loading...' : metric.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2 mt-8">
        <Card className="col-span-1 shadow-sm border-gray-200">
          <CardHeader className="bg-gray-50 border-b border-gray-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-[#0B192C] flex items-center">
              <FileText size={16} className="mr-2 text-amber-500" /> Recent Orders
            </CardTitle>
            <Link href="/admin/orders" className="text-[10px] font-extrabold uppercase tracking-widest text-blue-500 hover:underline">View All</Link>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? <div className="p-6 text-sm text-gray-400">Loading...</div> : (
              <div className="divide-y divide-gray-100">
                {recentOrders.length === 0 ? (
                  <div className="p-6 text-sm font-semibold text-gray-400">No recent orders found.</div>
                ) : (
                  recentOrders.map(order => (
                    <div key={order.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="text-sm font-bold text-[#0B192C]">{order.orderNumber}</p>
                        <p className="text-xs font-semibold text-gray-400">{new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-600">{formatCurrency(order.totalAmount)}</p>
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">{order.status}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1 shadow-sm border-gray-200">
          <CardHeader className="bg-gray-50 border-b border-gray-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-[#0B192C] flex items-center">
              <AlertTriangle size={16} className="mr-2 text-red-500" /> Low Stock Alerts
            </CardTitle>
            <Link href="/admin/products" className="text-[10px] font-extrabold uppercase tracking-widest text-blue-500 hover:underline">Manage</Link>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? <div className="p-6 text-sm text-gray-400">Loading...</div> : (
              <div className="divide-y divide-gray-100">
                {lowStock.length === 0 ? (
                  <div className="p-6 text-sm font-semibold text-green-600">Inventory is healthy.</div>
                ) : (
                  lowStock.map(product => (
                    <div key={product.id} className="p-4 flex items-center justify-between hover:bg-red-50/50 transition-colors">
                      <div>
                        <p className="text-sm font-bold text-[#0B192C] max-w-[250px] truncate">{product.name}</p>
                        <p className="text-xs font-semibold text-gray-400">{product.sku || 'No SKU'}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded ${product.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                          {product.stock} left
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
