'use client';
import React, { useState, useEffect } from 'react';
import { Timer, Plus, Edit2, Trash2, Search, ExternalLink, Eye , EyeOff} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmProvider';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

export default function FlashSalesPage() {
  const { confirm } = useConfirm();
  const router = useRouter();
  const [sales, setSales] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { token } = useAuthStore();

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>({ count: 0, products: [] });

  const openPreview = async (id: number) => {
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewData({ count: 0, products: [] });
    
    try {
      const res = await fetch(`${API}/api/v1/flash-sales/${id}/products`, { headers: { 'Authorization': `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setPreviewData(json.data);
    } catch(e) {}
    
    setPreviewLoading(false);
  };

  
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

  
  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      const res = await fetch(`${API}/api/v1/flash-sales/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      if (res.ok) {
        toast.success('Status updated');
        fetchSales();
      } else {
        toast.error('Failed to update status');
      }
    } catch(err) {
      toast.error('Error updating status');
    }
  };

  const handleOpenModal = (sale: any = null) => {
    if (sale) {
        router.push('/admin/flash-sales/' + sale.id);
    } else {
        router.push('/admin/flash-sales/new');
    }
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

  const handleDelete = (id: number) => {
    confirm({
      title: 'Confirm Deletion',
      message: 'Delete this flash sale?',
      confirmText: 'Delete',
      onConfirm: async () => {
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
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
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
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-x-auto">
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
              {(() => {
                const filteredSales = sales.filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()));
                if(filteredSales.length === 0) return <tr><td colSpan={6} className="text-center py-8 text-gray-500">No flash sales found.</td></tr>;
                return filteredSales.map((sale) => {
                  const now = new Date();
                  const start = new Date(sale.startTime);
                  const end = new Date(sale.endTime);
                  
                  let statusObj = { text: 'Scheduled', color: 'bg-blue-100 text-blue-700' };
                  if (!sale.isActive) statusObj = { text: 'Disabled', color: 'bg-gray-100 text-gray-500' };
                  else if (now >= start && now <= end) statusObj = { text: 'Active Now', color: 'bg-green-100 text-green-700 animate-pulse' };
                  else if (now > end) statusObj = { text: 'Ended', color: 'bg-red-100 text-red-700' };

                  return (
                    <tr key={sale.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4 font-bold text-gray-900">{sale.title}</td>
                      <td className="px-6 py-4">
                        <button 
                            onClick={() => handleToggleStatus(sale.id, sale.isActive)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${sale.isActive ? 'bg-amber-500' : 'bg-gray-200'}`}
                        >
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${sale.isActive ? 'translate-x-4' : 'translate-x-1'}`} />
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md ${statusObj.color}`}>
                          {statusObj.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                        {start.toLocaleDateString()} to {end.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-2 transition-opacity">
                        <button onClick={() => openPreview(sale.id)} title="Preview Affected Products" className="p-2 text-gray-400 hover:text-blue-500 bg-white border border-gray-200 rounded shadow-sm"><Eye size={14}/></button>
                        <button onClick={() => handleOpenModal(sale)} className="p-2 text-gray-400 hover:text-[#0B192C] bg-white border border-gray-200 rounded shadow-sm"><Edit2 size={14}/></button>
                        <button onClick={() => handleDelete(sale.id)} className="p-2 text-gray-400 hover:text-red-500 bg-white border border-gray-200 rounded shadow-sm"><Trash2 size={14}/></button>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      )}

          
      {previewOpen && (
        <div className="fixed inset-0 bg-[#0B192C]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#0B192C] p-5 flex justify-between items-center text-white shrink-0 rounded-t-xl">
              <h2 className="font-bold text-lg flex items-center gap-2"><Eye size={20}/> Preview Affected Products</h2>
              <button type="button" onClick={() => setPreviewOpen(false)} className="text-gray-400 hover:text-white transition-colors"><EyeOff size={20}/></button>
            </div>
            
            <div className="p-4 bg-amber-50 border-b border-amber-100 flex justify-between items-center shrink-0">
              <span className="text-sm font-bold text-amber-900 uppercase tracking-widest">Total Matched Inventory:</span>
              <span className="text-xl font-black text-amber-700">{previewLoading ? '...' : previewData?.count || 0} Items</span>
            </div>
            
            <div className="p-0 overflow-y-auto flex-1 custom-scrollbar">
              {previewLoading ? (
                <div className="text-center py-12 text-gray-400 text-sm font-bold tracking-widest uppercase">Fetching inventory data...</div>
              ) : !previewData?.products || previewData.products.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm font-bold tracking-widest uppercase">No products match this targeting criteria.</div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 sticky top-0 shadow-sm">
                    <tr>
                      <th className="px-6 py-3 font-bold text-gray-900">Product</th>
                      <th className="px-6 py-3 font-bold text-gray-900">SKU</th>
                      <th className="px-6 py-3 font-bold text-gray-900 text-right">Base MRP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {previewData.products.map((p: any) => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-[#0B192C] truncate max-w-[250px]" title={p.name}>{p.name}</td>
                        <td className="px-6 py-4 text-xs text-gray-500 font-mono">{p.sku}</td>
                        <td className="px-6 py-4 text-right font-bold text-gray-900">₹{p.mrp?.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
</div>
  );
}
