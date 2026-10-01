import Link from 'next/link';
import { ProductCard } from '@/components/ui/ProductCard';
import { FilterSidebar } from '@/components/ui/FilterSidebar';
import { SortDropdown } from '@/components/ui/SortDropdown';
import { SlidersHorizontal, ChevronRight, ArrowUpDown } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';
export const dynamic = 'force-dynamic';

async function get(path: string) {
  try {
    const res = await fetch(`${API}${path}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    return json.success !== undefined ? json.data : json;
  } catch {
    return [];
  }
}

const SORTS = [
  { label: 'Relevance', value: '' },
  { label: 'Price: Low → High', value: 'PriceLow' },
  { label: 'Price: High → Low', value: 'PriceHigh' },
  { label: 'Newest First', value: 'Newest' },
  { label: 'Most Popular', value: 'Popularity' },
];

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
  const { brand = '', q = '', sort = '', deal = '', inStockOnly = '' } = params;

  const [categories, brands] = await Promise.all([
    get('/api/v1/categories'),
    get('/api/v1/brands'),
  ]);

  const activeBrand = brands.find((b: any) => b.slug === brand);

  const qs = new URLSearchParams();
  if (activeBrand) qs.append('BrandId', activeBrand.id.toString());
  if (q) qs.append('Keyword', q);
  if (sort) qs.append('SortBy', sort);
  if (inStockOnly === 'true') qs.append('InStockOnly', 'true');
    if (params.minPrice) qs.append('MinPrice', params.minPrice);
    if (params.maxPrice) qs.append('MaxPrice', params.maxPrice);
    Object.keys(params).forEach(k => {
    if (k.startsWith('SpecFilters[')) {
      qs.append(k, params[k]);
    }
  });

  const productsRaw = await get(`/api/v1/products${qs.toString() ? `?${qs}` : ''}`);
  const facetsRaw = await get(`/api/v1/products/facets${qs.toString() ? `?${qs}` : ''}`);

  const mapProduct = (p: any) => ({
    ...p,
    mrp: p.mrp ?? p.MRP ?? 0,
    finalprice: p.finalPrice ?? p.finalprice ?? 0,
    discount: p.discount ?? p.Discount ?? 0,
      stock: p.stock ?? p.Stock ?? 0,
    imageurl: p.images?.[0]?.imageUrl || p.imageurl,
    brand: brands?.find((b: any) => b.id === p.brandId)?.name || p.brand,
    categorySlug: categories?.find((c: any) => c.id === p.categoryId)?.slug,
      brandSlug: p.brandSlug
  });

  const products = (productsRaw || []).map(mapProduct);

  const filteredProducts = deal === 'true'
    ? products.filter((p: any) => p.discount > 0)
    : products;

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    ...(activeBrand ? [{ label: activeBrand.name, href: `/products?brand=${brand}` }] : []),
    ...(q ? [{ label: `"${q}"`, href: `/products?q=${q}` }] : []),
  ];

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-6 py-3 flex items-center gap-2 text-[11px] text-gray-500">
          {breadcrumbs.map((b, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <ChevronRight size={12} className="text-gray-300" />}
              {i === breadcrumbs.length - 1
                ? <span className="font-bold text-[#0B192C]">{b.label}</span>
                : <Link href={b.href} className="hover:text-amber-500 transition-colors">{b.label}</Link>
              }
            </span>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 flex gap-7">

        {/* ─── SIDEBAR ─────────────────────────────────────── */}
        <FilterSidebar categories={categories} brands={brands} currentCategorySlug="" facets={facetsRaw} />

        {/* ─── MAIN CONTENT ────────────────────────────────── */}
        <div className="flex-1 min-w-0">
                              
          {/* Dynamic Banner Section */}
          {(() => {
            let title = "Premium Electronics";
            let desc = "Discover our latest range of high-end appliances and gadgets.";
            let img = "https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=2000";
            let badge = "New Collection";
            
            if (brand === 'apple' || brand === 'samsung') {
              title = "Next-Gen Smartphones";
              desc = "Up to 30% off on flagship models and accessories.";
              img = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=2000";
              badge = "Brand Days";
            }
            
            return (
              <div className="w-full h-48 md:h-56 bg-[#0a1020] rounded-xl overflow-hidden mb-8 flex items-center justify-between pl-10">
                 <div className="relative z-10 max-w-lg py-6">
                   <span className="bg-[#fbc02d] text-[#0B192C] text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded shadow-sm mb-4 inline-block">{badge}</span>
                   <h2 className="text-3xl font-serif text-white mb-2 leading-tight">{title}</h2>
                   <p className="text-sm text-gray-400 font-medium leading-relaxed">{desc}</p>
                 </div>
                 <div className="h-full w-2/5 min-w-[250px] relative hidden md:block">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0a1020] via-transparent to-transparent z-10"></div>
                    <img src={img} alt="Promo" className="w-full h-full object-cover object-center" />
                 </div>
              </div>
            );
          })()}
          
          {/* Category Header & Toolbar */}
          <div className="flex items-end justify-between mb-6 pb-4 border-b border-gray-100">
            <div>
              <h1 className="text-3xl font-serif font-black text-[#0B192C] mb-2">{activeBrand ? activeBrand.name : 'All Products'}</h1>
              <p className="text-sm text-gray-500 font-medium">Showing {filteredProducts.length} of 156 premium products in Kollam catalog</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 border border-gray-200 rounded-md px-3 py-2 bg-white cursor-pointer hover:border-gray-300">
                <span className="text-xs text-gray-500 font-medium">Sort By:</span>
                <SortDropdown currentSort={sort} />
              </div>
              <button className="p-2 border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
              </button>
            </div>
          </div>
          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 py-24 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <SlidersHorizontal size={28} className="text-gray-300" />
              </div>
              <h3 className="text-lg font-extrabold text-[#0B192C] mb-2">No Products Found</h3>
              <p className="text-sm text-gray-500 mb-6">Try adjusting your filters or search term.</p>
              <Link href="/products" className="bg-amber-400 hover:bg-amber-300 text-[#0B192C] font-extrabold text-xs uppercase tracking-widest px-6 py-3 transition-colors">
                Clear Filters
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
              {filteredProducts.map((p: any) => (
                <ProductCard key={p.id} {...p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
