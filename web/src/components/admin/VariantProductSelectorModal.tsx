import React, { useState, useMemo } from 'react';
import { Search, X, CheckCircle2 } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';

export function VariantProductSelectorModal({
    isOpen,
    onClose,
    onSelect,
    allProducts,
    categoryId,
    brandId,
    groupName,
    optionName
}: any) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProducts = useMemo(() => {
        return allProducts.filter((p: any) => {
            // Enforce Category and Brand match per requirements
            if (p.categoryId !== Number(categoryId)) return false;
            if (p.brandId !== Number(brandId)) return false;

            // Search by keyword
            if (searchTerm) {
                const kw = searchTerm.toLowerCase();
                if (!p.name?.toLowerCase().includes(kw) && !p.sku?.toLowerCase().includes(kw)) {
                    return false;
                }
            }

            // Auto-Match specification option (e.g., Color = Red)
            if (groupName && optionName) {
                const specs = typeof p.specificationJson === 'string' ? JSON.parse(p.specificationJson) : (p.specificationJson || {});
                let hasMatch = false;
                for (const g in specs) {
                    if (specs[g][groupName] === optionName) {
                        hasMatch = true;
                        break;
                    }
                }
                // Enforce exact match if both group and option are set
                if (!hasMatch) return false;
            }

            return true;
        });
    }, [allProducts, categoryId, brandId, groupName, optionName, searchTerm]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="font-bold text-gray-900">Select Linked Product</h3>
                        {groupName && optionName && (
                            <p className="text-xs text-gray-500 font-medium mt-1">
                                Auto-filtered for <strong className="text-amber-600">{groupName}: {optionName}</strong>
                            </p>
                        )}
                    </div>
                    <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-4 border-b border-gray-100 relative">
                    <Search size={16} className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search by product name or SKU..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-transparent rounded-lg text-sm font-medium focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all outline-none"
                    />
                </div>

                <div className="flex-1 overflow-y-auto p-2 bg-gray-50/50">
                    {filteredProducts.length === 0 ? (
                        <div className="p-10 text-center flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <Search size={24} className="text-gray-300" />
                            </div>
                            <p className="text-sm font-bold text-gray-900">No matching products found.</p>
                            <p className="text-xs text-gray-500 mt-2 max-w-sm">
                                The system requires an existing product with Brand, Category, and Specification ({groupName}: {optionName}) to match.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            {filteredProducts.map((p: any) => (
                                <div 
                                    key={p.id}
                                    onClick={() => { onSelect(p); onClose(); }}
                                    className="flex items-center gap-4 p-3 bg-white rounded-lg hover:bg-amber-50 cursor-pointer border border-gray-100 hover:border-amber-200 transition-colors shadow-sm group"
                                >
                                    <div className="w-12 h-12 bg-white rounded border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                                        {p.imageUrl ? (
                                            <img src={p.imageUrl.startsWith('/uploads') ? `${API}${p.imageUrl}` : p.imageUrl} alt={p.name} className="w-full h-full object-contain" />
                                        ) : (
                                            <span className="text-[10px] text-gray-300 font-bold">NO IMG</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-gray-900 truncate group-hover:text-amber-800 transition-colors">{p.name}</h4>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-mono font-bold tracking-wider">{p.sku}</span>
                                            <span className="text-xs font-black text-green-600">₹{p.finalPrice?.toLocaleString() || p.mrp?.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <button type="button" className="opacity-0 group-hover:opacity-100 px-3 py-2 bg-amber-500 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1 transition-opacity">
                                        <CheckCircle2 size={14} /> Bind
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
