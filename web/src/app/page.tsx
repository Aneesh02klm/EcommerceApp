import Link from 'next/link';
import { ProductCard } from '@/components/ui/ProductCard';
import { ArrowRight } from 'lucide-react';
import { PreBookingClientForm } from '@/components/ui/PreBookingClientForm';
import { DiscoverMoreClient } from '@/components/ui/DiscoverMoreClient';
import { SignalRListener } from '@/components/ui/SignalRListener';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

async function get<T = any>(path: string): Promise<T> {
  try {
    const res = await fetch(`${API}${path}`, { cache: 'no-store' });
    if (!res.ok) return [] as T;
    const json = await res.json();
    return json.success !== undefined ? json.data : json;
  } catch (err) {
    return [] as T;
  }
}

export default async function Home({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const params = await searchParams;
  const modeParam = params?.mode === 'draft' ? '?mode=draft' : '';
  const [config, banners, allProducts, allCategories, allBrands] = await Promise.all([
    get(`/api/v1/storefront/homepage-config${modeParam}`),
    get('/api/cms/banners'),
    get('/api/v1/products'),
    get('/api/v1/categories'),
    get('/api/v1/brands')
  ]);

  const mapProduct = (p: any) => ({
    ...p,
    mrp: p.mrp ?? p.MRP ?? 0,
    finalprice: p.finalPrice ?? p.finalprice ?? 0,
    discount: p.discount ?? p.Discount ?? 0,
    stock: p.stock ?? p.Stock ?? 0,
    imageurl: p.images?.[0]?.imageUrl || p.imageurl,
    brand: allBrands?.find((b: any) => b.id === p.brandId)?.name || p.brand,
    categorySlug: allCategories?.find((c: any) => c.id === p.categoryId)?.slug,
    brandSlug: p.brandSlug
  });

  const sections = config?.sections || [];
  const activeSections = sections.filter((s: any) => s.isActive).sort((a: any, b: any) => a.order - b.order);
  const heroBanner = banners && banners.length > 0 ? banners[0] : null;

  return (
    <div className="flex flex-col">
      {activeSections.map((section: any) => {
        if (section.type === 'HeroSlider') {
          return (
            <section key={section.id} className="bg-[#0B192C] relative overflow-hidden min-h-[420px] flex items-center">
              {(section.imageUrl || heroBanner) && (
                  <div
                    className="absolute inset-y-0 right-0 w-[55%] bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: `url(${API}${section.imageUrl || heroBanner?.imageurl || ''})` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0B192C] via-[#0B192C]/70 to-transparent" />
                  </div>
                )}
              <div className="relative z-10 container mx-auto px-6 py-16">
                <div className="max-w-[540px] space-y-5">
                  <div className="inline-block bg-amber-400 text-[#0B192C] text-[10px] font-extrabold uppercase tracking-[0.2em] px-3 py-1">
                    {section.subtitle || "Premium Collection"}
                  </div>
                  <h1 className="text-[42px] leading-[1.1] font-extrabold text-white tracking-tight">
                    {section.title || heroBanner?.title || 'Welcome to Malieakal'}
                  </h1>
                  <p className="text-gray-400 text-sm leading-relaxed max-w-md">
                    {section.description || heroBanner?.subtitle || "Upgrade your home."}
                  </p>
                  <div className="flex items-center gap-4 pt-2">
                    <Link href="/products" className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-[#0B192C] font-extrabold text-xs uppercase tracking-widest px-6 py-3.5 transition-colors">
                      Shop Now <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          );
        }

        if (section.type === 'FeaturedCategories') {
          const items = section.items || [];
          if (items.length === 0) return null;
          return (
            <section key={section.id} className="py-14 bg-white border-b border-gray-100">
              <div className="container mx-auto px-6">
                <div className="flex items-end justify-between mb-8 pb-5 border-b border-gray-100">
                  <div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-1">{section.subtitle}</p>
                    <h2 className="text-xl font-extrabold text-[#0B192C] tracking-tight">{section.title}</h2>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {items.map((cat: any) => (
                    <Link href={`/products/${cat.slug}`} key={cat.id} className="group block text-center space-y-4">
                      <div className="bg-gray-50 aspect-square rounded-full flex items-center justify-center p-6 mx-auto w-32 h-32 group-hover:bg-amber-50 transition-colors border border-gray-100 group-hover:border-amber-200">
                        {cat.imageUrl ? <img src={`${API}${cat.imageUrl}`} className="w-full h-full object-contain mix-blend-multiply" alt={cat.name} /> : <div className="text-2xl font-bold text-gray-300">{cat.name[0]}</div>}
                      </div>
                      <h3 className="text-xs font-extrabold text-[#0B192C] uppercase tracking-wider group-hover:text-amber-600 transition-colors">{cat.name}</h3>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          );
        }

        if (section.type === 'ProductGrid') {
          const items = (section.items || []).map(mapProduct);
          if (items.length === 0) return null;
          return (
            <section key={section.id} className="py-12 bg-[#fafafa]">
              <div className="container mx-auto px-6">
                <div className="flex items-end justify-between mb-8 pb-5 border-b border-gray-200">
                  <div>
                    <p className="text-[9px] text-amber-500 font-bold uppercase tracking-[0.2em] mb-1">{section.subtitle}</p>
                    <h2 className="text-xl font-extrabold text-[#0B192C] tracking-tight">{section.title}</h2>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {items.map((p: any) => <ProductCard key={p.id} {...p} />)}
                </div>
              </div>
            </section>
          );
        }

        if (section.type === 'BrandPartners') {
          const items = section.items || [];
          if (items.length === 0) return null;
          return (
            <section key={section.id} className="py-16 bg-white border-y border-gray-100">
              <div className="container mx-auto px-6">
                <div className="text-center mb-10">
                  <h2 className="text-xl font-extrabold text-[#0B192C] tracking-tight mb-2">{section.title}</h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">{section.subtitle}</p>
                </div>
                <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60">
                  {items.map((b: any) => (
                    <div key={b.id} className="h-12 flex items-center justify-center grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                      {b.logoUrl ? <img src={`${API}${b.logoUrl}`} className="h-full object-contain" alt={b.name} /> : <span className="font-extrabold text-xl text-gray-500">{b.name}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        }

        if (section.type === 'ContentBlock') {
          return (
            <section key={section.id} className="py-16 bg-white border-b border-gray-100">
              <div className="container mx-auto px-6 grid md:grid-cols-2 gap-14 items-center">
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-px bg-amber-400 block" />
                    <span className="text-[9px] text-amber-500 font-extrabold uppercase tracking-[0.2em]">{section.subtitle}</span>
                  </div>
                  <h2 className="text-[30px] font-extrabold text-[#0B192C] leading-tight tracking-tight">
                    {section.title}
                  </h2>
                  <div className="prose prose-sm text-gray-500" dangerouslySetInnerHTML={{ __html: section.htmlContent || '' }} />
                </div>
                {section.imageUrl ? (
                    <img src={section.imageUrl.startsWith('http') ? section.imageUrl : `${API}${section.imageUrl}`} alt={section.title} className="w-full h-auto max-h-[400px] object-cover rounded-xl shadow-lg border border-gray-200" />
                  ) : (
                    <div className="bg-gray-100 h-64 rounded-xl flex items-center justify-center border border-gray-200">
                      <span className="text-xs font-bold text-gray-400 uppercase">Featured Visual</span>
                    </div>
                  )}
              </div>
            </section>
          );
        }

        if (section.type === 'PreBookingForm') {
          return <PreBookingClientForm key={section.id} section={section} />;
        }
        
        if (section.type === 'DiscoverMore') {
          return <DiscoverMoreClient key={section.id} section={section} />;
        }

        return null;
      })}
    </div>
  );
}