'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Banner {
  id: number;
  title: string;
  subtitle: string;
  imageurl: string;
  targeturl: string;
  section: string;
}

export function HeroCarousel({ banners }: { banners: Banner[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners?.length]);

  if (!banners || banners.length === 0) return null;

  return (
    <section className="relative w-full h-[300px] md:h-[500px] overflow-hidden bg-gray-100">
      <div 
        className="flex h-full transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {banners.map((b) => (
          <Link 
            key={b.id} 
            href={b.targeturl || '/products'}
            className="w-full h-full flex-shrink-0 relative block"
          >
            {/* If the user just wants the full image, we render it full cover */}
            <img 
              src={b.imageurl} 
              alt={b.title} 
              className="w-full h-full object-cover"
            />
            {/* Optional subtle gradient at the bottom for readability if needed, or completely blank if image has text */}
            <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
               <h2 className="text-white text-xl md:text-3xl font-bold drop-shadow-lg">{b.title}</h2>
               <p className="text-white/90 text-sm md:text-base drop-shadow">{b.subtitle}</p>
            </div>
          </Link>
        ))}
      </div>

      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-amber-400 w-6' : 'bg-white/50 hover:bg-white/80'}`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
