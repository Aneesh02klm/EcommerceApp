'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface Banner {
  id: number;
  title: string;
  subtitle: string;
  imageurl: string;
  targeturl: string;
}

export function PromotionalBanners({ banners, title, subtitle }: { banners: Banner[], title: string, subtitle: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!banners || banners.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-10 bg-white border-b border-gray-100 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex items-end justify-between mb-6 pb-5">
          <div>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-1">{subtitle}</p>
            <h2 className="text-xl font-extrabold text-[#0B192C] tracking-tight">{title}</h2>
          </div>
          <div className="flex items-center gap-4">
            <Link href={banners[0]?.targeturl?.startsWith('/deals') ? '/deals' : '/products'} className="text-[10px] hidden md:flex font-bold text-amber-500 uppercase tracking-wider hover:text-amber-600 items-center gap-1">
                View All <ArrowRight size={12} />
            </Link>
            <div className="hidden md:flex gap-2">
                <button onClick={() => scroll('left')} className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 text-gray-600"><ChevronLeft size={16}/></button>
                <button onClick={() => scroll('right')} className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 text-gray-600"><ChevronRight size={16}/></button>
            </div>
          </div>
        </div>
        
        {/* Horizontal Slider */}
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-6 pb-4 -mx-6 px-6 md:mx-0 md:px-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {banners.map((b) => (
            <Link 
                key={b.id} 
                href={b.targeturl || '/products'} 
                className="snap-start shrink-0 group relative overflow-hidden rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all h-[200px] md:h-[240px] w-[85vw] md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
            >
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url(${b.imageurl || ''})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              
              <div className="absolute bottom-0 left-0 p-6 w-full">
                <h3 className="text-xl md:text-2xl font-extrabold text-white tracking-tight mb-1 group-hover:text-amber-400 transition-colors line-clamp-1">
                  {b.title}
                </h3>
                <p className="text-sm font-semibold text-gray-200 line-clamp-1">
                  {b.subtitle}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
