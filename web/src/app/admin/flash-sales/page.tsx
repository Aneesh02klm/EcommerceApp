'use client';
import React, { useState, useEffect } from 'react';
import { Timer, Plus, Edit2, Trash2, X, Check, Search, ExternalLink } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

export default function FlashSalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { token } = useAuthStore();
  
  const [formData, setFormData] = useState({
    id: 0,
    title: '',
    startTime: '',
    endTime: '',
    isActive: true,
    discountValue: 0,
    targetType: 'Category',
    targetCategoryId: 0
  });

  useEffect(() => {
    fetchSales();
    fetchCategories();
  }, []);

  const fetchSales = async () => {
    try {
      const res = await fetch(`${API}/api/v1/flash-sales`, { headers: { 'Authorization': `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setSales(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API}/api/v1/categories`);
      const json = await res.json();
      if (json.success) setCategories(json.data);
    } catch (err) { }
  };

  const handleOpenModal = (sale: any = null) => {
    if (sale) {
      setFormData({
        id: sale.id,
        title: sale.title,
        startTime: sale.startTime ? sale.startTime.substring(0, 16) : '',
        endTime: sale.endTime ? sale.endTime.substring(0, 16) : '',
        isActive: sale.isActive,
        discountValue: sale.discountValue || 0,
        targetType: sale.targetType || 'Category',
        targetCategoryId: sale.targetCategoryId || 0
      });
    } else {
      const start = new Date();
      const end = new Date();
      end.setDate(end.getDate() + 2);
      
      setFormData({
        id: 0,
        title: '',
        startTime: start.toISOString().substring(0, 16),
        endTime: end.toISOString().substring(0, 16),
        isActive: true,
        discountValue: 10,
        targetType: 'Category',
        targetCategoryId: categories.length > 0 ? categories[0].id : 0
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = formData.id ? `${API}/api/v1/flash-sales/${formData.id}` : `${API}/api/v1/flash-sales`;
      const method = formData.id ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          ...formData,
          targetCategoryId: parseInt(formData.targetCategoryId as any) || null,
          discountValue: parseFloat(formData.discountValue as any) || 0
        })
      });
      
      if (res.ok) {
        toast.success(`Flash sale ${formData.id ? 'updated' : 'created'}!`);
        setIsModalOpen(false);
        fetchSales();
      } else {
        toast.error('Error saving flash sale');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this flash sale?')) return;
    try {
      const res = await fetch(`${API}/api/v1/flash-sales/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Sale deleted');
        fetchSales();
      }
    } catch (err) {}
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0B192C]">Flash Sales</h1>
          <p className="text-sm font-medium text-gray-500">Manage time-limited sales with countdown timers.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-[#0B192C] text-white px-6 py-3 font-bold text-xs rounded shadow-sm hover:bg-gray-800 transition-colors">
          <Plus size={16}/> Create Flash Sale
        </button>
      </header>

      {loading ? (
        <div className="animate-pulse bg-white p-12 rounded-lg h-64 border border-gray-100"></div>
      ) : sales.length === 0 ? (
        <div className="bg-white p-12 text-center border border-gray-200 rounded-lg text-gray-400 font-bold">
          <Timer size={48} className="mx-auto mb-4 opacity-50"/>
          No active flash sales scheduled.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Discount</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sales.map((sale) => {
                const now = new Date();
                const start = new Date(sale.startTime);
                const end = new Date(sale.endTime);
                
                let statusObj = { label: 'Inactive', color: 'bg-gray-100 text-gray-600' };
                if (sale.isActive) {
                    if (now < start) statusObj = { label: 'Scheduled', color: 'bg-blue-100 text-blue-700' };
                    else if (now > end) statusObj = { label: 'Expired', color: 'bg-red-100 text-red-700' };
                    else statusObj = { label: 'Active', color: 'bg-green-100 text-green-700' };
                }

                return (
                  <tr key={sale.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-gray-900">{sale.title}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md ${statusObj.color}`}>
                        {statusObj.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-amber-500">{sale.discountValue}% OFF</td>
                    <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                      {start.toLocaleDateString()} to {end.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal(sale)} className="p-2 text-gray-400 hover:text-[#0B192C] bg-white border border-gray-200 rounded shadow-sm"><Edit2 size={14}/></button>
                      <button onClick={() => handleDelete(sale.id)} className="p-2 text-gray-400 hover:text-red-500 bg-white border border-gray-200 rounded shadow-sm"><Trash2 size={14}/></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0B192C]/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-black text-[#0B192C]">{formData.id ? 'Edit Flash Sale' : 'New Flash Sale'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Sale Title</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all" placeholder="e.g. Weekend Mega Sale" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Start Time</label>
                  <input required type="datetime-local" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">End Time</label>
                  <input required type="datetime-local" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Discount (%)</label>
                  <div className="relative">
                    <input required type="number" min="0" max="100" step="0.01" value={formData.discountValue} onChange={e => setFormData({...formData, discountValue: parseFloat(e.target.value)})} className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none pl-10" />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Status</label>
                  <div className="flex items-center h-[46px]">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      <span className="ml-3 text-sm font-bold text-gray-700">{formData.isActive ? 'Active' : 'Disabled'}</span>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5">Target Category</label>
                <select 
                    value={formData.targetCategoryId} 
                    onChange={e => setFormData({...formData, targetCategoryId: Number(e.target.value)})} 
                    className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                >
                    <option value="0">All Products (Global)</option>
                    {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-[#0B192C] font-black py-3.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                  <Check size={18} /> {formData.id ? 'Save Changes' : 'Create Flash Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
