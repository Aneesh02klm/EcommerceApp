'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';
import { Loader2, ArrowLeft, Download, User, MapPin, CreditCard, Package, Clock } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/formatCurrency';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

export default function AdminOrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token } = useAuthStore();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token && id) {
      fetchOrderDetails();
    }
  }, [token, id]);

  const fetchOrderDetails = async () => {
    try {
      const res = await fetch(`${API}/api/v1/admin/orders/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setOrder(json.data);
      } else {
        toast.error(json.message || 'Order not found');
      }
    } catch (err) {
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      const res = await fetch(`${API}/api/v1/orders/${id}/invoice`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Invoice_${order.orderNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      } else {
        toast.error('Invoice generation failed or not available');
      }
    } catch(err) {
      toast.error('Network error while downloading invoice');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-[50vh]"><Loader2 className="animate-spin text-amber-500" size={48} /></div>;
  }

  if (!order) return <div className="text-center py-20 text-gray-500">Order not found.</div>;

  let customer = { fullName: order.emailAddress || 'Unknown', phone: 'N/A', addressLine1: '', city: '', state: '', pincode: '' };
  try {
    if (order.deliveryAddressSnapshot) {
      const snap = JSON.parse(order.deliveryAddressSnapshot);
      customer = {
        fullName: snap.fullName || snap.FullName || customer.fullName,
        phone: snap.phone || snap.Phone || 'N/A',
        addressLine1: snap.addressLine1 || snap.AddressLine1 || snap.flatHouseNo || '',
        city: snap.city || snap.City || '',
        state: snap.state || snap.State || '',
        pincode: snap.pincode || snap.Pincode || ''
      };
    }
  } catch(e) {}

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="text-gray-500" size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-[#0B192C]">Order {order.orderNumber}</h1>
            <p className="text-sm font-semibold text-gray-500 mt-1">
              {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
          <span className="ml-4 px-3 py-1 bg-amber-100 text-amber-800 font-bold text-xs uppercase tracking-widest rounded">
            {order.status}
          </span>
        </div>
        <button 
          onClick={handleDownloadInvoice}
          className="flex items-center gap-2 bg-[#0B192C] text-white px-5 py-2.5 rounded text-sm font-bold shadow-sm hover:bg-[#162a45] transition-colors"
        >
          <Download size={16} /> Download Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Items & Timeline) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Order Items */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <Package className="text-amber-500" size={18} />
              <h2 className="text-sm font-black text-[#0B192C] uppercase tracking-widest">Order Items</h2>
            </div>
            <div className="p-5">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-gray-500 uppercase font-bold border-b border-gray-100">
                  <tr>
                    <th className="pb-3">Product</th>
                    <th className="pb-3">Price</th>
                    <th className="pb-3 text-center">Qty</th>
                    <th className="pb-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {order.items?.map((item: any) => (
                    <tr key={item.id}>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                            {item.productImage && <img src={item.productImage} className="w-full h-full object-cover" alt="" />}
                          </div>
                          <div>
                            <p className="font-bold text-[#0B192C]">{item.productName}</p>
                            <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase">ID: {item.productId.substring(0,8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 font-semibold text-gray-600">{formatCurrency(item.price)}</td>
                      <td className="py-4 text-center font-bold text-[#0B192C]">{item.quantity}</td>
                      <td className="py-4 text-right font-bold text-green-600">{formatCurrency(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-6 border-t border-gray-100 pt-6 flex justify-end">
                <div className="w-64 space-y-3 text-sm">
                  <div className="flex justify-between font-semibold text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(order.subTotal)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-gray-600">
                    <span>Shipping</span>
                    <span>{order.shippingCharges > 0 ? formatCurrency(order.shippingCharges) : 'Free'}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between font-semibold text-green-600">
                      <span>Discount</span>
                      <span>-{formatCurrency(order.discount)}</span>
                    </div>
                  )}
                  {order.promoDiscount > 0 && (
                    <div className="flex justify-between font-semibold text-amber-600">
                      <span>Promo ({order.promoCode})</span>
                      <span>-{formatCurrency(order.promoDiscount)}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-gray-100 flex justify-between text-lg font-black text-[#0B192C]">
                    <span>Total</span>
                    <span>{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Immutable Status Timeline */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <Clock className="text-amber-500" size={18} />
              <h2 className="text-sm font-black text-[#0B192C] uppercase tracking-widest">Status Timeline</h2>
            </div>
            <div className="p-6">
              {(!order.statusHistory || order.statusHistory.length === 0) ? (
                <p className="text-gray-500 text-sm font-medium">No timeline history available.</p>
              ) : (
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                  {order.statusHistory.map((history: any, index: number) => (
                    <div key={history.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white bg-amber-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10"></div>
                      <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.25rem)] bg-white p-4 rounded border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-[#0B192C] text-sm uppercase tracking-wider">{history.status}</span>
                          <span className="text-[10px] font-bold text-gray-400">{new Date(history.createdAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</span>
                        </div>
                        {history.comments && <p className="text-xs text-gray-500 mt-1">{history.comments}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column (Customer & Payment) */}
        <div className="space-y-6">
          
          {/* Customer Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <User className="text-amber-500" size={18} />
              <h2 className="text-sm font-black text-[#0B192C] uppercase tracking-widest">Customer</h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Name</p>
                <p className="font-semibold text-[#0B192C]">{customer.fullName}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Contact</p>
                <p className="font-semibold text-gray-600">{customer.phone}</p>
                <p className="font-semibold text-gray-600">{order.emailAddress || 'No email provided'}</p>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <MapPin className="text-amber-500" size={18} />
              <h2 className="text-sm font-black text-[#0B192C] uppercase tracking-widest">Shipping Address</h2>
            </div>
            <div className="p-5">
              <p className="font-semibold text-[#0B192C] mb-2">{customer.fullName}</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                {customer.addressLine1}<br/>
                {customer.city}, {customer.state} {customer.pincode}
              </p>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <CreditCard className="text-amber-500" size={18} />
              <h2 className="text-sm font-black text-[#0B192C] uppercase tracking-widest">Payment Details</h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Method</p>
                <p className="font-semibold text-[#0B192C]">{order.paymentMethod}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Payment Status</p>
                <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${order.paymentInfo?.status === 'Success' || order.paymentInfo?.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {order.paymentInfo?.status || 'Pending'}
                </span>
              </div>
              {order.paymentInfo?.razorpayPaymentId && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Transaction ID</p>
                  <p className="font-mono text-xs text-gray-600">{order.paymentInfo.razorpayPaymentId}</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
