'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';
import { Loader2, Plus, ShieldCheck, Mail, Lock, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

export default function StaffManagementPage() {
  const { token } = useAuthStore();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'Support' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (token) fetchStaff();
  }, [token]);

  const fetchStaff = async () => {
    try {
      const res = await fetch(`${API}/api/v1/admin/staff`, { headers: { 'Authorization': `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setStaff(json.data);
    } catch (err) {
      toast.error('Failed to load staff accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API}/api/v1/admin/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message);
        setIsModalOpen(false);
        setFormData({ firstName: '', lastName: '', email: '', password: '', role: 'Support' });
        fetchStaff();
      } else {
        toast.error(json.message || 'Failed to create staff account');
      }
    } catch (err) {
      toast.error('Network error while creating account');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-amber-500" size={32} /></div>;

  return (
    <div className="flex flex-col gap-6 max-w-7xl">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
        <div>
          <h1 className="text-2xl font-black text-[#0B192C]">Staff Management</h1>
          <p className="text-sm font-medium text-gray-500">Manage internal users (Admins, Support, Delivery).</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} variant="primary" className="flex items-center gap-2">
          <Plus size={16} /> Create Staff Account
        </Button>
      </header>

      <section className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-x-auto overflow-y-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Date Added</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {staff.map((user, i) => (
              <tr key={user.id || i} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-bold text-[#0B192C]">{user.firstname} {user.lastname}</td>
                <td className="px-6 py-4 text-gray-500">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-bold rounded-md ${
                    user.role === 'Admin' ? 'bg-red-100 text-red-600' :
                    user.role === 'Delivery' ? 'bg-blue-100 text-blue-600' :
                    'bg-amber-100 text-amber-600'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500">{new Date(user.createdat).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full w-full md:max-w-md overflow-x-auto overflow-y-hidden">
            <div className="bg-[#0B192C] p-4 text-white flex justify-between items-center">
              <h2 className="font-bold flex items-center gap-2"><ShieldCheck size={18} /> New Staff Account</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">&times;</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">First Name</label>
                  <div className="relative">
                    <UserIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full border border-gray-200 rounded pl-8 pr-3 py-2 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Last Name</label>
                  <input required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full border border-gray-200 rounded px-3 py-2 text-sm" />
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border border-gray-200 rounded pl-8 pr-3 py-2 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input required type="password" minLength={6} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full border border-gray-200 rounded pl-8 pr-3 py-2 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Role Designation</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full border border-gray-200 rounded px-3 py-2 text-sm font-semibold">
                  <option value="Support">Support (Customer Service)</option>
                  <option value="Delivery">Delivery (Logistics Agent)</option>
                  <option value="Admin">Admin (Full Access)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-sm font-bold text-gray-500 hover:text-gray-700">Cancel</button>
                <Button type="submit" variant="primary" disabled={isSubmitting} className="flex items-center gap-2">
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                  Provision Account
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
