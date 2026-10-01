import Link from 'next/link';
import { ProductCard } from '@/components/ui/ProductCard';
import { FilterSidebar } from '@/components/ui/FilterSidebar';
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
  
  Object.keys(params).forEach(k => {
    if (k.startsWith('SpecFilters[')) {
      qs.append(k, params[k]);
    }
  });

  const productsRaw = await get(`/api/v1/products${qs.toString() ? `?${qs}` : ''}`);

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
        <FilterSidebar categories={categories} brands={brands} currentCategorySlug="" />

        {/* ─── MAIN CONTENT ────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="bg-white rounded-lg border border-gray-200 px-5 py-3 flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <SlidersHorizontal size={15} className="text-gray-400" />
              <span className="text-xs font-bold text-[#0B192C]">
                {filteredProducts.length} Products
                {activeBrand ? ` by ${activeBrand.name}` : ''}
                {q ? ` for "${q}"` : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpDown size={13} className="text-gray-400" />
              <span className="text-[10px] text-gray-500 font-semibold">Sort:</span>
              <div className="flex gap-1">
                {SORTS.map(s => (
                  <Link
                    key={s.value}
                    href={`/products?${new URLSearchParams({ ...params, sort: s.value }).toString()}`}
                    className={`text-[10px] px-2.5 py-1.5 rounded font-bold uppercase tracking-wide transition-colors ${sort === s.value ? 'bg-amber-400 text-[#0B192C]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {s.label}
                  </Link>
                ))}
              </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
