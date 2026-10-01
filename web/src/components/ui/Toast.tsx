'use client';

import { useEffect, useState } from 'react';

interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

let toastId = 0;
let addToast: (t: ToastMessage) => void = () => {};

export const toast = {
  success: (message: string) => addToast({ id: ++toastId, type: 'success', message }),
  error: (message: string) => addToast({ id: ++toastId, type: 'error', message }),
  info: (message: string) => addToast({ id: ++toastId, type: 'info', message }),
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    addToast = (t: ToastMessage) => {
      setToasts(prev => [...prev, t]);
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 3000);
    };
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded shadow-lg text-sm font-semibold text-white animate-slide-up
            ${t.type === 'success' ? 'bg-green-600' : t.type === 'error' ? 'bg-red-600' : 'bg-[#0B192C]'}`}
        >
          {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'} {t.message}
        </div>
      ))}
    </div>
  );
}
