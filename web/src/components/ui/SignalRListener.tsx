'use client';

import { useEffect, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import * as signalR from '@microsoft/signalr';

export function SignalRListener() {
  const router = useRouter();

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030'}/hubs/storefront`)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.None)
      .build();

    connection.start().catch((err: any) => {
      // Graceful degradation: Ignore fetch/negotiation errors if backend is completely offline
      if (err.message && err.message.includes('stopped during negotiation')) return;
      if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('negotiation'))) {
          console.warn('Real-time sync unavailable. Backend may be offline.');
          return;
      }
      console.warn('SignalR Connection Error: ', err.message);
    });

    

        connection.on('ProductUpdated', (data: any) => {
      console.log('Product updated dynamically:', data);
      
      import('@/store/cartStore').then(({ useCartStore }) => {
        useCartStore.getState().initFromBackend();
      });

      startTransition(() => {
        router.refresh();
      });
    });

    return () => {
      connection.stop();
    };
  }, [router]);

  return null;
}
