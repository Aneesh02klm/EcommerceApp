'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { ConfirmModal } from './ConfirmModal';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => void;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setIsOpen(true);
  }, []);

  const handleConfirm = async () => {
    if (options?.onConfirm) {
      setIsLoading(true);
      try {
        await options.onConfirm();
      } finally {
        setIsLoading(false);
      }
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmModal 
        isOpen={isOpen} 
        title={options?.title || 'Confirm Action'} 
        message={options?.message || 'Are you sure you want to proceed?'} 
        confirmText={options?.confirmText || 'Confirm'} 
        cancelText={options?.cancelText || 'Cancel'} 
        onConfirm={handleConfirm} 
        onCancel={handleCancel} 
        isLoading={isLoading}
      />
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm must be used within ConfirmProvider');
  return context;
};
