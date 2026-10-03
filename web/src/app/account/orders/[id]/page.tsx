'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';
import { Loader2, ArrowLeft, Download, User, MapPin, CreditCard, Package, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/formatCurrency';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

export default function CustomerOrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token } = useAuthStore();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (token && id) {
      fetchOrderDetails();
    }
  }, [token, id]);

  const fetchOrderDetails = async () => {
    try {
      const res = await fetch(`${API}/api/v1/orders/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setOrder(json.data);
      } else {
        toast.error(json.message || 'Error occurred');
        router.push('/account/orders');
      }
    } catch (error) {
      toast.error('Failed to load order details');
      router.push('/account/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      setDownloading(true);
      const res = await fetch(`${API}/api/v1/orders/${id}/invoice`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to download');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice_${order.orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      toast.error('Failed to download invoice');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-amber-500" size={32} />
      </div>
    );
  }

  if (!order) return null;

  let snap: any = {};
  try {
    snap = order.deliveryAddressSnapshot ? JSON.parse(order.deliveryAddressSnapshot) : {};
  } catch(e) {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/account/orders" className="p-2 -ml-2 text-gray-400 hover:text-[#0B192C] hover:bg-gray-50 rounded-full transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#0B192C]">Order {order.orderNumber}</h1>
            <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
              order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 
              order.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 
              'bg-blue-100 text-blue-700'
            }`}>
              {order.status === 'Placed' ? 'Order Confirmed' : order.status}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-500 mt-1 ml-11">
            Placed on {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>
        
        <button 
          onClick={handleDownloadInvoice}
          disabled={downloading}
          className="flex items-center gap-2 px-4 py-2 bg-[#0B192C] hover:bg-gray-800 text-white text-xs font-bold uppercase tracking-wider rounded transition-colors disabled:opacity-50"
        >
          {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          Download Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Items & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-sm font-extrabold text-[#0B192C] flex items-center gap-2">
                <Package size={16} className="text-gray-400" />
                Items Ordered
              </h2>
            </div>
            <div className="p-4 space-y-4">
              {order.items.map((item: any) => (
                <div key={item.id} className="flex gap-4">
                  <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center shrink-0 border border-gray-100">
                     <Package size={24} className="text-gray-300" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-[#0B192C] line-clamp-2">{item.productName}</h4>
                    <p className="text-xs font-semibold text-gray-500 mt-1">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-[#0B192C]">{formatCurrency(item.price)}</p>
                    <p className="text-[10px] font-bold text-gray-400 line-through">{formatCurrency(item.price * 1.2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Immutable Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-sm font-extrabold text-[#0B192C] flex items-center gap-2">
                <Clock size={16} className="text-gray-400" />
                Order Status Timeline
              </h2>
            </div>
            <div className="p-6">
              {order.statusHistory && order.statusHistory.length > 0 ? (
                <div className="relative border-l-2 border-gray-100 ml-3 space-y-6">
                  {order.statusHistory.map((history: any, index: number) => {
                     const isLast = index === order.statusHistory.length - 1;
                     return (
                      <div key={history.id} className="relative pl-6">
                        <span className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 \${isLast ? 'bg-amber-500 border-white ring-2 ring-amber-100' : 'bg-gray-200 border-white'}`}></span>
                        <h4 className={`text-sm font-extrabold \${isLast ? 'text-[#0B192C]' : 'text-gray-500'}`}>
                          {history.status === 'Placed' ? 'Order Confirmed' : history.status}
                        </h4>
                        <p className="text-xs font-semibold text-gray-400 mt-0.5">
                          {new Date(history.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                        {history.comments && (
                          <p className="text-xs font-medium text-gray-500 mt-2 bg-gray-50 p-2 rounded border border-gray-100">
                            {history.comments}
                          </p>
                        )}
                      </div>
                     );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500 font-medium">No tracking history available.</p>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Customer Info & Summary */}
        <div className="space-y-6">
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-sm font-extrabold text-[#0B192C] flex items-center gap-2">
                <MapPin size={16} className="text-gray-400" />
                Shipping Details
              </h2>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Deliver To</p>
                <p className="text-sm font-bold text-[#0B192C] mt-1">{snap.FullName || snap.fullName || order.emailAddress || 'Customer'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone</p>
                <p className="text-sm font-semibold text-gray-600 mt-1">{snap.Phone || snap.phone || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Address</p>
                <p className="text-xs font-semibold text-gray-600 mt-1 leading-relaxed">
                  {[snap.FlatHouseNo, snap.AreaStreet, snap.City, snap.State, snap.Pincode].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-sm font-extrabold text-[#0B192C] flex items-center gap-2">
                <CreditCard size={16} className="text-gray-400" />
                Payment Summary
              </h2>
            </div>
            <div className="p-4 space-y-3">
              
              <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                <div>
                  <p className="text-xs font-bold text-gray-500">Method</p>
                  <p className="text-sm font-extrabold text-[#0B192C] mt-0.5">{order.paymentMethod || 'Online'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-500">Status</p>
                  <span className={`inline-block mt-0.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest \${order.paymentInfo?.status === 'Success' || order.paymentInfo?.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {order.paymentInfo?.status || 'Pending'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex justify-between text-xs font-semibold text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subTotal)}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-gray-500">
                  <span>Shipping</span>
                  <span>{formatCurrency(order.shippingCharges || 0)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-xs font-bold text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-extrabold text-[#0B192C] pt-2 border-t border-gray-100">
                  <span>Total</span>
                  <span>{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
