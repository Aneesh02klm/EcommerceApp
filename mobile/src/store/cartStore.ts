import { create } from 'zustand';
import { fetchApi } from '../lib/api';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  originalPrice: number;
  quantity: number;
  imageUrl?: string;
}

interface CartState {
  items: CartItem[];
  totalMRP: number;
  finalTotal: number;
  discount: number;
  isLoading: boolean;
  
  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateItemQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  totalMRP: 0,
  finalTotal: 0,
  discount: 0,
  isLoading: false,

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const response = await fetchApi('/cart');
      const cart = response.data;
      
      // Map API fields appropriately
      // set({ items: cart.items, totalMRP: cart.totalMRP, ... });
    } catch (error) {
      console.error('Failed to fetch cart', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addItem: async (productId, quantity = 1) => {
    set({ isLoading: true });
    try {
      await fetchApi('/cart/items', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity }),
      });
      await get().fetchCart();
    } catch (error) {
      console.error('Failed to add item', error);
    } finally {
      set({ isLoading: false });
    }
  },

  updateItemQuantity: async (productId, quantity) => {
    set({ isLoading: true });
    try {
      await fetchApi(`/cart/items/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity }),
      });
      await get().fetchCart();
    } catch (error) {
      console.error('Failed to update quantity', error);
    } finally {
      set({ isLoading: false });
    }
  },

  removeItem: async (productId) => {
    set({ isLoading: true });
    try {
      await fetchApi(`/cart/items/${productId}`, { method: 'DELETE' });
      await get().fetchCart();
    } catch (error) {
      console.error('Failed to remove item', error);
    } finally {
      set({ isLoading: false });
    }
  }
}));
