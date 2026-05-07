# PHASE 2 ARCHITECTURE: Technical Specifications

## Table of Contents
1. [Component Architecture](#1-component-architecture)
2. [State Management](#2-state-management)
3. [Form Handling](#3-form-handling)
4. [Map Integration](#4-map-integration)
5. [Data Export](#5-data-export)
6. [API Enhancements](#6-api-enhancements)
7. [Code Examples](#7-code-examples)

---

## 1. Component Architecture

### 1.1 Component Hierarchy

```
App
├── Layout (Main)
│   ├── Sidebar
│   ├── Topbar
│   └── Content
│       ├── OLT Page
│       │   ├── OltFilters
│       │   ├── OltTable (DataTable)
│       │   ├── OltForm (FormModal)
│       │   └── ConfirmDialog
│       ├── ODC Page
│       │   ├── OdcFilters
│       │   ├── OdcTable (DataTable)
│       │   ├── OdcForm (FormModal)
│       │   └── ConfirmDialog
│       ├── Vendor Page
│       │   ├── VendorFilters
│       │   ├── VendorTable (DataTable)
│       │   ├── VendorForm (FormModal)
│       │   └── ConfirmDialog
│       ├── Map Page
│       │   ├── NetworkMap
│       │   │   ├── MapMarker (OLT)
│       │   │   ├── MapMarker (ODC)
│       │   │   ├── MapPolygon
│       │   │   └── MapPopup
│       │   ├── MapFilters
│       │   ├── MapLegend
│       │   └── MapStats
│       └── Detail Pages
│           ├── OLT Detail
│           ├── ODC Detail
│           └── Vendor Detail
└── Global Components
    ├── Toast (Portal)
    └── ConfirmDialog (Portal)
```

---

## 2. State Management

### 2.1 Context Structure

```typescript
// src/contexts/ToastContext.tsx
interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  hideToast: (id: string) => void;
}

// src/contexts/ConfirmContext.tsx
interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

// src/contexts/FilterContext.tsx
interface FilterContextType {
  filters: Record<string, any>;
  setFilters: (filters: Record<string, any>) => void;
  clearFilters: () => void;
  savePreset: (name: string) => void;
  loadPreset: (name: string) => void;
}
```

### 2.2 Local State Pattern

```typescript
// Page-level state
const [data, setData] = useState<OltInventory[]>([]);
const [isLoading, setIsLoading] = useState(false);
const [selectedRows, setSelectedRows] = useState<string[]>([]);
const [pagination, setPagination] = useState({
  page: 1,
  pageSize: 20,
  total: 0
});

// Modal state
const [isModalOpen, setIsModalOpen] = useState(false);
const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
const [editingItem, setEditingItem] = useState<OltInventory | null>(null);
```

---

## 3. Form Handling

### 3.1 Form Schema (Zod)

```typescript
// src/lib/validation.ts - OLT Form Schema
export const oltFormSchema = z.object({
  hostname: z.string()
    .min(1, 'Hostname is required')
    .max(100, 'Hostname too long')
    .regex(/^[a-zA-Z0-9-_.]+$/, 'Invalid hostname format'),
  
  ip_address: z.string()
    .min(1, 'IP address is required')
    .regex(
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
      'Invalid IP address format'
    ),
  
  brand: z.string().optional(),
  model: z.string().optional(),
  software_version: z.string().optional(),
  serial_number: z.string().optional(),
  
  location_name: z.string().optional(),
  latitude: z.number()
    .min(-90, 'Latitude must be >= -90')
    .max(90, 'Latitude must be <= 90')
    .optional(),
  longitude: z.number()
    .min(-180, 'Longitude must be >= -180')
    .max(180, 'Longitude must be <= 180')
    .optional(),
  
  area: z.string().optional(),
  branch: z.string().optional(),
  sto: z.string().optional(),
  
  total_ports: z.number()
    .int('Must be an integer')
    .positive('Must be positive')
    .min(1, 'At least 1 port required'),
  
  status: z.enum(['active', 'inactive', 'maintenance']).default('active'),
  
  installation_date: z.string().optional(),
  notes: z.string().optional()
});

export type OltFormData = z.infer<typeof oltFormSchema>;
```

### 3.2 React Hook Form Integration

```typescript
// src/components/features/olt/OltForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

interface OltFormProps {
  initialData?: OltInventory;
  onSubmit: (data: OltFormData) => Promise<void>;
  onCancel: () => void;
}

export function OltForm({ initialData, onSubmit, onCancel }: OltFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch
  } = useForm<OltFormData>({
    resolver: zodResolver(oltFormSchema),
    defaultValues: initialData || {
      status: 'active',
      total_ports: 48
    }
  });

  const onSubmitHandler = async (data: OltFormData) => {
    try {
      await onSubmit(data);
      reset();
    } catch (error) {
      // Error handled by parent
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-4">
      {/* Form fields */}
    </form>
  );
}
```

---

## 4. Map Integration

### 4.1 Leaflet Setup

```typescript
// src/components/features/map/NetworkMap.tsx
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom icons
const oltIcon = new L.Icon({
  iconUrl: '/icons/olt-marker.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const odcIcon = new L.Icon({
  iconUrl: '/icons/odc-marker.png',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28]
});

interface NetworkMapProps {
  olts: OltInventory[];
  odcs: OdcInventory[];
  center?: [number, number];
  zoom?: number;
  onMarkerClick?: (type: 'olt' | 'odc', id: string) => void;
}

export function NetworkMap({
  olts,
  odcs,
  center = [0.5071, 101.4478], // Pekanbaru
  zoom = 12,
  onMarkerClick
}: NetworkMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* OLT Markers */}
      {olts.map(olt => (
        olt.latitude && olt.longitude && (
          <Marker
            key={olt.id}
            position={[olt.latitude, olt.longitude]}
            icon={oltIcon}
            eventHandlers={{
              click: () => onMarkerClick?.('olt', olt.id)
            }}
          >
            <Popup>
              <OltPopupContent olt={olt} />
            </Popup>
          </Marker>
        )
      ))}
      
      {/* ODC Markers */}
      {odcs.map(odc => (
        odc.latitude && odc.longitude && (
          <Marker
            key={odc.id}
            position={[odc.latitude, odc.longitude]}
            icon={odcIcon}
            eventHandlers={{
              click: () => onMarkerClick?.('odc', odc.id)
            }}
          >
            <Popup>
              <OdcPopupContent odc={odc} />
            </Popup>
          </Marker>
        )
      ))}
      
      {/* ODC Coverage Polygons */}
      {odcs.map(odc => {
        const coords = parsePolygonCoordinates(odc.polygon_coordinates);
        return coords.length > 0 && (
          <Polygon
            key={`polygon-${odc.id}`}
            positions={coords}
            pathOptions={{
              color: odc.polygon_status === 'active' ? '#3b82f6' : '#94a3b8',
              fillColor: odc.polygon_status === 'active' ? '#3b82f6' : '#94a3b8',
              fillOpacity: 0.2
            }}
          />
        );
      })}
    </MapContainer>
  );
}
```

### 4.2 Map Utilities

```typescript
// src/utils/map.ts

export function parsePolygonCoordinates(coords: string): [number, number][] {
  try {
    const parsed = JSON.parse(coords);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map(([lat, lng]) => [lat, lng]);
    }
    return [];
  } catch {
    return [];
  }
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Haversine formula
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function findNearestDevice<T extends { latitude?: number; longitude?: number }>(
  targetLat: number,
  targetLon: number,
  devices: T[]
): T | null {
  let nearest: T | null = null;
  let minDistance = Infinity;

  for (const device of devices) {
    if (device.latitude && device.longitude) {
      const distance = calculateDistance(
        targetLat,
        targetLon,
        device.latitude,
        device.longitude
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearest = device;
      }
    }
  }

  return nearest;
}
```

---

## 5. Data Export

### 5.1 Excel Export

```typescript
// src/utils/export.ts
import * as XLSX from 'xlsx';

export interface ExportColumn<T> {
  key: keyof T;
  label: string;
  format?: (value: any) => string;
}

export function exportToExcel<T>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string
): void {
  // Transform data
  const exportData = data.map(row => {
    const exportRow: Record<string, any> = {};
    columns.forEach(col => {
      const value = row[col.key];
      exportRow[col.label] = col.format ? col.format(value) : value;
    });
    return exportRow;
  });

  // Create workbook
  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');

  // Auto-size columns
  const maxWidth = 50;
  const colWidths = columns.map(col => ({
    wch: Math.min(col.label.length + 5, maxWidth)
  }));
  ws['!cols'] = colWidths;

  // Download
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportToCSV<T>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string
): void {
  // Transform data
  const exportData = data.map(row => {
    const exportRow: Record<string, any> = {};
    columns.forEach(col => {
      const value = row[col.key];
      exportRow[col.label] = col.format ? col.format(value) : value;
    });
    return exportRow;
  });

  // Create CSV
  const ws = XLSX.utils.json_to_sheet(exportData);
  const csv = XLSX.utils.sheet_to_csv(ws);

  // Download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
}
```

### 5.2 PDF Export

```typescript
// src/utils/export.ts (continued)
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportToPDF<T>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string,
  title?: string
): void {
  const doc = new jsPDF();

  // Add title
  if (title) {
    doc.setFontSize(16);
    doc.text(title, 14, 20);
  }

  // Transform data
  const tableData = data.map(row =>
    columns.map(col => {
      const value = row[col.key];
      return col.format ? col.format(value) : String(value || '');
    })
  );

  // Generate table
  autoTable(doc, {
    head: [columns.map(col => col.label)],
    body: tableData,
    startY: title ? 30 : 20,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] }
  });

  // Download
  doc.save(`${filename}.pdf`);
}
```

### 5.3 Export Hook

```typescript
// src/hooks/useExport.ts
import { useState } from 'react';
import { exportToExcel, exportToCSV, exportToPDF, ExportColumn } from '@/utils/export';

export function useExport<T>() {
  const [isExporting, setIsExporting] = useState(false);

  const exportData = async (
    format: 'excel' | 'csv' | 'pdf',
    data: T[],
    columns: ExportColumn<T>[],
    filename: string,
    title?: string
  ) => {
    setIsExporting(true);
    try {
      switch (format) {
        case 'excel':
          exportToExcel(data, columns, filename);
          break;
        case 'csv':
          exportToCSV(data, columns, filename);
          break;
        case 'pdf':
          exportToPDF(data, columns, filename, title);
          break;
      }
    } finally {
      setIsExporting(false);
    }
  };

  return { exportData, isExporting };
}
```

---

## 6. API Enhancements

### 6.1 Pagination Support

```typescript
// src/app/api/olt/route.ts (enhanced)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Pagination params
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const offset = (page - 1) * pageSize;
    
    // Filter params
    const filters: OltFilters = {
      area: searchParams.get('area') || undefined,
      branch: searchParams.get('branch') || undefined,
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined
    };
    
    // Get data with pagination
    const allData = OltRepository.findAll(filters);
    const total = allData.length;
    const data = allData.slice(offset, offset + pageSize);
    
    return successResponse({
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    return errorResponse('Failed to fetch OLT devices', 500);
  }
}
```

### 6.2 Bulk Operations

```typescript
// src/app/api/olt/bulk/route.ts
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, ids } = body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return errorResponse('No IDs provided', 400);
    }
    
    let result;
    switch (action) {
      case 'delete':
        result = OltRepository.bulkDelete(ids);
        break;
      case 'activate':
        result = OltRepository.bulkUpdateStatus(ids, 'active');
        break;
      case 'deactivate':
        result = OltRepository.bulkUpdateStatus(ids, 'inactive');
        break;
      default:
        return errorResponse('Invalid action', 400);
    }
    
    return successResponse(result, `Bulk ${action} completed`);
  } catch (error) {
    return errorResponse('Bulk operation failed', 500);
  }
}
```

---

## 7. Code Examples

### 7.1 Complete CRUD Page Example

```typescript
// src/app/(main)/olt/page.tsx (enhanced)
'use client';

import { useState, useEffect } from 'react';
import { OltInventory } from '@/repositories/OltRepository';
import { DataTable } from '@/components/ui/DataTable';
import { FormModal } from '@/components/ui/FormModal';
import { OltForm } from '@/components/features/olt/OltForm';
import { OltFilters } from '@/components/features/olt/OltFilters';
import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/hooks/useConfirm';
import { useExport } from '@/hooks/useExport';

export default function OltPage() {
  const [data, setData] = useState<OltInventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingItem, setEditingItem] = useState<OltInventory | null>(null);
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0
  });

  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const { exportData, isExporting } = useExport<OltInventory>();

  // Fetch data
  useEffect(() => {
    fetchData();
  }, [filters, pagination.page, pagination.pageSize]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        pageSize: String(pagination.pageSize),
        ...filters
      });
      
      const response = await fetch(`/api/olt?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data.data);
        setPagination(prev => ({
          ...prev,
          total: result.data.pagination.total
        }));
      }
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Failed to fetch data'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add handler
  const handleAdd = () => {
    setModalMode('add');
    setEditingItem(null);
    setIsModalOpen(true);
  };

  // Edit handler
  const handleEdit = (item: OltInventory) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // Delete handler
  const handleDelete = async (item: OltInventory) => {
    const confirmed = await confirm({
      title: 'Delete OLT Device',
      message: `Are you sure you want to delete ${item.hostname}?`,
      confirmLabel: 'Delete',
      variant: 'danger'
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/olt/${item.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showToast({
          type: 'success',
          message: 'OLT device deleted successfully'
        });
        fetchData();
      }
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Failed to delete OLT device'
      });
    }
  };

  // Form submit handler
  const handleSubmit = async (formData: any) => {
    try {
      const url = modalMode === 'add' ? '/api/olt' : `/api/olt/${editingItem?.id}`;
      const method = modalMode === 'add' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showToast({
          type: 'success',
          message: `OLT device ${modalMode === 'add' ? 'created' : 'updated'} successfully`
        });
        setIsModalOpen(false);
        fetchData();
      }
    } catch (error) {
      showToast({
        type: 'error',
        message: `Failed to ${modalMode} OLT device`
      });
    }
  };

  // Export handler
  const handleExport = (format: 'excel' | 'csv' | 'pdf') => {
    const columns = [
      { key: 'hostname', label: 'Hostname' },
      { key: 'ip_address', label: 'IP Address' },
      { key: 'area', label: 'Area' },
      { key: 'status', label: 'Status' },
      { key: 'total_ports', label: 'Total Ports' },
      { key: 'used_ports', label: 'Used Ports' }
    ];

    exportData(format, data, columns, 'olt-inventory', 'OLT Inventory Report');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">OLT Inventory</h1>
        <div className="flex gap-2">
          <ExportButton onExport={handleExport} isLoading={isExporting} />
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add OLT
          </button>
        </div>
      </div>

      <OltFilters filters={filters} onChange={setFilters} />

      <DataTable
        data={data}
        columns={oltColumns}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
        onPageSizeChange={(pageSize) => setPagination(prev => ({ ...prev, pageSize, page: 1 }))}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'add' ? 'Add OLT Device' : 'Edit OLT Device'}
        onSubmit={handleSubmit}
      >
        <OltForm
          initialData={editingItem}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      </FormModal>
    </div>
  );
}
```

---

## 8. Performance Optimization

### 8.1 Memoization

```typescript
import { useMemo } from 'react';

// Memoize filtered data
const filteredData = useMemo(() => {
  return data.filter(item => {
    // Apply filters
    if (filters.area && item.area !== filters.area) return false;
    if (filters.status && item.status !== filters.status) return false;
    return true;
  });
}, [data, filters]);

// Memoize sorted data
const sortedData = useMemo(() => {
  return [...filteredData].sort((a, b) => {
    // Apply sorting
    return a[sortKey] > b[sortKey] ? 1 : -1;
  });
}, [filteredData, sortKey, sortOrder]);
```

### 8.2 Debouncing

```typescript
// src/hooks/useDebounce.ts
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Usage in search
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 500);

useEffect(() => {
  // Fetch with debounced search
  fetchData({ search: debouncedSearch });
}, [debouncedSearch]);
```

---

## 9. Testing Strategy

### 9.1 Component Tests

```typescript
// tests/components/OltForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OltForm } from '@/components/features/olt/OltForm';

describe('OltForm', () => {
  it('should render all fields', () => {
    render(<OltForm onSubmit={jest.fn()} onCancel={jest.fn()} />);
    
    expect(screen.getByLabelText(/hostname/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ip address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/total ports/i)).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    const onSubmit = jest.fn();
    render(<OltForm onSubmit={onSubmit} onCancel={jest.fn()} />);
    
    fireEvent.click(screen.getByText(/submit/i));
    
    await waitFor(() => {
      expect(screen.getByText(/hostname is required/i)).toBeInTheDocument();
    });
    
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should submit valid data', async () => {
    const onSubmit = jest.fn();
    render(<OltForm onSubmit={onSubmit} onCancel={jest.fn()} />);
    
    fireEvent.change(screen.getByLabelText(/hostname/i), {
      target: { value: 'OLT-PKU-01' }
    });
    fireEvent.change(screen.getByLabelText(/ip address/i), {
      target: { value: '10.10.1.1' }
    });
    fireEvent.change(screen.getByLabelText(/total ports/i), {
      target: { value: '48' }
    });
    
    fireEvent.click(screen.getByText(/submit/i));
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        hostname: 'OLT-PKU-01',
        ip_address: '10.10.1.1',
        total_ports: 48,
        status: 'active'
      });
    });
  });
});
```

---

**Document Version**: 1.0  
**Created**: 2026-05-07  
**Status**: Technical Specification  
**Complexity**: High