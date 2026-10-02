import Link from 'next/link';
import { ProductCard } from '@/components/ui/ProductCard';
import { ProductGridLayout } from '@/components/ui/ProductGridLayout';
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
          
          <ProductGridLayout title={activeBrand ? activeBrand.name : 'Products'} products={filteredProducts} sort={sort} />
          </div>
      </div>
    </div>
  );
}
