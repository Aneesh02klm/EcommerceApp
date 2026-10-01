'use client';
import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false
}: ConfirmModalProps) {
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog" 
        aria-modal="true"
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h2 className="text-lg font-extrabold text-[#0B192C]">{title}</h2>
          <button 
            onClick={onCancel}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-gray-600 font-medium text-sm leading-relaxed">{message}</p>
        </div>
        
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-50 bg-gray-50/50">
          <Button 
            variant="outline" 
            onClick={onCancel}
            disabled={isLoading}
            className="px-5 font-bold text-gray-600 border-gray-300 hover:bg-gray-100 uppercase tracking-widest text-xs"
          >
            {cancelText}
          </Button>
          <Button 
            variant="primary"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-5 bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700 font-bold uppercase tracking-widest text-xs shadow-lg shadow-red-600/20"
          >
            {isLoading ? 'Processing...' : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
