'use client';

import { useState, useEffect } from 'react';
import { Heart, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { toast } from './Toast';
import { useWishlistStore } from '@/store/wishlistStore';
import { useAuthStore } from '@/store/authStore';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

interface Image {
  imageUrl: string;
  altText?: string;
}

export function ProductGallery({ images, productId }: { images: Image[], productId?: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const token = useAuthStore(s => s.token);
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const wishlisted = productId ? isInWishlist(productId) : false;
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => { setCurrentIndex(0); }, [images]);
  const mainImage = images[currentIndex] || { imageUrl: '' };
  
  const handleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!productId) return;
    if (!token) {
      toast.error('Please login to add to wishlist');
      return;
    }
    try {
      const added = await toggleWishlist(productId, token);
      toast.success(added ? 'Added to wishlist' : 'Removed from wishlist');
    } catch {
      toast.error('Failed to update wishlist');
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePos({ x, y });
  };

  return (
    <div className="flex flex-col md:flex-row gap-3 lg:gap-5 w-full">
      {/* Thumbnails Slider (Left on Desktop, Bottom on Mobile) */}
      {images.length > 1 && (
        <div className="flex md:flex-col gap-2 md:gap-3 overflow-x-auto md:overflow-y-auto md:max-h-[500px] w-full md:w-20 lg:w-24 shrink-0 hide-scrollbar order-2 md:order-1 px-1 py-1 md:py-0 md:px-0">
          {images.map((img, i) => (
            <button 
              key={i} 
              onMouseEnter={() => setCurrentIndex(i)} // Amazon-style quick preview
              onClick={() => setCurrentIndex(i)}
              className={`aspect-square shrink-0 w-16 md:w-full bg-white border-2 rounded-lg p-1.5 flex items-center justify-center transition-all ${
                i === currentIndex ? 'border-amber-400 shadow-sm' : 'border-gray-200 hover:border-amber-200'
              }`}
            >
              <img 
                src={`${API}${img.imageUrl}`} 
                alt="Thumbnail" 
                className="w-full h-full object-contain mix-blend-multiply"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main Image Container */}
      <div className="flex-1 aspect-square md:aspect-auto md:h-[500px] bg-white border border-gray-200 rounded-xl flex items-center justify-center relative p-6 sm:p-10 group order-1 md:order-2 overflow-hidden shadow-sm">
        
        {/* Top Actions: Wishlist & Zoom Hint */}
        <div className="absolute right-4 top-4 flex flex-col gap-2 z-20">
          <button 
            onClick={handleWishlist}
            className="text-gray-400 hover:text-red-500 hover:scale-110 transition-all p-2.5 bg-white border border-gray-100 rounded-full shadow-sm"
            aria-label="Add to Wishlist"
          >
            <Heart size={20} className={wishlisted ? 'fill-red-500 text-red-500' : ''} />
          </button>
          <div className="text-gray-400 p-2.5 bg-white border border-gray-100 rounded-full shadow-sm opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none hidden md:block">
            <ZoomIn size={20} />
          </div>
        </div>
        
        {/* Mobile Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button 
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(i => (i === 0 ? images.length - 1 : i - 1)); }}
              className="md:hidden absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-[#0B192C] bg-white/90 border border-gray-100 rounded-full p-2 shadow-md transition-all z-20"
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(i => (i === images.length - 1 ? 0 : i + 1)); }}
              className="md:hidden absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-[#0B192C] bg-white/90 border border-gray-100 rounded-full p-2 shadow-md transition-all z-20"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
        
        {/* Image & Zoom Canvas */}
        {mainImage.imageUrl ? (
          <div 
            className="relative w-full h-full cursor-crosshair md:cursor-zoom-in"
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
            onMouseMove={handleMouseMove}
          >
            {/* Standard Image */}
            <img 
              src={`${API}${mainImage.imageUrl}`} 
              alt={mainImage.altText || 'Product image'} 
              className={`w-full h-full object-contain mix-blend-multiply transition-opacity duration-200 ${isZoomed && window.innerWidth >= 768 ? 'opacity-0' : 'opacity-100'}`}
            />
            
            {/* Zoom Layer (Desktop only) */}
            {isZoomed && (
              <div 
                className="absolute inset-0 bg-no-repeat bg-white z-10 hidden md:block"
                style={{
                  backgroundImage: `url(${API}${mainImage.imageUrl})`,
                  backgroundPosition: `${mousePos.x}% ${mousePos.y}%`,
                  backgroundSize: '250%' // Zoom magnification level
                }}
              />
            )}
          </div>
        ) : (
          <div className="text-gray-400 font-bold uppercase tracking-widest text-xs">No Image Available</div>
        )}
      </div>
    </div>
  );
}
