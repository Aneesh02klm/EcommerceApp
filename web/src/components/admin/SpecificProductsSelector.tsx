"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Trash2, Upload, Download, Tag, DollarSign, Filter, Image as ImageIcon, AlertCircle, RefreshCw } from 'lucide-react';
import Papa from 'papaparse';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

interface SelectedProduct {
    id: string;
    sku: string;
    name: string;
    mrp: number;
    imageUrl: string | null;
    discount: number;
    discountType: 'Percentage' | 'Fixed';
    error?: string;
    isVerifying?: boolean;
}

interface SpecificProductsSelectorProps {
    value: SelectedProduct[];
    onChange: (products: SelectedProduct[]) => void;
    templateFilename?: string;
}

export default function SpecificProductsSelector({ value, onChange, templateFilename = 'promo_skus_template.csv' }: SpecificProductsSelectorProps) {
    const [search, setSearch] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [categories, setCategories] = useState<any[]>([]);
    const [results, setResults] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetch(`${API}/api/v1/categories`)
            .then(res => res.json())
            .then(data => setCategories(data?.data || data || []))
            .catch(() => {});
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search.length > 2) {
                let url = `${API}/api/v1/products?q=${encodeURIComponent(search)}&pageSize=10`;
                if (categoryId) url += `&categoryId=${categoryId}`;
                fetch(url)
                    .then(res => res.json())
                    .then(json => setResults(json.data || []))
                    .catch(() => {});
            } else {
                setResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [search, categoryId]);

    const addProduct = (p: any) => {
        if (!value.find(x => x.id === p.id)) {
            onChange([...value, {
                id: p.id,
                sku: p.sku || 'N/A',
                name: p.name,
                mrp: p.mrp,
                imageUrl: (p.images && p.images.length > 0) ? p.images[0].url : p.imageUrl,
                discount: 10,
                discountType: 'Percentage'
            }]);
        }
        setSearch('');
        setResults([]);
    };

    const removeProduct = (id: string) => {
        onChange(value.filter(x => x.id !== id));
    };

    const downloadTemplate = () => {
        const rows = [
            "Product_SKU,Discount_Type,Discount_Value",
            "SKU-123,percentage,15",
            "SKU-456,fixed,500"
        ];
        const csvContent = rows.join("\r\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = templateFilename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    };

    const handleVerifySku = async (index: number, newSku: string) => {
        const next = [...value];
        const item = next[index];
        
        if (!newSku) {
            item.error = "Missing Product SKU";
            item.id = `invalid-${Date.now()}`;
            onChange(next);
            return;
        }

        item.isVerifying = true;
        onChange([...next]); // Trigger re-render for loading state
        
        try {
            const r = await fetch(`${API}/api/v1/products?q=${encodeURIComponent(newSku)}&pageSize=10`);
            const j = await r.json();
            
            let found = false;
            if (j.data && j.data.length > 0) {
                const p = j.data.find((x: any) => (x.sku || '').toLowerCase() === newSku.toLowerCase() || x.id === newSku);
                if (p) {
                    // Check if this product is already in the list (excluding the current row)
                    const isDuplicate = next.some((existingItem, i) => i !== index && existingItem.id === p.id);
                    
                    if (isDuplicate) {
                        item.error = `Duplicate Product: SKU '${newSku}' is already added`;
                        item.id = `invalid-${Date.now()}-${Math.random()}`;
                        item.name = p.name;
                        item.mrp = p.mrp;
                        item.imageUrl = (p.images && p.images.length > 0) ? p.images[0].url : p.imageUrl;
                        item.sku = p.sku || newSku;
                    } else {
                        item.id = p.id;
                        item.name = p.name;
                        item.mrp = p.mrp;
                        item.imageUrl = (p.images && p.images.length > 0) ? p.images[0].url : p.imageUrl;
                        item.sku = p.sku || newSku;
                        item.error = undefined; // clear SKU error
                        // Re-evaluate discount limits now that we have real MRP
                        item.error = revalidate(item); 
                    }
                    found = true;
                }
            }
            
            if (!found) {
                item.error = `SKU '${newSku}' not found`;
                item.id = `invalid-${Date.now()}`;
                item.name = 'Unknown / Invalid Product';
                item.mrp = 0;
                item.imageUrl = null;
            }
        } catch (err) {
            item.error = "Network error verifying SKU";
        }
        
        item.isVerifying = false;
        onChange([...next]);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            const cleanText = text.replace(/^\uFEFF/, '');
            
            Papa.parse(cleanText, {
                header: false,
                skipEmptyLines: true,
                complete: async (results) => {
                    const rows = results.data as string[][];
                    
                    if (rows.length < 2) {
                        setIsUploading(false);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                        return;
                    }

                    const headers = rows[0].map(h => (h || '').toLowerCase().replace(/[^a-z0-9]/g, ''));
                    let skuIdx = headers.findIndex(h => h.includes('sku') || h.includes('productid') || h === 'id');
                    let typeIdx = headers.findIndex(h => h.includes('type') || h === 'discounttype');
                    let valIdx = headers.findIndex(h => h.includes('value') || h.includes('amount') || h === 'discountvalue' || h === 'discount');

                    if (skuIdx === -1) skuIdx = 0;
                    if (typeIdx === -1) typeIdx = 1;
                    if (valIdx === -1) valIdx = 2;
                    
                    const promises = [];
                    for (let i = 1; i < rows.length; i++) {
                        const row = rows[i];
                        const sku = (row[skuIdx] || '').trim();
                        const typeStr = (row[typeIdx] || '').trim().toLowerCase() || 'percentage';
                        const discountStr = (row[valIdx] || '').trim() || '0';
                        
                        if (!sku && !row[typeIdx] && !row[valIdx]) continue;

                        promises.push((async () => {
                            let error = undefined;
                            let finalDiscount = parseFloat(discountStr);
                            if (isNaN(finalDiscount)) finalDiscount = 0;
                            
                            const isFixed = typeStr === 'fixed' || typeStr === 'flat';
                            
                            if (typeStr !== 'percentage' && !isFixed) {
                                error = `Invalid discount type: '${typeStr}'`;
                            } else if (finalDiscount < 0) {
                                error = "Discount cannot be negative";
                            } else if (!isFixed && finalDiscount > 100) {
                                error = "Percentage cannot exceed 100";
                            }

                            let pId = `invalid-${Date.now()}-${Math.random()}`;
                            let name = 'Unknown / Invalid Product';
                            let mrp = 0;
                            let imageUrl = null;
                            let finalSku = sku;
                            
                            if (sku) {
                                try {
                                    const r = await fetch(`${API}/api/v1/products?q=${encodeURIComponent(sku)}&pageSize=10`);
                                    const j = await r.json();
                                    if (j.data && j.data.length > 0) {
                                        const p = j.data.find((x: any) => (x.sku || '').toLowerCase() === sku.toLowerCase() || x.id === sku);
                                        
                                        if (p) {
                                            pId = p.id;
                                            name = p.name;
                                            mrp = p.mrp;
                                            imageUrl = (p.images && p.images.length > 0) ? p.images[0].url : p.imageUrl;
                                            finalSku = p.sku || sku;
                                        } else if (!error) {
                                            error = `SKU '${sku}' not found in database`;
                                        }
                                    } else if (!error) {
                                        error = `SKU '${sku}' not found in database`;
                                    }
                                } catch (err) {
                                    if (!error) error = "Network error verifying SKU";
                                }
                            } else if (!error) {
                                error = "Missing Product SKU";
                            }

                            return {
                                id: pId,
                                sku: finalSku,
                                name,
                                mrp,
                                imageUrl,
                                discount: finalDiscount,
                                discountType: isFixed ? 'Fixed' : 'Percentage',
                                error
                            } as SelectedProduct;
                        })());
                    }
                    
                    const processedResults = await Promise.all(promises);
                    const newProducts = [...value];
                    
                    for (const r of processedResults) {
                        if (!r.id.startsWith('invalid-') && newProducts.find(x => x.id === r.id)) {
                            continue; 
                        }
                        newProducts.push(r);
                    }
                    
                    onChange(newProducts);
                    setIsUploading(false);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                },
                error: (err: any) => {
                    console.error('CSV Parse Error:', err);
                    setIsUploading(false);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                }
            });
        };
        reader.readAsText(file);
    };

    const revalidate = (item: SelectedProduct) => {
        // If it's an invalid SKU, preserve the SKU error message from handleVerifySku/Upload
        if (item.id.startsWith('invalid-') && item.error?.includes('SKU')) return item.error; 
        
        if (item.discountType === 'Percentage' && item.discount > 100) return "Percentage cannot exceed 100";
        if (item.discount < 0) return "Discount cannot be negative";
        return undefined; // Valid!
    };

    const hasErrors = value.some(v => !!v.error);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-gray-700 uppercase tracking-widest">Selected Products ({value.length})</span>
                    {hasErrors && (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-100 px-2.5 py-1 rounded-full">
                            <AlertCircle size={14} /> Validation Errors Found
                        </span>
                    )}
                </div>
                <div className="flex gap-2">
                    <button type="button" onClick={downloadTemplate} className="text-xs flex items-center gap-1 font-bold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-md shadow-sm transition-colors">
                        <Download size={14} /> Template
                    </button>
                    <button type="button" disabled={isUploading} onClick={() => fileInputRef.current?.click()} className={`text-xs flex items-center gap-1 font-bold px-3 py-1.5 rounded-md shadow-sm transition-colors ${isUploading ? 'bg-gray-200 text-gray-500' : 'text-[#0B192C] hover:text-white bg-amber-400 hover:bg-amber-500'}`}>
                        <Upload size={14} /> {isUploading ? 'Validating...' : 'Bulk Upload CSV'}
                    </button>
                    <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                </div>
            </div>
            
            <div className="relative flex gap-2">
                <div className="relative w-1/3">
                    <Filter size={16} className="absolute left-3 top-3 text-gray-400" />
                    <select 
                        value={categoryId} 
                        onChange={e => setCategoryId(e.target.value)} 
                        className="w-full border border-gray-300 rounded-lg p-2.5 pl-10 text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-white font-semibold text-gray-700"
                    >
                        <option value="">All Categories</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="relative w-2/3">
                    <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by Product Name or SKU..." className="w-full border border-gray-300 rounded-lg p-2.5 pl-10 text-sm focus:ring-2 focus:ring-amber-500 outline-none font-semibold" />
                    
                    {results.length > 0 && (
                        <div className="absolute z-20 w-full bg-white border border-gray-200 mt-2 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                            {results.map(r => (
                                <div key={r.id} onClick={() => addProduct(r)} className="p-3 hover:bg-amber-50 cursor-pointer flex gap-3 items-center border-b border-gray-100 transition-colors">
                                    {((r.images && r.images.length > 0) || r.imageUrl) ? (
                                        <img src={(r.images && r.images.length > 0) ? r.images[0].url : r.imageUrl} alt={r.name} className="w-10 h-10 object-cover rounded shadow-sm bg-white" />
                                    ) : (
                                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-400"><ImageIcon size={20}/></div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold text-gray-900 truncate">{r.name}</div>
                                        <div className="text-xs text-gray-500 font-mono mt-0.5">SKU: {r.sku || 'N/A'}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-black text-[#0B192C]">₹{r.mrp.toLocaleString('en-IN')}</div>
                                    </div>
                                    <button className="ml-2 bg-gray-100 p-1.5 rounded-full text-gray-500 hover:text-amber-500 hover:bg-amber-100 transition-colors">
                                        <Plus size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {value.length > 0 && (
                <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-[10px] uppercase tracking-wider text-gray-500 font-extrabold">
                            <tr>
                                <th className="px-4 py-3">Product</th>
                                <th className="px-4 py-3 text-right">Base MRP</th>
                                <th className="px-4 py-3">Discount Type</th>
                                <th className="px-4 py-3 text-right">Discount Value</th>
                                <th className="px-4 py-3 text-right text-amber-600">Final Price</th>
                                <th className="px-4 py-3 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {value.map((v, idx) => {
                                const isInvalid = !!v.error;
                                const calculatedPrice = v.discountType === 'Fixed' 
                                    ? Math.max(0, v.mrp - v.discount)
                                    : Math.max(0, v.mrp - (v.mrp * (v.discount / 100)));

                                return (
                                    <tr key={`${v.id}-${idx}`} className={isInvalid ? "bg-red-50/60 transition-colors" : "hover:bg-gray-50/50 transition-colors"}>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {v.imageUrl ? (
                                                    <img src={v.imageUrl} className="w-8 h-8 rounded object-cover shadow-sm bg-white" />
                                                ) : (
                                                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                                                        {v.isVerifying ? <RefreshCw size={14} className="animate-spin" /> : <ImageIcon size={14}/>}
                                                    </div>
                                                )}
                                                <div className="max-w-[200px]">
                                                    <div className={`font-bold truncate ${isInvalid ? 'text-red-900' : 'text-gray-900'}`} title={v.name}>{v.name}</div>
                                                    
                                                    <div className="flex items-center gap-1.5 mt-1 relative max-w-max group">
                                                        <span className="text-[10px] text-gray-400 font-mono font-bold uppercase">SKU</span>
                                                        <input 
                                                            type="text"
                                                            value={v.sku}
                                                            onChange={e => {
                                                                const next = [...value];
                                                                next[idx].sku = e.target.value;
                                                                onChange(next);
                                                            }}
                                                            onBlur={() => handleVerifySku(idx, v.sku)}
                                                            onKeyDown={e => e.key === 'Enter' && handleVerifySku(idx, v.sku)}
                                                            className={`text-[10px] font-mono tracking-wide px-1.5 py-0.5 border ${isInvalid && v.error?.includes('SKU') ? 'border-red-400 bg-red-100 text-red-900' : 'border-dashed border-gray-300 hover:border-solid hover:border-gray-400 bg-gray-50/50'} rounded outline-none focus:border-amber-500 focus:bg-white transition-all w-28 shadow-inner`}
                                                            title="Edit and press Enter to re-verify"
                                                        />
                                                    </div>

                                                    {isInvalid && (
                                                        <div className="text-[10px] text-red-600 font-extrabold mt-1.5 flex items-center gap-1 bg-white inline-block px-1.5 py-0.5 rounded border border-red-100 shadow-sm">
                                                            <AlertCircle size={10} /> {v.error}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-black text-gray-700">₹{v.mrp.toLocaleString('en-IN')}</td>
                                        <td className="px-4 py-3">
                                            <select 
                                                value={v.discountType} 
                                                onChange={e => {
                                                    const next = [...value];
                                                    next[idx].discountType = e.target.value as 'Percentage' | 'Fixed';
                                                    next[idx].error = revalidate(next[idx]);
                                                    onChange(next);
                                                }}
                                                className={`w-full border ${isInvalid && v.error?.includes('type') ? 'border-red-400 bg-red-50 text-red-900' : 'border-gray-200'} rounded p-1.5 text-xs font-bold text-gray-700 focus:ring-2 focus:ring-amber-500 outline-none transition-colors cursor-pointer`}
                                            >
                                                <option value="Percentage">% Percentage</option>
                                                <option value="Fixed">₹ Fixed Amount</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end">
                                                <div className="relative w-20">
                                                    {v.discountType === 'Fixed' ? (
                                                        <DollarSign size={12} className={`absolute left-2 top-1/2 -translate-y-1/2 ${isInvalid && !v.error?.includes('SKU') ? 'text-red-400' : 'text-gray-400'}`} />
                                                    ) : (
                                                        <Tag size={12} className={`absolute left-2 top-1/2 -translate-y-1/2 ${isInvalid && !v.error?.includes('SKU') ? 'text-red-400' : 'text-gray-400'}`} />
                                                    )}
                                                    <input 
                                                        type="number" 
                                                        min="0"
                                                        value={v.discount} 
                                                        onChange={e => {
                                                            const next = [...value];
                                                            next[idx].discount = parseFloat(e.target.value) || 0;
                                                            next[idx].error = revalidate(next[idx]);
                                                            onChange(next);
                                                        }} 
                                                        className={`w-full border ${isInvalid && !v.error?.includes('SKU') && !v.error?.includes('type') ? 'border-red-400 bg-red-100 text-red-900' : 'border-gray-200 bg-white'} rounded p-1.5 pl-6 text-right text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none transition-colors`} 
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-black text-emerald-600 bg-emerald-50/30">
                                            {isInvalid ? '-' : `₹${Math.round(calculatedPrice).toLocaleString('en-IN')}`}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button type="button" onClick={() => removeProduct(v.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
