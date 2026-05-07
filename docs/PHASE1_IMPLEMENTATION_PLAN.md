# Phase 1 Implementation Plan: OLT & ODC Inventory System

## Overview
Dokumen ini adalah rencana implementasi detail untuk Phase 1 dari INTEGRATION_PLAN.md, fokus pada setup database dan UI untuk OLT Inventory, ODC Inventory, dan Vendor Management.

## Current State Analysis

### Existing Architecture
- **Database**: SQLite dengan Better-SQLite3
- **Migration System**: Custom migration system di [`src/lib/migrations.ts`](../src/lib/migrations.ts)
- **Repository Pattern**: Class-based repositories (contoh: [`ProjectRepository`](../src/repositories/ProjectRepository.ts))
- **API Routes**: Next.js App Router API routes di `src/app/api/`
- **UI Pages**: Next.js pages di `src/app/(main)/`
- **Sidebar Navigation**: [`Sidebar.tsx`](../src/components/layout/Sidebar.tsx) dengan 7 menu items

### Current Database Tables
1. `projects` - Project tracking
2. `aanwijzing` - Technical briefing records
3. `ut` - Acceptance test records
4. `boq` - Bill of Quantities
5. `boq_aanwijzing` - BOQ for aanwijzing
6. `boq_ut` - BOQ for UT

## Implementation Tasks

### 1. Database Layer (Migrations)

#### 1.1 Migration #4: OLT Inventory Table
**File**: [`src/lib/migrations.ts`](../src/lib/migrations.ts)

**Schema**:
```sql
CREATE TABLE olt_inventory (
  id TEXT PRIMARY KEY,
  ip_address TEXT UNIQUE NOT NULL,
  hostname TEXT NOT NULL,
  brand TEXT DEFAULT '',
  model TEXT DEFAULT '',
  software_version TEXT DEFAULT '',
  serial_number TEXT UNIQUE,
  location_name TEXT DEFAULT '',
  latitude REAL,
  longitude REAL,
  area TEXT DEFAULT '',
  branch TEXT DEFAULT '',
  sto TEXT DEFAULT '',
  uplink_config TEXT DEFAULT '{}',
  dualhoming_enabled INTEGER DEFAULT 0,
  dualhoming_pair TEXT,
  total_ports INTEGER DEFAULT 0,
  used_ports INTEGER DEFAULT 0,
  available_ports INTEGER DEFAULT 0,
  cacti_integrated INTEGER DEFAULT 0,
  cacti_device_id TEXT,
  nms_integrated INTEGER DEFAULT 0,
  nms_device_id TEXT,
  status TEXT DEFAULT 'active',
  installation_date TEXT,
  last_maintenance_date TEXT,
  next_maintenance_date TEXT,
  notes TEXT DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_olt_ip ON olt_inventory(ip_address);
CREATE INDEX idx_olt_hostname ON olt_inventory(hostname);
CREATE INDEX idx_olt_area ON olt_inventory(area);
CREATE INDEX idx_olt_status ON olt_inventory(status);
```

**Key Fields**:
- `id`: UUID primary key
- `ip_address`: Unique IP address untuk network identification
- `hostname`: Display name untuk OLT device
- `latitude/longitude`: GPS coordinates untuk map visualization
- `total_ports/used_ports/available_ports`: Capacity tracking
- `status`: active, inactive, maintenance

#### 1.2 Migration #5: ODC Inventory Table
**File**: [`src/lib/migrations.ts`](../src/lib/migrations.ts)

**Schema**:
```sql
CREATE TABLE odc_inventory (
  id TEXT PRIMARY KEY,
  odc_name TEXT UNIQUE NOT NULL,
  regional TEXT DEFAULT '',
  witel TEXT DEFAULT '',
  datel TEXT DEFAULT '',
  sto TEXT NOT NULL,
  olt_id TEXT,
  splitter_type TEXT DEFAULT '',
  max_capacity INTEGER DEFAULT 0,
  used_capacity INTEGER DEFAULT 0,
  available_capacity INTEGER DEFAULT 0,
  latitude REAL,
  longitude REAL,
  polygon_coordinates TEXT DEFAULT '[]',
  polygon_status TEXT DEFAULT 'planned',
  installation_date TEXT,
  status TEXT DEFAULT 'active',
  notes TEXT DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (olt_id) REFERENCES olt_inventory(id)
);

CREATE INDEX idx_odc_name ON odc_inventory(odc_name);
CREATE INDEX idx_odc_sto ON odc_inventory(sto);
CREATE INDEX idx_odc_olt ON odc_inventory(olt_id);
CREATE INDEX idx_odc_status ON odc_inventory(status);
```

**Key Fields**:
- `odc_name`: Unique identifier untuk ODC
- `olt_id`: Foreign key ke OLT inventory
- `splitter_type`: 48, 144, atau 288 port
- `polygon_coordinates`: JSON array untuk coverage area
- `polygon_status`: planned, active, inactive

#### 1.3 Migration #6: Vendors Table
**File**: [`src/lib/migrations.ts`](../src/lib/migrations.ts)

**Schema**:
```sql
CREATE TABLE vendors (
  id TEXT PRIMARY KEY,
  vendor_name TEXT UNIQUE NOT NULL,
  vendor_code TEXT UNIQUE,
  contact_person TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  contract_start_date TEXT,
  contract_end_date TEXT,
  contract_value REAL DEFAULT 0,
  rating REAL DEFAULT 0,
  total_projects INTEGER DEFAULT 0,
  completed_projects INTEGER DEFAULT 0,
  on_time_delivery_rate REAL DEFAULT 0,
  quality_score REAL DEFAULT 0,
  status TEXT DEFAULT 'active',
  notes TEXT DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vendor_name ON vendors(vendor_name);
CREATE INDEX idx_vendor_status ON vendors(status);
```

**Key Fields**:
- `vendor_name`: Nama mitra/vendor
- `vendor_code`: Kode unik vendor
- `rating`: Performance rating (0-5)
- `on_time_delivery_rate`: Percentage (0-100)
- `quality_score`: Quality score (0-100)

#### 1.4 Migration #7: Enhance Projects Table
**File**: [`src/lib/migrations.ts`](../src/lib/migrations.ts)

**New Columns**:
```sql
ALTER TABLE projects ADD COLUMN area TEXT DEFAULT '';
ALTER TABLE projects ADD COLUMN witel TEXT DEFAULT '';
ALTER TABLE projects ADD COLUMN datel TEXT DEFAULT '';
ALTER TABLE projects ADD COLUMN sto TEXT DEFAULT '';
ALTER TABLE projects ADD COLUMN branch TEXT DEFAULT '';
ALTER TABLE projects ADD COLUMN mitra TEXT DEFAULT '';
ALTER TABLE projects ADD COLUMN vendor_id TEXT;
ALTER TABLE projects ADD COLUMN olt_id TEXT;
ALTER TABLE projects ADD COLUMN odc_id TEXT;
ALTER TABLE projects ADD COLUMN odp_planned INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN odp_realized INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN port_planned INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN port_realized INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN boq_value REAL DEFAULT 0;
ALTER TABLE projects ADD COLUMN boq_currency TEXT DEFAULT 'IDR';
ALTER TABLE projects ADD COLUMN golive_target TEXT;
ALTER TABLE projects ADD COLUMN golive_actual TEXT;
ALTER TABLE projects ADD COLUMN project_manager TEXT DEFAULT '';
ALTER TABLE projects ADD COLUMN technical_lead TEXT DEFAULT '';
ALTER TABLE projects ADD COLUMN priority TEXT DEFAULT 'medium';
ALTER TABLE projects ADD COLUMN risk_level TEXT DEFAULT 'low';
ALTER TABLE projects ADD COLUMN completion_percentage REAL DEFAULT 0;

CREATE INDEX idx_projects_vendor ON projects(vendor_id);
CREATE INDEX idx_projects_olt ON projects(olt_id);
CREATE INDEX idx_projects_odc ON projects(odc_id);
CREATE INDEX idx_projects_area ON projects(area);
CREATE INDEX idx_projects_sto ON projects(sto);
CREATE INDEX idx_projects_priority ON projects(priority);
```

### 2. Repository Layer

#### 2.1 OLT Repository
**File**: `src/repositories/OltRepository.ts`

**Methods**:
- `findAll(filters?)`: Get all OLT devices with optional filtering
- `findById(id)`: Get single OLT by ID
- `findByIpAddress(ip)`: Get OLT by IP address
- `create(data)`: Create new OLT device
- `update(id, data)`: Update OLT device
- `delete(id)`: Delete OLT device
- `getCapacityStats()`: Get capacity statistics
- `findByArea(area)`: Get OLTs by area

**Interface**:
```typescript
export interface OltInventory {
  id: string;
  ip_address: string;
  hostname: string;
  brand: string;
  model: string;
  software_version: string;
  serial_number: string | null;
  location_name: string;
  latitude: number | null;
  longitude: number | null;
  area: string;
  branch: string;
  sto: string;
  uplink_config: string;
  dualhoming_enabled: number;
  dualhoming_pair: string | null;
  total_ports: number;
  used_ports: number;
  available_ports: number;
  cacti_integrated: number;
  cacti_device_id: string | null;
  nms_integrated: number;
  nms_device_id: string | null;
  status: string;
  installation_date: string | null;
  last_maintenance_date: string | null;
  next_maintenance_date: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}
```

#### 2.2 ODC Repository
**File**: `src/repositories/OdcRepository.ts`

**Methods**:
- `findAll(filters?)`: Get all ODC with optional filtering
- `findById(id)`: Get single ODC by ID
- `findByOltId(oltId)`: Get ODCs connected to specific OLT
- `create(data)`: Create new ODC
- `update(id, data)`: Update ODC
- `delete(id)`: Delete ODC
- `getCapacityStats()`: Get capacity statistics
- `findBySto(sto)`: Get ODCs by STO

**Interface**:
```typescript
export interface OdcInventory {
  id: string;
  odc_name: string;
  regional: string;
  witel: string;
  datel: string;
  sto: string;
  olt_id: string | null;
  splitter_type: string;
  max_capacity: number;
  used_capacity: number;
  available_capacity: number;
  latitude: number | null;
  longitude: number | null;
  polygon_coordinates: string;
  polygon_status: string;
  installation_date: string | null;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
}
```

#### 2.3 Vendor Repository
**File**: `src/repositories/VendorRepository.ts`

**Methods**:
- `findAll()`: Get all vendors
- `findById(id)`: Get single vendor by ID
- `findByName(name)`: Get vendor by name
- `create(data)`: Create new vendor
- `update(id, data)`: Update vendor
- `delete(id)`: Delete vendor
- `getPerformanceMetrics(id)`: Get vendor performance metrics
- `getActiveVendors()`: Get only active vendors

**Interface**:
```typescript
export interface Vendor {
  id: string;
  vendor_name: string;
  vendor_code: string | null;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  contract_start_date: string | null;
  contract_end_date: string | null;
  contract_value: number;
  rating: number;
  total_projects: number;
  completed_projects: number;
  on_time_delivery_rate: number;
  quality_score: number;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
}
```

### 3. API Layer

#### 3.1 OLT API Routes
**File**: `src/app/api/olt/route.ts`

**Endpoints**:
- `GET /api/olt` - List all OLT devices with filtering
  - Query params: `area`, `status`, `search`
  - Response: `{ data: OltInventory[], total: number }`

- `POST /api/olt` - Create new OLT device
  - Body: OLT data
  - Validation: IP address format, required fields
  - Response: `{ data: OltInventory, message: string }`

**File**: `src/app/api/olt/[id]/route.ts`

- `GET /api/olt/[id]` - Get single OLT device
- `PUT /api/olt/[id]` - Update OLT device
- `DELETE /api/olt/[id]` - Delete OLT device

**File**: `src/app/api/olt/stats/route.ts`

- `GET /api/olt/stats` - Get capacity statistics

#### 3.2 ODC API Routes
**File**: `src/app/api/odc/route.ts`

**Endpoints**:
- `GET /api/odc` - List all ODC with filtering
- `POST /api/odc` - Create new ODC

**File**: `src/app/api/odc/[id]/route.ts`

- `GET /api/odc/[id]` - Get single ODC
- `PUT /api/odc/[id]` - Update ODC
- `DELETE /api/odc/[id]` - Delete ODC

#### 3.3 Vendor API Routes
**File**: `src/app/api/vendors/route.ts`

**Endpoints**:
- `GET /api/vendors` - List all vendors
- `POST /api/vendors` - Create new vendor

**File**: `src/app/api/vendors/[id]/route.ts`

- `GET /api/vendors/[id]` - Get single vendor
- `PUT /api/vendors/[id]` - Update vendor
- `DELETE /api/vendors/[id]` - Delete vendor

**File**: `src/app/api/vendors/[id]/performance/route.ts`

- `GET /api/vendors/[id]/performance` - Get vendor performance metrics

### 4. Validation Layer

**File**: `src/lib/validation.ts` (enhance existing)

**Schemas**:
```typescript
// OLT Validation Schema
export const oltSchema = z.object({
  ip_address: z.string().ip({ version: 'v4' }),
  hostname: z.string().min(1).max(255),
  brand: z.string().optional(),
  model: z.string().optional(),
  software_version: z.string().optional(),
  serial_number: z.string().optional(),
  location_name: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  area: z.string().optional(),
  branch: z.string().optional(),
  sto: z.string().optional(),
  total_ports: z.number().int().min(0).default(0),
  used_ports: z.number().int().min(0).default(0),
  status: z.enum(['active', 'inactive', 'maintenance']).default('active'),
  notes: z.string().optional(),
});

// ODC Validation Schema
export const odcSchema = z.object({
  odc_name: z.string().min(1).max(255),
  regional: z.string().optional(),
  witel: z.string().optional(),
  datel: z.string().optional(),
  sto: z.string().min(1),
  olt_id: z.string().uuid().optional(),
  splitter_type: z.enum(['48', '144', '288']).optional(),
  max_capacity: z.number().int().min(0).default(0),
  used_capacity: z.number().int().min(0).default(0),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  polygon_status: z.enum(['planned', 'active', 'inactive']).default('planned'),
  status: z.enum(['active', 'inactive']).default('active'),
  notes: z.string().optional(),
});

// Vendor Validation Schema
export const vendorSchema = z.object({
  vendor_name: z.string().min(1).max(255),
  vendor_code: z.string().optional(),
  contact_person: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  contract_start_date: z.string().optional(),
  contract_end_date: z.string().optional(),
  contract_value: z.number().min(0).default(0),
  rating: z.number().min(0).max(5).default(0),
  status: z.enum(['active', 'inactive']).default('active'),
  notes: z.string().optional(),
});
```

### 5. UI Layer

#### 5.1 OLT Inventory Page
**File**: `src/app/(main)/olt/page.tsx`

**Features**:
- Data table dengan sorting, filtering, pagination
- Search by hostname, IP address
- Filter by area, status
- Add/Edit/Delete OLT devices
- View capacity statistics
- Export to Excel

**Components**:
- `<OltTable />` - Main data table
- `<OltForm />` - Add/Edit form modal
- `<OltFilters />` - Filter controls
- `<CapacityCard />` - Capacity statistics card

#### 5.2 ODC Inventory Page
**File**: `src/app/(main)/odc/page.tsx`

**Features**:
- Data table dengan sorting, filtering, pagination
- Search by ODC name
- Filter by STO, status, OLT
- Add/Edit/Delete ODC
- View capacity statistics
- Link to OLT devices

**Components**:
- `<OdcTable />` - Main data table
- `<OdcForm />` - Add/Edit form modal
- `<OdcFilters />` - Filter controls
- `<CapacityCard />` - Capacity statistics card

#### 5.3 Vendor Management Page
**File**: `src/app/(main)/vendors/page.tsx`

**Features**:
- Data table dengan sorting, filtering
- Search by vendor name
- Filter by status
- Add/Edit/Delete vendors
- View performance metrics
- View assigned projects

**Components**:
- `<VendorTable />` - Main data table
- `<VendorForm />` - Add/Edit form modal
- `<VendorPerformanceCard />` - Performance metrics card

#### 5.4 Update Sidebar Navigation
**File**: [`src/components/layout/Sidebar.tsx`](../src/components/layout/Sidebar.tsx)

**New Menu Items**:
```typescript
const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects Data', icon: Database },
  { href: '/boq', label: 'BoQ Plan', icon: Receipt },
  { href: '/aanwijzing', label: 'Catatan AANWIJZING', icon: FileText },
  { href: '/ut', label: 'Rekap UT', icon: ClipboardList },
  { href: '/report', label: 'KPI Report', icon: BarChart3 },
  { href: '/topology', label: 'Topology', icon: Network },
  // NEW ITEMS
  { href: '/olt', label: 'OLT Inventory', icon: Server },
  { href: '/odc', label: 'ODC Inventory', icon: Box },
  { href: '/vendors', label: 'Vendor Management', icon: Users },
];
```

### 6. Reusable Components

#### 6.1 DataTable Component
**File**: `src/components/ui/DataTable.tsx`

**Features**:
- Generic table component
- Sorting, filtering, pagination
- Column configuration
- Row actions (edit, delete)
- Bulk actions
- Export functionality

#### 6.2 FormModal Component
**File**: `src/components/ui/FormModal.tsx`

**Features**:
- Generic modal for forms
- Form validation
- Loading states
- Error handling

#### 6.3 CapacityGauge Component
**File**: `src/components/ui/CapacityGauge.tsx`

**Features**:
- Circular progress gauge
- Color coding (green, yellow, red)
- Percentage display

## Implementation Order

### Week 1: Database & Repository Layer
1. ✅ Day 1-2: Create migrations #4, #5, #6, #7
2. ✅ Day 3: Create OltRepository
3. ✅ Day 4: Create OdcRepository
4. ✅ Day 5: Create VendorRepository

### Week 2: API & Validation Layer
1. ✅ Day 1: Add validation schemas
2. ✅ Day 2-3: Create OLT API routes
3. ✅ Day 4: Create ODC API routes
4. ✅ Day 5: Create Vendor API routes

### Week 3: UI Components
1. ✅ Day 1-2: Create reusable components (DataTable, FormModal, etc.)
2. ✅ Day 3: Create OLT Inventory page
3. ✅ Day 4: Create ODC Inventory page
4. ✅ Day 5: Create Vendor Management page

### Week 4: Integration & Testing
1. ✅ Day 1: Update Sidebar navigation
2. ✅ Day 2-3: Integration testing
3. ✅ Day 4: Bug fixes
4. ✅ Day 5: Documentation

## Testing Strategy

### Unit Tests
- Repository methods
- Validation schemas
- Utility functions

### Integration Tests
- API endpoints
- Database operations
- CRUD workflows

### Manual Testing Checklist
- [ ] Create OLT device
- [ ] Edit OLT device
- [ ] Delete OLT device
- [ ] Filter OLT by area
- [ ] Search OLT by hostname
- [ ] Create ODC
- [ ] Link ODC to OLT
- [ ] Create Vendor
- [ ] View vendor performance
- [ ] Navigation between pages

## Success Criteria

### Technical
- ✅ All migrations run successfully
- ✅ All API endpoints return correct responses
- ✅ Data validation works correctly
- ✅ UI is responsive and user-friendly
- ✅ No console errors

### Functional
- ✅ Users can manage OLT inventory
- ✅ Users can manage ODC inventory
- ✅ Users can manage vendors
- ✅ Data relationships work correctly (ODC → OLT)
- ✅ Capacity calculations are accurate

### Performance
- ✅ Page load time < 2 seconds
- ✅ API response time < 500ms
- ✅ Table rendering with 100+ rows is smooth

## Next Steps After Phase 1

1. **Phase 2**: Interactive Network Map (GIS)
2. **Phase 3**: Visual Status Pipeline (Kanban)
3. **Phase 4**: Enhanced BOQ Management
4. **Phase 5**: Advanced Analytics Dashboard

## Notes

- Gunakan UUID untuk primary keys (consistency dengan existing tables)
- Semua timestamps dalam format ISO 8601
- Status fields menggunakan enum untuk consistency
- Foreign keys dengan ON DELETE SET NULL untuk data integrity
- Indexes pada frequently queried columns untuk performance

---

**Document Version**: 1.0  
**Created**: 2026-05-07  
**Status**: Ready for Implementation