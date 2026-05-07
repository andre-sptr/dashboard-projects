'use client';

import { ReactNode } from 'react';
import { ToastProvider } from '@/contexts/ToastContext';
import { ConfirmProvider } from '@/contexts/ConfirmContext';
import { ToastContainer } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';

function ToastContainerWrapper() {
  const { toasts, hideToast } = useToast();
  return <ToastContainer toasts={toasts} onClose={hideToast} />;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ConfirmProvider>
        {children}
        <ToastContainerWrapper />
      </ConfirmProvider>
    </ToastProvider>
  );
}

// Made with Bob
