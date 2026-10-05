'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { Star, Truck, ShieldCheck, ChevronRight, Check, MapPin, MapPinIcon } from 'lucide-react';
import { ProductGallery } from '@/components/ui/ProductGallery';
import { AddToCartWidget } from '@/components/ui/AddToCartWidget';
import { ProductCard } from '@/components/ui/ProductCard';
import { formatCurrency } from '@/lib/formatCurrency';
import { FlashSaleCountdown } from '@/components/ui/FlashSaleCountdown';

export function ProductDetailClient({ product, category, brand, specifications, relatedProducts, API }: any) {
    const [activeTab, setActiveTab] = useState('description');
  const [pincode, setPincode] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState<string | null>(null);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const { token } = useAuthStore();

  // Update Recently Viewed in Local Storage
  useEffect(() => {
    if (!product) return;
    try {
      const mappedProduct = {
        ...product,
        mrp: product.mrp ?? product.MRP ?? 0,
        finalprice: product.finalPrice ?? product.finalprice ?? 0,
        discount: product.discount ?? product.Discount ?? 0,
        imageurl: product.images?.[0]?.imageUrl || product.imageurl || product.imageUrl,
      };

      const stored = JSON.parse(localStorage.getItem('recently_viewed') || '[]');
      const filtered = stored.filter((p: any) => p.id !== product.id);
      const updated = [mappedProduct, ...filtered].slice(0, 8);
      localStorage.setItem('recently_viewed', JSON.stringify(updated));
      setRecentlyViewed(filtered.slice(0, 4)); // Show previous ones
    } catch(e) {}
  }, [product]);

  const discountAmount = product.mrp - product.finalPrice;
      
  
  
  const handleOptionSelect = (key: string, val: string) => {
    const newOpts = { ...({}), [key]: val };
    
    // Attempt exact match
    let match = product.variants.find((v: any) => {
      try {
        const attrs = typeof v.attributesJSON === 'string' ? JSON.parse(v.attributesJSON) : (v.attributesJSON || {});
        return Object.entries(newOpts).every(([k, v]) => attrs[k] === v);
      } catch(e) { return false; }
    });

    if (match) {
      // setSelectedOptions(newOpts);
      // setSelectedVariant(match);
    } else {
      // If exact combination doesn't exist, find the first variant that has this new option
      match = product.variants.find((v: any) => {
        try {
          const attrs = typeof v.attributesJSON === 'string' ? JSON.parse(v.attributesJSON) : (v.attributesJSON || {});
          return attrs[key] === val;
        } catch(e) { return false; }
      });
      if (match) {
        try {
          const attrs = typeof match.attributesJSON === 'string' ? JSON.parse(match.attributesJSON) : (match.attributesJSON || {});
          // setSelectedOptions(attrs);
          // setSelectedVariant(match);
        } catch(e) {}
      }
    }
  };

  const vKeys = (() => {
    try {
      return typeof product.variantKeys === 'string' ? JSON.parse(product.variantKeys) : (product.variantKeys || []);
    } catch { return []; }
  })();

  const vOptions = (key: string) => {
    const opts = new Set<string>();
    (product.variants || []).forEach((v: any) => {
      try {
        const attrs = typeof v.attributesJSON === 'string' ? JSON.parse(v.attributesJSON) : (v.attributesJSON || {});
        if (attrs[key]) opts.add(attrs[key]);
      } catch(e) {}
    });
    return Array.from(opts);
  };

  const [checkingPincode, setCheckingPincode] = useState(false);

  const checkPincode = async () => {
    if (pincode.length !== 6) {
      setDeliveryInfo('Please enter a valid 6-digit pincode.');
      return;
    }
    
    try {
      setCheckingPincode(true);
      const res = await fetch(`${API || 'http://localhost:5030'}/api/v1/delivery/check-pincode/${pincode}`);
      const result = await res.json();
      
      if (result.success && result.data) {
        if (result.data.isServiceable) {
          setDeliveryInfo(`Deliverable. ${result.data.estimatedDays} (Delivery Charge: ₹${result.data.charge})`);
        } else {
          setDeliveryInfo(result.data.message || 'Delivery is not available to this pincode.');
        }
      } else {
        setDeliveryInfo('Could not verify serviceability.');
      }
    } catch (err) {
      setDeliveryInfo('Error checking pincode.');
    } finally {
      setCheckingPincode(false);
    }
  };

  const images = product.images || [];

  const richMedia = product.richMedia || [];

  return (
    <div className="bg-gray-50 min-h-screen pb-24 lg:pb-12">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-100 mb-6 shadow-sm">
        <div className="container mx-auto px-6 py-3 flex items-center gap-2 text-[11px] font-semibold text-gray-500 uppercase tracking-widest overflow-x-auto hide-scrollbar whitespace-nowrap">
          <Link href="/" className="hover:text-amber-500 transition-colors">Home</Link>
          <ChevronRight size={12} className="text-gray-300 shrink-0" />
          <Link href="/products" className="hover:text-amber-500 transition-colors">Products</Link>
          {category && (
            <>
              <ChevronRight size={12} className="text-gray-300 shrink-0" />
              <Link href={`/products/${category.slug}`} className="hover:text-amber-500 transition-colors">
                {category.name}
              </Link>
            </>
          )}
          <ChevronRight size={12} className="text-gray-300 shrink-0" />
          <span className="text-[#0B192C]">{product.name}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6">
        
        {/* Main 2-Column Product Section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12 shadow-sm items-start">
          
          {/* LEFT COLUMN: Gallery */}
          <div className="w-full min-w-0 lg:sticky lg:top-28">
            <ProductGallery images={images} productId={product.id} />
          </div>

          {/* RIGHT COLUMN: Details & Actions */}
          <div className="w-full flex flex-col min-w-0">
            
            {/* 1. Header: Brand, Title, Reviews, Stock */}
            <div className="mb-6 border-b border-gray-100 pb-6">
              <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-widest mb-2 block">
                {brand ? `${brand.name} DIRECT AUTHORIZED` : 'DIRECT AUTHORIZED'}
              </span>
              {product.appliedPromotionType === 'FLASH_SALE' && (
                  <div className="mb-4">
                    <div className="flex flex-col gap-2">
                      <span className="bg-red-600 text-white text-[11px] font-black px-2.5 py-1 rounded shadow-sm uppercase tracking-wider w-fit flex items-center gap-1">
                        ⚡ FLASH SALE
                      </span>
                      {product.flashSaleEndTime && <FlashSaleCountdown endTime={product.flashSaleEndTime} saleName={product.flashSaleName} />}
                    </div>
                  </div>
                )}
                {product.appliedPromotionType === 'CATALOG_PROMOTION' && (
                  <div className="mb-4">
                    <span className="bg-amber-500 text-white text-[11px] font-black px-2.5 py-1 rounded shadow-sm uppercase tracking-wider w-fit flex items-center gap-1">
                      🔥 LIMITED DEAL
                    </span>
                  </div>
                )}
              <h1 className="text-3xl lg:text-[40px] font-serif font-black text-[#0B192C] leading-[1.15] mb-4">
                {product.name}
              </h1>
              
              <div className="text-[15px] font-medium text-gray-600 mb-5">
                Model: <span className="text-[#0B192C] font-bold">{product.sku || 'FHM1209ZDL'}</span> <span className="mx-2 text-gray-300">|</span> AI Direct Drive Technology
              </div>

              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={15} className={s <= 4 ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"} />
                  ))}
                </div>
                <span className="text-[13px] font-medium text-gray-500">
                  4.5 <span className="mx-1 text-gray-300">|</span> 238 Verified Reviews
                </span>
                <span className="mx-2 text-gray-300">|</span>
                <span className={`text-[11px] font-black tracking-widest uppercase ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {product.stock > 0 ? 'IN STOCK' : 'OUT OF STOCK'}
                </span>
              </div>
            </div>            {/* 2. Price Block */}
            <div className="mb-6">
              <div className="flex items-baseline gap-3 mb-1">
                <span className="text-[40px] font-black text-[#0B192C] tracking-tight">{formatCurrency(product.finalPrice)}</span>
                {product.mrp > product.finalPrice && product.finalPrice > 0 && (
                    <>
                      <span className="text-lg text-gray-400 line-through font-medium">MRP {formatCurrency(product.mrp)}</span>
                      <span className="bg-[#128842] text-white text-[13px] font-bold px-2 py-0.5 rounded uppercase tracking-wide self-center -translate-y-[2px]">
                        {Math.round(((product.mrp - product.finalPrice) / product.mrp) * 100)}% OFF
                      </span>
                    </>
                  )}
              </div>
              {discountAmount > 0 && (
                <div className="text-green-600 font-bold text-[15px] mb-1.5 tracking-tight">
                  You Save: {formatCurrency(discountAmount)}
                </div>
              )}
              <div className="text-[13px] font-medium text-gray-400">
                Inclusive of all local taxes & State duties
              </div>
            </div>

            {/* 3. Family Variants */}
            {product.familyVariants && product.familyVariants.length > 1 && (
              <div className="mb-8">
                <h3 className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest mb-3">Available Variants</h3>
                <div className="flex flex-wrap gap-3">
                  {product.familyVariants.map((sibling: any) => {
                    const isActive = sibling.id === product.id;
                    const catSlug = sibling.categorySlug || sibling.CategorySlug || sibling.categoryslug || category?.slug || product.categorySlug;
                    const brnSlug = sibling.brandSlug || sibling.BrandSlug || sibling.brandslug || brand?.slug || product.brandSlug;
                    const vSlug = sibling.slug || sibling.Slug || sibling.slug;
                    const vName = sibling.name || sibling.Name;
                    const vImg = sibling.imageUrl || sibling.ImageUrl || sibling.imageurl;
                    const vPrice = sibling.finalPrice || sibling.FinalPrice || sibling.finalprice || 0;
                    
                    // Simple heuristic to extract options from name if inside parentheses
                    const parenMatch = vName.match(/\((.*?)\)/);
                    const shortName = parenMatch ? parenMatch[1] : vName.replace(/^.*?\s?-?\s?/, '').substring(0, 30);
                    
                    return (
                      <Link key={sibling.id || vSlug} href={`/products/${catSlug}/${brnSlug}/${vSlug}`} className={`flex items-center gap-3 p-2 pr-4 rounded-xl border-2 transition-all ${isActive ? 'border-amber-400 bg-amber-50 shadow-[0_2px_10px_rgba(251,191,36,0.2)]' : 'border-gray-200 hover:border-amber-200 hover:bg-gray-50 bg-white'}`}>
                        {vImg ? (
                           <span className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-gray-100 overflow-hidden shrink-0">
                              <img src={vImg.startsWith('/uploads') ? `${API || 'http://localhost:5030'}${vImg}` : vImg} alt={vName} className="w-full h-full object-contain mix-blend-multiply p-0.5" />
                           </span>
                        ) : (
                           <span className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                              <span className="text-[10px] text-gray-400 font-bold">VAR</span>
                           </span>
                        )}
                        <div className="flex flex-col gap-0.5 justify-center">
                            <span className={`text-xs font-bold leading-tight max-w-[160px] truncate ${isActive ? 'text-amber-900' : 'text-gray-700'}`}>
                               {shortName}
                            </span>
                            <span className={`text-[11px] font-black tracking-tight ${isActive ? 'text-amber-700' : 'text-[#0B192C]'}`}>
                               {formatCurrency(vPrice)}
                            </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 4. Primary Action Buttons (Add to Cart & Buy Now) */}
            <div className="mb-5">
              <AddToCartWidget 
                showBorder={false}
                showBuyNow={true}
                product={{...product, finalPrice: product.finalPrice, mrp: product.mrp, stock: product.stock, variantId: null}} 
              />
            </div>

            {/* 5. Delivery Options (Pincode) */}
            <div className="mb-8">
              <div className="max-w-sm border border-gray-200 rounded-lg p-3.5 bg-white">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center">
                    <Truck className="text-gray-500" size={14} />
                  </div>
                  <h4 className="text-xs font-black text-[#0B192C] uppercase tracking-widest">Check Delivery</h4>
                </div>
                <div className="flex flex-row gap-2 w-full items-center">
                  <input 
                    type="text" 
                    placeholder="Enter 6-digit Pincode" 
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="flex-1 min-w-0 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-white"
                    maxLength={6}
                  />
                  <button 
                    type="button"
                    onClick={checkPincode} 
                    disabled={checkingPincode}
                    className="shrink-0 bg-gray-100 hover:bg-gray-200 text-[#0B192C] disabled:opacity-50 px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-colors whitespace-nowrap"
                  >
                    {checkingPincode ? '...' : 'Check'}
                  </button>
                </div>
                {deliveryInfo && (
                  <div className={`mt-3 flex items-start gap-2 p-3 rounded-md text-xs font-bold leading-relaxed ${deliveryInfo.includes('not available') || deliveryInfo.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    <Check size={14} className="shrink-0 mt-0.5" />
                    <span>{deliveryInfo}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 6. Key Highlights & Offers */}
            <div className="border-t border-gray-100 pt-8">
              {(() => {
                let h: string[] = [];
                    try {
                      const specJson = typeof product.specificationJson === 'string' ? JSON.parse(product.specificationJson) : (product.specificationJson || {});
                      
                      if (product.highlights) {
                        const selectedKeys = product.highlights.split('|').map((s: string) => s.trim()).filter(Boolean);
                        const foundKeys = new Set<string>();
                        
                        for (const group of Object.values(specJson)) {
                          for (const [key, val] of Object.entries(group as any || {})) {
                            if (selectedKeys.includes(key) && val) {
                              h.push(`${key}: ${val}`);
                              foundKeys.add(key);
                            }
                          }
                        }
                        
                        // Append any remaining items (legacy custom text support)
                        for (const key of selectedKeys) {
                          if (!foundKeys.has(key)) {
                            h.push(key);
                          }
                        }
                      } else {
                        // Fallback to Category defaults
                        const hKeys = typeof category?.highlightKeys === 'string' ? JSON.parse(category.highlightKeys) : (category?.highlightKeys || []);
                        if (Array.isArray(hKeys) && hKeys.length > 0) {
                          for (const group of Object.values(specJson)) {
                            for (const [key, val] of Object.entries(group as any || {})) {
                              if (hKeys.includes(key) && val) {
                                h.push(`${key}: ${val}`);
                              }
                            }
                          }
                        }
                      }
                    } catch(e) {}

                if (h.length === 0) return null;

                return (
                  <div>
                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-5">Key Features</h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                      {h.map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                          <span className="text-sm font-semibold text-gray-700 leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })()}
            </div>

          </div>
        </div>

        {/* Rich Media Content / Description Tabs */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-8 lg:p-10 mb-12 shadow-sm">
          <div className="flex gap-8 border-b border-gray-200 hide-scrollbar overflow-x-auto">
            {['description', 'specifications', 'reviews'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-colors ${activeTab === tab ? 'border-b-2 border-amber-500 text-[#0B192C]' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="py-8">
            {activeTab === 'description' && (
              <div className="prose max-w-none text-gray-600 font-medium leading-loose">
                <div className="prose prose-sm max-w-none text-gray-600 font-medium leading-loose" dangerouslySetInnerHTML={{ __html: product.description }} />
                {product.features && (
                  <div className="mt-10">
                    <h3 className="text-xl font-black text-[#0B192C] mb-6">Detailed Overview</h3>
                    <div className="prose prose-sm max-w-none prose-img:rounded-xl prose-headings:font-black prose-headings:text-[#0B192C]" dangerouslySetInnerHTML={{ __html: product.features }} />
                  </div>
                )}
              </div>
            )}
            {activeTab === 'specifications' && (
              <div>
                {(() => {
                  try {
                    const specJson = typeof product.specificationJson === 'string' ? JSON.parse(product.specificationJson) : (product.specificationJson || {});
                    return Object.keys(specJson).length > 0 ? (
                      <div className="space-y-10">
                        {Object.entries(specJson).map(([group, fields]: any) => (
                          <div key={group}>
                            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 bg-gray-50 px-4 py-2.5 rounded-lg">{group}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-12 px-4">
                              {Object.entries(fields || {}).filter(([_, v]: any) => v !== null && v !== undefined && v !== '').map(([k, v]: any) => (
                                <div key={k} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-6 border-b border-gray-100 pb-4">
                                  <span className="text-sm text-gray-400 font-semibold min-w-[200px]">{k}</span>
                                  <span className="text-sm font-bold text-[#0B192C]">{v}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-sm font-bold text-gray-400">Detailed specifications not available.</p>;
                  } catch(e) {
                    return <p className="text-sm font-bold text-gray-400">Detailed specifications not available.</p>;
                  }
                })()}
              </div>
            )}
            
              {activeTab === 'reviews' && (
                <div className="space-y-8">
                  <ProductReviews productId={product.id} token={token} />
                </div>
              )}

          </div>
        </div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl lg:text-2xl font-black text-[#0B192C] mb-8 uppercase tracking-tight">Similar Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {relatedProducts.slice(0, 5).map((p: any) => (
                <ProductCard key={p.id} {...p} />
              ))}
            </div>
          </div>
        )}

      </div>
      
      {/* Mobile Sticky Buy Button (keeps essential action accessible on small screens) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-3 shadow-[0_-8px_25px_rgba(0,0,0,0.1)] z-50 flex items-center justify-between gap-4">
        <div className="flex flex-col shrink-0">
          <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Total</span>
          <span className="font-extrabold text-lg text-[#0B192C]">{formatCurrency(product.finalPrice)}</span>
        </div>
        <div className="flex-1 flex gap-2">
           <AddToCartWidget 
            compact={true}
            showBorder={false}
            showBuyNow={true}
            product={{...product, finalPrice: product.finalPrice, mrp: product.mrp, stock: product.stock, variantId: null}} 
          />
        </div>
      </div>
    </div>
  );
}


function ProductReviews({ productId, token }: { productId: string, token: string | null }) {
  const [reviews, setReviews] = React.useState<any[]>([]);
  const [rating, setRating] = React.useState(5);
  const [comment, setComment] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    fetch(process.env.NEXT_PUBLIC_API_URL + '/api/v1/reviews/' + productId)
      .then(res => res.json())
      .then(json => {
        if (json.success) setReviews(json.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return alert('Please login to submit a review');
    if (!comment.trim()) return alert('Please write a comment');
    
    setSubmitting(true);
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/v1/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ productId, rating, comment })
      });
      const json = await res.json();
      if (json.success) {
        alert('Review submitted successfully');
        setComment('');
        setRating(5);
        // Refresh reviews
        const refresh = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/v1/reviews/' + productId);
        const refJson = await refresh.json();
        if (refJson.success) setReviews(refJson.data);
      } else {
        alert(json.message || 'Failed to submit review');
      }
    } catch {
      alert('Error submitting review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-2 space-y-6">
        <h3 className="text-sm font-black text-[#0B192C] uppercase tracking-widest border-b border-gray-100 pb-4">Customer Reviews</h3>
        {loading ? <p className="text-sm text-gray-500">Loading reviews...</p> : reviews.length === 0 ? <p className="text-sm text-gray-500">No reviews yet. Be the first to review this product!</p> : (
          <div className="space-y-6">
            {reviews.map(r => (
              <div key={r.id} className="border-b border-gray-100 pb-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className={`w-3 h-3 ${i < r.rating ? 'fill-current' : 'fill-gray-200'}`} viewBox="0 0 24 24"><path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.62L12 2L9.19 8.62L2 9.24L7.45 13.97L5.82 21L12 17.27Z"/></svg>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-gray-900">{r.firstName} {r.lastName}</span>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider ml-auto">{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 h-fit">
        <h3 className="text-sm font-black text-[#0B192C] uppercase tracking-widest mb-6">Write a Review</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button type="button" key={star} onClick={() => setRating(star)} className="focus:outline-none">
                  <svg className={`w-6 h-6 ${star <= rating ? 'fill-amber-400' : 'fill-gray-200 hover:fill-amber-200 transition-colors'}`} viewBox="0 0 24 24"><path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.62L12 2L9.19 8.62L2 9.24L7.45 13.97L5.82 21L12 17.27Z"/></svg>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Review</label>
            <textarea required value={comment} onChange={e => setComment(e.target.value)} rows={4} className="w-full text-sm border-gray-200 rounded-lg p-3 focus:ring-1 focus:ring-[#0B192C] focus:border-[#0B192C] transition-all" placeholder="Share your experience..."></textarea>
          </div>
          <button type="submit" disabled={submitting} className="w-full bg-[#0B192C] hover:bg-[#1a2d4c] text-white text-[10px] font-bold uppercase tracking-widest py-3 rounded shadow transition-colors disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  );
}
