import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useCartStore } from './cartStore';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  roles?: string[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      setAuth: (user, token) => {
        set({ user, token, isAuthenticated: true });
        // Fetch/sync user's cart from backend upon login
        useCartStore.getState().initFromBackend();
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        useCartStore.getState().clearCart(); // Clear local cart state on logout
      },
    }),
    {
      name: 'malieakal-auth-storage',
    }
  )
);
