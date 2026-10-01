'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { buildProductUrl } from '@/lib/buildProductUrl';
import { Package, Loader2, CheckCircle, Truck, XCircle, ChevronDown, ChevronUp, MapPin, Shield, RefreshCw, HelpCircle, MessageSquare, CreditCard, Download, Star, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { toast } from '@/components/ui/Toast';
import { formatCurrency } from '@/lib/formatCurrency';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items?: OrderItem[];
  shippingAddress?: Address;
  paymentInfo?: any;
  subTotal?: number;
  promoCode?: string;
  promoDiscount?: number;
  discount?: number;
  shippingCharges?: number;
  deliveryMethod?: string;
  courierName?: string;
  trackingId?: string;
  trackingUrl?: string;
}

interface OrderItem {
  id: number;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  productImage?: string;
  productSlug?: string;
  categorySlug?: string;
  warrantyPeriod?: string;
  warrantyExpiryDate?: string;
}

interface Address {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

export default function OrdersPage() {
  const { token } = useAuthStore();
  const { addItem } = useCartStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Modal States
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewItem, setReviewItem] = useState<OrderItem | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(`${API}/api/v1/orders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) {
          setOrders(json.data);
          
          // Check for ?track=orderId in URL
          const params = new URLSearchParams(window.location.search);
          const trackId = params.get('track');
          if (trackId) {
            setExpandedOrderId(trackId);
            const orderToTrack = json.data.find((o: Order) => o.id === trackId);
            if (orderToTrack) {
              setTrackingOrder(orderToTrack);
              setTrackingModalOpen(true);
            }
          }
        }
      } catch (err) {
        toast.error('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchOrders();
  }, [token]);

  const toggleOrderDetails = async (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }
    setExpandedOrderId(orderId);
    const order = orders.find(o => o.id === orderId);
    if (order && !order.items) {
      setDetailsLoading(true);
      try {
        const res = await fetch(`${API}/api/v1/orders/${orderId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) {
          setOrders(prev => prev.map(o => o.id === orderId ? { ...o, items: json.data.items, shippingAddress: json.data.shippingAddress, paymentInfo: json.data.paymentInfo, subTotal: json.data.subTotal, discount: json.data.discount, shippingCharges: json.data.shippingCharges } : o));
        }
      } catch (err) {
        toast.error('Failed to load order details');
      } finally {
        setDetailsLoading(false);
      }
    }
  };

  const downloadInvoice = async (orderId: string, orderNumber: string) => {
    try {
      setDownloadingInvoice(orderId);
      const res = await fetch(`${API}/api/v1/orders/${orderId}/invoice`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to generate invoice');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice_${orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Invoice downloaded successfully');
    } catch (err) {
      toast.error('Failed to download invoice');
    } finally {
      setDownloadingInvoice(null);
    }
  };

  const handleBuyItAgain = async (productId: string) => {
    try {
      await addItem(productId, 1);
      toast.success('Added to cart!');
    } catch (e) {
      toast.error('Failed to add to cart');
    }
  };

  const openReviewModal = (item: OrderItem) => {
    setReviewItem(item);
    setRating(5);
    setComment('');
    setReviewModalOpen(true);
  };

  const submitReview = async () => {
    if (!reviewItem) return;
    setSubmittingReview(true);
    try {
      const res = await fetch(`${API}/api/v1/reviews`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: reviewItem.productId,
          rating,
          comment
        })
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Review submitted successfully!');
        setReviewModalOpen(false);
      } else {
        toast.error(json.message || 'Failed to submit review');
      }
    } catch (e) {
      toast.error('An error occurred while submitting');
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <span className="bg-amber-100 text-amber-700 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest rounded-full flex items-center w-fit"><Loader2 size={12} className="mr-1.5 animate-spin"/> {status}</span>;
      case 'Paid':
      case 'Processing':
        return <span className="bg-blue-100 text-blue-700 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest rounded-full flex items-center w-fit"><Package size={12} className="mr-1.5"/> {status}</span>;
      case 'Shipped':
      case 'In Transit':
        return <span className="bg-purple-100 text-purple-700 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest rounded-full flex items-center w-fit"><Truck size={12} className="mr-1.5"/> {status}</span>;
      case 'Delivered':
        return <span className="bg-green-100 text-green-700 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest rounded-full flex items-center w-fit"><CheckCircle size={12} className="mr-1.5"/> Delivered</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest rounded-full flex items-center w-fit">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-amber-500" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <h1 className="text-2xl font-extrabold tracking-tight text-[#0B192C] mb-6 border-b border-gray-100 pb-4">My Orders</h1>
      
      {orders.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-100">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-[#0B192C] mb-2">No orders found</h3>
          <p className="text-sm text-gray-500 mb-6">Looks like you haven't made any purchases yet.</p>
          <Button variant="primary" className="font-extrabold uppercase tracking-widest text-xs shadow-lg shadow-amber-500/20" onClick={() => window.location.href = '/'}>
            Start Shopping
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            return (
              <div key={order.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md">
                <div 
                  className="bg-gray-50 p-4 sm:px-6 border-b border-gray-200 flex flex-wrap justify-between items-center gap-4 cursor-pointer hover:bg-gray-100/50 transition-colors"
                  onClick={() => toggleOrderDetails(order.id)}
                >
                  <div className="flex flex-wrap gap-6 sm:gap-10">
                    <div>
                      <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1">Order Placed</p>
                      <p className="text-sm font-bold text-[#0B192C]">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1">Total</p>
                      <p className="text-sm font-bold text-[#0B192C]">{formatCurrency(order.totalAmount)}</p>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1">Order #</p>
                      <p className="text-sm font-bold text-[#0B192C]">{order.orderNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {getStatusBadge(order.status)}
                    <button className="text-gray-400 hover:text-amber-500 transition-colors">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="p-4 sm:p-6 bg-white animate-in slide-in-from-top-2 duration-200">
                    {detailsLoading && !order.items ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="animate-spin text-amber-500" size={24} />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-4">
                          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                             <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest">Items Included</h3>
                             <div className="flex items-center gap-4">
                               <button onClick={() => {
                                 setTrackingOrder(order);
                                 setTrackingModalOpen(true);
                               }} className="flex items-center text-blue-600 hover:text-blue-700 text-xs font-extrabold transition-colors bg-blue-50 px-2 py-1 rounded">
                                 <Truck size={14} className="mr-1" /> Track Order
                               </button>
                               <button onClick={() => downloadInvoice(order.id, order.orderNumber)} disabled={downloadingInvoice === order.id} className="flex items-center text-amber-600 hover:text-amber-700 text-xs font-extrabold transition-colors disabled:opacity-50">
                                   {downloadingInvoice === order.id ? (
                                      <><Loader2 size={14} className="mr-1 animate-spin" /> Generating...</>
                                   ) : (
                                      <><Download size={14} className="mr-1" /> Download Invoice</>
                                   )}
                                 </button>
                             </div>
                          </div>
                          <div className="space-y-6">
                            {order.items?.map((item: any) => (
                              <div key={item.id} className="flex flex-col border-b border-gray-100 last:border-0 pb-6 gap-4">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                                    <div className="flex items-start space-x-4">
                                    <Link href={buildProductUrl(item.categorySlug, item.brandSlug, item.productSlug || item.productId)} className="relative w-20 h-20 bg-white border border-gray-100 rounded-md flex items-center justify-center p-2 hover:border-amber-400 transition-colors shrink-0">
                                        {item.productImage ? (
                                        <img src={`http://localhost:5030${item.productImage}`} alt={item.productName} className="w-full h-full object-contain" />
                                        ) : (
                                        <Package size={24} className="text-gray-300" />
                                        )}
                                        {item.quantity > 1 && (
                                            <div className="absolute -bottom-2 -right-2 bg-amber-500 text-white w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-extrabold border-2 border-white shadow-sm">
                                                {item.quantity}x
                                            </div>
                                        )}
                                    </Link>
                                    <div>
                                        <Link href={buildProductUrl(item.categorySlug, item.brandSlug, item.productSlug || item.productId)} className="text-sm font-bold text-[#0B192C] hover:text-amber-500 transition-colors line-clamp-2">
                                        {item.productName}
                                        </Link>
                                        <p className="text-xs font-semibold text-gray-500 mt-1">Price: {formatCurrency(item.price)}</p>
                                        
                                        {item.warrantyPeriod && (
                                        <div className="flex items-center mt-2 space-x-2">
                                            <Shield size={12} className="text-gray-400" />
                                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500">
                                            {item.warrantyPeriod} Warranty
                                            </span>
                                            {item.warrantyExpiryDate && (
                                            <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-sm tracking-wider ${new Date(item.warrantyExpiryDate) > new Date() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {new Date(item.warrantyExpiryDate) > new Date() ? 'ACTIVE' : 'EXPIRED'}
                                                {' '}UNTIL {new Date(item.warrantyExpiryDate).toLocaleDateString()}
                                            </span>
                                            )}
                                        </div>
                                        )}
                                    </div>
                                    </div>
                                    <div className="text-left sm:text-right pt-2 sm:pt-0">
                                    <p className="text-base font-extrabold text-[#0B192C]">{formatCurrency(item.price * item.quantity)}</p>
                                    </div>
                                </div>
                                {order.status === 'Delivered' && (
                                    <div className="flex flex-wrap gap-3 pl-0 sm:pl-24">
                                        <Button variant="outline" size="sm" className="h-8 text-[11px] font-extrabold flex items-center" onClick={() => handleBuyItAgain(item.productId)}>
                                            <RefreshCw size={12} className="mr-1.5" /> Buy It Again
                                        </Button>
                                        <Button variant="outline" size="sm" className="h-8 text-[11px] font-extrabold flex items-center" onClick={() => setSupportModalOpen(true)}>
                                            <HelpCircle size={12} className="mr-1.5" /> Get product support
                                        </Button>
                                        <Button variant="outline" size="sm" className="h-8 text-[11px] font-extrabold flex items-center" onClick={() => openReviewModal(item)}>
                                            <MessageSquare size={12} className="mr-1.5" /> Write a product review
                                        </Button>
                                    </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-gray-50 p-5 rounded-lg border border-gray-100 h-fit">
                                <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-3 mb-3">
                                Order Summary
                                </h3>
                                <div className="space-y-2 mb-3 border-b border-gray-200 pb-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600 font-medium">Item(s) Subtotal (MRP)</span>
                                        <span className="font-bold text-[#0B192C]">{formatCurrency(order.subTotal || 0)}</span>
                                    </div>
                                    {(order.discount || 0) > 0 && (
                                        <div className="flex justify-between items-center text-sm text-green-600">
                                            <span className="font-medium">Product Discount</span>
                                            <span className="font-bold">- {formatCurrency(order.discount || 0)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600 font-medium">Shipping charges</span>
                                        <span className="font-bold text-[#0B192C]">{formatCurrency(order.shippingCharges || 0)}</span>
                                    </div>
                                    {(order.promoDiscount || 0) > 0 && (
                                        <div className="flex justify-between items-center text-sm text-green-600 mb-2">
                                            <span className="font-medium">Promo Code ({order.promoCode})</span>
                                            <span className="font-bold">- {formatCurrency(order.promoDiscount || 0)}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-extrabold text-[#0B192C] uppercase tracking-wider">Grand Total</span>
                                    <span className="text-lg font-extrabold text-amber-600">{formatCurrency(order.totalAmount || 0)}</span>
                                </div>
                            </div>
                            
                            {order.shippingAddress && (
                            <div className="bg-gray-50 p-5 rounded-lg border border-gray-100 h-fit">
                                <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-3 mb-3 flex items-center">
                                <MapPin size={14} className="mr-1.5" /> Ship to
                                </h3>
                                <p className="text-sm font-bold text-[#0B192C]">{order.shippingAddress.fullName}</p>
                                <p className="text-sm text-gray-600 mt-1">{order.shippingAddress.addressLine1}</p>
                                {order.shippingAddress.addressLine2 && <p className="text-sm text-gray-600">{order.shippingAddress.addressLine2}</p>}
                                <p className="text-sm text-gray-600">{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}</p>
                                <p className="text-sm text-gray-600 mt-2 font-medium">Phone: {order.shippingAddress.phone}</p>
                            </div>
                            )}

                            {order.paymentInfo && (
                            <div className="bg-gray-50 p-5 rounded-lg border border-gray-100 h-fit">
                                <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-3 mb-3 flex items-center">
                                <CreditCard size={14} className="mr-1.5" /> Payment method
                                </h3>
                                <div className="flex items-center space-x-2">
                                    <div className="w-8 h-5 bg-white border border-gray-200 flex items-center justify-center rounded shadow-sm">
                                        <span className="text-[8px] font-black text-blue-900">PAY</span>
                                    </div>
                                    <p className="text-sm font-bold text-[#0B192C]">{order.paymentInfo.method || 'Online Payment'}</p>
                                </div>
                                <p className="text-xs text-gray-500 mt-2 font-medium">Transaction ID: {order.paymentInfo.razorpayPaymentId || 'N/A'}</p>
                            </div>
                            )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Support Modal */}
      {supportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200 relative">
            <button onClick={() => setSupportModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-600">
              <HelpCircle size={24} />
            </div>
            <h2 className="text-xl font-bold text-[#0B192C] mb-2">Need Help?</h2>
            <p className="text-sm text-gray-600 mb-6">Our customer support team is available 24/7 to assist you with your purchase.</p>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Call Us (Toll Free)</p>
                <p className="text-lg font-extrabold text-[#0B192C]">1800-425-4255</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email Support</p>
                <p className="text-sm font-bold text-[#0B192C]">support@malieakal.com</p>
              </div>
            </div>
            <Button className="w-full mt-6" onClick={() => setSupportModalOpen(false)}>Close</Button>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModalOpen && reviewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200 relative">
            <button onClick={() => setReviewModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold text-[#0B192C] mb-2">Write a Review</h2>
            <p className="text-sm text-gray-600 mb-6">Share your experience with {reviewItem.productName}</p>
            
            <div className="mb-6">
              <label className="block text-sm font-bold text-[#0B192C] mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button 
                    key={star} 
                    type="button" 
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star size={32} className={`${rating >= star ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-bold text-[#0B192C] mb-2">Review Details</label>
              <textarea 
                className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
                rows={4}
                placeholder="What did you like or dislike?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setReviewModalOpen(false)}>Cancel</Button>
              <Button variant="primary" className="flex-1" onClick={submitReview} disabled={submittingReview}>
                {submittingReview ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Submit Review'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tracking Modal */}
      {trackingModalOpen && trackingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="text-lg font-extrabold text-[#0B192C]">Track Order</h2>
              <button 
                onClick={() => setTrackingModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 hover:bg-gray-100 px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6 pb-4 border-b border-gray-100">
                <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1">Order Number</p>
                <p className="text-sm font-bold text-[#0B192C]">{trackingOrder.orderNumber}</p>
                <p className="text-xs text-gray-500 mt-1">Status: {trackingOrder.status}</p>
              </div>

              {trackingOrder.deliveryMethod === 'Third-Party' ? (
                <div className="space-y-4 text-center py-4">
                  <Truck size={48} className="mx-auto text-blue-500 mb-2" />
                  <h3 className="text-lg font-extrabold text-[#0B192C]">Shipped via {trackingOrder.courierName || 'Courier'}</h3>
                  {trackingOrder.trackingId && (
                    <p className="text-sm text-gray-600">
                      Tracking ID: <span className="font-bold text-[#0B192C]">{trackingOrder.trackingId}</span>
                    </p>
                  )}
                  {trackingOrder.trackingUrl && (
                    <a 
                      href={trackingOrder.trackingUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-sm font-bold transition-colors mt-4 shadow-lg shadow-blue-500/30"
                    >
                      Track on {trackingOrder.courierName} Website
                    </a>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Visual Timeline for In-House Delivery */}
                  <h3 className="text-sm font-extrabold text-[#0B192C] mb-4">In-House Delivery Progress</h3>
                  <div className="relative border-l-2 border-gray-200 ml-3 space-y-6">
                    {['Pending', 'Confirmed', 'Processing', 'Out for Delivery', 'Delivered'].map((step, idx) => {
                      // Simple logic to determine if step is completed
                      const statuses = ['Pending', 'Confirmed', 'Processing', 'Out for Delivery', 'Delivered'];
                      const currentIdx = statuses.indexOf(trackingOrder.status);
                      const isCompleted = currentIdx >= idx;
                      const isCurrent = currentIdx === idx;
                      
                      return (
                        <div key={step} className="relative pl-6">
                          <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 bg-white ${
                            isCompleted ? 'border-green-500 bg-green-500' : 'border-gray-300'
                          }`}>
                            {isCompleted && <CheckCircle size={12} className="text-white relative -left-0.5 -top-0.5" />}
                          </div>
                          <p className={`text-sm font-bold ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-gray-800' : 'text-gray-400'}`}>
                            {step}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <Button variant="outline" onClick={() => setTrackingModalOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
