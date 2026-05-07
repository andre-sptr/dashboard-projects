'use client';

import { useContext } from 'react';
import { ConfirmContext } from '@/contexts/ConfirmContext';

export function useConfirm() {
  const context = useContext(ConfirmContext);
  
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmProvider');
  }
  
  return context;
}

// Made with Bob
