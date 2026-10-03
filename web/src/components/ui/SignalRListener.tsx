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
      if (err.message && err.message.includes('stopped during negotiation')) return; // Ignore React 18 StrictMode unmounts
      console.error('SignalR Connection Error: ', err);
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
