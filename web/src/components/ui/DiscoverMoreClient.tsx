'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { ProductCard } from '@/components/ui/ProductCard';
import { Loader2 } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

export function DiscoverMoreClient({ section }: { section: any }) {
    const [products, setProducts] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const observer = useRef<IntersectionObserver | null>(null);
    const pageSize = 20;

    const lastElementRef = useCallback((node: any) => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prev => prev + 1);
            }
        }, { rootMargin: '300px' });
        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API}/api/v1/products?page=${page}&pageSize=${pageSize}`);
                const json = await res.json();
                if (json.success) {
                    const newProducts = json.data.map((p: any) => ({
                        ...p,
                        mrp: p.mrp ?? p.MRP ?? 0,
                        finalprice: p.finalPrice ?? p.finalprice ?? 0,
                        discount: p.discount ?? p.Discount ?? 0,
                        stock: p.stock ?? p.Stock ?? 0,
                        imageurl: p.images?.[0]?.imageUrl || p.imageurl,
                        brand: p.brandName || p.brand,
                        categorySlug: p.categorySlug,
                        brandSlug: p.brandSlug
                    }));
                    setProducts(prev => {
                        const existingIds = new Set(prev.map(p => p.id));
                        return [...prev, ...newProducts.filter((p: any) => !existingIds.has(p.id))];
                    });
                    if (json.data.length < pageSize) {
                        setHasMore(false);
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [page]);

    if (products.length === 0 && !loading) return null;

    return (
        <section id={section.id} className="py-16 bg-white border-t border-gray-100">
          <div className="container mx-auto px-6">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-extrabold text-[#0B192C] tracking-tight mb-2">{section.title || 'Discover More'}</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">{section.subtitle || 'GENERAL CATALOG'}</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {products.map((p: any, index: number) => {
                  if (index === products.length - 1) {
                      return <div ref={lastElementRef} key={p.id}><ProductCard {...p} /></div>;
                  }
                  return <div key={p.id}><ProductCard {...p} /></div>;
              })}
            </div>
            
            {loading && (
                <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                </div>
            )}
            {!hasMore && products.length > 0 && (
                <div className="text-center py-10 text-gray-400 text-sm font-medium">
                    You've reached the end of the catalog.
                </div>
            )}
          </div>
        </section>
    );
}
