# PHASE 2 IMPLEMENTATION PLAN: Interactive Features & GIS Integration

## Executive Summary

Phase 2 fokus pada penambahan fitur interaktif untuk CRUD operations, Interactive Network Map (GIS), dan peningkatan user experience. Phase ini akan membuat aplikasi fully functional dengan kemampuan untuk mengelola data OLT, ODC, dan Vendor secara lengkap.

### Phase 1 Recap (✅ COMPLETED)
- ✅ Database schema (3 new tables + enhanced projects)
- ✅ Repository layer (3 repositories with CRUD)
- ✅ API endpoints (15 endpoints)
- ✅ Basic UI pages (3 pages with read-only view)
- ✅ Sidebar navigation

### Phase 2 Goals
1. **Complete CRUD Operations** - Add/Edit/Delete functionality untuk semua modules
2. **Interactive GIS Map** - Network visualization dengan OLT & ODC locations
3. **Advanced Filtering** - Multi-criteria filtering dan sorting
4. **Data Export** - Export ke Excel/PDF
5. **Reusable Components** - Component library untuk consistency

---

## 1. Reusable UI Components

### 1.1 FormModal Component
**File**: `src/components/ui/FormModal.tsx`

**Purpose**: Generic modal untuk forms (Add/Edit)

**Features**:
- Responsive modal dengan backdrop
- Form validation integration
- Loading states
- Error handling
- Success/error notifications
- Keyboard shortcuts (ESC to close)

**Props**:
```typescript
interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onSubmit: (data: any) => Promise<void>;
  children: React.ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
}
```

**Usage Example**:
```tsx
<FormModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title="Add OLT Device"
  onSubmit={handleSubmit}
  submitLabel="Create OLT"
>
  <OltForm data={formData} onChange={setFormData} />
</FormModal>
```

---

### 1.2 DataTable Component
**File**: `src/components/ui/DataTable.tsx`

**Purpose**: Advanced data table dengan sorting, pagination, dan actions

**Features**:
- Column sorting (ascending/descending)
- Pagination dengan page size options
- Row selection (single/multiple)
- Bulk actions
- Column visibility toggle
- Responsive design (mobile-friendly)
- Loading skeleton
- Empty state

**Props**:
```typescript
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  onRowClick?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  isLoading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  };
  selection?: {
    selectedRows: string[];
    onSelectionChange: (ids: string[]) => void;
  };
  bulkActions?: BulkAction[];
}
```

---

### 1.3 FilterPanel Component
**File**: `src/components/ui/FilterPanel.tsx`

**Purpose**: Advanced filtering panel dengan multiple criteria

**Features**:
- Multiple filter types (text, select, date range, number range)
- Filter presets (saved filters)
- Clear all filters
- Filter count badge
- Collapsible panel

**Props**:
```typescript
interface FilterPanelProps {
  filters: FilterConfig[];
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
  onClear: () => void;
  presets?: FilterPreset[];
}
```

---

### 1.4 ConfirmDialog Component
**File**: `src/components/ui/ConfirmDialog.tsx`

**Purpose**: Confirmation dialog untuk destructive actions

**Features**:
- Customizable title, message, buttons
- Danger/warning/info variants
- Keyboard shortcuts
- Focus trap

---

### 1.5 Toast Notification Component
**File**: `src/components/ui/Toast.tsx`

**Purpose**: Toast notifications untuk feedback

**Features**:
- Success, error, warning, info variants
- Auto-dismiss dengan timer
- Manual dismiss
- Stack multiple toasts
- Position options (top-right, bottom-right, etc.)

---

### 1.6 ExportButton Component
**File**: `src/components/ui/ExportButton.tsx`

**Purpose**: Export data ke berbagai format

**Features**:
- Export to Excel (.xlsx)
- Export to CSV
- Export to PDF
- Custom column selection
- Date range filter for export

---

## 2. CRUD Operations Implementation

### 2.1 OLT Management

#### 2.1.1 Add OLT Form
**File**: `src/components/features/olt/OltForm.tsx`

**Fields**:
- Hostname* (required)
- IP Address* (required, validated)
- Brand
- Model
- Software Version
- Serial Number
- Location Name
- Coordinates (Latitude, Longitude)
- Area, Branch, STO
- Total Ports* (required, number)
- Status (dropdown: active, inactive, maintenance)
- Installation Date
- Notes

**Validation**:
- IP address format (IPv4)
- Hostname uniqueness
- Serial number uniqueness
- Coordinate bounds (-90 to 90, -180 to 180)
- Port numbers (positive integers)

#### 2.1.2 Edit OLT Form
**File**: Same as Add, with pre-filled data

**Additional Features**:
- Show last updated timestamp
- Track changes (highlight modified fields)
- Prevent duplicate IP/hostname

#### 2.1.3 Delete OLT
**Confirmation Dialog**:
- Show OLT details
- Warn if OLT has connected ODCs
- Cascade delete option (optional)

---

### 2.2 ODC Management

#### 2.2.1 Add ODC Form
**File**: `src/components/features/odc/OdcForm.tsx`

**Fields**:
- ODC Name* (required, unique)
- Regional, Witel, Datel
- STO* (required)
- OLT Selection (dropdown from active OLTs)
- Splitter Type (dropdown: 48, 144, 288)
- Max Capacity* (required)
- Coordinates (Latitude, Longitude)
- Polygon Coordinates (JSON or map picker)
- Polygon Status (dropdown: planned, active, inactive)
- Installation Date
- Status (dropdown: active, inactive)
- Notes

**Validation**:
- ODC name uniqueness
- STO required
- Capacity positive number
- Valid OLT selection

#### 2.2.2 Edit ODC Form
Similar to Add, with pre-filled data

#### 2.2.3 Delete ODC
**Confirmation Dialog**:
- Show ODC details
- Warn if ODC has projects assigned
- Option to reassign projects

---

### 2.3 Vendor Management

#### 2.3.1 Add Vendor Form
**File**: `src/components/features/vendors/VendorForm.tsx`

**Fields**:
- Vendor Name* (required, unique)
- Vendor Code (unique)
- Contact Person
- Phone
- Email (validated)
- Address
- Contract Start Date
- Contract End Date
- Contract Value (IDR)
- Rating (0-5, slider)
- Status (dropdown: active, inactive)
- Notes

**Validation**:
- Vendor name uniqueness
- Email format
- Contract dates (start < end)
- Rating range (0-5)
- Contract value positive

#### 2.3.2 Edit Vendor Form
Similar to Add, with pre-filled data

**Additional Features**:
- Show project count
- Show performance metrics
- Contract expiry warning

#### 2.3.3 Delete Vendor
**Confirmation Dialog**:
- Show vendor details
- Warn if vendor has active projects
- Option to reassign projects

---

## 3. Interactive Network Map (GIS)

### 3.1 Map Component
**File**: `src/components/features/map/NetworkMap.tsx`

**Technology**: Leaflet.js or Mapbox GL JS

**Features**:
- Interactive map dengan zoom/pan
- OLT markers (custom icons)
- ODC markers (custom icons)
- Cluster markers untuk dense areas
- Popup on marker click (device details)
- Layer toggle (show/hide OLT, ODC)
- Search location
- Draw polygon tool (for ODC coverage)
- Measure distance tool
- Export map as image

**Map Layers**:
1. **Base Layer**: OpenStreetMap or Mapbox Streets
2. **OLT Layer**: Red markers with server icon
3. **ODC Layer**: Blue markers with box icon
4. **Coverage Layer**: Polygon overlays for ODC coverage
5. **Connection Layer**: Lines connecting ODC to OLT

**Marker Popup Content**:
```
OLT-PKU-01
IP: 10.10.1.1
Area: Pekanbaru
Ports: 48/64 (75% used)
Status: Active
[View Details] [Edit]
```

---

### 3.2 Map Page
**File**: `src/app/(main)/map/page.tsx`

**Layout**:
- Full-screen map
- Sidebar with filters
- Legend
- Stats overlay

**Filters**:
- Device type (OLT, ODC, Both)
- Area
- Status
- Utilization range

**Stats Overlay** (top-right):
- Total OLTs visible
- Total ODCs visible
- Average utilization
- Coverage area

---

### 3.3 Map Integration in Detail Pages

**OLT Detail Page**:
- Show OLT location on mini-map
- Show connected ODCs
- Draw coverage radius

**ODC Detail Page**:
- Show ODC location on mini-map
- Show connected OLT
- Show coverage polygon

---

## 4. Advanced Filtering & Sorting

### 4.1 Multi-Criteria Filtering

**OLT Filters**:
- Area (multi-select)
- Branch (multi-select)
- STO (multi-select)
- Status (multi-select)
- Port utilization range (slider)
- Installation date range
- Has dualhoming (checkbox)

**ODC Filters**:
- Regional (multi-select)
- Witel (multi-select)
- STO (multi-select)
- OLT (multi-select)
- Splitter type (multi-select)
- Capacity utilization range
- Polygon status (multi-select)
- Status (multi-select)

**Vendor Filters**:
- Status (multi-select)
- Rating range (slider)
- On-time delivery rate range
- Quality score range
- Contract status (active, expired, expiring soon)
- Has active projects (checkbox)

---

### 4.2 Sorting Options

**All Tables**:
- Sort by any column
- Multi-column sorting (hold Shift)
- Save sort preferences
- Default sort order

---

### 4.3 Filter Presets

**Predefined Filters**:
- "High Utilization" (>80%)
- "Low Utilization" (<30%)
- "Maintenance Required"
- "Recently Added" (last 30 days)
- "Expiring Contracts" (next 90 days)

**Custom Presets**:
- Save current filters as preset
- Name and description
- Share presets with team

---

## 5. Data Export Features

### 5.1 Export Options

**Formats**:
- Excel (.xlsx) - Full data with formatting
- CSV (.csv) - Raw data
- PDF (.pdf) - Formatted report

**Export Scope**:
- Current page
- All pages (with filters applied)
- Selected rows only
- Custom date range

---

### 5.2 Export Templates

**OLT Export**:
- Device inventory report
- Capacity utilization report
- Maintenance schedule report

**ODC Export**:
- Coverage area report
- Capacity planning report
- Installation timeline report

**Vendor Export**:
- Performance scorecard
- Contract summary
- Project assignment report

---

## 6. Detail Pages

### 6.1 OLT Detail Page
**File**: `src/app/(main)/olt/[id]/page.tsx`

**Sections**:
1. **Overview**
   - Device information
   - Status badge
   - Quick actions (Edit, Delete)

2. **Capacity**
   - Port utilization chart
   - Historical trends
   - Capacity forecast

3. **Connected ODCs**
   - List of ODCs connected to this OLT
   - Quick navigation

4. **Location**
   - Mini-map showing location
   - Coordinates
   - Coverage radius

5. **Maintenance**
   - Last maintenance date
   - Next scheduled maintenance
   - Maintenance history

6. **Technical Details**
   - Software version
   - Uplink configuration
   - Dualhoming status
   - Cacti/NMS integration

---

### 6.2 ODC Detail Page
**File**: `src/app/(main)/odc/[id]/page.tsx`

**Sections**:
1. **Overview**
   - ODC information
   - Status badges
   - Quick actions

2. **Capacity**
   - Splitter utilization
   - Available ports
   - Capacity trends

3. **Connected OLT**
   - OLT details
   - Connection status
   - Quick navigation

4. **Coverage**
   - Mini-map with polygon
   - Coverage area (km²)
   - Polygon status

5. **Projects**
   - List of projects using this ODC
   - Project status distribution

---

### 6.3 Vendor Detail Page
**File**: `src/app/(main)/vendors/[id]/page.tsx`

**Sections**:
1. **Overview**
   - Vendor information
   - Contact details
   - Quick actions

2. **Performance Metrics**
   - Rating (star display)
   - On-time delivery rate
   - Quality score
   - Completion rate
   - Performance trends (chart)

3. **Contract Information**
   - Contract dates
   - Contract value
   - Renewal status
   - Contract documents

4. **Projects**
   - Active projects
   - Completed projects
   - Project timeline
   - Revenue by project

5. **Performance History**
   - Historical ratings
   - Trend analysis
   - Comparison with other vendors

---

## 7. Implementation Timeline

### Week 1: Reusable Components
- Day 1-2: FormModal, ConfirmDialog, Toast
- Day 3-4: DataTable with sorting & pagination
- Day 5: FilterPanel, ExportButton

### Week 2: CRUD Operations
- Day 1-2: OLT Add/Edit/Delete forms
- Day 3: ODC Add/Edit/Delete forms
- Day 4: Vendor Add/Edit/Delete forms
- Day 5: Integration testing

### Week 3: GIS Map
- Day 1-2: Map component setup (Leaflet/Mapbox)
- Day 3: OLT & ODC markers
- Day 4: Polygon drawing & coverage
- Day 5: Map page & filters

### Week 4: Advanced Features
- Day 1-2: Advanced filtering & sorting
- Day 3: Data export (Excel, CSV, PDF)
- Day 4: Detail pages
- Day 5: Polish & bug fixes

---

## 8. Technical Considerations

### 8.1 State Management
- Use React Context for global state (filters, selections)
- Local state for form data
- Consider Zustand for complex state

### 8.2 Form Handling
- React Hook Form for form management
- Zod for validation (already implemented)
- Optimistic updates for better UX

### 8.3 Map Library Selection

**Option 1: Leaflet.js** (Recommended)
- ✅ Free and open-source
- ✅ Lightweight
- ✅ Good documentation
- ✅ Many plugins available
- ❌ Less modern than Mapbox

**Option 2: Mapbox GL JS**
- ✅ Modern and performant
- ✅ Beautiful styling
- ✅ 3D support
- ❌ Requires API key
- ❌ Usage limits on free tier

**Recommendation**: Start with Leaflet.js, migrate to Mapbox if needed

### 8.4 Export Libraries

**Excel Export**: `xlsx` or `exceljs`
**PDF Export**: `jsPDF` or `pdfmake`
**CSV Export**: Native JavaScript

---

## 9. UI/UX Improvements

### 9.1 Loading States
- Skeleton loaders for tables
- Spinner for buttons
- Progress bars for long operations

### 9.2 Error Handling
- User-friendly error messages
- Retry mechanisms
- Error boundaries

### 9.3 Accessibility
- Keyboard navigation
- ARIA labels
- Focus management
- Screen reader support

### 9.4 Responsive Design
- Mobile-first approach
- Tablet optimization
- Desktop enhancements

---

## 10. Testing Strategy

### 10.1 Unit Tests
- Component tests (React Testing Library)
- Form validation tests
- Utility function tests

### 10.2 Integration Tests
- CRUD workflow tests
- API integration tests
- Map interaction tests

### 10.3 E2E Tests (Optional)
- User journey tests (Playwright/Cypress)
- Critical path testing

---

## 11. Success Metrics

### Technical KPIs
- Form submission success rate > 95%
- Page load time < 2s
- Map render time < 1s
- Export generation time < 5s

### User Experience KPIs
- Task completion rate > 90%
- User satisfaction score > 4.0/5.0
- Error rate < 1%

---

## 12. Dependencies to Install

```json
{
  "dependencies": {
    "react-hook-form": "^7.x",
    "leaflet": "^1.9.x",
    "react-leaflet": "^4.x",
    "@tanstack/react-table": "^8.x",
    "xlsx": "^0.18.x",
    "jspdf": "^2.x",
    "date-fns": "^2.x",
    "recharts": "^2.x"
  },
  "devDependencies": {
    "@testing-library/react": "^14.x",
    "@testing-library/user-event": "^14.x",
    "vitest": "^1.x"
  }
}
```

---

## 13. File Structure (New Files)

```
src/
├── components/
│   ├── ui/
│   │   ├── FormModal.tsx
│   │   ├── DataTable.tsx
│   │   ├── FilterPanel.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── Toast.tsx
│   │   └── ExportButton.tsx
│   └── features/
│       ├── olt/
│       │   ├── OltForm.tsx
│       │   ├── OltTable.tsx
│       │   └── OltFilters.tsx
│       ├── odc/
│       │   ├── OdcForm.tsx
│       │   ├── OdcTable.tsx
│       │   └── OdcFilters.tsx
│       ├── vendors/
│       │   ├── VendorForm.tsx
│       │   ├── VendorTable.tsx
│       │   └── VendorFilters.tsx
│       └── map/
│           ├── NetworkMap.tsx
│           ├── MapMarker.tsx
│           ├── MapLegend.tsx
│           └── MapFilters.tsx
├── app/(main)/
│   ├── map/
│   │   └── page.tsx
│   ├── olt/[id]/
│   │   └── page.tsx
│   ├── odc/[id]/
│   │   └── page.tsx
│   └── vendors/[id]/
│       └── page.tsx
├── hooks/
│   ├── useToast.ts
│   ├── useConfirm.ts
│   └── useExport.ts
└── utils/
    ├── export.ts
    └── map.ts
```

---

## 14. Next Steps After Phase 2

**Phase 3 Candidates**:
1. Google Sheets Integration (auto-sync)
2. Real-time Updates (WebSocket)
3. Advanced Analytics Dashboard
4. Notification System
5. Document Management
6. Audit Logs & History

---

**Document Version**: 1.0  
**Created**: 2026-05-07  
**Status**: Ready for Implementation  
**Estimated Duration**: 4 weeks  
**Complexity**: Medium-High