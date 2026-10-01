import { create } from 'zustand';

export interface CompareProduct {
  id: string;
  name: string;
  slug: string;
  brandSlug?: string;
  brand?: string;
  finalprice: number;
  mrp: number;
  discount: number;
  imageurl?: string;
  stock?: number;
  categorySlug?: string;
}

interface CompareState {
  items: CompareProduct[];
  addItem: (product: CompareProduct) => void;
  removeItem: (id: string) => void;
  clearAll: () => void;
  isComparing: (id: string) => boolean;
}

const MAX_COMPARE = 4;

export const useCompareStore = create<CompareState>((set, get) => ({
  items: [],

  addItem: (product) => {
    const { items } = get();
    if (items.length >= MAX_COMPARE) return;
    if (items.find(i => i.id === product.id)) return;
    set({ items: [...items, product] });
  },

  removeItem: (id) => {
    set(state => ({ items: state.items.filter(i => i.id !== id) }));
  },

  clearAll: () => set({ items: [] }),

  isComparing: (id) => get().items.some(i => i.id === id),
}));
