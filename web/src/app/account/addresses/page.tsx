'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Loader2, Home, Briefcase, MapPin, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

interface SavedAddress {
  id: number;
  fullName: string;
  email?: string;
  phone: string;
  addressType: string;
  flatHouseNo?: string;
  areaStreet?: string;
  addressLine1?: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export default function AddressesPage() {
  const { token } = useAuthStore();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [addressToDelete, setAddressToDelete] = useState<number | null>(null);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (token) {
      fetchAddresses();
    }
  }, [token]);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/v1/addresses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setAddresses(data.data || []);
      }
    } catch (err) {
      toast.error('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAddress) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${API}/api/v1/addresses/${editingAddress.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editingAddress)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Address updated successfully');
        setEditingAddress(null);
        // Instant state update without fetching everything
        setAddresses(addresses.map(a => a.id === editingAddress.id ? data.data : a));
      } else {
        toast.error(data.message || 'Failed to update address');
      }
    } catch (err) {
      toast.error('Failed to update address');
    } finally {
      setIsSaving(false);
    }
  };

  const setAsDefault = async (id: number) => {
    try {
      const res = await fetch(`${API}/api/v1/addresses/${id}/set-default`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Default address updated');
        fetchAddresses();
      }
    } catch (err) {
      toast.error('Failed to update address');
    }
  };

  const confirmDeleteAddress = async () => {
    if (!addressToDelete) return;
    try {
      const res = await fetch(`${API}/api/v1/addresses/${addressToDelete}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Address removed');
        setAddresses(addresses.filter(a => a.id !== addressToDelete));
      } else {
        toast.error('Failed to remove address');
      }
    } catch (err) {
      toast.error('Failed to remove address');
    } finally {
      setAddressToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-amber-500" size={32} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-primary">Manage Addresses</h1>
        <Button className="flex items-center space-x-2" size="sm" onClick={() => toast.info('Edit/Add UI coming soon in checkout')}>
          <Plus size={16} />
          <span>Add New Address</span>
        </Button>
      </div>
      
      {addresses.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-100">
          <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-gray-700">No saved addresses</h3>
          <p className="text-sm text-gray-500 mt-2">Add an address to speed up your checkout process.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((addr) => (
            <div key={addr.id} className={`border rounded-lg p-5 bg-white relative transition-all ${addr.isDefault ? 'border-amber-400 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>
              
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  {addr.addressType === 'Work' ? <Briefcase size={16} className="text-gray-400" /> : <Home size={16} className="text-gray-400" />}
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {addr.addressType}
                  </span>
                  {addr.isDefault && (
                    <span className="text-[10px] font-extrabold uppercase tracking-widest bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                      Default
                    </span>
                  )}
                </div>
              </div>
              
              <h3 className="font-extrabold text-[#0B192C] text-lg">{addr.fullName}</h3>
              <p className="text-sm font-semibold text-gray-500 mt-1">{addr.phone}</p>
              
              <div className="mt-4 text-gray-600 text-sm leading-relaxed min-h-[60px]">
                <p>{addr.flatHouseNo ? `${addr.flatHouseNo}, ` : ''}{addr.addressLine1}</p>
                <p>{addr.areaStreet ? `${addr.areaStreet}, ` : ''}{addr.addressLine2}</p>
                <p className="font-medium mt-1 text-[#0B192C]">{addr.city}, {addr.state} - {addr.pincode}</p>
              </div>
              
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex gap-4">
                  <button 
                    onClick={() => setEditingAddress(addr)}
                    className="text-[#0B192C] hover:text-amber-600 text-xs font-extrabold uppercase tracking-wider flex items-center transition-colors"
                  >
                    <Edit2 size={14} className="mr-1" /> Edit
                  </button>
                  <button 
                    onClick={() => {
                      if (!addr.isDefault) setAddressToDelete(addr.id);
                    }}
                    disabled={addr.isDefault}
                    title={addr.isDefault ? "Set another address as default to remove this one." : ""}
                    className={`text-xs font-extrabold uppercase tracking-wider flex items-center transition-colors ${
                      addr.isDefault 
                        ? 'text-gray-300 cursor-not-allowed' 
                        : 'text-red-500 hover:text-red-700'
                    }`}
                  >
                    <Trash2 size={14} className="mr-1" /> Remove
                  </button>
                </div>
                {!addr.isDefault && (
                  <button 
                    onClick={() => setAsDefault(addr.id)}
                    className="text-[#0B192C] hover:text-amber-600 text-xs font-extrabold uppercase tracking-wider transition-colors"
                  >
                    Set as Default
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Address Modal */}
      {editingAddress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="text-lg font-extrabold text-[#0B192C]">Edit Address</h2>
              <button 
                onClick={() => setEditingAddress(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 hover:bg-gray-100 px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="edit-address-form" onSubmit={handleSaveEdit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">Full Name</label>
                    <input required className="w-full border border-gray-200 rounded p-2 text-sm outline-none focus:border-amber-400" 
                      value={editingAddress.fullName} onChange={e => setEditingAddress({...editingAddress, fullName: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">Phone</label>
                    <input required className="w-full border border-gray-200 rounded p-2 text-sm outline-none focus:border-amber-400" 
                      value={editingAddress.phone} onChange={e => setEditingAddress({...editingAddress, phone: e.target.value})} />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">Email (Optional)</label>
                  <input type="email" className="w-full border border-gray-200 rounded p-2 text-sm outline-none focus:border-amber-400" 
                    value={editingAddress.email || ''} onChange={e => setEditingAddress({...editingAddress, email: e.target.value})} />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">Flat, House no., Building</label>
                  <input required className="w-full border border-gray-200 rounded p-2 text-sm outline-none focus:border-amber-400" 
                    value={editingAddress.flatHouseNo || ''} onChange={e => setEditingAddress({...editingAddress, flatHouseNo: e.target.value})} />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">Area, Street, Sector</label>
                  <input required className="w-full border border-gray-200 rounded p-2 text-sm outline-none focus:border-amber-400" 
                    value={editingAddress.areaStreet || ''} onChange={e => setEditingAddress({...editingAddress, areaStreet: e.target.value})} />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">City</label>
                    <input required className="w-full border border-gray-200 rounded p-2 text-sm outline-none focus:border-amber-400" 
                      value={editingAddress.city} onChange={e => setEditingAddress({...editingAddress, city: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">State</label>
                    <input required className="w-full border border-gray-200 rounded p-2 text-sm outline-none focus:border-amber-400" 
                      value={editingAddress.state} onChange={e => setEditingAddress({...editingAddress, state: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">Pincode</label>
                    <input required className="w-full border border-gray-200 rounded p-2 text-sm outline-none focus:border-amber-400" 
                      value={editingAddress.pincode} onChange={e => setEditingAddress({...editingAddress, pincode: e.target.value})} />
                  </div>
                </div>
              </form>
            </div>
            
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-50 bg-gray-50/50">
              <Button variant="outline" onClick={() => setEditingAddress(null)} disabled={isSaving} className="text-xs font-bold uppercase tracking-widest text-gray-600 px-5 border-gray-300">Cancel</Button>
              <Button variant="primary" type="submit" form="edit-address-form" disabled={isSaving} className="text-xs font-bold uppercase tracking-widest bg-[#0B192C] text-white px-5 border-[#0B192C]">
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={addressToDelete !== null}
        title="Delete Address"
        message="Are you sure you want to delete this address? This action cannot be undone."
        onConfirm={confirmDeleteAddress}
        onCancel={() => setAddressToDelete(null)}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}
