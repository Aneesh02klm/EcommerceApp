'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';

export function AppInitializer() {
  const initDone = useRef(false);
  const token = useAuthStore(s => s.token);
  const initFromBackend = useCartStore(s => s.initFromBackend);

  useEffect(() => {
    // Only run this once when the token is first verified to be present on mount
    // or when the user logs in (token transitions from null to string).
    if (token && !initDone.current) {
      initDone.current = true;
      initFromBackend();
      useWishlistStore.getState().fetchWishlist(token);
    } else if (!token) {
      // If user logs out, we want to allow initFromBackend to run again on next login
      initDone.current = false;
    }
  }, [token, initFromBackend]);

  // CROSS-TAB & STALE STATE SYNC
  useEffect(() => {
    // 1. Sync across tabs using the storage event (BroadcastChannel alternative)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'malieakal-cart-storage') {
        useCartStore.persist.rehydrate();
      }
    };
    window.addEventListener('storage', handleStorage);

    // 2. Refetch on window focus to ensure fresh state (like React Query's refetchOnWindowFocus)
    const handleFocus = () => {
      useCartStore.persist.rehydrate();
      if (useAuthStore.getState().token) {
        useCartStore.getState().initFromBackend();
        useWishlistStore.getState().fetchWishlist(useAuthStore.getState().token);
      }
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return null;
}
