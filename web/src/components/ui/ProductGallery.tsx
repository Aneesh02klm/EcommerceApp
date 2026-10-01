'use client';

import { useState, useEffect } from 'react';
import { Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from './Toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

interface Image {
  imageUrl: string;
  altText?: string;
}

export function ProductGallery({ images }: { images: Image[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => { setCurrentIndex(0); }, [images]);
  const mainImage = images[currentIndex] || { imageUrl: '' };
  
  const handleWishlist = () => {
    setWishlisted(!wishlisted);
    toast.info(wishlisted ? 'Removed from wishlist' : 'Added to wishlist');
  };

  return (
    <div className="space-y-4">
      <div className="aspect-square bg-gray-50 border border-gray-200 rounded flex items-center justify-center relative p-8 group">
        <button 
          onClick={handleWishlist}
          className="absolute right-4 top-4 text-gray-400 hover:text-red-500 hover:scale-110 transition-all p-2 bg-white rounded-full shadow-sm z-10"
        >
          <Heart size={20} className={wishlisted ? 'fill-red-500 text-red-500' : ''} />
        </button>
        
        {images.length > 1 && (
          <>
            <button 
              onClick={() => setCurrentIndex(i => (i === 0 ? images.length - 1 : i - 1))}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-[#0B192C] bg-white/80 hover:bg-white rounded-full p-2 shadow-sm transition-all z-10 opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              onClick={() => setCurrentIndex(i => (i === images.length - 1 ? 0 : i + 1))}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-[#0B192C] bg-white/80 hover:bg-white rounded-full p-2 shadow-sm transition-all z-10 opacity-0 group-hover:opacity-100"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
        
        {mainImage.imageUrl ? (
          <img 
            src={`${API}${mainImage.imageUrl}`} 
            alt={mainImage.altText || 'Product image'} 
            className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500"
          />
        ) : (
          <div className="text-gray-400 font-bold uppercase tracking-widest text-xs">No Image</div>
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-4">
          {images.map((img, i) => (
            <button 
              key={i} 
              onClick={() => setCurrentIndex(i)}
              className={`aspect-square bg-white border rounded p-2 flex items-center justify-center transition-all ${
                i === currentIndex ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-gray-200 hover:border-gray-300'
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
    </div>
  );
}
