# RENCANA INTEGRASI DATA EXCEL KE DASHBOARD

## Executive Summary

### Overview Integrasi Data
Dokumen ini merancang strategi komprehensif untuk mengintegrasikan tiga dataset utama dari Google Spreadsheet ke dalam dashboard monitoring proyek fiber optik SUMBAGTENG:

1. **Sheet JPP (Jaringan Pita Panjang)** - 31 kolom tracking proyek fiber optik dengan status detail dari DROP hingga UJI TERIMA
2. **Sheet OLT PBB & OLT DUMAI** - 50+ kolom inventaris perangkat OLT dengan data teknis lengkap
3. **Sheet ODC (Optical Distribution Cabinet)** - 13 kolom data kabinet distribusi optik dengan koordinat GPS

### Manfaat Bisnis

**Operational Excellence:**
- **Real-time Visibility**: Dashboard terintegrasi memberikan visibilitas penuh terhadap status proyek, inventaris perangkat, dan infrastruktur jaringan
- **Data-Driven Decision Making**: Analytics dan reporting yang komprehensif untuk pengambilan keputusan strategis
- **Automated Tracking**: Eliminasi manual tracking dan reporting, mengurangi human error hingga 80%

**Cost Optimization:**
- **Resource Planning**: Optimasi alokasi resource berdasarkan data real-time BOQ dan progress proyek
- **Asset Management**: Tracking inventaris OLT dan ODC untuk mencegah over-provisioning atau under-utilization
- **Budget Control**: Monitoring BOQ vs actual spending dengan alert system

**Performance Improvement:**
- **Faster Issue Resolution**: Identifikasi bottleneck dan masalah proyek lebih cepat dengan visual analytics
- **Improved Collaboration**: Centralized platform untuk semua stakeholder (PM, engineer, management)
- **Compliance & Audit**: Automated documentation dan audit trail untuk setiap perubahan status

**Strategic Value:**
- **Network Planning**: Data-driven network expansion planning berdasarkan coverage analysis
- **Capacity Management**: Predictive analytics untuk capacity planning OLT dan ODC
- **Performance Benchmarking**: KPI tracking dan benchmarking antar regional/area

---

## 1. Mapping Data ke Modul Existing

### 1.1 Data JPP → Dashboard Module

**Current State:**
- Dashboard menampilkan project list dengan status tracking
- Data source: `projects` table dengan kolom terbatas

**Integration Mapping:**

| JPP Column | Dashboard Usage | Database Field | Priority |
|------------|----------------|----------------|----------|
| ID Proyek | Primary identifier | `id_ihld` | HIGH |
| Nama LOP | Project name display | `nama_lop` | HIGH |
| Regional/Area | Filtering & grouping | `region`, new: `area` | HIGH |
| STO | Location tracking | new: `sto` | HIGH |
| Status (0-8) | Status badge & filtering | `status` | HIGH |
| ODP Planning | Capacity metrics | new: `odp_planned` | HIGH |
| Port Planning | Capacity metrics | new: `port_planned` | HIGH |
| BOQ Value | Budget tracking | new: `boq_value` | MEDIUM |
| Mitra | Vendor management | new: `mitra` | MEDIUM |
| Timeline GoLive | Deadline tracking | new: `golive_target` | HIGH |
| Status Detail | Sub-status tracking | `sub_status` | HIGH |

**New Dashboard Features:**
- **Status Pipeline View**: Visual funnel dari DROP → AANWIJZING → PERIZINAN → INSTALASI → GOLIVE → UJI TERIMA
- **Capacity Dashboard**: Total ODP/Port planned vs realized per area
- **Budget Dashboard**: BOQ tracking dengan variance analysis
- **Timeline Dashboard**: Gantt chart view untuk semua proyek dengan milestone tracking

### 1.2 Data JPP → Projects Module

**Integration Mapping:**
- All 31 columns stored in `full_data` JSON + dedicated columns for frequently queried fields
- Enhanced filtering: Regional, Area, STO, Mitra, Status (multi-select)
- Project detail page dengan tabs: Overview, BOQ, Timeline, Documents
- Bulk operations: Mass update status, assign mitra, export

### 1.3 Data JPP → Aanwijzing Module

**Integration Mapping:**
- Link JPP data via `id_ihld`
- ODP/Port planning → Capacity allocation validation
- Status tracking → Workflow automation
- Timeline → Scheduling system

### 1.4 Data JPP → BOQ Module

**Integration Mapping:**
- BOQ Value → Budget baseline
- ODP/Port Planning → Quantity validation
- Mitra → Vendor pricing
- Status → Payment milestone triggers

### 1.5 Data JPP → UT Module

**Integration Mapping:**
- ODP/Port Realized → Acceptance criteria
- Status → UT eligibility check
- Timeline GoLive → UT deadline calculation
- Mitra → Responsible party for follow-up

### 1.6 Data OLT → Topology Module

**New Table: `olt_inventory`**

| OLT Column | Topology Usage | Database Field |
|------------|---------------|----------------|
| IP Address | Network identifier | `ip_address` |
| Hostname | Display name | `hostname` |
| Merk/Tipe | Device info | `brand`, `model` |
| Software Version | Version tracking | `software_version` |
| Serial Number | Asset tracking | `serial_number` |
| Lokasi (Lat/Long) | Map visualization | `latitude`, `longitude` |
| Uplink Config | Network topology | `uplink_config` JSON |
| Dualhoming Status | Redundancy info | `dualhoming_enabled` |
| Cacti/NMS Integration | Monitoring status | `cacti_integrated`, `nms_integrated` |

**New Features:**
- Interactive Network Map dengan OLT markers
- OLT Health Dashboard (real-time monitoring)
- Capacity Heatmap
- Network Path Tracer
- Redundancy Analyzer

### 1.7 Data ODC → Topology & Report Module

**New Table: `odc_inventory`**

| ODC Column | Usage | Database Field |
|------------|-------|----------------|
| Regional/Witel/Datel | Location hierarchy | `regional`, `witel`, `datel` |
| STO | Service area | `sto` |
| Nama ODC | Identifier | `odc_name` |
| Tipe (48/144/288) | Capacity info | `splitter_type`, `max_capacity` |
| Koordinat GPS | Map location | `latitude`, `longitude` |
| Status Polygon | Coverage status | `polygon_status` |

**New Features:**
- ODC Coverage Map dengan polygon overlay
- Capacity Planning dashboard
- Proximity Search
- Coverage Report

---

## 2. Fitur-Fitur Baru yang Bisa Dibangun

### 2.1 Network Infrastructure Management
**Fitur: OLT Inventory & Monitoring Dashboard**

**Deskripsi:** Centralized dashboard untuk manage semua OLT devices dengan real-time monitoring integration dari Cacti/NMS.

**Features:**
- Live status monitoring (up/down, CPU, memory, temperature)
- Port utilization tracking dengan visual gauges
- Software version management
- Maintenance schedule dan history
- Alert system untuk threshold violations

**Prioritas:** HIGH | **Kompleksitas:** COMPLEX | **Estimasi:** 3-4 minggu

---

### 2.2 Geographic Information System (GIS)
**Fitur: Interactive Network Coverage Map**

**Deskripsi:** Full-featured GIS map dengan OLT locations, ODC coverage polygons, ODP points, heat map untuk network density, route planning, dan coverage gap analysis.

**Prioritas:** HIGH | **Kompleksitas:** COMPLEX | **Estimasi:** 4-5 minggu

---

### 2.3 Project Status Pipeline
**Fitur: Visual Status Pipeline dengan Drag & Drop**

**Deskripsi:** Kanban-style board untuk project status management dengan 8 columns (DROP → UJI TERIMA), drag & drop untuk update status, filtering, bulk operations, dan audit trail.

**Prioritas:** HIGH | **Kompleksitas:** MEDIUM | **Estimasi:** 2-3 minggu

---

### 2.4 BOQ & Budget Management
**Fitur: Comprehensive BOQ Tracking System**

**Deskripsi:** Full budget management dengan BOQ baseline vs actual tracking, variance analysis, cost breakdown, payment milestone tracking, vendor invoice management, budget forecasting dengan ML.

**Prioritas:** HIGH | **Kompleksitas:** COMPLEX | **Estimasi:** 4-5 minggu

---

### 2.5 Capacity Planning & Forecasting
**Fitur: AI-Powered Capacity Planning**

**Deskripsi:** Predictive analytics untuk network capacity dengan current utilization, growth trend analysis, capacity exhaustion prediction, expansion recommendations, what-if scenario planning.

**Prioritas:** MEDIUM | **Kompleksitas:** COMPLEX | **Estimasi:** 5-6 minggu

---

### 2.6 Vendor/Mitra Management
**Fitur: Vendor Performance Dashboard**

**Deskripsi:** Comprehensive vendor management dengan vendor profile, project assignment tracking, performance metrics, rating system, contract management, payment history.

**Prioritas:** MEDIUM | **Kompleksitas:** MEDIUM | **Estimasi:** 3-4 minggu

---

### 2.7 Timeline & Milestone Tracking
**Fitur: Interactive Gantt Chart**

**Deskripsi:** Visual timeline management dengan Gantt chart, milestone tracking, critical path analysis, dependency management, delay alerts, resource allocation timeline.

**Prioritas:** MEDIUM | **Kompleksitas:** COMPLEX | **Estimasi:** 4-5 minggu

---

### 2.8 Document Management System
**Fitur: Centralized Document Repository**

**Deskripsi:** Document management untuk semua project documents dengan upload/download, categorization, version control, access control, full-text search, preview.

**Prioritas:** MEDIUM | **Kompleksitas:** MEDIUM | **Estimasi:** 2-3 minggu

---

### 2.9 Notification & Alert System
**Fitur: Multi-Channel Notification System**

**Deskripsi:** Comprehensive notification dengan in-app notifications, email, WhatsApp integration (optional), alert rules, notification preferences, digest emails.

**Prioritas:** MEDIUM | **Kompleksitas:** MEDIUM | **Estimasi:** 3-4 minggu

---

### 2.10 Advanced Analytics & Reporting
**Fitur: Executive Dashboard dengan Advanced Analytics**

**Deskripsi:** Comprehensive analytics dengan KPI cards, trend charts, distribution charts, performance benchmarking, custom report builder, scheduled reports, export to Excel/PDF.

**Prioritas:** HIGH | **Kompleksitas:** COMPLEX | **Estimasi:** 4-5 minggu

---

## 3. Perubahan Database Schema

### 3.1 Tabel Baru

#### Table: `olt_inventory`
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
  dualhoming_enabled BOOLEAN DEFAULT 0,
  dualhoming_pair TEXT,
  total_ports INTEGER DEFAULT 0,
  used_ports INTEGER DEFAULT 0,
  available_ports INTEGER DEFAULT 0,
  cacti_integrated BOOLEAN DEFAULT 0,
  cacti_device_id TEXT,
  nms_integrated BOOLEAN DEFAULT 0,
  nms_device_id TEXT,
  status TEXT DEFAULT 'active',
  installation_date TEXT,
  last_maintenance_date TEXT,
  next_maintenance_date TEXT,
  notes TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_olt_ip ON olt_inventory(ip_address);
CREATE INDEX idx_olt_hostname ON olt_inventory(hostname);
CREATE INDEX idx_olt_area ON olt_inventory(area);
CREATE INDEX idx_olt_status ON olt_inventory(status);
```

#### Table: `odc_inventory`
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (olt_id) REFERENCES olt_inventory(id)
);

CREATE INDEX idx_odc_name ON odc_inventory(odc_name);
CREATE INDEX idx_odc_sto ON odc_inventory(sto);
CREATE INDEX idx_odc_olt ON odc_inventory(olt_id);
CREATE INDEX idx_odc_status ON odc_inventory(status);
```

#### Table: `vendors`
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vendor_name ON vendors(vendor_name);
CREATE INDEX idx_vendor_status ON vendors(status);
```

#### Table: `project_milestones`
```sql
CREATE TABLE project_milestones (
  id TEXT PRIMARY KEY,
  project_uid TEXT NOT NULL,
  milestone_type TEXT NOT NULL,
  planned_date TEXT,
  actual_date TEXT,
  status TEXT DEFAULT 'pending',
  responsible_person TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_uid) REFERENCES projects(uid)
);

CREATE INDEX idx_milestone_project ON project_milestones(project_uid);
CREATE INDEX idx_milestone_type ON project_milestones(milestone_type);
CREATE INDEX idx_milestone_status ON project_milestones(status);
```

#### Table: `documents`
```sql
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  project_uid TEXT NOT NULL,
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER DEFAULT 0,
  mime_type TEXT DEFAULT '',
  uploaded_by TEXT DEFAULT '',
  upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  version INTEGER DEFAULT 1,
  parent_document_id TEXT,
  tags TEXT DEFAULT '[]',
  notes TEXT DEFAULT '',
  FOREIGN KEY (project_uid) REFERENCES projects(uid),
  FOREIGN KEY (parent_document_id) REFERENCES documents(id)
);

CREATE INDEX idx_doc_project ON documents(project_uid);
CREATE INDEX idx_doc_type ON documents(document_type);
CREATE INDEX idx_doc_date ON documents(upload_date);
```

#### Table: `notifications`
```sql
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_entity_type TEXT,
  related_entity_id TEXT,
  is_read BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  read_at DATETIME
);

CREATE INDEX idx_notif_user ON notifications(user_id);
CREATE INDEX idx_notif_read ON notifications(is_read);
CREATE INDEX idx_notif_date ON notifications(created_at);
```

#### Table: `audit_logs`
```sql
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  old_value TEXT DEFAULT '{}',
  new_value TEXT DEFAULT '{}',
  ip_address TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_date ON audit_logs(created_at);
```

### 3.2 Kolom Baru pada Tabel Existing

#### Enhancement: `projects` table
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

---

## 4. API Endpoints Baru

### 4.1 OLT Management APIs

- `GET /api/olt` - Get all OLT devices with filtering
- `POST /api/olt` - Create new OLT device
- `PUT /api/olt/:id` - Update OLT device
- `DELETE /api/olt/:id` - Delete OLT device
- `GET /api/olt/:id/capacity` - Get OLT capacity details
- `GET /api/olt/:id/health` - Get OLT health metrics from Cacti/NMS

### 4.2 ODC Management APIs

- `GET /api/odc` - Get all ODC with filtering
- `POST /api/odc` - Create new ODC
- `PUT /api/odc/:id` - Update ODC
- `GET /api/odc/:id/coverage` - Get ODC coverage polygon

### 4.3 Vendor Management APIs

- `GET /api/vendors` - Get all vendors with performance metrics
- `POST /api/vendors` - Create new vendor
- `PUT /api/vendors/:id` - Update vendor
- `GET /api/vendors/:id/performance` - Get vendor performance analytics
- `GET /api/vendors/:id/projects` - Get all projects assigned to vendor

### 4.4 Project Enhancement APIs

- `GET /api/projects/:uid/timeline` - Get project timeline with milestones
- `POST /api/projects/:uid/milestones` - Add milestone to project
- `PUT /api/projects/:uid/status` - Update project status with validation
- `GET /api/projects/:uid/documents` - Get all documents for project
- `POST /api/projects/:uid/documents` - Upload document

### 4.5 Analytics & Reporting APIs

- `GET /api/analytics/dashboard` - Get dashboard KPIs
- `GET /api/analytics/trends` - Get trend data for charts
- `GET /api/analytics/distribution` - Get distribution data
- `POST /api/reports/generate` - Generate custom report

### 4.6 GIS & Mapping APIs

- `GET /api/map/olts` - Get OLT locations for map (GeoJSON)
- `GET /api/map/odcs` - Get ODC locations and polygons
- `GET /api/map/coverage` - Get coverage analysis
- `POST /api/map/proximity` - Find nearest ODC/OLT from coordinates

### 4.7 Notification APIs

- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all as read
- `POST /api/notifications/preferences` - Update notification preferences

### 4.8 Data Sync APIs

- `POST /api/sync/google-sheets` - Trigger sync from Google Sheets
- `GET /api/sync/status` - Get sync status and history

---

## 5. Komponen UI Baru

### 5.1 Dashboard Components
- `<KpiGrid />` - Display key performance indicators
- `<StatusPipeline />` - Kanban-style status board
- `<TimelineChart />` - Gantt chart for project timelines

### 5.2 Map Components
- `<NetworkMap />` - Interactive GIS map
- `<CoverageHeatmap />` - Heat map for network density

### 5.3 Analytics Components
- `<TrendChart />` - Line/area chart for trends
- `<DistributionChart />` - Pie/donut chart for distributions
- `<ComparisonTable />` - Side-by-side comparison

### 5.4 Form Components
- `<ProjectForm />` - Comprehensive project creation/edit form
- `<AanwijzingScheduler />` - Schedule aanwijzing sessions
- `<UtChecklist />` - Digital UT checklist

### 5.5 Data Display Components
- `<DataTable />` - Advanced data table with sorting, filtering, export
- `<DetailPanel />` - Slide-out detail panel

### 5.6 Visualization Components
- `<CapacityGauge />` - Circular gauge for capacity
- `<ProgressBar />` - Multi-segment progress bar

### 5.7 Utility Components
- `<FileUploader />` - Drag & drop file upload
- `<SearchBar />` - Advanced search with filters
- `<ExportButton />` - Export data in multiple formats

---

## 6. Data Synchronization Strategy

### 6.1 Recommended Approach: Scheduled Sync

**Implementation:**
```typescript
// Using node-cron for scheduled sync
import cron from 'node-cron';

// Run every hour
cron.schedule('0 * * * *', async () => {
  await syncFromGoogleSheets('jpp');
  await syncFromGoogleSheets('olt');
  await syncFromGoogleSheets('odc');
});
```

### 6.2 Sync Process Flow

1. **Fetch** data from Google Sheets API
2. **Validate** data structure and required fields
3. **Transform** data to database format
4. **Compare** with existing records
5. **Upsert** changed records in transaction
6. **Log** all changes to audit trail
7. **Notify** users of sync completion
8. **Handle** errors gracefully with retry logic

### 6.3 Error Handling

- Validation errors → Log and skip record
- API errors → Retry with exponential backoff
- Database errors → Rollback transaction
- Email notification for critical errors

### 6.4 Data Validation Rules

**JPP Sheet:**
- ID Proyek must be unique
- Status must be valid (0-8)
- ODP/Port must be numeric
- BOQ value must be positive

**OLT Sheet:**
- IP Address must be valid IPv4
- Hostname must be unique
- Coordinates must be valid lat/long

**ODC Sheet:**
- ODC Name must be unique
- STO must exist in reference data
- Splitter type must be 48/144/288

---

## 7. Implementation Roadmap

### Phase 1: Foundation & Quick Wins (Weeks 1-2)

**Week 1:**
- [ ] Setup database migrations untuk tabel baru
- [ ] Implement Google Sheets API integration
- [ ] Create sync service dengan manual trigger
- [ ] Enhance projects table dengan kolom baru

**Week 2:**
- [ ] Build OLT inventory table dan API
- [ ] Build ODC inventory table dan API
- [ ] Create basic vendor management
- [ ] Implement data validation layer

**Deliverables:**
- Working sync from Google Sheets
- Enhanced project data structure
- Basic OLT/ODC inventory

### Phase 2: Core Features (Weeks 3-6)

**Week 3:**
- [ ] Build Status Pipeline (Kanban board)
- [ ] Implement drag & drop status updates
- [ ] Create project detail page dengan tabs
- [ ] Add advanced filtering

**Week 4:**
- [ ] Build Interactive Network Map
- [ ] Implement OLT/ODC markers
- [ ] Add coverage polygons
- [ ] Create proximity search

**Week 5:**
- [ ] Build Analytics Dashboard
- [ ] Implement KPI cards
- [ ] Create trend charts
- [ ] Add distribution charts

**Week 6:**
- [ ] Build BOQ tracking system
- [ ] Implement variance analysis
- [ ] Create payment milestone tracking
- [ ] Add budget forecasting

**Deliverables:**
- Visual status pipeline
- Interactive GIS map
- Analytics dashboard
- BOQ management system

### Phase 3: Advanced Features (Weeks 7-10)

**Week 7:**
- [ ] Build Gantt chart timeline
- [ ] Implement milestone tracking
- [ ] Add critical path analysis
- [ ] Create dependency management

**Week 8:**
- [ ] Build Document Management System
- [ ] Implement file upload/download
- [ ] Add version control
- [ ] Create document preview

**Week 9:**
- [ ] Build Notification System
- [ ] Implement in-app notifications
- [ ] Add email notifications
- [ ] Create notification preferences

**Week 10:**
- [ ] Build Vendor Performance Dashboard
- [ ] Implement rating system
- [ ] Add performance metrics
- [ ] Create vendor comparison

**Deliverables:**
- Timeline management
- Document repository
- Notification system
- Vendor management

### Phase 4: Optimization & Polish (Weeks 11-12)

**Week 11:**
- [ ] Performance optimization
- [ ] Implement caching strategy
- [ ] Add database indexes
- [ ] Optimize queries

**Week 12:**
- [ ] User acceptance testing
- [ ] Bug fixes
- [ ] Documentation
- [ ] Training materials

**Deliverables:**
- Optimized performance
- Complete documentation
- Training materials
- Production-ready system

---

## 8. Technical Considerations

### 8.1 Performance Optimization

**Database:**
- Add indexes pada frequently queried columns
- Use prepared statements untuk repeated queries
- Implement connection pooling
- Regular VACUUM untuk SQLite maintenance

**API:**
- Implement response caching (Redis optional)
- Use pagination untuk large datasets
- Compress responses dengan gzip
- Rate limiting untuk API endpoints

**Frontend:**
- Code splitting untuk reduce bundle size
- Lazy loading untuk components
- Virtual scrolling untuk large lists
- Debounce search inputs

### 8.2 Data Validation

**Input Validation:**
- Zod schemas untuk type-safe validation
- Sanitize user inputs
- Validate file uploads (type, size)
- Check coordinate bounds

**Business Logic Validation:**
- Status transition rules
- Capacity constraints
- Date logic (start < end)
- Budget constraints

### 8.3 Security Concerns

**Authentication & Authorization:**
- Implement user roles (admin, PM, engineer, viewer)
- Role-based access control (RBAC)
- Secure session management
- API key untuk external integrations

**Data Security:**
- Encrypt sensitive data at rest
- Use HTTPS untuk all communications
- Sanitize SQL queries (prevent injection)
- Validate file uploads (prevent malware)

**Audit & Compliance:**
- Log all data modifications
- Track user activities
- Implement data retention policies
- GDPR compliance (data export/delete)

### 8.4 Scalability

**Current Scale:**
- ~150 projects
- ~50 OLT devices
- ~200 ODC cabinets
- ~10 concurrent users

**Future Scale (3 years):**
- ~1000 projects
- ~200 OLT devices
- ~1000 ODC cabinets
- ~50 concurrent users

**Scalability Strategy:**
- SQLite sufficient untuk current scale
- Consider PostgreSQL untuk >5000 projects
- Implement read replicas jika needed
- Use CDN untuk static assets

---

## 9. Success Metrics

### 9.1 Technical KPIs

- **System Uptime**: >99.5%
- **API Response Time**: <500ms (p95)
- **Page Load Time**: <2s (p95)
- **Data Sync Success Rate**: >99%
- **Error Rate**: <0.1%

### 9.2 Business KPIs

- **User Adoption**: >80% active users dalam 3 bulan
- **Time Savings**: 50% reduction dalam manual reporting
- **Data Accuracy**: >95% data accuracy
- **Decision Speed**: 30% faster decision making
- **Cost Savings**: 20% reduction dalam operational costs

### 9.3 User Satisfaction KPIs

- **User Satisfaction Score**: >4.0/5.0
- **Feature Usage**: >70% feature adoption
- **Support Tickets**: <5 tickets per week
- **Training Completion**: >90% users trained

### 9.4 Operational KPIs

- **Project Completion Rate**: Track improvement
- **On-Time Delivery**: Track improvement
- **Budget Adherence**: Track variance reduction
- **Quality Score**: Track improvement

---

## 10. Next Steps

### Immediate Actions (This Week)

1. **Review & Approval**: Present plan ke stakeholders untuk approval
2. **Team Formation**: Assign developers ke each phase
3. **Environment Setup**: Setup development, staging, production environments
4. **Google Sheets Access**: Obtain API credentials dan sheet access

### Short-term Actions (Next 2 Weeks)

1. **Database Design**: Finalize schema dan create migrations
2. **API Design**: Finalize API contracts dan documentation
3. **UI/UX Design**: Create wireframes dan mockups
4. **Sprint Planning**: Break down tasks into 2-week sprints

### Long-term Actions (Next 3 Months)

1. **Development**: Execute implementation roadmap
2. **Testing**: Continuous testing dan QA
3. **Documentation**: Maintain technical dan user documentation
4. **Training**: Conduct user training sessions

---

## Appendix A: Technology Stack

**Backend:**
- Next.js 14 (App Router)
- TypeScript
- Better-SQLite3
- Node-cron (scheduling)

**Frontend:**
- React 18
- TailwindCSS
- Chart.js / Recharts
- Leaflet.js / Mapbox GL
- React DnD (drag & drop)

**External Services:**
- Google Sheets API
- Email service (SendGrid/AWS SES)
- File storage (local/S3)

**Development Tools:**
- Git (version control)
- ESLint + Prettier
- Vitest (testing)
- Postman (API testing)

---

## Appendix B: Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Google Sheets API rate limits | HIGH | MEDIUM | Implement caching, batch requests |
| Data inconsistency | HIGH | MEDIUM | Strong validation, audit logs |
| Performance degradation | MEDIUM | LOW | Optimization, monitoring |
| User resistance | MEDIUM | MEDIUM | Training, change management |
| Scope creep | HIGH | HIGH | Strict change control process |

---

**Document Version:** 1.0  
**Last Updated:** 2026-05-07  
**Author:** Technical Planning Team  
**Status:** Draft for Review