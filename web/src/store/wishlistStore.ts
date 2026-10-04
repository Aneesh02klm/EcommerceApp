import { create } from 'zustand';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

interface WishlistStore {
  items: any[];
  isLoading: boolean;
  fetchWishlist: (token: string | null) => Promise<void>;
  toggleWishlist: (productId: string, token: string | null) => Promise<boolean>; 
  isInWishlist: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  items: [],
  isLoading: false,
  fetchWishlist: async (token: string | null) => {
    if (!token) {
      set({ items: [] });
      return;
    }
    set({ isLoading: true });
    try {
      const res = await fetch(`${API}/api/v1/wishlist`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
        if (!res.ok) {
            if (res.status === 401) {
                console.warn('Unauthorized fetch to ' + res.url);
                return;
            }
        }
        let json: any = { success: false, data: {} };
        try { json = await res.json(); } catch(e) {}
    
      if (json.success) {
        set({ items: json.data || [] });
      }
    } catch (err) {
      console.error('Failed to fetch wishlist', err);
    } finally {
      set({ isLoading: false });
    }
  },
  toggleWishlist: async (productId: string, token: string | null) => {
    if (!token) {
      throw new Error("unauthorized");
    }

    const isCurrentlyIn = get().isInWishlist(productId);
    
    // Optimistic UI update
    if (isCurrentlyIn) {
      set((state) => ({ items: state.items.filter(i => i.productId !== productId) }));
    } else {
      set((state) => ({ items: [...state.items, { productId }] }));
    }

    try {
      if (isCurrentlyIn) {
        const res = await fetch(`${API}/api/v1/wishlist/${productId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to remove");
        return false;
      } else {
        const res = await fetch(`${API}/api/v1/wishlist/${productId}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to add");
        return true;
      }
    } catch (err) {
      // Revert optimistic update on failure
      get().fetchWishlist(token);
      throw err;
    }
  },
  isInWishlist: (productId: string) => {
    return get().items.some(i => i.productId === productId);
  }
}));
