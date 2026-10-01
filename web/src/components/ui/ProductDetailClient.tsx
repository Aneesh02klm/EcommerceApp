'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, Truck, ShieldCheck, ChevronRight, Check, MapPin, MapPinIcon } from 'lucide-react';
import { ProductGallery } from '@/components/ui/ProductGallery';
import { AddToCartWidget } from '@/components/ui/AddToCartWidget';
import { ProductCard } from '@/components/ui/ProductCard';
import { formatCurrency } from '@/lib/formatCurrency';

export function ProductDetailClient({ product, category, brand, specifications, relatedProducts, API }: any) {
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('description');
  const [pincode, setPincode] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState<string | null>(null);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);

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
  const activePrice = product.finalPrice;
  const activeMrp = product.mrp;
  const activeStock = selectedVariant ? selectedVariant.stock : product.stock;

    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product.variants && product.variants.length > 0) {
      const v = product.variants[0];
      try {
        const attrs = typeof v.attributesJSON === 'string' ? JSON.parse(v.attributesJSON) : (v.attributesJSON || {});
        setSelectedOptions(attrs);
        setSelectedVariant(v);
      } catch(e) {}
    }
  }, [product]);

  const handleOptionSelect = (key: string, val: string) => {
    const newOpts = { ...selectedOptions, [key]: val };
    
    // Attempt exact match
    let match = product.variants.find((v: any) => {
      try {
        const attrs = typeof v.attributesJSON === 'string' ? JSON.parse(v.attributesJSON) : (v.attributesJSON || {});
        return Object.entries(newOpts).every(([k, v]) => attrs[k] === v);
      } catch(e) { return false; }
    });

    if (match) {
      setSelectedOptions(newOpts);
      setSelectedVariant(match);
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
          setSelectedOptions(attrs);
          setSelectedVariant(match);
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

  const images = selectedVariant && selectedVariant.imageUrl 
                 ? [{ imageUrl: selectedVariant.imageUrl, isPrimary: true }, ...(product.images || [])] 
                 : (product.images || []);

  const richMedia = product.richMedia || [];

  return (
    <div className="bg-[#fafafa] min-h-screen pb-24 lg:pb-12">
      <div className="bg-white border-b border-gray-100 mb-8">
        <div className="container mx-auto px-6 py-3 flex items-center gap-2 text-[11px] text-gray-500">
          <Link href="/" className="hover:text-amber-500 transition-colors">Home</Link>
          <ChevronRight size={12} className="text-gray-300" />
          <Link href="/products" className="hover:text-amber-500 transition-colors">Products</Link>
          {category && (
            <>
              <ChevronRight size={12} className="text-gray-300" />
              <Link href={`/products/${category.slug}`} className="hover:text-amber-500 transition-colors">
                {category.name}
              </Link>
            </>
          )}
          <ChevronRight size={12} className="text-gray-300" />
          <span className="font-bold text-[#0B192C] truncate max-w-xs">{product.name}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 lg:p-8 grid grid-cols-1 md:grid-cols-12 lg:grid-cols-12 gap-6 lg:gap-8 mb-12 shadow-sm items-start">
          <div className="w-full order-1 md:col-span-6 lg:col-span-5">
            <ProductGallery images={images} />
          </div>

          <div className="w-full order-2 md:col-span-6 lg:col-span-4 flex flex-col">
            {brand && (
              <Link href={`/products?brand=${brand.slug}`}>
                <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-widest block mb-2 hover:text-[#0B192C] transition-colors">
                  {brand.name}
                </span>
              </Link>
            )}
            
            <h1 className="text-3xl font-extrabold text-[#0B192C] leading-tight mb-4 tracking-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} size={14} className={s <= 4 ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"} />
                ))}
              </div>
              <span className="text-[11px] text-gray-500 font-semibold">124 Reviews</span>
              <span className="text-gray-300">|</span>
              <span className={`text-[11px] font-extrabold tracking-wide uppercase ${activeStock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {activeStock > 0 ? 'In Stock' : 'Out of Stock'}
                </span>
            </div>

            

                        {/* Variants */}
            {product.variants && product.variants.length > 0 && vKeys.length > 0 && (
              <div className="mb-8 space-y-5">
                {vKeys.map((vk: string) => {
                  const isColor = vk.toLowerCase().includes('color');
                  return (
                    <div key={vk}>
                      <h4 className="text-[10px] font-extrabold text-[#0B192C] uppercase tracking-widest mb-3">{vk}</h4>
                      <div className="flex flex-wrap gap-3">
                        {vOptions(vk).map((opt: string) => {
                          const isSelected = selectedOptions[vk] === opt;
                          const optLower = opt.toLowerCase();
                          const colorMap: Record<string, string> = { "space black": "#1c1c1e", "silver": "#e3e4e6", "black": "#000000", "white": "#ffffff", "blue": "#215E7C", "red": "#A52019", "gold": "#F7E8CC", "purple": "#E8DDF2", "yellow": "#F9E567", "green": "#AEE1CD", "midnight": "#1c1d21", "starlight": "#f8f9f4", "phantom black": "#222222" };
                          const fallbackColor = colorMap[optLower] || null;
                          
                          // Find an image for this variant option
                          let optImage = null;
                          if (isColor) {
                            const matchingVariant = product.variants.find((v: any) => {
                              try {
                                const attrs = typeof v.attributesJSON === 'string' ? JSON.parse(v.attributesJSON) : (v.attributesJSON || {});
                                return attrs[vk] === opt && v.imageUrl;
                              } catch(e){return false;}
                            });
                            if (matchingVariant) optImage = matchingVariant.imageUrl;
                          }

                          return (
                            <button 
                              key={opt}
                              onClick={() => handleOptionSelect(vk, opt)}
                              className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded border transition-all ${isSelected ? 'border-amber-500 bg-amber-50 text-amber-700 ring-1 ring-amber-500' : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}
                            >
                              {isColor && optImage && (
                                <span className="w-8 h-8 rounded overflow-hidden block shrink-0 border border-gray-200">
                                  <img src={optImage} alt={opt} className="w-full h-full object-cover" />
                                </span>
                              )}
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Highlights */}
            {(() => {
              let h: string[] = [];
              try {
                const specJson = typeof product.specificationJson === 'string' ? JSON.parse(product.specificationJson) : (product.specificationJson || {});
                const hKeys = typeof category?.highlightKeys === 'string' ? JSON.parse(category.highlightKeys) : (category?.highlightKeys || []);
                if (Array.isArray(hKeys) && hKeys.length > 0) {
                  for (const group of Object.values(specJson)) {
                    for (const [key, val] of Object.entries(group as any || {})) {
                      if (hKeys.includes(key)) {
                        h.push(`${key}: ${val}`);
                      }
                    }
                  }
                }
              } catch(e) {}
              
              if (h.length === 0 && product.highlights) {
                h = product.highlights.split('|').map((s: string) => s.trim());
              }

              if (h.length === 0) return null;

              return (
                <div className="mb-8">
                  <h4 className="text-[10px] font-extrabold text-[#0B192C] uppercase tracking-widest mb-3">Key Highlights</h4>
                  <ul className="space-y-2">
                    {h.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-amber-500 mt-1 pb-1 text-xs">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })()}

            

            
          </div>
          {/* BUY BOX COLUMN */}
          <div className="w-full order-3 md:col-span-12 lg:col-span-3">
            <div className="border border-gray-200 rounded-xl p-4 sm:p-5 lg:sticky lg:top-24 bg-white shadow-sm flex flex-col gap-5 w-full">
              <div className="w-full">
                <div className="flex items-baseline gap-2.5 mb-1 flex-wrap">
                  <span className="text-3xl sm:text-4xl font-extrabold text-[#0B192C]">{formatCurrency(activePrice)}</span>
                  {product.discount > 0 && (
                    <span className="text-sm text-gray-400 line-through font-semibold">{formatCurrency(activeMrp)}</span>
                  )}
                </div>
                <div className="text-[10px] text-gray-400">Inclusive of all taxes</div>
              </div>

              <div className="w-full">
                <AddToCartWidget product={{...product, finalPrice: activePrice, mrp: activeMrp, stock: activeStock, variantId: selectedVariant?.id}} />
              </div>

              <div className="border-t border-gray-100 pt-4 w-full">
                <div className="border border-gray-100 rounded-lg p-3 sm:p-4 bg-gray-50/70 w-full">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="text-gray-400 shrink-0" size={16} />
                    <h4 className="text-xs font-extrabold text-[#0B192C] uppercase tracking-wider">Delivery Options</h4>
                  </div>
                  <div className="flex flex-row gap-2 w-full items-center">
                    <input 
                      type="text" 
                      placeholder="Enter Pincode" 
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="flex-1 min-w-0 w-full border border-gray-200 rounded px-2.5 py-2 text-xs sm:text-sm focus:outline-none focus:border-amber-400 bg-white"
                      maxLength={6}
                    />
                    <button 
                      type="button"
                      onClick={checkPincode} 
                      disabled={checkingPincode}
                      className="shrink-0 bg-[#0B192C] hover:bg-[#162a45] disabled:opacity-50 text-white px-3.5 py-2 rounded text-xs font-bold transition-colors whitespace-nowrap"
                    >
                      {checkingPincode ? 'Checking...' : 'Check'}
                    </button>
                  </div>
                  {deliveryInfo && <p className={`text-xs mt-2 font-semibold ${deliveryInfo.includes('not available') || deliveryInfo.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>{deliveryInfo}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-16">
          <div className="flex gap-8 border-b border-gray-200">
            {['description', 'specifications', 'reviews'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-sm font-extrabold uppercase tracking-widest ${activeTab === tab ? 'border-b-2 border-amber-500 text-[#0B192C]' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="py-8">
            {activeTab === 'description' && (
              <div className="prose max-w-none text-gray-600">
                <p>{product.description}</p>
                {product.features && (
                  <div className="mt-8">
                    <h3 className="text-lg font-bold text-[#0B192C] mb-4">Features</h3>
                    <div dangerouslySetInnerHTML={{ __html: product.features }} />
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
                      <div className="space-y-8">
                        {Object.entries(specJson).map(([group, fields]: any) => (
                          <div key={group}>
                            <h3 className="text-md font-bold text-[#0B192C] mb-4 bg-gray-50 p-3 rounded">{group}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 px-3">
                              {Object.entries(fields || {}).map(([k, v]: any) => (
                                <div key={k} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 border-b border-gray-100 pb-3">
                                  <span className="text-sm text-gray-500 min-w-[200px]">{k}</span>
                                  <span className="text-sm font-semibold text-[#0B192C]">{v}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-gray-500">Detailed specifications not available for this product.</p>;
                  } catch(e) {
                    return <p className="text-gray-500">Detailed specifications not available for this product.</p>;
                  }
                })()}
              </div>
            )}
            {activeTab === 'reviews' && (
              <p className="text-gray-500">Reviews coming soon.</p>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-extrabold text-[#0B192C] mb-6 uppercase tracking-tight">Similar Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((p: any) => (
                <ProductCard key={p.id} {...p} />
              ))}
            </div>
          </div>
        )}

      </div>
      
      {/* Mobile Sticky Buy Button */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-3 shadow-[0_-8px_25px_rgba(0,0,0,0.1)] z-50 flex items-center justify-between gap-3">
        <div className="flex flex-col shrink-0">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total</span>
          <span className="font-extrabold text-lg sm:text-xl text-[#0B192C]">{formatCurrency(activePrice)}</span>
        </div>
        <div className="flex-1 max-w-[220px]">
          <AddToCartWidget 
            compact={true}
            showBorder={false}
            product={{...product, finalPrice: activePrice, mrp: activeMrp, stock: activeStock, variantId: selectedVariant?.id}} 
          />
        </div>
      </div>
    </div>
  );
}
