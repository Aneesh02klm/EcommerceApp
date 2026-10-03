'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Search, Loader2, FileText, CheckCircle, Package, Truck, XCircle, ChevronUp, ChevronDown, Filter } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';
import { formatCurrency } from '@/lib/formatCurrency';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  userId: string;
  deliveryAddressSnapshot?: string;
  emailAddress?: string;
  deliveryMethod?: string;
  courierName?: string;
  trackingId?: string;
  trackingUrl?: string;
}

export default function AdminOrdersPage() {
  const { token } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState<string>('Actionable');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Order, direction: 'asc' | 'desc' }>({ key: 'createdAt', direction: 'desc' });

  
  // Tracking Update State
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingForm, setTrackingForm] = useState({
    deliveryMethod: 'In-House',
    courierName: '',
    trackingId: '',
    trackingUrl: ''
  });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/admin/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (json.success) setOrders(json.data);
    } catch (err) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchOrders();
  }, [token]);

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`${API}/api/v1/admin/orders/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Order status updated to ${newStatus}`);
        fetchOrders();
      } else {
        toast.error(data.message || 'Failed to update status');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setUpdatingId(null);
    }
  };

  const updateTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setUpdatingId(selectedOrder.id);
    try {
      const res = await fetch(`${API}/api/v1/admin/orders/${selectedOrder.id}/tracking`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(trackingForm)
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Tracking updated for ${selectedOrder.orderNumber}`);
        setTrackingModalOpen(false);
        fetchOrders();
      } else {
        toast.error(data.message || 'Failed to update tracking');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setUpdatingId(null);
    }
  };

  const openTrackingModal = (order: Order) => {
    setSelectedOrder(order);
    setTrackingForm({
      deliveryMethod: order.deliveryMethod || 'In-House',
      courierName: order.courierName || '',
      trackingId: order.trackingId || '',
      trackingUrl: order.trackingUrl || ''
    });
    setTrackingModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <span className="bg-amber-100 text-amber-700 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest rounded flex items-center w-fit"><Loader2 size={12} className="mr-1 animate-spin"/> {status}</span>;
      case 'Paid':
        return <span className="bg-blue-100 text-blue-700 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest rounded flex items-center w-fit"><CheckCircle size={12} className="mr-1"/> {status}</span>;
      case 'Shipped':
        return <span className="bg-purple-100 text-purple-700 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest rounded flex items-center w-fit"><Truck size={12} className="mr-1"/> {status}</span>;
      case 'Delivered':
        return <span className="bg-green-100 text-green-700 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest rounded flex items-center w-fit"><Package size={12} className="mr-1"/> {status}</span>;
      case 'Cancelled':
        return <span className="bg-red-100 text-red-700 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest rounded flex items-center w-fit"><XCircle size={12} className="mr-1"/> {status}</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest rounded">{status}</span>;
    }
  };

  
  const getFilteredOrders = () => {
    let result = [...orders];
    
    if (filterStatus === 'Actionable') {
      result = result.filter(o => !['Delivered', 'Cancelled'].includes(o.status));
    } else if (filterStatus !== 'All') {
      result = result.filter(o => o.status === filterStatus);
    }
    
    result.sort((a, b) => {
      let aVal = a[sortConfig.key] || '';
      let bVal = b[sortConfig.key] || '';
      if (sortConfig.key === 'totalAmount') {
        aVal = Number(aVal);
        bVal = Number(bVal);
      }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return result;
  };

  const filteredOrders = getFilteredOrders();

  const handleSort = (key: keyof Order) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const SortIcon = ({ columnKey }: { columnKey: keyof Order }) => {
    if (sortConfig.key !== columnKey) return <ChevronDown size={14} className="inline ml-1 opacity-20" />;
    return sortConfig.direction === 'asc' 
      ? <ChevronUp size={14} className="inline ml-1 text-amber-500" />
      : <ChevronDown size={14} className="inline ml-1 text-amber-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0B192C]">Order Management</h1>
          <p className="text-sm text-gray-500 font-semibold mt-1">View and process customer orders.</p>
        </div>
      </div>

      <Card className="shadow-sm border-gray-200">
        <CardHeader className="bg-gray-50 border-b border-gray-200 flex flex-row items-center justify-between py-4">
          <CardTitle className="text-sm font-bold text-[#0B192C] flex items-center">
            <FileText size={18} className="mr-2 text-amber-500" /> All Orders
          </CardTitle>
          
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded p-1.5 text-xs font-semibold text-[#0B192C] focus:ring-1 focus:ring-amber-500 outline-none"
            >
              <option value="Actionable">Actionable Orders</option>
              <option value="All">All Orders</option>
              <option value="Placed">Placed</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div className="relative max-w-xs w-full">

            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by order number..." 
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 outline-none text-xs font-semibold text-[#0B192C]"
            />
          </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="animate-spin text-amber-500" size={32} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('orderNumber')}>Order ID <SortIcon columnKey="orderNumber"/></th>
                     <th className="px-6 py-4">Customer</th>
                     <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('createdAt')}>Date <SortIcon columnKey="createdAt"/></th>
                    <th className="px-6 py-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('totalAmount')}>Amount <SortIcon columnKey="totalAmount"/></th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Update Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <FileText size={48} className="mx-auto text-gray-200 mb-3" />
                        <p className="text-gray-400 font-semibold">No orders found.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {

                      let customerName = 'Unknown';
                      let customerPhone = 'Unknown';
                      try {
                        if (order.deliveryAddressSnapshot) {
                            const snap = JSON.parse(order.deliveryAddressSnapshot);
                            customerName = snap.fullName || snap.FullName || 'Unknown';
                            customerPhone = snap.phone || snap.Phone || 'Unknown';
                        } else {
                            customerName = order.emailAddress || 'Unknown';
                        }
                      } catch(e) {}

                    return (
                      <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-extrabold text-blue-600 hover:underline"><Link href={`/admin/orders/${order.id}`}>{order.orderNumber}</Link></td>
                        <td className="px-6 py-4 text-[#0B192C] font-semibold">{customerName}</td>
                        <td className="px-6 py-4 text-gray-500 font-medium">{customerPhone}</td>
                        <td className="px-6 py-4 font-semibold text-gray-500 text-xs">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                        </td>
                        <td className="px-6 py-4 font-bold text-green-600">{formatCurrency(order.totalAmount)}</td>
                        <td className="px-6 py-4">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                          <button
                            onClick={() => openTrackingModal(order)}
                            className="p-2 border border-blue-300 rounded text-xs font-bold text-blue-700 hover:bg-blue-50 transition-colors"
                          >
                            Tracking
                          </button>
                          <select
                            disabled={updatingId === order.id}
                            value={order.status}
                            onChange={(e) => updateStatus(order.id, e.target.value)}
                            className="p-2 border border-gray-300 rounded text-xs font-bold text-[#0B192C] focus:ring-1 focus:ring-amber-500 outline-none disabled:bg-gray-100 cursor-pointer"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Processing">Processing</option>
                            <option value="Out for Delivery">Out for Delivery</option>
                            <option value="Paid">Paid</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {trackingModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="text-lg font-extrabold text-[#0B192C]">Update Tracking</h2>
              <button 
                onClick={() => setTrackingModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 hover:bg-gray-100 px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={updateTracking} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">Delivery Method</label>
                <select 
                  className="w-full border border-gray-200 rounded p-2 text-sm outline-none focus:border-amber-400"
                  value={trackingForm.deliveryMethod}
                  onChange={e => setTrackingForm({...trackingForm, deliveryMethod: e.target.value})}
                >
                  <option value="In-House">In-House Fleet</option>
                  <option value="Third-Party">Third-Party Courier</option>
                </select>
              </div>

              {trackingForm.deliveryMethod === 'Third-Party' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">Courier Name</label>
                    <input 
                      required 
                      className="w-full border border-gray-200 rounded p-2 text-sm outline-none focus:border-amber-400"
                      value={trackingForm.courierName}
                      onChange={e => setTrackingForm({...trackingForm, courierName: e.target.value})}
                      placeholder="e.g. BlueDart, Delhivery"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">Tracking ID</label>
                    <input 
                      required 
                      className="w-full border border-gray-200 rounded p-2 text-sm outline-none focus:border-amber-400"
                      value={trackingForm.trackingId}
                      onChange={e => setTrackingForm({...trackingForm, trackingId: e.target.value})}
                      placeholder="AWB or Tracking Number"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">Tracking URL (Optional)</label>
                    <input 
                      type="url"
                      className="w-full border border-gray-200 rounded p-2 text-sm outline-none focus:border-amber-400"
                      value={trackingForm.trackingUrl}
                      onChange={e => setTrackingForm({...trackingForm, trackingUrl: e.target.value})}
                      placeholder="https://..."
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                <Button variant="outline" type="button" onClick={() => setTrackingModalOpen(false)}>Cancel</Button>
                <Button variant="primary" type="submit" disabled={updatingId === selectedOrder.id}>
                  {updatingId === selectedOrder.id ? 'Saving...' : 'Save Tracking'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
