'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';

export function GlobalFetchErrorInterceptor() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
      try {
        const response = await originalFetch.apply(this, args);
        
        if (isOffline) setIsOffline(false); // recover

        // Intercept 401 Unauthorized globally
        if (response.status === 401) {
          const url = typeof args[0] === 'string' ? args[0] : (args[0] instanceof Request ? args[0].url : '');
          if (url.includes('/api/')) {
            // Token is likely expired or invalid. Log the user out safely.
            const logout = useAuthStore.getState().logout;
            if (useAuthStore.getState().token) {
              logout();
              // Optional: Redirect to login if they are on a protected route, or just let the reactive authState handle it.
              if (window.location.pathname.startsWith('/account') || window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/checkout')) {
                  window.location.href = '/login';
              }
            }
          }
        }
        
        return response;
      } catch (error: any) {
        // Handle Network error / Failed to fetch
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
          if (!isOffline) setIsOffline(true);
          
          const url = typeof args[0] === 'string' ? args[0] : (args[0] instanceof Request ? args[0].url : '');
          
          // Only mock REST API calls, NOT SignalR negotiation
          if (url.includes('/api/')) {
            return new Response(JSON.stringify({ success: false, data: [], message: 'Offline mode active.' }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [isOffline]);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] bg-[#0B192C] text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-red-500/20 animate-in fade-in slide-in-from-bottom-4">
      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
      <p className="text-xs font-semibold tracking-wide">Unable to connect to the server. Some features may be offline.</p>
    </div>
  );
}
