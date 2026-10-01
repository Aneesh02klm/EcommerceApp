'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PromoCodeInput } from '@/components/ui/PromoCodeInput';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Button } from '@/components/ui/Button';
import {
  Lock, MapPin, CreditCard, ChevronRight, Plus, Home, Briefcase,
  MapPinned, CheckCircle, Loader2, Navigation, Trash2, Edit2
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/Toast';
import { formatCurrency } from '@/lib/formatCurrency';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SavedAddress {
  id: number;
  fullName: string;
  email?: string;
  phone: string;
  addressType: string;
  flatHouseNo?: string;
  areaStreet?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

interface AddressFormData {
  fullName: string;
  email: string;
  phone: string;
  recipientPhone: string;
  sameAsAccountPhone: boolean;
  addressType: string;
  flatHouseNo: string;
  areaStreet: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  saveAddress: boolean;
}

const EMPTY_FORM: AddressFormData = {
  fullName: '', email: '', phone: '', recipientPhone: '', sameAsAccountPhone: true, addressType: 'Home',
  flatHouseNo: '', areaStreet: '', addressLine2: '',
  city: '', state: '', pincode: '', isDefault: false, saveAddress: true,
};

// ─── Input Component ──────────────────────────────────────────────────────────

const inputCls = 'w-full p-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#0B192C] focus:border-[#0B192C] outline-none text-sm font-semibold bg-white disabled:bg-gray-50 disabled:text-gray-500';
const labelCls = 'block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5';

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
    </div>
  );
}

// ─── Address Card ─────────────────────────────────────────────────────────────

function AddressCard({
  address, selected, onSelect, onEdit, onDelete, onSetDefault
}: {
  address: SavedAddress;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  const Icon = address.addressType === 'Work' ? Briefcase : Home;
  return (
    <div
      onClick={onSelect}
      className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all ${
        selected
          ? 'border-amber-400 bg-amber-50/60 shadow-md ring-1 ring-amber-400'
          : 'border-gray-200 hover:border-gray-400 bg-white'
      }`}
    >
      {address.isDefault && (
        <span className="absolute top-3 right-3 bg-[#0B192C] text-white text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full">
          Default
        </span>
      )}
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${selected ? 'bg-amber-400' : 'bg-gray-100'}`}>
          <Icon size={14} className={selected ? 'text-white' : 'text-gray-500'} />
        </div>
        <span className="text-xs font-extrabold text-[#0B192C] uppercase tracking-wider">{address.addressType}</span>
        {selected && <CheckCircle size={14} className="text-amber-500 ml-auto mr-6" />}
      </div>
      <p className="text-sm font-bold text-[#0B192C]">{address.fullName}</p>
      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
        {[address.flatHouseNo || address.addressLine1, address.areaStreet, address.addressLine2, address.city, address.state, address.pincode]
          .filter(Boolean).join(', ')}
      </p>
      <p className="text-xs text-gray-500 mt-0.5">{address.phone}</p>
      <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100">
        <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="text-xs font-bold text-[#0B192C] hover:text-amber-600 flex items-center gap-1 transition-colors">
          <Edit2 size={11} /> Edit
        </button>
        {!address.isDefault && (
          <button onClick={(e) => { e.stopPropagation(); onSetDefault(); }} className="text-xs font-bold text-gray-500 hover:text-[#0B192C] transition-colors">
            Set Default
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!address.isDefault) onDelete();
          }}
          disabled={address.isDefault}
          title={address.isDefault ? "Set another address as default to remove this one." : ""}
          className={`text-xs font-bold flex items-center gap-1 ml-auto transition-colors ${
            address.isDefault 
              ? 'text-gray-300 cursor-not-allowed' 
              : 'text-red-400 hover:text-red-600'
          }`}
        >
          <Trash2 size={11} /> Remove
        </button>
      </div>
    </div>
  );
}

// ─── Address Form ─────────────────────────────────────────────────────────────

function AddressForm({
  form, onChange, onGeolocate, isGeolocating, isEditMode
}: {
  form: AddressFormData;
  onChange: (patch: Partial<AddressFormData>) => void;
  onGeolocate: () => void;
  isGeolocating: boolean;
  isEditMode: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Full Name" required>
          <input className={inputCls} value={form.fullName} required
            onChange={e => onChange({ fullName: e.target.value })} placeholder="Enter full name" />
        </Field>
        <Field label="Account / Billing Phone" required>
          <input className={inputCls} type="tel" value={form.phone} required
            onChange={e => {
              const newPhone = e.target.value;
              if (form.sameAsAccountPhone) {
                onChange({ phone: newPhone, recipientPhone: newPhone });
              } else {
                onChange({ phone: newPhone });
              }
            }} placeholder="+91 XXXXX XXXXX" />
        </Field>
      </div>

      <div className="border border-gray-100 bg-gray-50/50 p-4 rounded-xl">
        <label className="flex items-center gap-2 cursor-pointer mb-3">
          <input type="checkbox" checked={form.sameAsAccountPhone}
            onChange={e => {
              const isChecked = e.target.checked;
              if (isChecked) {
                onChange({ sameAsAccountPhone: isChecked, recipientPhone: form.phone });
              } else {
                onChange({ sameAsAccountPhone: isChecked, recipientPhone: '' });
              }
            }}
            className="w-4 h-4 accent-[#0B192C] cursor-pointer rounded" />
          <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">Same as Account/Billing Phone Number</span>
        </label>
        
        <Field label="Delivery / Recipient Phone Number" required>
          <input className={inputCls} type="tel" value={form.recipientPhone} required
            disabled={form.sameAsAccountPhone}
            onChange={e => onChange({ recipientPhone: e.target.value })} placeholder="+91 XXXXX XXXXX" />
        </Field>
      </div>

      <Field label="Email Address" required>
        <input className={inputCls} type="email" value={form.email} required
          onChange={e => onChange({ email: e.target.value })} placeholder="you@example.com" />
      </Field>

      <Field label="Address Type" required>
        <div className="flex gap-2">
          {['Home', 'Work', 'Other'].map(t => (
            <button key={t} type="button" onClick={() => onChange({ addressType: t })}
              className={`flex-1 py-2 rounded text-xs font-extrabold uppercase tracking-wider border-2 transition-all ${
                form.addressType === t
                  ? 'border-[#0B192C] bg-[#0B192C] text-white'
                  : 'border-gray-200 text-gray-500 hover:border-gray-400'
              }`}>
              {t}
            </button>
          ))}
        </div>
      </Field>

      <div className="relative">
        <Field label="Flat, House no., Building, Company, Apartment" required>
          <input className={inputCls} value={form.flatHouseNo} required
            onChange={e => onChange({ flatHouseNo: e.target.value })}
            placeholder="e.g., Flat 4B, Sunrise Apartments" />
        </Field>
      </div>

      <div className="relative">
        <Field label="Area, Street, Sector, Village" required>
          <div className="flex gap-2">
            <input className={`${inputCls} flex-1`} value={form.areaStreet} required
              onChange={e => onChange({ areaStreet: e.target.value })}
              placeholder="e.g., MG Road, Sector 15" />
            <button
              type="button"
              onClick={onGeolocate}
              disabled={isGeolocating}
              title="Use my current location"
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 border-2 border-[#0B192C] text-[#0B192C] rounded text-xs font-extrabold uppercase tracking-wider hover:bg-[#0B192C] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeolocating ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
              <span className="hidden sm:inline">Locate</span>
            </button>
          </div>
        </Field>
      </div>

      <Field label="Landmark / Apt / Suite (Optional)">
        <input className={inputCls} value={form.addressLine2}
          onChange={e => onChange({ addressLine2: e.target.value })}
          placeholder="e.g., Near Apollo Hospital" />
      </Field>

      <div className="grid grid-cols-3 gap-4">
        <Field label="City" required>
          <input className={inputCls} value={form.city} required
            onChange={e => onChange({ city: e.target.value })} placeholder="City" />
        </Field>
        <Field label="State" required>
          <input className={inputCls} value={form.state} required
            onChange={e => onChange({ state: e.target.value })} placeholder="State" />
        </Field>
        <Field label="Pincode" required>
          <input className={inputCls} value={form.pincode} required maxLength={6}
            pattern="\d{6}"
            onChange={e => onChange({ pincode: e.target.value.replace(/\D/g, '') })} placeholder="6 digits" />
        </Field>
      </div>

      {!isEditMode && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.saveAddress}
            onChange={e => onChange({ saveAddress: e.target.checked })}
            className="w-4 h-4 accent-[#0B192C] cursor-pointer" />
          <span className="text-xs font-bold text-gray-600">Save this address for future orders</span>
        </label>
      )}

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.isDefault}
          onChange={e => onChange({ isDefault: e.target.checked })}
          className="w-4 h-4 accent-[#0B192C] cursor-pointer" />
        <span className="text-xs font-bold text-gray-600">Set as default address</span>
      </label>
    </div>
  );
}

// ─── Main Checkout Page ───────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const { items, totalMRP, finalTotal, discount, clearCart, promoDiscount, promoCode } = useCartStore();
  const { user, token } = useAuthStore();

  // Address state
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [addressForm, setAddressForm] = useState<AddressFormData>(EMPTY_FORM);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [addressToDelete, setAddressToDelete] = useState<number | null>(null);

  // Geolocation
  const [isGeolocating, setIsGeolocating] = useState(false);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'Razorpay' | 'COD'>('Razorpay');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Delivery
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [deliveryChecking, setDeliveryChecking] = useState(false);
  const [deliveryError, setDeliveryError] = useState('');

  // Unified Final Payable Amount
  const finalPayableAmount = Math.max(0, finalTotal + deliveryCharge - (promoDiscount || 0));

  // OTP Login
  const [showOtpLogin, setShowOtpLogin] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpStep, setOtpStep] = useState(1); // 1 = enter email, 2 = enter code
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const { setAuth } = useAuthStore();

  // ── Init ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // If we have a token, load addresses. If not, stop loading and show form.
    if (token) {
      loadAddresses();
    } else {
      setAddressesLoading(false);
      setShowAddressForm(true);
    }
    
    // Pre-fill email and phone from user profile
    if (user) {
      setAddressForm(f => ({ 
        ...f, 
        email: f.email || user.email || '',
        phone: f.phone || user.phone || '',
        recipientPhone: f.recipientPhone || user.phone || '',
        sameAsAccountPhone: f.phone === f.recipientPhone || (!f.phone && !f.recipientPhone)
      }));
    }
  }, [mounted, token, user?.email, user?.phone]); // Added user profile dependencies

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }), [token]);

  // ── Load saved addresses ──────────────────────────────────────────────────

  const loadAddresses = useCallback(async () => {
    if (!token) {
      setAddressesLoading(false);
      setShowAddressForm(true);
      return;
    }
    
    try {
      setAddressesLoading(true);
      const res = await fetch(`${API}/api/v1/addresses`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to load addresses');
      const data = await res.json();
      const addresses: SavedAddress[] = data.data || [];
      
      setSavedAddresses(addresses);
      
      if (addresses.length === 0) {
        setShowAddressForm(true);
        setSelectedAddressId(null);
      } else {
        // Auto-select default address
        const defaultAddr = addresses.find(a => a.isDefault) ?? addresses[0];
        setSelectedAddressId(defaultAddr.id);
        setShowAddressForm(false);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load your saved addresses.');
      setSavedAddresses([]);
      setShowAddressForm(true);
      setSelectedAddressId(null);
    } finally {
      setAddressesLoading(false);
    }
  }, [token, authHeaders]);

  // ── OTP ───────────────────────────────────────────────────────────────────

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpEmail) return;
    setIsOtpLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/auth/send-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone: otpEmail })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send OTP');
      toast.success(data.message || 'OTP Sent!');
      setOtpStep(2);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) return;
    setIsOtpLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/auth/verify-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone: otpEmail, otp: otpCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Invalid OTP');
      toast.success('Logged in successfully!');
      setAuth(data.user, data.token);
      setShowOtpLogin(false);
      // Addresses will auto-load due to token change in useEffect
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsOtpLoading(false);
    }
  };

  // ── Geolocation ───────────────────────────────────────────────────────────

  const handleGeolocate = useCallback(async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }
    setIsGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const addr = data.address ?? {};
          const street = [addr.road, addr.suburb, addr.neighbourhood].filter(Boolean).join(', ') || '';
          const city = addr.city || addr.town || addr.village || addr.county || '';
          const state = addr.state || '';
          const pincode = addr.postcode || '';
          setAddressForm(f => ({
            ...f,
            areaStreet: street || f.areaStreet,
            city: city || f.city,
            state: state || f.state,
            pincode: pincode || f.pincode,
          }));
          toast.success('Location detected! Please verify the details.');
        } catch {
          toast.error('Could not fetch address. Please enter manually.');
        } finally {
          setIsGeolocating(false);
        }
      },
      (err) => {
        setIsGeolocating(false);
        if (err.code === 1) toast.error('Location permission denied.');
        else toast.error('Could not get your location. Please enter manually.');
      },
      { timeout: 10000 }
    );
  }, []);

  // ── Address CRUD ──────────────────────────────────────────────────────────

  const handleSaveAddress = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const body = {
        fullName: addressForm.fullName,
        email: addressForm.email,
        phone: addressForm.phone,
        addressType: addressForm.addressType,
        flatHouseNo: addressForm.flatHouseNo,
        areaStreet: addressForm.areaStreet,
        addressLine1: addressForm.flatHouseNo, // backward compat
        addressLine2: addressForm.addressLine2,
        city: addressForm.city,
        state: addressForm.state,
        pincode: addressForm.pincode,
        isDefault: addressForm.isDefault,
      };

      if (editingAddressId) {
        const res = await fetch(`${API}/api/v1/addresses/${editingAddressId}`, {
          method: 'PUT', headers: authHeaders(), body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error('Failed to update address');
        toast.success('Address updated successfully!');
      } else {
        const res = await fetch(`${API}/api/v1/addresses`, {
          method: 'POST', headers: authHeaders(), body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error('Failed to save address');
        const data = await res.json();
        toast.success('Address saved!');
        setSelectedAddressId(data.data?.id ?? null);
      }

      setEditingAddressId(null);
      setShowAddressForm(false);
      setAddressForm(EMPTY_FORM);
      await loadAddresses();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save address');
    }
  }, [addressForm, editingAddressId, token, authHeaders, loadAddresses]);

  const confirmDeleteAddress = async () => {
    if (!token || !addressToDelete) return;
    try {
      const res = await fetch(`${API}/api/v1/addresses/${addressToDelete}`, {
        method: 'DELETE', headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Address removed.');
      if (selectedAddressId === addressToDelete) setSelectedAddressId(null);
      await loadAddresses();
    } catch {
      toast.error('Could not delete address');
    } finally {
      setAddressToDelete(null);
    }
  };

  const handleSetDefault = useCallback(async (id: number) => {
    if (!token) return;
    try {
      await fetch(`${API}/api/v1/addresses/${id}/set-default`, {
        method: 'PATCH', headers: authHeaders(),
      });
      await loadAddresses();
    } catch {
      toast.error('Could not update default');
    }
  }, [token, authHeaders, loadAddresses]);

  const handleEditAddress = useCallback((addr: SavedAddress) => {
    const actPhone = user?.phone || addr.phone;
    const samePhone = actPhone === addr.phone;
    setAddressForm({
      fullName: addr.fullName,
      email: addr.email || '',
      phone: actPhone,
      recipientPhone: addr.phone,
      sameAsAccountPhone: samePhone,
      addressType: addr.addressType || 'Home',
      flatHouseNo: addr.flatHouseNo || addr.addressLine1 || '',
      areaStreet: addr.areaStreet || '',
      addressLine2: addr.addressLine2 || '',
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      isDefault: addr.isDefault,
      saveAddress: true,
    });
    setEditingAddressId(addr.id);
    setShowAddressForm(true);
  }, [user]);

  // ── Calculate Delivery ──────────────────────────────────────────────────
  
  useEffect(() => {
    let activePincode = '';
    let activeState = '';

    if (selectedAddressId && !showAddressForm) {
      const addr = savedAddresses.find(a => a.id === selectedAddressId);
      if (addr) {
        activePincode = addr.pincode;
        activeState = addr.state;
      }
    } else if (showAddressForm && addressForm.pincode.length === 6) {
      activePincode = addressForm.pincode;
      activeState = addressForm.state;
    }

    if (activePincode.length === 6) {
      setDeliveryChecking(true);
      setDeliveryError('');
      fetch(`${API || 'http://localhost:5030'}/api/v1/delivery/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pincode: activePincode, stateName: activeState })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          if (data.data.isServiceable) {
            setDeliveryCharge(data.data.charge);
            setDeliveryError('');
          } else {
            setDeliveryCharge(0);
            setDeliveryError(data.data.message || 'Not deliverable to this pincode');
          }
        }
      })
      .catch(() => setDeliveryError('Could not verify delivery'))
      .finally(() => setDeliveryChecking(false));
    } else {
      setDeliveryCharge(0);
      setDeliveryError('');
    }
  }, [selectedAddressId, showAddressForm, savedAddresses, addressForm.pincode, addressForm.state]);

  // ── Place Order ───────────────────────────────────────────────────────────

  const handlePlaceOrder = useCallback(async () => {
    // Validate address selection
    if (!selectedAddressId && !showAddressForm) {
      toast.error('Please select or add a delivery address.');
      return;
    }

    try {
      setIsPlacingOrder(true);

      // Sync cart to backend first if authenticated
      if (token) {
        const syncPayload = {
          items: items.map(i => ({ productId: i.productId, quantity: i.quantity }))
        };
        const syncRes = await fetch(`${API}/api/v1/cart/sync`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(syncPayload),
        });
        if (!syncRes.ok) console.warn('Failed to sync cart to DB');
      }

      // Build checkout payload
      const selectedAddr = savedAddresses.find(a => a.id === selectedAddressId);
      const checkoutPayload: Record<string, any> = {
        paymentMethod,
        emailAddress: selectedAddr?.email || addressForm.email || user?.email || '',
        promoCode: useCartStore.getState().promoCode,
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity })) // Pass items for guest/direct calculate
      };

      if (selectedAddressId) {
        checkoutPayload.addressId = selectedAddressId;
      } else {
        // Use inline form data
        checkoutPayload.fullName = addressForm.fullName;
        checkoutPayload.phone = addressForm.recipientPhone;
        checkoutPayload.flatHouseNo = addressForm.flatHouseNo;
        checkoutPayload.areaStreet = addressForm.areaStreet;
        checkoutPayload.addressLine2 = addressForm.addressLine2;
        checkoutPayload.city = addressForm.city;
        checkoutPayload.state = addressForm.state;
        checkoutPayload.pincode = addressForm.pincode;
        checkoutPayload.addressType = addressForm.addressType;
        checkoutPayload.saveAddress = addressForm.saveAddress;
        checkoutPayload.isDefault = addressForm.isDefault;
      }

      const initRes = await fetch(`${API}/api/v1/checkout/initiate`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(checkoutPayload),
      });

      const initData = await initRes.json();
      if (!initData.success) throw new Error(initData.message || 'Checkout failed');

      // Save guest info for post-purchase account creation
      if (!token) {
        localStorage.setItem('guest_checkout_data', JSON.stringify({
          firstName: addressForm.fullName?.split(' ')[0] || '',
          lastName: addressForm.fullName?.split(' ').slice(1).join(' ') || '',
          email: checkoutPayload.emailAddress,
          phone: addressForm.phone || ''
        }));
      }

      if (paymentMethod === 'COD') {
        // COD: order confirmed directly
        clearCart();
        toast.success('Order placed successfully! Pay on delivery.');
        router.push(`/checkout/success?orderId=${initData.data?.orderId}`);
        return;
      }

      // Razorpay flow
      const { razorpayOrderId, amount, orderId } = initData.data || initData;
      if (typeof (window as any).Razorpay === 'undefined') {
        // Load Razorpay SDK dynamically
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
          document.head.appendChild(script);
        });
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
        amount: Math.round(amount * 100),
        currency: 'INR',
        name: 'Malieakal Electronics',
        description: 'Order Payment',
        order_id: razorpayOrderId,
        prefill: {
          name: selectedAddr?.fullName || addressForm.fullName || user?.firstName || '',
          email: checkoutPayload.emailAddress || '',
          contact: selectedAddr?.phone || addressForm.phone || '',
        },
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch(`${API}/api/v1/checkout/verify`, {
              method: 'POST',
              headers: authHeaders(),
              body: JSON.stringify({
                orderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              clearCart();
              toast.success('Payment successful! Order confirmed.');
              router.push(`/checkout/success?orderId=${orderId}`);
            } else {
              toast.error('Payment verification failed. Please contact support.');
            }
          } catch {
            toast.error('Payment verification error. Please contact support.');
          }
        },
        modal: { ondismiss: () => toast.error('Payment cancelled.') },
        theme: { color: '#FBBF24' },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (err: any) {
      toast.error(err.message || 'An error occurred during checkout');
    } finally {
      setIsPlacingOrder(false);
    }
  }, [
    token, selectedAddressId, showAddressForm, savedAddresses,
    addressForm, items, paymentMethod, user, authHeaders, clearCart, router,
  ]);

  // ── Render guard ──────────────────────────────────────────────────────────

  if (!mounted) return <div className="min-h-screen" />;

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-xl text-center min-h-screen">
        <h2 className="text-2xl font-extrabold text-[#0B192C] mb-4">Checkout not available</h2>
        <p className="text-gray-500 mb-8">Your cart is empty. Add items before proceeding to checkout.</p>
        <Link href="/products">
          <Button variant="primary" size="lg" className="px-8 font-extrabold tracking-widest uppercase">Start Shopping</Button>
        </Link>
      </div>
    );
  }

  // ── Rendered address summary (step 2 collapsed view) ──────────────────────

  const selectedAddr = savedAddresses.find(a => a.id === selectedAddressId);
  const addressSummary = selectedAddr
    ? `${selectedAddr.fullName} — ${[selectedAddr.flatHouseNo || selectedAddr.addressLine1, selectedAddr.city, selectedAddr.state, selectedAddr.pincode].filter(Boolean).join(', ')}`
    : [addressForm.fullName, addressForm.flatHouseNo, addressForm.city, addressForm.state, addressForm.pincode].filter(Boolean).join(', ');

  return (
    <div className="bg-[#fafafa] min-h-screen pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 mb-8 py-6">
        <div className="container mx-auto px-4 max-w-6xl flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-[#0B192C] flex items-center tracking-tight">
            <Lock className="mr-3 text-amber-500" size={24} />
            Secure Checkout
          </h1>
          <div className="flex items-center space-x-3 text-xs font-bold uppercase tracking-widest">
            <span className={step >= 1 ? 'text-[#0B192C]' : 'text-gray-400'}>1. Address</span>
            <ChevronRight size={14} className="text-gray-300" />
            <span className={step >= 2 ? 'text-[#0B192C]' : 'text-gray-400'}>2. Payment</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Steps */}
          <div className="flex-1 space-y-6">

            {/* ── Step 1: Address ─────────────────────────────────────────── */}
            <div className={`bg-white p-6 rounded-xl border-2 transition-all ${
              step === 1 ? 'border-amber-400 shadow-md ring-1 ring-amber-400' : 'border-gray-200 opacity-70'
            }`}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-extrabold text-[#0B192C] flex items-center">
                  <MapPin className="mr-3 text-gray-400" size={20} />
                  Shipping Address
                </h2>
                {step === 2 && (
                  <button onClick={() => setStep(1)} className="text-xs font-bold text-amber-600 uppercase tracking-widest hover:underline">
                    Edit
                  </button>
                )}
              </div>

              {step === 1 ? (
                <>
                  {!token && (
                    <div className="mb-6 bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                      {!showOtpLogin ? (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-extrabold text-[#0B192C]">Want to checkout faster?</h3>
                            <p className="text-xs text-gray-500">Log in with OTP to access your saved addresses.</p>
                          </div>
                          <button onClick={() => setShowOtpLogin(true)} className="shrink-0 bg-white border border-gray-200 text-[#0B192C] font-bold text-xs px-4 py-2 rounded-lg hover:border-amber-400 transition-colors uppercase tracking-widest">
                            Log In
                          </button>
                        </div>
                      ) : (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-extrabold text-[#0B192C]">Instant Login</h3>
                            <button onClick={() => setShowOtpLogin(false)} className="text-xs text-gray-400 hover:text-gray-600">Close</button>
                          </div>
                          {otpStep === 1 ? (
                            <form onSubmit={handleSendOtp} className="flex gap-2">
                              <input type="text" placeholder="Email or Phone Number" value={otpEmail} onChange={e => setOtpEmail(e.target.value)} required className="flex-1 border border-gray-200 rounded p-2 text-sm outline-none focus:border-amber-400" />
                              <button type="submit" disabled={isOtpLoading} className="bg-[#0B192C] text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest disabled:opacity-50 min-w-[100px] flex items-center justify-center">
                                {isOtpLoading ? <Loader2 size={14} className="animate-spin" /> : 'Get OTP'}
                              </button>
                            </form>
                          ) : (
                            <form onSubmit={handleVerifyOtp} className="flex gap-2">
                              <input type="text" placeholder="Enter 6-digit OTP (123456)" value={otpCode} onChange={e => setOtpCode(e.target.value)} required className="flex-1 border border-gray-200 rounded p-2 text-sm outline-none focus:border-amber-400 tracking-widest" />
                              <button type="submit" disabled={isOtpLoading} className="bg-amber-500 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest disabled:opacity-50 min-w-[100px] flex items-center justify-center">
                                {isOtpLoading ? <Loader2 size={14} className="animate-spin" /> : 'Verify'}
                              </button>
                            </form>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Saved addresses grid */}
                  {addressesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="animate-spin text-gray-400" size={24} />
                      <span className="ml-2 text-sm text-gray-400">Loading your addresses...</span>
                    </div>
                  ) : (
                    <>
                      {savedAddresses.length > 0 && !showAddressForm && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                          {savedAddresses.map(addr => (
                            <AddressCard
                              key={addr.id}
                              address={addr}
                              selected={selectedAddressId === addr.id}
                              onSelect={() => setSelectedAddressId(addr.id)}
                              onEdit={() => handleEditAddress(addr)}
                              onDelete={() => setAddressToDelete(addr.id)}
                              onSetDefault={() => handleSetDefault(addr.id)}
                            />
                          ))}
                        </div>
                      )}

                      {/* Add new address button */}
                      {savedAddresses.length > 0 && !showAddressForm && (
                        <button
                          onClick={() => {
                            setEditingAddressId(null);
                            setAddressForm(f => ({ ...EMPTY_FORM, email: f.email || user?.email || '', phone: user?.phone || '', recipientPhone: user?.phone || '', sameAsAccountPhone: true }));
                            setShowAddressForm(true);
                            setSelectedAddressId(null);
                          }}
                          className="flex items-center gap-2 text-sm font-bold text-[#0B192C] border-2 border-dashed border-gray-300 hover:border-[#0B192C] rounded-xl p-4 w-full mt-2 transition-all hover:bg-gray-50"
                        >
                          <Plus size={16} className="text-amber-500" />
                          Add New Address
                        </button>
                      )}

                      {/* Address Form */}
                      {showAddressForm && (
                        <form onSubmit={handleSaveAddress} className="space-y-4">
                          {editingAddressId && (
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-bold text-[#0B192C]">Edit Address</span>
                              <button type="button" onClick={() => {
                                setShowAddressForm(false);
                                setEditingAddressId(null);
                                if (savedAddresses.length > 0) setSelectedAddressId(savedAddresses[0].id);
                              }} className="text-xs font-bold text-gray-500 hover:text-gray-700 uppercase tracking-wider">
                                ← Back
                              </button>
                            </div>
                          )}
                          {!editingAddressId && savedAddresses.length > 0 && (
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-bold text-[#0B192C]">New Address</span>
                              <button type="button" onClick={() => {
                                setShowAddressForm(false);
                                if (savedAddresses.length > 0) setSelectedAddressId(savedAddresses[0].id);
                              }} className="text-xs font-bold text-gray-500 hover:text-gray-700 uppercase tracking-wider">
                                ← Back to Saved
                              </button>
                            </div>
                          )}

                          <AddressForm
                            form={addressForm}
                            onChange={(patch) => setAddressForm(f => ({ ...f, ...patch }))}
                            onGeolocate={handleGeolocate}
                            isGeolocating={isGeolocating}
                            isEditMode={!!editingAddressId}
                          />

                          <div className="flex gap-3 pt-2">
                            {editingAddressId ? (
                              <>
                                <Button type="submit" variant="primary" size="md" className="font-extrabold uppercase tracking-widest">
                                  Save Changes
                                </Button>
                                <Button type="button" variant="ghost" size="md" onClick={() => {
                                  setShowAddressForm(false);
                                  setEditingAddressId(null);
                                  if (savedAddresses.length > 0) setSelectedAddressId(savedAddresses[0].id);
                                }} className="text-gray-500">
                                  Cancel
                                </Button>
                              </>
                            ) : (
                                <Button
                                  type="button"
                                  variant="primary"
                                  size="lg"
                                  disabled={!!deliveryError || deliveryChecking}
                                  className="font-extrabold uppercase tracking-widest disabled:opacity-50"
                                  onClick={() => {
                                    if (deliveryError) {
                                      toast.error(deliveryError);
                                      return;
                                    }
                                    if (!addressForm.fullName || !addressForm.phone || !addressForm.flatHouseNo || !addressForm.city || !addressForm.state || !addressForm.pincode || !addressForm.email) {
                                      toast.error('Please fill in all required fields.');
                                      return;
                                    }
                                    setStep(2);
                                  }}
                                >
                                  {deliveryChecking ? 'Calculating Delivery...' : 'Deliver to this Address'}
                                </Button>
                            )}
                          </div>
                        </form>
                      )}

                      {/* Proceed button when address is selected */}
                      {!showAddressForm && selectedAddressId && (
                        <div className="pt-4 border-t border-gray-100 mt-4">
                          <Button
                            variant="primary"
                            size="lg"
                            disabled={!!deliveryError || deliveryChecking}
                            className="font-extrabold uppercase tracking-widest disabled:opacity-50"
                            onClick={() => {
                              if (deliveryError) {
                                toast.error(deliveryError);
                                return;
                              }
                              setStep(2);
                            }}
                          >
                            {deliveryChecking ? 'Calculating Delivery...' : 'Deliver to Selected Address'}
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                /* Collapsed address summary */
                <div className="flex items-start gap-3 text-sm font-semibold text-gray-600 pl-4 border-l-4 border-amber-400">
                  <CheckCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[#0B192C] font-bold">{selectedAddr?.fullName || addressForm.fullName}</p>
                    <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{addressSummary}</p>
                    <p className="text-gray-500 text-xs">{selectedAddr?.phone || addressForm.phone}</p>
                  </div>
                </div>
              )}
            </div>

            {/* ── Step 2: Payment ──────────────────────────────────────────── */}
            <div className={`bg-white p-6 rounded-xl border-2 transition-all ${
              step === 2
                ? 'border-amber-400 shadow-md ring-1 ring-amber-400'
                : 'border-gray-200 opacity-50 pointer-events-none'
            }`}>
              <h2 className="text-lg font-extrabold text-[#0B192C] mb-5 flex items-center">
                <CreditCard className="mr-3 text-gray-400" size={20} />
                Payment Method
              </h2>

              <div className="space-y-3">
                {/* Razorpay option */}
                <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  paymentMethod === 'Razorpay'
                    ? 'border-amber-400 bg-amber-50/50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-400'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="Razorpay"
                    checked={paymentMethod === 'Razorpay'}
                    onChange={() => setPaymentMethod('Razorpay')}
                    className="w-4 h-4 accent-amber-500"
                  />
                  <div className="flex-1">
                    <p className="font-bold text-[#0B192C] text-sm">Pay Online</p>
                    <p className="text-xs text-gray-500 mt-0.5">Credit Card, Debit Card, UPI, NetBanking via Razorpay</p>
                  </div>
                  <div className="bg-white px-2 py-1 rounded text-[10px] font-bold tracking-wider text-blue-700 border border-gray-200">
                    RAZORPAY
                  </div>
                </label>

                {/* COD option */}
                <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  paymentMethod === 'COD'
                    ? 'border-amber-400 bg-amber-50/50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-400'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="w-4 h-4 accent-amber-500"
                  />
                  <div className="flex-1">
                    <p className="font-bold text-[#0B192C] text-sm">Cash on Delivery</p>
                    <p className="text-xs text-gray-500 mt-0.5">Pay with cash when your order arrives</p>
                  </div>
                  <div className="bg-green-100 px-2 py-1 rounded text-[10px] font-bold tracking-wider text-green-700 border border-green-200">
                    COD
                  </div>
                </label>
              </div>

              {step === 2 && (
                <div className="pt-6">
                  <Button
                    onClick={handlePlaceOrder}
                    variant="primary"
                    size="lg"
                    disabled={isPlacingOrder}
                    className="w-full font-extrabold uppercase tracking-widest shadow-lg shadow-[#0B192C]/20 text-lg"
                  >
                    {isPlacingOrder ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 size={18} className="animate-spin" />
                        Processing...
                      </span>
                    ) : paymentMethod === 'COD' ? (
                      `Place Order — ${formatCurrency(finalPayableAmount)}`
                    ) : (
                      `Pay ${formatCurrency(finalPayableAmount)} Securely`
                    )}
                  </Button>
                  <p className="text-center text-xs text-gray-400 mt-3 flex items-center justify-center gap-1">
                    <Lock size={10} /> Secured by 256-bit SSL encryption
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="w-full lg:w-96">
            <div className="bg-white p-6 rounded-xl border border-gray-200 sticky top-8 shadow-sm">
              <h2 className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-4 border-b border-gray-100 pb-4">
                Order Summary
              </h2>

              <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2">
                {items.map(item => (
                  <div key={item.productId} className="flex gap-3">
                    <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded flex-shrink-0 flex items-center justify-center p-1">
                      {item.imageUrl ? (
                        <img src={`http://localhost:5030${item.imageUrl}`} className="w-full h-full object-contain mix-blend-multiply" alt={item.name} />
                      ) : (
                        <span className="text-[8px] text-gray-400 font-bold uppercase">No Img</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#0B192C] leading-tight line-clamp-2">{item.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs font-semibold text-gray-500">Qty: {item.quantity}</p>
                        <span className="text-gray-300">|</span>
                        <p className="text-xs font-extrabold text-[#0B192C]">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 mb-6 text-sm font-semibold pt-4 border-t border-gray-100">
                <div className="flex justify-between text-gray-600">
                  <span>Total MRP</span>
                  <span>{formatCurrency(totalMRP)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Product Discount</span>
                    <span>- {formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-gray-600">
                  <div className="flex items-center gap-2">
                    <span>Delivery</span>
                    {deliveryChecking && <Loader2 size={12} className="animate-spin text-gray-400" />}
                  </div>
                  {deliveryCharge > 0 ? (
                    <span className="font-bold text-[#0B192C]">{formatCurrency(deliveryCharge)}</span>
                  ) : deliveryError ? (
                    <span className="text-red-500 font-bold text-xs uppercase tracking-wider">{deliveryError}</span>
                  ) : (
                    <span className="text-green-600 font-bold uppercase text-[10px] tracking-wider mt-1">Free</span>
                  )}
                </div>
              </div>

              <PromoCodeInput />

              {promoDiscount > 0 && (
                  <div className="flex justify-between text-green-600 mb-3">
                    <span>Coupon Discount ({promoCode})</span>
                    <span>- {formatCurrency(promoDiscount)}</span>
                  </div>
                )}
                <div className="border-t border-dashed border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-extrabold text-[#0B192C] uppercase tracking-wider">Total to Pay</span>
                  <span className="text-2xl font-extrabold text-[#0B192C]">{formatCurrency(finalPayableAmount)}</span>
                </div>
              </div>

              {paymentMethod === 'COD' && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs text-green-700 font-bold flex items-center gap-1.5">
                    <CheckCircle size={12} /> Cash on Delivery selected
                  </p>
                  <p className="text-xs text-green-600 mt-0.5">Pay {formatCurrency(finalPayableAmount)} when your order arrives</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
