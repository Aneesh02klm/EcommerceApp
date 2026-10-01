'use client';
import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Loader2 } from 'lucide-react';

export default function Page() {
  const { token } = useAuthStore();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';
        const res = await fetch(`${API}/api/v1/account/payment-methods`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          setData(json.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchData();
  }, [token]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-amber-500" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-[#0B192C] mb-6 pb-4 border-b border-gray-100">Payment Methods</h1>
      {data.length === 0 ? (
        <div className="text-center py-16 text-gray-500 font-bold bg-gray-50 rounded-lg">No records found.</div>
      ) : (
        <div className="space-y-4">
          {data.map((item, i) => (
            <div key={i} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <p className="font-bold text-[#0B192C]">{item.provider + " ending in " + item.last4}</p>
              {item.status && <p className="text-xs font-bold text-amber-600 mt-1 uppercase tracking-widest">{item.status}</p>}
              {item.createdAt && <p className="text-xs text-gray-400 mt-1">Date: {new Date(item.createdAt).toLocaleDateString()}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}