'use client';

import { useCompareStore } from '@/store/compareStore';
import { useRouter } from 'next/navigation';
import { X, GitCompare, Trash2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';
const MAX_COMPARE = 4;

export function CompareBar() {
  const { items, removeItem, clearAll } = useCompareStore();
  const router = useRouter();

  if (items.length === 0) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-300"
      aria-label="Product comparison bar"
    >
      {/* Backdrop blur strip */}
      <div className="bg-white/95 backdrop-blur-md border-t-2 border-amber-400 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
        <div className="container mx-auto px-6 py-3 flex items-center gap-4">

          {/* Label */}
          <div className="shrink-0 flex items-center gap-2 text-[#0B192C]">
            <GitCompare size={18} className="text-amber-500" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Comparing</p>
              <p className="text-sm font-extrabold leading-tight">
                {items.length} / {MAX_COMPARE}
                <span className="text-gray-400 font-semibold text-xs ml-1">products selected</span>
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-12 w-px bg-gray-200 shrink-0" />

          {/* Product thumbnails */}
          <div className="flex items-center gap-3 flex-1 overflow-x-auto hide-scrollbar py-1">
            {items.map(item => (
              <div
                key={item.id}
                className="relative shrink-0 group flex flex-col items-center"
              >
                <div className="w-14 h-14 border-2 border-amber-300 rounded-lg bg-white flex items-center justify-center overflow-hidden">
                  {item.imageurl ? (
                    <img
                      src={`${API_URL}${item.imageurl}`}
                      alt={item.name}
                      className="w-full h-full object-contain p-1 mix-blend-multiply"
                    />
                  ) : (
                    <span className="text-[8px] font-bold text-gray-400 text-center px-1 leading-tight">{item.name.substring(0, 12)}…</span>
                  )}
                </div>
                <p className="text-[9px] font-bold text-gray-600 mt-1 max-w-[56px] text-center leading-tight line-clamp-2">
                  {item.brand || item.name.split(' ')[0]}
                </p>
                {/* Remove button */}
                <button
                  onClick={() => removeItem(item.id)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gray-700 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                  aria-label={`Remove ${item.name}`}
                >
                  <X size={9} strokeWidth={3} />
                </button>
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: MAX_COMPARE - items.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="shrink-0 w-14 h-14 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center"
              >
                <span className="text-gray-300 text-xl font-light">+</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-red-500 transition-colors px-3 py-2"
            >
              <Trash2 size={13} />
              Clear All
            </button>
            <button
              onClick={() => router.push('/compare')}
              disabled={items.length < 2}
              className="flex items-center gap-2 bg-[#0B192C] hover:bg-amber-400 hover:text-[#0B192C] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-[11px] font-black uppercase tracking-widest px-5 py-2.5 rounded transition-colors"
            >
              <GitCompare size={15} />
              Compare Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
