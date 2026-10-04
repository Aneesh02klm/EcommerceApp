'use client';

import React, { useState, useEffect, use, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';
import { Loader2, Download, Printer, ArrowLeft, ArrowUp, ArrowDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

export default function DetailedReportPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const reportId = resolvedParams.id;
  const { token } = useAuthStore();
  const router = useRouter();
  
  const [rawData, setRawData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc'|'desc' } | null>(null);

  useEffect(() => {
    if (token) fetchReport();
  }, [token, reportId]);

  const fetchReport = async () => {
    try {
      const queryParam = reportId === 'low-stock-inventory' && startDate ? `?startDate=${startDate}` : '';
      const res = await fetch(`${API}/api/v1/admin/reports/${reportId}${queryParam}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setRawData(json.data);
      else toast.error(json.message);
    } catch (err) {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  // 1. Client-Side Date Filtering (if date column exists)
  const filteredData = useMemo(() => {
    let data = [...rawData];
    if (startDate || endDate) {
      // Find the date column
      const dateKey = data.length > 0 ? Object.keys(data[0]).find(k => k.toLowerCase().includes('date')) : null;
      if (dateKey) {
        data = data.filter(row => {
          const rowDate = new Date(row[dateKey]).getTime();
          const start = startDate ? new Date(startDate).getTime() : -Infinity;
          const end = endDate ? new Date(endDate).setHours(23,59,59,999) : Infinity;
          return rowDate >= start && rowDate <= end;
        });
      }
    }
    
    // 2. Sorting
    if (sortConfig) {
      data.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [rawData, startDate, endDate, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleExport = () => {
    if (!filteredData.length) return;
    const headers = Object.keys(filteredData[0]).join(',');
    const rows = filteredData.map(row => Object.values(row).map(val => `"${val}"`).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${reportId}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const reportNames: Record<string, string> = {
    'sales-by-date': 'Sales by Date',
    'inventory-valuation': 'Inventory Valuation',
    'coupon-usage': 'Coupon Usage Analytics',
    'product-performance': 'Product Performance',
    'low-stock-inventory': 'Low Stock Inventory',
    'warranty-metrics': 'Warranty & Complaints',
    'campaign-roi': 'Campaign & Notification ROI',
    'tax-discount-summary': 'Tax & Discount Summary'
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-amber-500" size={32} /></div>;

  // Render Charts dynamically based on report
  const renderChart = () => {
    if (!filteredData.length) return null;
    
    if (reportId === 'sales-by-date') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={filteredData.slice().reverse()}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="date" tick={{fontSize: 12}} stroke="#9CA3AF" tickFormatter={val => new Date(val).toLocaleDateString()} />
            <YAxis yAxisId="left" tick={{fontSize: 12}} stroke="#9CA3AF" tickFormatter={val => `₹${val/1000}k`} />
            <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12}} stroke="#9CA3AF" />
            <Tooltip labelFormatter={(val: any) => new Date(val).toLocaleDateString()} formatter={(val: any, name: any) => [String(name).includes('revenue') ? `₹${val}` : val, name]} />
            <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#D97706" strokeWidth={3} dot={{r:4}} activeDot={{r: 6}} />
            <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#3B82F6" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      );
    }
    
    // Default Bar Chart for remaining reports
    const xAxisKey = Object.keys(filteredData[0])[0];
    const dataKey = Object.keys(filteredData[0]).find(k => typeof filteredData[0][k] === 'number' && !k.toLowerCase().includes('id'));
    
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={filteredData.slice(0, 15)}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis dataKey={xAxisKey} tick={{fontSize: 10}} stroke="#9CA3AF" tickFormatter={val => (val||'').toString().substring(0, 15)} />
          <YAxis tick={{fontSize: 12}} stroke="#9CA3AF" />
          <Tooltip />
          <Bar dataKey={dataKey || ''} fill="#D97706" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0 border-b border-gray-200 pb-6">
        <div>
          <button onClick={() => router.back()} className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-[#0B192C] mb-3 transition-colors uppercase tracking-widest"><ArrowLeft size={14}/> Back to Reports</button>
          <h1 className="text-2xl font-black text-[#0B192C]">{reportNames[reportId] || 'Detailed Report'}</h1>
          <p className="text-sm font-medium text-gray-500">Interactive data view. Filter, sort, and export.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="flex items-center gap-2" onClick={() => window.print()}><Printer size={16}/> Print</Button>
          <Button variant="primary" className="flex items-center gap-2" onClick={handleExport}><Download size={16}/> CSV</Button>
        </div>
      </header>

      {/* Dynamic Filters */}
      {reportId === 'low-stock-inventory' ? (
        <div className="flex gap-4 items-center bg-red-50 p-4 rounded-lg border border-red-100">
          <div>
            <label className="block text-[10px] font-extrabold text-red-700 uppercase tracking-widest mb-1">Stock Threshold</label>
            <div className="flex items-center gap-2">
              <input type="number" min="0" value={startDate || '5'} onChange={e => setStartDate(e.target.value)} className="border border-red-200 text-red-900 rounded px-3 py-1.5 text-sm outline-none w-24 font-bold" />
              <Button onClick={() => fetchReport()} variant="primary" className="bg-red-600 hover:bg-red-700 h-[34px] px-4 text-xs font-bold">Apply Filter</Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex gap-4 items-center bg-gray-50 p-4 rounded-lg border border-gray-100">
          <div>
            <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1">Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border border-gray-200 rounded px-3 py-1.5 text-sm outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1">End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border border-gray-200 rounded px-3 py-1.5 text-sm outline-none" />
          </div>
          {(startDate || endDate) && (
            <button onClick={() => {setStartDate(''); setEndDate('');}} className="mt-5 text-xs font-bold text-red-500 hover:text-red-700">Clear</button>
          )}
        </div>
      )}

      {/* Real Chart Visualization */}
      {filteredData.length > 0 && (
        <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <h3 className="text-sm font-extrabold text-[#0B192C] mb-4">Analytics Visualization</h3>
          {renderChart()}
        </section>
      )}

      {/* Interactive Data Table */}
      <section className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-x-auto overflow-y-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 border-b border-gray-200">
              <tr>
                {filteredData.length > 0 ? Object.keys(filteredData[0]).map(k => (
                  <th key={k} onClick={() => requestSort(k)} className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors group select-none">
                    <div className="flex items-center gap-1">
                      {k}
                      <span className="text-gray-300 group-hover:text-amber-500">
                        {sortConfig?.key === k ? (sortConfig.direction === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>) : <ArrowUp size={12} className="opacity-0 group-hover:opacity-50"/>}
                      </span>
                    </div>
                  </th>
                )) : <th className="px-6 py-4">Data</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.length === 0 ? (
                <tr><td colSpan={10} className="px-6 py-8 text-center text-gray-400 font-medium">No data available for this range.</td></tr>
              ) : (
                filteredData.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    {Object.values(row).map((val: any, j) => {
                      const keyName = Object.keys(row)[j].toLowerCase();
                      const isMoney = typeof val === 'number' && (keyName.includes('revenue') || keyName.includes('price') || keyName.includes('value') || keyName.includes('discount'));
                      const isDate = keyName === 'date' || keyName.includes('time');
                      return (
                        <td key={j} className="px-6 py-3 font-semibold text-[#0B192C]">
                          {isMoney ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val)
                           : isDate ? new Date(val).toLocaleDateString()
                           : String(val)}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
