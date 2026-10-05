'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';
import { Loader2, Upload, Save, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

export default function LogisticsAdminPage() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  
  const [settings, setSettings] = useState({
    storeLat: 9.9312,
    storeLng: 76.2673,
    freeDeliveryRadiusKm: 25.0,
    chargePerKm: 10.0,
    baseFlatRate: 100.0,
  });

  const [states, setStates] = useState<any[]>([]);
  const [newState, setNewState] = useState({ stateName: '', flatCharge: '', isServiceable: true });
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resSettings, resStates] = await Promise.all([
        fetch(`${API}/api/v1/admin/logistics/settings`, { headers: authHeaders }),
        fetch(`${API}/api/v1/admin/logistics/states`, { headers: authHeaders })
      ]);
      const dataSettings = await resSettings.json();
      const dataStates = await resStates.json();
      
      if (dataSettings.success) setSettings(dataSettings.data);
      if (dataStates.success) setStates(dataStates.data);
    } catch (err) {
      toast.error('Failed to load logistics data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/api/v1/admin/logistics/settings`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(settings)
      });
      if (res.ok) toast.success('Settings updated');
    } catch {
      toast.error('Failed to update settings');
    }
  };

  const handleAddState = async () => {
    if (!newState.stateName || !newState.flatCharge) return;
    try {
      const res = await fetch(`${API}/api/v1/admin/logistics/states`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          stateName: newState.stateName,
          flatCharge: parseFloat(newState.flatCharge),
          isServiceable: newState.isServiceable
        })
      });
      if (res.ok) {
        toast.success('State added');
        setNewState({ stateName: '', flatCharge: '', isServiceable: true });
        fetchData();
      }
    } catch {
      toast.error('Failed to add state');
    }
  };

  const handleDeleteState = async (id: number) => {
    try {
      const res = await fetch(`${API}/api/v1/admin/logistics/states/${id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (res.ok) {
        toast.success('State deleted');
        fetchData();
      }
    } catch {
      toast.error('Failed to delete state');
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) return;
    try {
      const text = await csvFile.text();
      const rows = text.split('\n').filter(r => r.trim() !== '');
      const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
      
      const pincodes = rows.slice(1).map(row => {
        const cols = row.split(',').map(c => c.trim());
        return {
          pincode: cols[0],
          city: cols[1] || 'Unknown',
          stateName: cols[2] || 'Unknown',
          latitude: cols[3] ? parseFloat(cols[3]) : null,
          longitude: cols[4] ? parseFloat(cols[4]) : null,
          estimatedDeliveryDays: cols[5] || '3-5 Days',
          isServiceable: cols[6] ? cols[6].toLowerCase() === 'true' : true
        };
      }).filter(p => p.pincode);

      const res = await fetch(`${API}/api/v1/admin/logistics/pincodes/bulk`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(pincodes)
      });
      
      if (res.ok) {
        toast.success(`Uploaded ${pincodes.length} pincodes`);
        setCsvFile(null);
      } else {
        toast.error('Upload failed');
      }
    } catch (err) {
      toast.error('Error processing CSV');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[#0B192C]">Logistics & Delivery Settings</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Settings Panel */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-4">Distance & Base Settings</h2>
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Store Latitude</label>
                <input type="number" step="any" className="w-full border rounded p-2 text-sm"
                  value={settings.storeLat} onChange={e => setSettings({...settings, storeLat: parseFloat(e.target.value)})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Store Longitude</label>
                <input type="number" step="any" className="w-full border rounded p-2 text-sm"
                  value={settings.storeLng} onChange={e => setSettings({...settings, storeLng: parseFloat(e.target.value)})} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Free Delivery Radius (km)</label>
              <input type="number" step="0.1" className="w-full border rounded p-2 text-sm"
                value={settings.freeDeliveryRadiusKm} onChange={e => setSettings({...settings, freeDeliveryRadiusKm: parseFloat(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Charge Per Additional KM (₹)</label>
              <input type="number" step="0.1" className="w-full border rounded p-2 text-sm"
                value={settings.chargePerKm} onChange={e => setSettings({...settings, chargePerKm: parseFloat(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Base Flat Rate (fallback) (₹)</label>
              <input type="number" step="0.1" className="w-full border rounded p-2 text-sm"
                value={settings.baseFlatRate} onChange={e => setSettings({...settings, baseFlatRate: parseFloat(e.target.value)})} />
            </div>
            <Button type="submit" className="w-full"><Save size={16} className="mr-2" /> Save Settings</Button>
          </form>
        </div>

        {/* CSV Upload */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-fit">
          <h2 className="text-xl font-bold mb-4">Bulk Upload Pincodes</h2>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Upload a CSV file with columns: <br/>
              <code className="bg-gray-100 px-1 py-0.5 rounded text-xs text-[#0B192C]">Pincode,City,StateName,Latitude,Longitude,EstimatedDeliveryDays,IsServiceable</code>
            </p>
            <input type="file" accept=".csv" onChange={e => setCsvFile(e.target.files?.[0] || null)} className="w-full text-sm" />
            <Button onClick={handleCsvUpload} disabled={!csvFile} className="w-full">
              <Upload size={16} className="mr-2" /> Upload CSV
            </Button>
          </div>
        </div>
      </div>

      {/* State Delivery Rules */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold mb-4">Interstate Flat Charges</h2>
        <table className="w-full mb-6">
          <thead className="bg-gray-50 border-y text-left">
            <tr>
              <th className="py-3 px-4 text-sm font-bold">State</th>
              <th className="py-3 px-4 text-sm font-bold">Flat Charge (₹)</th>
              <th className="py-3 px-4 text-sm font-bold">Serviceable</th>
              <th className="py-3 px-4 text-sm font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {states.map(state => (
              <tr key={state.id}>
                <td className="py-3 px-4">{state.stateName}</td>
                <td className="py-3 px-4">₹{state.flatCharge.toFixed(2)}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 text-xs font-bold rounded ${state.isServiceable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {state.isServiceable ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <button onClick={() => handleDeleteState(state.id)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex gap-4 items-end bg-gray-50 p-4 rounded border">
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-500 mb-1">State Name</label>
            <input type="text" className="w-full border rounded p-2 text-sm" placeholder="e.g. Kerala"
              value={newState.stateName} onChange={e => setNewState({...newState, stateName: e.target.value})} />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-500 mb-1">Flat Charge (₹)</label>
            <input type="number" step="0.01" className="w-full border rounded p-2 text-sm" placeholder="100"
              value={newState.flatCharge} onChange={e => setNewState({...newState, flatCharge: e.target.value})} />
          </div>
          <div className="w-32 flex items-center mb-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-bold">
              <input type="checkbox" checked={newState.isServiceable}
                onChange={e => setNewState({...newState, isServiceable: e.target.checked})} className="accent-[#0B192C] w-4 h-4" />
              Serviceable
            </label>
          </div>
          <Button onClick={handleAddState}><Plus size={16} className="mr-2" /> Add Rule</Button>
        </div>
      </div>
    </div>
  );
}
