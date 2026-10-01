'use client';

import { useEffect, useState, useCallback } from 'react';

export function CountdownTimer({ endHours = 14, endMinutes = 45, endSeconds = 18 }: { endHours?: number; endMinutes?: number; endSeconds?: number }) {
  const [time, setTime] = useState({ h: endHours, m: endMinutes, s: endSeconds });

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(prev => {
        let { h, m, s } = prev;
        if (s > 0) return { h, m, s: s - 1 };
        if (m > 0) return { h, m: m - 1, s: 59 };
        if (h > 0) return { h: h - 1, m: 59, s: 59 };
        return { h: 0, m: 0, s: 0 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">Offer ends in:</span>
      {[{ v: pad(time.h), l: 'Hrs' }, { v: pad(time.m), l: 'Min' }, { v: pad(time.s), l: 'Sec' }].map((t, i) => (
        <span key={i} className="flex items-center gap-1">
          <span className="bg-[#0B192C] text-white text-[11px] font-bold px-2 py-1 rounded min-w-[28px] text-center tabular-nums">{t.v}</span>
          {i < 2 && <span className="text-[#0B192C] font-bold text-sm">:</span>}
        </span>
      ))}
    </div>
  );
}

export function HeroCountdown() {
  const [time, setTime] = useState({ d: 2, h: 14, m: 45, s: 18 });

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(prev => {
        let { d, h, m, s } = prev;
        if (s > 0) return { d, h, m, s: s - 1 };
        if (m > 0) return { d, h, m: m - 1, s: 59 };
        if (h > 0) return { d, h: h - 1, m: 59, s: 59 };
        if (d > 0) return { d: d - 1, h: 23, m: 59, s: 59 };
        return { d: 0, h: 0, m: 0, s: 0 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');
  const segments = [{ v: pad(time.d), l: 'Days' }, { v: pad(time.h), l: 'Hrs' }, { v: pad(time.m), l: 'Min' }, { v: pad(time.s), l: 'Sec' }];

  return (
    <div>
      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2 block">Sale Ends In</span>
      <div className="flex space-x-3">
        {segments.map((t, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="bg-[#111827] text-white border border-gray-700 w-14 h-14 flex items-center justify-center font-bold text-2xl rounded tabular-nums">{t.v}</div>
            <span className="text-[9px] text-gray-400 uppercase mt-1.5 font-bold">{t.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
