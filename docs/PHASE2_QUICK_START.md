# PHASE 2 QUICK START GUIDE

## Prerequisites

Pastikan Phase 1 sudah selesai dan berjalan dengan baik:
- ✅ Database migrations applied
- ✅ Repositories created (OLT, ODC, Vendor)
- ✅ API endpoints working
- ✅ Basic UI pages accessible

## Installation

### 1. Install Dependencies

```bash
npm install react-hook-form @hookform/resolvers/zod
npm install leaflet react-leaflet @types/leaflet
npm install @tanstack/react-table
npm install xlsx jspdf jspdf-autotable
npm install date-fns
npm install recharts
```

### 2. Install Dev Dependencies

```bash
npm install -D @testing-library/react @testing-library/user-event
```

---

## Implementation Checklist

### Week 1: Reusable Components

#### Day 1-2: Modal & Dialog Components

**Files to Create:**
- [ ] `src/components/ui/FormModal.tsx`
- [ ] `src/components/ui/ConfirmDialog.tsx`
- [ ] `src/contexts/ConfirmContext.tsx`
- [ ] `src/hooks/useConfirm.ts`

**FormModal Component:**
```typescript
// src/components/ui/FormModal.tsx
'use client';

import { ReactNode } from 'react';
import { X } from 'lucide-react';

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function FormModal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md'
}: FormModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-xl ${sizeClasses[size]} w-full`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
```

**ConfirmDialog Hook:**
```typescript
// src/hooks/useConfirm.ts
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
```

**Test:**
```bash
# Create a test page to verify modal works
# Visit /test-modal and click button to open modal
```

---

#### Day 3-4: DataTable Component

**Files to Create:**
- [ ] `src/components/ui/DataTable.tsx`
- [ ] `src/components/ui/Pagination.tsx`

**DataTable Component (Simplified):**
```typescript
// src/components/ui/DataTable.tsx
'use client';

import { ReactNode } from 'react';
import { Edit, Trash2 } from 'lucide-react';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (value: any, row: T) => ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  isLoading?: boolean;
  keyField?: keyof T;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  onEdit,
  onDelete,
  isLoading,
  keyField = 'id' as keyof T
}: DataTableProps<T>) {
  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No data available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {columns.map((column, idx) => (
              <th
                key={idx}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                {column.label}
              </th>
            ))}
            {(onEdit || onDelete) && (
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((row) => (
            <tr key={String(row[keyField])} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              {columns.map((column, idx) => (
                <td key={idx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {column.render
                    ? column.render(row[column.key as keyof T], row)
                    : String(row[column.key as keyof T] || '-')}
                </td>
              ))}
              {(onEdit || onDelete) && (
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(row)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(row)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

#### Day 5: Toast Notifications

**Files to Create:**
- [ ] `src/components/ui/Toast.tsx`
- [ ] `src/contexts/ToastContext.tsx`
- [ ] `src/hooks/useToast.ts`

**Toast Component:**
```typescript
// src/components/ui/Toast.tsx
'use client';

import { useEffect } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface ToastItemProps {
  toast: Toast;
  onClose: (id: string) => void;
}

export function ToastItem({ toast, onClose }: ToastItemProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />
  };

  const bgColors = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
  };

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-lg border ${bgColors[toast.type]} shadow-lg`}
    >
      {icons[toast.type]}
      <p className="flex-1 text-sm text-gray-900 dark:text-gray-100">
        {toast.message}
      </p>
      <button
        onClick={() => onClose(toast.id)}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onClose }: {
  toasts: Toast[];
  onClose: (id: string) => void;
}) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 w-96">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}
```

---

### Week 2: CRUD Forms

#### Day 1-2: OLT Form

**Files to Create:**
- [ ] `src/components/features/olt/OltForm.tsx`
- [ ] Update `src/app/(main)/olt/page.tsx`

**OLT Form Component:**
```typescript
// src/components/features/olt/OltForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { oltFormSchema, type OltFormData } from '@/lib/validation';

interface OltFormProps {
  initialData?: Partial<OltFormData>;
  onSubmit: (data: OltFormData) => Promise<void>;
  onCancel: () => void;
}

export function OltForm({ initialData, onSubmit, onCancel }: OltFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<OltFormData>({
    resolver: zodResolver(oltFormSchema),
    defaultValues: initialData || {
      status: 'active',
      total_ports: 48
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Hostname */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Hostname <span className="text-red-500">*</span>
        </label>
        <input
          {...register('hostname')}
          className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
          placeholder="OLT-PKU-01"
        />
        {errors.hostname && (
          <p className="text-red-500 text-sm mt-1">{errors.hostname.message}</p>
        )}
      </div>

      {/* IP Address */}
      <div>
        <label className="block text-sm font-medium mb-1">
          IP Address <span className="text-red-500">*</span>
        </label>
        <input
          {...register('ip_address')}
          className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
          placeholder="10.10.1.1"
        />
        {errors.ip_address && (
          <p className="text-red-500 text-sm mt-1">{errors.ip_address.message}</p>
        )}
      </div>

      {/* Total Ports */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Total Ports <span className="text-red-500">*</span>
        </label>
        <input
          {...register('total_ports', { valueAsNumber: true })}
          type="number"
          className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
          placeholder="48"
        />
        {errors.total_ports && (
          <p className="text-red-500 text-sm mt-1">{errors.total_ports.message}</p>
        )}
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium mb-1">Status</label>
        <select
          {...register('status')}
          className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}
```

**Update OLT Page:**
```typescript
// Add to src/app/(main)/olt/page.tsx
import { FormModal } from '@/components/ui/FormModal';
import { OltForm } from '@/components/features/olt/OltForm';

// Add state
const [isModalOpen, setIsModalOpen] = useState(false);
const [editingItem, setEditingItem] = useState(null);

// Add handlers
const handleAdd = () => {
  setEditingItem(null);
  setIsModalOpen(true);
};

const handleEdit = (item) => {
  setEditingItem(item);
  setIsModalOpen(true);
};

const handleFormSubmit = async (data) => {
  const url = editingItem ? `/api/olt/${editingItem.id}` : '/api/olt';
  const method = editingItem ? 'PUT' : 'POST';
  
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (response.ok) {
    setIsModalOpen(false);
    fetchData(); // Refresh data
  }
};

// Add to JSX
<FormModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title={editingItem ? 'Edit OLT' : 'Add OLT'}
>
  <OltForm
    initialData={editingItem}
    onSubmit={handleFormSubmit}
    onCancel={() => setIsModalOpen(false)}
  />
</FormModal>
```

---

### Week 3: GIS Map

#### Day 1-2: Map Setup

**Files to Create:**
- [ ] `src/components/features/map/NetworkMap.tsx`
- [ ] `src/app/(main)/map/page.tsx`
- [ ] `public/icons/olt-marker.png`
- [ ] `public/icons/odc-marker.png`

**Install Leaflet CSS:**
```typescript
// Add to src/app/layout.tsx
import 'leaflet/dist/leaflet.css';
```

**NetworkMap Component:**
```typescript
// src/components/features/map/NetworkMap.tsx
'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

interface NetworkMapProps {
  olts: any[];
  odcs: any[];
}

export function NetworkMap({ olts, odcs }: NetworkMapProps) {
  const center: [number, number] = [0.5071, 101.4478]; // Pekanbaru

  return (
    <MapContainer
      center={center}
      zoom={12}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {olts.map(olt => (
        olt.latitude && olt.longitude && (
          <Marker
            key={olt.id}
            position={[olt.latitude, olt.longitude]}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold">{olt.hostname}</h3>
                <p className="text-sm">IP: {olt.ip_address}</p>
                <p className="text-sm">Area: {olt.area}</p>
              </div>
            </Popup>
          </Marker>
        )
      ))}
    </MapContainer>
  );
}
```

**Map Page:**
```typescript
// src/app/(main)/map/page.tsx
'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues
const NetworkMap = dynamic(
  () => import('@/components/features/map/NetworkMap').then(mod => mod.NetworkMap),
  { ssr: false }
);

export default function MapPage() {
  const [olts, setOlts] = useState([]);
  const [odcs, setOdcs] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [oltsRes, odcsRes] = await Promise.all([
      fetch('/api/olt'),
      fetch('/api/odc')
    ]);
    
    const oltsData = await oltsRes.json();
    const odcsData = await odcsRes.json();
    
    setOlts(oltsData.data || []);
    setOdcs(odcsData.data || []);
  };

  return (
    <div className="h-[calc(100vh-4rem)]">
      <NetworkMap olts={olts} odcs={odcs} />
    </div>
  );
}
```

**Update Sidebar:**
```typescript
// Add to src/components/layout/Sidebar.tsx
import { Map } from 'lucide-react';

// Add menu item
{
  name: 'Network Map',
  href: '/map',
  icon: Map
}
```

---

### Week 4: Export & Polish

#### Day 3: Export Functionality

**Files to Create:**
- [ ] `src/utils/export.ts`
- [ ] `src/components/ui/ExportButton.tsx`
- [ ] `src/hooks/useExport.ts`

**Export Utilities:**
```typescript
// src/utils/export.ts
import * as XLSX from 'xlsx';

export function exportToExcel(data: any[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportToCSV(data: any[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
}
```

**ExportButton Component:**
```typescript
// src/components/ui/ExportButton.tsx
'use client';

import { Download } from 'lucide-react';
import { useState } from 'react';

interface ExportButtonProps {
  onExport: (format: 'excel' | 'csv') => void;
  isLoading?: boolean;
}

export function ExportButton({ onExport, isLoading }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
        disabled={isLoading}
      >
        <Download className="w-4 h-4" />
        Export
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border rounded-lg shadow-lg z-10">
          <button
            onClick={() => {
              onExport('excel');
              setIsOpen(false);
            }}
            className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Export to Excel
          </button>
          <button
            onClick={() => {
              onExport('csv');
              setIsOpen(false);
            }}
            className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Export to CSV
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## Testing

### Manual Testing Checklist

**OLT Module:**
- [ ] Can add new OLT device
- [ ] Can edit existing OLT device
- [ ] Can delete OLT device (with confirmation)
- [ ] Form validation works correctly
- [ ] Data persists after page refresh
- [ ] Export to Excel works
- [ ] Export to CSV works

**ODC Module:**
- [ ] Can add new ODC
- [ ] Can edit existing ODC
- [ ] Can delete ODC (with confirmation)
- [ ] Form validation works correctly
- [ ] Data persists after page refresh

**Vendor Module:**
- [ ] Can add new vendor
- [ ] Can edit existing vendor
- [ ] Can delete vendor (with confirmation)
- [ ] Form validation works correctly
- [ ] Performance metrics display correctly

**Map Module:**
- [ ] Map loads correctly
- [ ] OLT markers display
- [ ] ODC markers display
- [ ] Popups show correct information
- [ ] Map is responsive

---

## Troubleshooting

### Common Issues

**1. Leaflet CSS not loading**
```typescript
// Make sure to import in layout.tsx
import 'leaflet/dist/leaflet.css';
```

**2. Map not rendering**
```typescript
// Use dynamic import to avoid SSR
const NetworkMap = dynamic(
  () => import('@/components/features/map/NetworkMap'),
  { ssr: false }
);
```

**3. Form validation not working**
```typescript
// Make sure zodResolver is imported
import { zodResolver } from '@hookform/resolvers/zod';
```

**4. Toast not showing**
```typescript
// Make sure ToastProvider wraps your app
<ToastProvider>
  {children}
</ToastProvider>
```

---

## Next Steps

After completing Phase 2:
1. Test all features thoroughly
2. Fix any bugs found
3. Optimize performance
4. Update documentation
5. Plan Phase 3 (Google Sheets integration, Analytics, etc.)

---

**Document Version**: 1.0  
**Created**: 2026-05-07  
**Estimated Time**: 4 weeks  
**Difficulty**: Medium