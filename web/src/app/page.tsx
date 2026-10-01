import Link from 'next/link';
import { ProductCard } from '@/components/ui/ProductCard';
import { HeroCountdown, CountdownTimer } from '@/components/ui/CountdownTimer';
import { Shield, Truck, BadgeCheck, CreditCard, ArrowRight, Star } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';
import { HeroCarousel } from '@/components/ui/HeroCarousel';
import { PromotionalBanners } from '@/components/ui/PromotionalBanners';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';
export const dynamic = 'force-dynamic';

async function get<T = any>(path: string): Promise<T> {
  try {
    const res = await fetch(`${API}${path}`, { cache: 'no-store' });
    if (!res.ok) {
      console.error(`Fetch failed for ${path}: ${res.status} ${res.statusText}`);
      return [] as T;
    }
    const json = await res.json();
    return json.success !== undefined ? json.data : json;
  } catch (err) {
    console.error(`Network error for ${path}:`, err);
    return [] as T;
  }
}

export default async function Home() {
  const [allProducts, categories, banners, features, articles, brands] = await Promise.all([
    get('/api/v1/products'),
    get('/api/v1/categories'),
    get('/api/cms/banners'),
    get('/api/cms/features'),
    get('/api/cms/articles'),
    get('/api/v1/brands'),
  ]);

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

  const deals = allProducts.filter((p: any) => p.discount >= 15).slice(0, 4).map(mapProduct);
  const bestSellers = [...allProducts].sort((a: any, b: any) => (b.finalprice ?? 0) - (a.finalprice ?? 0)).slice(0, 4).map(mapProduct);
  const newArrivals = [...allProducts].reverse().slice(0, 4).map(mapProduct);
  const prebookItemRaw = allProducts.find((p: any) => p.name?.toLowerCase().includes('bravia 9')) || allProducts[allProducts.length - 1];
  const prebookItem = prebookItemRaw ? mapProduct(prebookItemRaw) : null;
  const heroBanner = banners && banners.length > 0 ? banners[0] : null;

  const featureIcons = [Shield, Truck, BadgeCheck, CreditCard];

  return (
    <div className="flex flex-col">

      {/* ═══════════════════════════════════════════════════════
          1. HERO SECTION
      ═══════════════════════════════════════════════════════ */}
      {heroBanner && (
        <section className="bg-[#0B192C] relative overflow-hidden min-h-[420px] flex items-center">
          {/* Background image – right 55% */}
          <div
            className="absolute inset-y-0 right-0 w-[55%] bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${API}${heroBanner.imageurl || ''})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B192C] via-[#0B192C]/70 to-transparent" />
          </div>

          <div className="relative z-10 container mx-auto px-6 py-16">
            <div className="max-w-[540px] space-y-5">
              <div className="inline-block bg-amber-400 text-[#0B192C] text-[10px] font-extrabold uppercase tracking-[0.2em] px-3 py-1">
                Monsoon Showers — Up to 40% Off on Refrigerators
              </div>

              <h1 className="text-[42px] leading-[1.1] font-extrabold text-white tracking-tight">
                {heroBanner.title || 'Bring Premium Comfort Home'}
              </h1>

              <p className="text-gray-400 text-sm leading-relaxed max-w-md">
                {heroBanner.subtitle || "Upgrade to next-generation innovations with Kerala's most trusted home appliance brand since 1979."}
              </p>

              <HeroCountdown />

              <div className="flex items-center gap-4 pt-2">
                <Link
                  href={heroBanner.targeturl || '/products'}
                  className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-[#0B192C] font-extrabold text-xs uppercase tracking-widest px-6 py-3.5 transition-colors"
                >
                  Explore Monsoon Deals <ArrowRight size={14} />
                </Link>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 border border-white/25 hover:border-white text-white font-bold text-xs uppercase tracking-widest px-6 py-3.5 transition-colors"
                >
                  View Store Catalog
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          2. LIGHTNING DEALS
      ═══════════════════════════════════════════════════════ */}
      {deals.length > 0 && (
        <section className="py-10 bg-white border-b border-gray-100">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-5">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-extrabold text-[#0B192C] tracking-tight">Lightning Deals</h2>
                <span className="bg-red-500 text-white text-[9px] font-extrabold px-2 py-0.5 uppercase tracking-widest animate-pulse rounded-sm">
                  LIVE
                </span>
              </div>
              <div className="flex items-center gap-4">
                <CountdownTimer />
                <Link href="/products?deal=true" className="text-[10px] font-bold text-amber-500 uppercase tracking-wider hover:text-amber-600 flex items-center gap-1">
                  View All <ArrowRight size={12} />
                </Link>
              </div>
            </div>

            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-6 px-6 md:mx-0 md:px-0 md:grid md:grid-cols-4 lg:grid-cols-5 hide-scrollbar">
              {deals.map((p: any) => <div key={p.id} className="snap-start shrink-0 w-[70vw] md:w-auto"><ProductCard {...p} /></div>)}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          3. FEATURED DEPARTMENTS
      ═══════════════════════════════════════════════════════ */}
      {categories.length > 0 && (
        <section className="py-10 bg-[#fafafa] border-b border-gray-100">
          <div className="container mx-auto px-6">
            <div className="flex items-end justify-between mb-7">
              <div>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-1">Curated Collections</p>
                <h2 className="text-xl font-extrabold text-[#0B192C] tracking-tight">Featured Departments</h2>
              </div>
              <p className="text-[10px] text-gray-500 max-w-[240px] text-right leading-relaxed">
                Handpicked premium segments tailored to modern lifestyles.
              </p>
            </div>

            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {categories.slice(0, 8).map((cat: any) => (
                <Link
                  key={cat.id}
                  href={`/products/${cat.slug}`}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="w-16 h-16 rounded-full border-2 border-gray-200 bg-white group-hover:border-amber-400 transition-colors overflow-hidden flex items-center justify-center shadow-sm">
                    <img
                      src={`${API}${cat.imageurl || cat.imageUrl || ''}`}
                      alt={cat.name}
                      className="w-10 h-10 object-contain"
                    />
                  </div>
                  <span className="text-[9px] font-bold text-center text-gray-600 group-hover:text-amber-500 uppercase tracking-wide line-clamp-2 leading-tight max-w-[70px]">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          4. AUTHORIZED BRAND PARTNERS
      ═══════════════════════════════════════════════════════ */}
      {brands.length > 0 && (
        <section className="py-6 bg-white border-b border-gray-100">
          <div className="container mx-auto px-6">
            <p className="text-center text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-5">Authorized Brand Partners</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {brands.map((b: any) => (
                <Link
                  key={b.id}
                  href={`/products?brand=${b.slug}`}
                  className="flex items-center justify-center border border-gray-200 rounded px-4 py-2 h-12 min-w-[80px] max-w-[120px] grayscale opacity-60 hover:grayscale-0 hover:opacity-100 hover:border-amber-400 hover:shadow-sm transition-all"
                >
                  {b.logourl ? (
                    <img src={`${API}${b.logourl}`} alt={b.name} className="max-h-6 max-w-full object-contain" />
                  ) : (
                    <span className="text-xs font-extrabold text-[#0B192C]">{b.name}</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          5. BEST SELLERS IN KOLLAM
      ═══════════════════════════════════════════════════════ */}
      {bestSellers.length > 0 && (
        <section className="py-10 bg-white border-b border-gray-100">
          <div className="container mx-auto px-6">
            <div className="flex items-end justify-between mb-6 border-b border-gray-100 pb-5">
              <div>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-1">Customer Favourites</p>
                <h2 className="text-xl font-extrabold text-[#0B192C] tracking-tight">Best Sellers in Kollam</h2>
              </div>
              <Link href="/products?sort=Popularity" className="text-[10px] font-bold text-amber-500 uppercase tracking-wider hover:text-amber-600 flex items-center gap-1">
                View All <ArrowRight size={12} />
              </Link>
            </div>
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-6 px-6 md:mx-0 md:px-0 md:grid md:grid-cols-4 lg:grid-cols-5 hide-scrollbar">
              {bestSellers.map((p: any) => <div key={p.id} className="snap-start shrink-0 w-[70vw] md:w-auto"><ProductCard {...p} /></div>)}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          6. NEW ARRIVALS AT MALIEAKAL
      ═══════════════════════════════════════════════════════ */}
      {newArrivals.length > 0 && (
        <section className="py-10 bg-[#fafafa] border-b border-gray-100">
          <div className="container mx-auto px-6">
            <div className="flex items-end justify-between mb-6 border-b border-gray-100 pb-5">
              <div>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-1">Freshly Landed</p>
                <h2 className="text-xl font-extrabold text-[#0B192C] tracking-tight">New Arrivals at Malieakal</h2>
              </div>
              <Link href="/products?sort=Newest" className="text-[10px] font-bold text-amber-500 uppercase tracking-wider hover:text-amber-600 flex items-center gap-1">
                View All <ArrowRight size={12} />
              </Link>
            </div>
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-6 px-6 md:mx-0 md:px-0 md:grid md:grid-cols-4 lg:grid-cols-5 hide-scrollbar">
              {newArrivals.map((p: any) => <div key={p.id} className="snap-start shrink-0 w-[70vw] md:w-auto"><ProductCard {...p} /></div>)}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          7. SECURE YOUR BOOKING SLOT — PRE-BOOK
      ═══════════════════════════════════════════════════════ */}
      {prebookItem && (
        <section className="bg-[#0B192C] py-14">
          <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
            {/* Left: info */}
            <div className="space-y-5">
              <p className="text-amber-400 text-[9px] font-extrabold uppercase tracking-[0.2em]">
                ★ Pre-Booking Open For Premium Displays
              </p>
              <h2 className="text-3xl font-extrabold text-white leading-tight">
                {prebookItem.name}
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Experience cinematic sight and sound. Driven by next-gen XR Processor with unmatched brightness and rich contrast. Book now to receive exclusive launch benefits.
              </p>
              <ul className="space-y-2 pt-2">
                {[
                  'Zero Downpayment Booking',
                  'Free Sony HT-S40R Soundbar (Worth ₹25,000)',
                  'Complimentary 3-Year Extended Warranty',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-300 text-xs font-semibold">
                    <span className="text-amber-400 font-bold">✓</span> {item}
                  </li>
                ))}
              </ul>
              <div className="pt-3">
                <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">Starting from</p>
                <p className="text-3xl font-extrabold text-white">
                  {formatCurrency(prebookItem.finalprice ?? 0)}
                </p>
              </div>
            </div>

            {/* Right: booking form */}
            <div>
              <div className="bg-[#111827] border border-gray-700/50 rounded-lg p-6">
                <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-5 pb-3 border-b border-gray-700">
                  Secure Your Booking Slot
                </h3>
                <div className="space-y-4">
                  {[
                    { label: 'Full Name', placeholder: 'George Kurian', type: 'text' },
                    { label: 'Contact Number', placeholder: '+91 98765 43210', type: 'tel' },
                  ].map(f => (
                    <div key={f.label}>
                      <label className="block text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">{f.label}</label>
                      <input
                        type={f.type}
                        placeholder={f.placeholder}
                        className="w-full bg-[#0B192C] border border-gray-700 focus:border-amber-400 rounded px-3 py-2.5 text-white text-sm placeholder-gray-600 outline-none transition-colors"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Select Variant</label>
                    <select className="w-full bg-[#0B192C] border border-gray-700 focus:border-amber-400 rounded px-3 py-2.5 text-white text-sm outline-none transition-colors">
                      <option>{prebookItem.name}</option>
                    </select>
                  </div>
                  <button className="w-full mt-2 bg-amber-400 hover:bg-amber-300 text-[#0B192C] font-extrabold text-xs uppercase tracking-widest py-3.5 rounded transition-colors">
                    Pre-Book For ₹10,000 Only
                  </button>
                  <p className="text-[9px] text-gray-500 text-center">Amount adjustable against final purchase price</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          8. FEATURE PILLARS (Trust Badges)
      ═══════════════════════════════════════════════════════ */}
      {features.length > 0 && (
        <section className="py-10 bg-white border-b border-gray-100">
          <div className="container mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((f: any, i: number) => {
              const Icon = featureIcons[i % featureIcons.length];
              return (
                <div key={f.id || i} className="flex flex-col items-center text-center gap-3 group">
                  <div className="w-14 h-14 rounded-full border-2 border-gray-100 group-hover:border-amber-400 bg-gray-50 flex items-center justify-center transition-colors">
                    <Icon size={22} className="text-[#0B192C] group-hover:text-amber-500 transition-colors" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-[#0B192C] mb-1">{f.title}</h4>
                    <p className="text-[10px] text-gray-500 leading-relaxed max-w-[160px]">{f.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          9. LEGACY OF TRUST IN KOLLAM'S HEARTS
      ═══════════════════════════════════════════════════════ */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="container mx-auto px-6 grid md:grid-cols-2 gap-14 items-center">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <span className="w-8 h-px bg-amber-400 block" />
              <span className="text-[9px] text-amber-500 font-extrabold uppercase tracking-[0.2em]">Our Story Since 1979</span>
            </div>
            <h2 className="text-[30px] font-extrabold text-[#0B192C] leading-tight tracking-tight">
              A Legacy of Trust in Kollam's Hearts
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Founded over four decades ago, Malieakal Electronics began as a humble boutique near Kollam's historic center.
            </p>
            <p className="text-gray-500 text-sm leading-relaxed">
              Today, Malieakal Plaza stands as Kerala's most trusted destination for premium consumer technology — guiding families through generations of appliance upgrades with unmatched expertise and service.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-amber-400 overflow-hidden flex-shrink-0" />
              <div>
                <p className="text-xs font-extrabold text-[#0B192C]">George Malieakal</p>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Founder, Malieakal Group</p>
              </div>
            </div>
            <div className="flex items-center gap-6 pt-2">
              {[{ n: '45+', l: 'Years of Trust' }, { n: '1L+', l: 'Happy Customers' }, { n: '50+', l: 'Brands Stocked' }].map(s => (
                <div key={s.n} className="text-center">
                  <p className="text-2xl font-extrabold text-[#0B192C]">{s.n}</p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg overflow-hidden h-64 bg-gray-100 flex items-center justify-center border border-gray-200">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Vintage Store Image</span>
            </div>
            <div className="rounded-lg overflow-hidden h-64 bg-gray-100 flex items-center justify-center border border-gray-200 mt-10">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Modern Store Image</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          10. BUYING GUIDES & INSIGHTS
      ═══════════════════════════════════════════════════════ */}
      {articles.length > 0 && (
        <section className="py-14 bg-[#fafafa]">
          <div className="container mx-auto px-6">
            <div className="flex items-end justify-between mb-8 border-b border-gray-100 pb-5">
              <div>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-1">Knowledge Hub</p>
                <h2 className="text-xl font-extrabold text-[#0B192C] tracking-tight">Buying Guides & Insights</h2>
              </div>
              <p className="text-[10px] text-gray-500 text-right max-w-[240px] leading-relaxed">
                Make intelligent purchase decisions with curated columns from home appliance engineers.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {articles.map((a: any, i: number) => (
                <div key={a.id || i} className="group cursor-pointer">
                  <div className="aspect-video rounded overflow-hidden bg-gray-200 mb-4 relative">
                    <img
                      src={`${API}${a.imageurl || ''}`}
                      alt={a.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-[#0B192C]/0 group-hover:bg-[#0B192C]/10 transition-colors" />
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[9px] font-extrabold text-amber-500 uppercase tracking-widest">{a.category}</span>
                    <span className="text-[9px] text-gray-400 font-semibold">
                      {a.publishedat ? new Date(a.publishedat).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-[#0B192C] leading-snug mb-2 group-hover:text-amber-600 transition-colors line-clamp-2">
                    {a.title}
                  </h3>
                  <p className="text-[10px] text-gray-500 leading-relaxed mb-3 line-clamp-2">{a.excerpt}</p>
                  <span className="text-[10px] font-extrabold text-[#0B192C] uppercase border-b-2 border-amber-400 pb-0.5 group-hover:border-[#0B192C] transition-colors">
                    Read Article →
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          8. DISCOVER MORE
          ========================================================================= */}
      <section className="py-10 bg-white">
        <div className="container mx-auto px-6">
          <div className="flex items-end justify-between mb-6 pb-5 border-b border-gray-100">
            <div>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-1">General Catalog</p>
              <h2 className="text-xl font-extrabold text-[#0B192C] tracking-tight">Discover More</h2>
            </div>
            <Link href="/products" className="text-[10px] font-bold text-amber-500 uppercase tracking-wider hover:text-amber-600 flex items-center gap-1">
              View All <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {allProducts.slice(0, 15).map(mapProduct).map((p: any) => (
              <ProductCard key={p.id} {...p} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}