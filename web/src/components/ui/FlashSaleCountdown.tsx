
'use client';
import { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

export function FlashSaleCountdown({ endTime, saleName, variant = 'default' }: { endTime: string, saleName?: string, variant?: 'default' | 'premium' }) {
  const [timeLeft, setTimeLeft] = useState({ h: '00', m: '00', s: '00' });
  const [isExpired, setIsExpired] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const target = new Date(endTime).getTime();
    
    const update = () => {
      const now = new Date().getTime();
      const diff = target - now;
      
      if (diff <= 0) {
        setIsExpired(true);
        return;
      }
      
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft({
        h: h.toString().padStart(2, '0'),
        m: m.toString().padStart(2, '0'),
        s: s.toString().padStart(2, '0')
      });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  if (!mounted || isExpired) return null;

  if (variant === 'premium') {
    return (
      <div className="flex items-center gap-2">
        {saleName && <span className="text-sm font-bold text-red-600 mr-2 uppercase">{saleName}</span>}
        <div className="flex items-center gap-1.5">
          <div className="bg-red-600 text-white font-black text-xl w-10 h-10 flex items-center justify-center rounded-md shadow-inner">{timeLeft.h}</div>
          <span className="text-red-400 font-bold text-xl">:</span>
          <div className="bg-red-600 text-white font-black text-xl w-10 h-10 flex items-center justify-center rounded-md shadow-inner">{timeLeft.m}</div>
          <span className="text-red-400 font-bold text-xl">:</span>
          <div className="bg-red-600 text-white font-black text-xl w-10 h-10 flex items-center justify-center rounded-md shadow-inner">{timeLeft.s}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1.5 rounded-md border border-red-100 shadow-sm w-fit">
      <Timer size={14} className="animate-pulse" />
      <span className="text-xs font-bold uppercase tracking-wider">
        {saleName ? saleName + " Ends in " : "Ends in "} 
        {timeLeft.h}h {timeLeft.m}m {timeLeft.s}s
      </span>
    </div>
  );
}
