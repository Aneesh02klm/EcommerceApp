'use client';

import React, { useState } from 'react';
import { toast } from '@/components/ui/Toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

export function PreBookingClientForm({ section }: { section: any }) {
  const [formData, setFormData] = useState({ fullName: '', contactNumber: '', email: '', variantOfInterest: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/storefront/pre-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message);
        setFormData({ fullName: '', contactNumber: '', email: '', variantOfInterest: '' });
      } else {
        toast.error(json.message);
      }
    } catch (err) {
      toast.error('Network Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 bg-[#0B192C] text-white">
      <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-amber-400 block" />
            <span className="text-[9px] text-amber-500 font-extrabold uppercase tracking-[0.2em]">{section.subtitle}</span>
          </div>
          <h2 className="text-[32px] font-extrabold text-white leading-tight mb-4">{section.title}</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">{section.description}</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 sm:p-8 rounded-xl backdrop-blur-sm shadow-xl">
           <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Full Name</label>
                <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Contact Number</label>
                <input required type="text" value={formData.contactNumber} onChange={e => setFormData({...formData, contactNumber: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400" placeholder="+91 98765 43210" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Email (Optional)</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400" placeholder="john@example.com" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Variant / Model</label>
                    <input type="text" value={formData.variantOfInterest} onChange={e => setFormData({...formData, variantOfInterest: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400" placeholder="e.g. 256GB Black" />
                  </div>
              </div>
              <button disabled={loading} type="submit" className="w-full bg-amber-400 hover:bg-amber-300 text-[#0B192C] font-extrabold text-xs uppercase tracking-widest py-4 mt-2 transition-colors disabled:opacity-50">
                {loading ? 'Submitting...' : 'Register Enquiry'}
              </button>
           </form>
        </div>
      </div>
    </section>
  );
}
