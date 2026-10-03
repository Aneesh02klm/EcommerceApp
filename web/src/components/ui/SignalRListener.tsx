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
      .build();

    connection.start().catch((err: any) => console.error('SignalR Connection Error: ', err));

    connection.on('ReceiveLayoutUpdate', () => {
      console.log('Received live layout update from CMS. Refreshing UI natively...');
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
