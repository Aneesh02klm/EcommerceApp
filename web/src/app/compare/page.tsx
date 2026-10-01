'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCompareStore, CompareProduct } from '@/store/compareStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { buildProductUrl } from '@/lib/buildProductUrl';
import { X, Plus, Search, ArrowLeft, GitCompare, ShoppingCart, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';
import { useCartStore } from '@/store/cartStore';
import { toast } from '@/components/ui/Toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';
const MAX_COMPARE = 4;

// ─── Add Product Modal ──────────────────────────────────────────────────────
function AddProductModal({ onClose, onAdd }: { onClose: () => void; onAdd: (p: CompareProduct) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { items } = useCompareStore();
  const existingIds = new Set(items.map(i => i.id));

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/products?Keyword=${encodeURIComponent(q)}&PageSize=10`);
      const json = await res.json();
      setResults(json.success ? json.data : []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-[61] w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-extrabold text-[#0B192C]">Add Product to Compare</h2>
            <p className="text-xs text-gray-500 mt-0.5">Search and select a product</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              type="text"
              placeholder="Search products..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-amber-400" />
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Search size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold">No products found</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          )}

          {!loading && !query && (
            <div className="text-center py-16 text-gray-400">
              <Search size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold">Start typing to search</p>
            </div>
          )}

          {!loading && results.map(p => {
            const already = existingIds.has(p.id);
            return (
              <button
                key={p.id}
                disabled={already}
                onClick={() => {
                  onAdd({
                    id: p.id,
                    name: p.name,
                    slug: p.slug,
                    brandSlug: p.brandSlug,
                    brand: p.brand,
                    finalprice: p.finalPrice ?? p.finalprice ?? 0,
                    mrp: p.mrp ?? p.MRP ?? 0,
                    discount: p.discount ?? 0,
                    imageurl: p.images?.[0]?.imageUrl,
                    stock: p.stock ?? 0,
                    categorySlug: p.categorySlug,
                  });
                  onClose();
                }}
                className="w-full flex items-center gap-4 px-6 py-3.5 hover:bg-amber-50 disabled:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors border-b border-gray-50 text-left"
              >
                <div className="w-12 h-12 shrink-0 bg-white border border-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  {p.images?.[0]?.imageUrl ? (
                    <img src={`${API}${p.images[0].imageUrl}`} alt={p.name} className="w-full h-full object-contain p-1 mix-blend-multiply" />
                  ) : (
                    <span className="text-gray-300 text-xs">—</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#0B192C] line-clamp-2 leading-tight">{p.name}</p>
                  <p className="text-[11px] text-amber-600 font-extrabold mt-0.5">{formatCurrency(p.finalPrice ?? p.finalprice ?? 0)}</p>
                </div>
                {already ? (
                  <span className="text-[10px] font-bold text-gray-400 shrink-0">Added</span>
                ) : (
                  <Plus size={16} className="text-amber-500 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ─── Spec Row ───────────────────────────────────────────────────────────────
function SpecRow({ label, values, highlight = false }: { label: string; values: (string | number | undefined)[]; highlight?: boolean }) {
  return (
    <tr className={highlight ? 'bg-amber-50/50' : 'hover:bg-gray-50/50'}>
      <td className="py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-r border-gray-100 w-36 shrink-0">
        {label}
      </td>
      {values.map((v, i) => (
        <td key={i} className="py-3 px-4 text-sm font-semibold text-[#0B192C] border-r border-gray-100 last:border-r-0">
          {v ?? <span className="text-gray-300">—</span>}
        </td>
      ))}
    </tr>
  );
}

// ─── Main Compare Page ──────────────────────────────────────────────────────
export default function ComparePage() {
  const { items, addItem, removeItem, clearAll } = useCompareStore();
  const addToCart = useCartStore(s => s.addItem);
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  const emptySlots = MAX_COMPARE - items.length;

  const handleAddToCart = async (item: CompareProduct) => {
    setAddingToCart(item.id);
    try {
      await addToCart(item.id, 1);
      toast.success(`${item.name.split(' ').slice(0, 3).join(' ')} added to cart!`);
    } catch {
      toast.error('Failed to add to cart');
    } finally {
      setAddingToCart(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {showModal && (
        <AddProductModal onClose={() => setShowModal(false)} onAdd={addItem} />
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-lg font-extrabold text-[#0B192C] flex items-center gap-2">
                <GitCompare size={20} className="text-amber-500" />
                Product Comparison
              </h1>
              <p className="text-xs text-gray-500">{items.length} product{items.length !== 1 ? 's' : ''} selected · Compare up to {MAX_COMPARE}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {items.length > 0 && (
              <button onClick={clearAll} className="text-[11px] font-bold text-red-500 hover:text-red-600 uppercase tracking-wider transition-colors">
                Clear All
              </button>
            )}
            {items.length < MAX_COMPARE && (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-[#0B192C] text-[11px] font-black uppercase tracking-wider px-4 py-2 rounded transition-colors"
              >
                <Plus size={15} /> Add Product
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {items.length === 0 && (
        <div className="container mx-auto px-6 py-24 text-center">
          <GitCompare size={64} className="mx-auto mb-6 text-gray-200" />
          <h2 className="text-2xl font-extrabold text-gray-800 mb-3">Nothing to compare yet</h2>
          <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto">
            Check the "Compare" box on any product card to add it here, or use the button below to search.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-[#0B192C] text-white text-sm font-extrabold uppercase tracking-wider px-6 py-3 rounded transition-colors hover:bg-[#162a45]"
            >
              <Plus size={16} /> Add Products to Compare
            </button>
            <Link href="/products" className="flex items-center gap-2 text-sm font-bold text-amber-500 hover:text-amber-600 uppercase tracking-wider">
              Browse Products
            </Link>
          </div>
        </div>
      )}

      {/* Comparison Table */}
      {items.length > 0 && (
        <div className="container mx-auto px-6 py-8">
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full min-w-[600px]">
              <colgroup>
                <col className="w-36" />
                {items.map(i => <col key={i.id} />)}
                {Array.from({ length: emptySlots }).map((_, i) => <col key={`e${i}`} />)}
              </colgroup>

              {/* Product Header Row */}
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-6 px-4 border-r border-gray-100 bg-gray-50/80" />
                  
                  {/* Filled product columns */}
                  {items.map(item => {
                    const productUrl = buildProductUrl(item.categorySlug, item.brandSlug || item.brand, item.slug);
                    return (
                      <th key={item.id} className="py-6 px-4 border-r border-gray-100 last:border-r-0 align-top">
                        <div className="relative group/col">
                          {/* Remove button */}
                          <button
                            onClick={() => removeItem(item.id)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-gray-700 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-colors opacity-0 group-hover/col:opacity-100 z-10"
                          >
                            <X size={11} strokeWidth={3} />
                          </button>

                          {/* Product image */}
                          <Link href={productUrl}>
                            <div className="w-full aspect-square max-w-[140px] mx-auto border border-gray-100 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center mb-3">
                              {item.imageurl ? (
                                <img src={`${API}${item.imageurl}`} alt={item.name} className="w-full h-full object-contain p-3 mix-blend-multiply hover:scale-105 transition-transform" />
                              ) : (
                                <span className="text-gray-300 text-xs text-center px-2">No Image</span>
                              )}
                            </div>
                          </Link>

                          {/* Brand */}
                          {item.brand && (
                            <p className="text-[10px] font-extrabold text-amber-500 uppercase tracking-widest mb-1">{item.brand}</p>
                          )}

                          {/* Name */}
                          <Link href={productUrl} className="text-sm font-bold text-[#0B192C] line-clamp-2 leading-tight hover:text-amber-500 transition-colors block mb-2">
                            {item.name}
                          </Link>

                          {/* Price */}
                          <p className="text-base font-black text-[#0B192C]">{formatCurrency(item.finalprice)}</p>
                          {item.discount > 0 && (
                            <p className="text-xs text-gray-400 line-through">{formatCurrency(item.mrp)}</p>
                          )}

                          {/* Add to Cart button */}
                          <button
                            onClick={() => handleAddToCart(item)}
                            disabled={addingToCart === item.id || item.stock === 0}
                            className="w-full mt-3 flex items-center justify-center gap-1.5 bg-[#0B192C] hover:bg-amber-400 hover:text-[#0B192C] disabled:bg-gray-100 disabled:text-gray-400 text-white text-[10px] font-black uppercase tracking-widest py-2.5 rounded transition-colors"
                          >
                            {addingToCart === item.id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <ShoppingCart size={13} />
                            )}
                            {item.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                          </button>
                        </div>
                      </th>
                    );
                  })}

                  {/* Empty slot columns */}
                  {Array.from({ length: emptySlots }).map((_, i) => (
                    <th key={`empty-${i}`} className="py-6 px-4 border-r border-gray-100 last:border-r-0 align-top">
                      <button
                        onClick={() => setShowModal(true)}
                        className="w-full flex flex-col items-center justify-center gap-3 py-10 border-2 border-dashed border-gray-200 rounded-xl hover:border-amber-400 hover:bg-amber-50/40 transition-colors group/add"
                      >
                        <div className="w-12 h-12 rounded-full bg-gray-100 group-hover/add:bg-amber-100 flex items-center justify-center transition-colors">
                          <Plus size={22} className="text-gray-400 group-hover/add:text-amber-500 transition-colors" />
                        </div>
                        <span className="text-[11px] font-bold text-gray-400 group-hover/add:text-amber-500 uppercase tracking-wider transition-colors">
                          Add Product
                        </span>
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Spec rows */}
              <tbody className="divide-y divide-gray-50">
                <SpecRow
                  label="Stock"
                  values={items.map(i => i.stock && i.stock > 0 ? '✅ In Stock' : '❌ Out of Stock')}
                />
                <SpecRow
                  label="Final Price"
                  values={items.map(i => formatCurrency(i.finalprice))}
                  highlight
                />
                <SpecRow
                  label="MRP"
                  values={items.map(i => formatCurrency(i.mrp))}
                />
                <SpecRow
                  label="Discount"
                  values={items.map(i => i.discount > 0 ? `${i.discount}% OFF` : '—')}
                  highlight
                />
                <SpecRow
                  label="Savings"
                  values={items.map(i => i.mrp > i.finalprice ? formatCurrency(i.mrp - i.finalprice) : '—')}
                />
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
