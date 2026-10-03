import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from './authStore';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  originalPrice: number;
  quantity: number;
  slug?: string;
  categorySlug?: string;
  brandSlug?: string;
  imageUrl?: string;
}

interface CartState {
  items: CartItem[];
  totalMRP: number;
  finalTotal: number;
  discount: number;
  appliedCoupons: { code: string, discountAmount: number, cannotBeCombined: boolean }[];
    promoCode: string;
    promoDiscount: number;
  
  addItem: (productId: string, quantity?: number) => Promise<void>;
  syncPrices: () => Promise<void>;
  updateItemQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  setPromo: (code: string, discountAmount: number) => void;
    addPromo: (coupon: { code: string, discountAmount: number, cannotBeCombined: boolean }) => void;
    removePromo: (code?: string) => void;
  
  // Backend Auth Sync Methods
  initFromBackend: () => Promise<void>;
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

const calculateTotals = (items: CartItem[]) => {
  const totalMRP = items.reduce((sum, item) => sum + (item.originalPrice * item.quantity), 0);
  const finalTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = totalMRP - finalTotal;
  return { totalMRP, finalTotal, discount };
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      totalMRP: 0,
      finalTotal: 0,
      discount: 0,
      appliedCoupons: [],
      promoCode: '',
      promoDiscount: 0,

      initFromBackend: async () => {
        const token = useAuthStore.getState().token;
        if (!token) return;

        const { items } = get();

        try {
          if (items.length > 0) {
            // Push local cart to backend if we have local items
            await fetch(`${API}/api/v1/cart/sync`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                items: items.map(i => ({ productId: i.productId, quantity: i.quantity }))
              })
            });
          } else {
            // Fetch backend cart and populate local
            const res = await fetch(`${API}/api/v1/cart`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success && json.data && json.data.items) {
              const backendItems = json.data.items.map((i: any) => ({
                productId: i.productId,
                name: i.product?.name || 'Unknown',
                price: i.product?.finalPrice || 0,
                originalPrice: i.product?.mrp || 0,
                quantity: i.quantity,
                slug: i.product?.slug,
                categorySlug: i.product?.categorySlug,
              }));
              set({ items: backendItems, ...calculateTotals(backendItems) });
            }
          }
          await get().syncPrices();
        } catch (error) {
          console.error('Failed to init cart from backend', error);
        }
      },

      addItem: async (productId, quantityToAdd = 1) => {
        const { items } = get();
        const existingItem = items.find(i => i.productId === productId);

        // Optimistic local update
        if (existingItem) {
          const newItems = items.map(i => i.productId === productId ? { ...i, quantity: i.quantity + quantityToAdd } : i);
          set({ items: newItems, ...calculateTotals(newItems) });
        } else {
          try {
            const res = await fetch(`${API}/api/v1/products/${productId}`);
            if (!res.ok) throw new Error('Product not found');
            const json = await res.json();
            const product = json.data;

            const newItem: CartItem = {
              productId: product.id,
              name: product.name,
              price: product.finalPrice,
              originalPrice: product.mrp,
              quantity: quantityToAdd,
              slug: product.slug,
              categorySlug: product.categorySlug,
              imageUrl: product.images?.[0]?.imageUrl
            };

            const newItems = [...items, newItem];
            set({ items: newItems, ...calculateTotals(newItems) });
          } catch (error) {
            console.error('Failed to fetch product for cart', error);
            throw error;
          }
        }

        // Backend Sync using INTENT-based atomic updates (safe increment)
        const token = useAuthStore.getState().token;
        if (token) {
          try {
            const res = await fetch(`${API}/api/v1/cart/items`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ skuId: productId, quantityToAdd })
            });
            // If the local state was stale, refetch directly from the backend to guarantee accuracy
            if (res.ok) {
              await get().initFromBackend();
            }
          } catch (error) {
            console.error('Failed to sync intent to cart backend', error);
          }
        }
      },

      syncPrices: async () => {
        const { items } = get();
        if (items.length === 0) return;
        try {
          const updatedItems = await Promise.all(items.map(async (item) => {
            try {
              const res = await fetch(`${API}/api/v1/products/${item.productId}`);
              if (!res.ok) return item;
              const json = await res.json();
              const product = json.data;
              return {
                ...item,
                price: product.finalPrice,
                originalPrice: product.mrp,
                name: product.name,
                slug: product.slug,
                categorySlug: product.categorySlug,
                imageUrl: product.images?.[0]?.imageUrl || item.imageUrl
              };
            } catch {
              return item;
            }
          }));
          set({ items: updatedItems, ...calculateTotals(updatedItems) });
        } catch (error) {
          console.error('Failed to sync cart prices', error);
        }
      },

      updateItemQuantity: (productId, quantity) => {
        const { items } = get();
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        
        // Remove duplicate/stale entries if they exist for some reason, keeping only the updated one
        const filteredItems = items.filter(i => i.productId !== productId);
        const targetItem = items.find(i => i.productId === productId);
        
        if (targetItem) {
          const newItems = [...filteredItems, { ...targetItem, quantity }];
          set({ items: newItems, ...calculateTotals(newItems) });

          // Sync to backend
          const token = useAuthStore.getState().token;
          if (token) {
            fetch(`${API}/api/v1/cart/items/${productId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ quantity })
            }).catch(console.error);
          }
        }
      },

      removeItem: (productId) => {
        const newItems = get().items.filter(i => i.productId !== productId);
        set({ items: newItems, ...calculateTotals(newItems) });

        // Sync to backend
        const token = useAuthStore.getState().token;
        if (token) {
          fetch(`${API}/api/v1/cart/items/${productId}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`
            }
          }).catch(console.error);
        }
      },

      clearCart: () => {
        set({ items: [], totalMRP: 0, finalTotal: 0, discount: 0, promoCode: '', promoDiscount: 0, appliedCoupons: [] });

        // Sync to backend
        const token = useAuthStore.getState().token;
        if (token) {
          fetch(`${API}/api/v1/cart`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`
            }
          }).catch(console.error);
        }
      },

      setPromo: (code: string, discountAmount: number) => {
        set({ promoCode: code, promoDiscount: discountAmount });
      },

      addPromo: (coupon: { code: string, discountAmount: number, cannotBeCombined: boolean }) => {
        const state = get();
        if (state.appliedCoupons.find(c => c.code === coupon.code)) return;
        const newCoupons = [...state.appliedCoupons, coupon];
        const totalDiscount = newCoupons.reduce((sum, c) => sum + c.discountAmount, 0);
        set({ appliedCoupons: newCoupons, promoCode: newCoupons.map(c => c.code).join(','), promoDiscount: totalDiscount });
      },

      removePromo: (code?: string) => {
        if (!code) {
          set({ promoCode: '', promoDiscount: 0, appliedCoupons: [] });
          return;
        }
        const state = get();
        const newCoupons = state.appliedCoupons.filter(c => c.code !== code);
        const totalDiscount = newCoupons.reduce((sum, c) => sum + c.discountAmount, 0);
        set({ appliedCoupons: newCoupons, promoCode: newCoupons.map(c => c.code).join(','), promoDiscount: totalDiscount });
      }
    }),
    {
      name: 'malieakal-cart-storage'
    }
  )
);
