# Phase 1 Architecture Diagram

## System Architecture Overview

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI1[OLT Inventory Page]
        UI2[ODC Inventory Page]
        UI3[Vendor Management Page]
        SB[Sidebar Navigation]
    end

    subgraph "Component Layer"
        DT[DataTable Component]
        FM[FormModal Component]
        CG[CapacityGauge Component]
        FC[Filter Components]
    end

    subgraph "API Layer"
        API1[/api/olt]
        API2[/api/odc]
        API3[/api/vendors]
    end

    subgraph "Repository Layer"
        REPO1[OltRepository]
        REPO2[OdcRepository]
        REPO3[VendorRepository]
    end

    subgraph "Database Layer"
        DB[(SQLite Database)]
        M1[Migration #4: OLT Table]
        M2[Migration #5: ODC Table]
        M3[Migration #6: Vendors Table]
        M4[Migration #7: Projects Enhancement]
    end

    subgraph "Validation Layer"
        V1[OLT Schema]
        V2[ODC Schema]
        V3[Vendor Schema]
    end

    UI1 --> DT
    UI1 --> FM
    UI1 --> CG
    UI2 --> DT
    UI2 --> FM
    UI2 --> CG
    UI3 --> DT
    UI3 --> FM

    UI1 --> API1
    UI2 --> API2
    UI3 --> API3

    API1 --> V1
    API2 --> V2
    API3 --> V3

    API1 --> REPO1
    API2 --> REPO2
    API3 --> REPO3

    REPO1 --> DB
    REPO2 --> DB
    REPO3 --> DB

    M1 --> DB
    M2 --> DB
    M3 --> DB
    M4 --> DB

    SB -.-> UI1
    SB -.-> UI2
    SB -.-> UI3
```

## Database Schema Relationships

```mermaid
erDiagram
    OLT_INVENTORY ||--o{ ODC_INVENTORY : "has many"
    OLT_INVENTORY ||--o{ PROJECTS : "serves"
    ODC_INVENTORY ||--o{ PROJECTS : "serves"
    VENDORS ||--o{ PROJECTS : "executes"

    OLT_INVENTORY {
        text id PK
        text ip_address UK
        text hostname
        text brand
        text model
        text area
        text sto
        integer total_ports
        integer used_ports
        integer available_ports
        text status
    }

    ODC_INVENTORY {
        text id PK
        text odc_name UK
        text sto
        text olt_id FK
        text splitter_type
        integer max_capacity
        integer used_capacity
        integer available_capacity
        text status
    }

    VENDORS {
        text id PK
        text vendor_name UK
        text vendor_code UK
        real rating
        integer total_projects
        integer completed_projects
        real on_time_delivery_rate
        text status
    }

    PROJECTS {
        text uid PK
        text id_ihld
        text area
        text sto
        text vendor_id FK
        text olt_id FK
        text odc_id FK
        integer odp_planned
        integer odp_realized
        text status
    }
```

## Data Flow Diagram

```mermaid
sequenceDiagram
    participant User
    participant UI as UI Page
    participant API as API Route
    participant Val as Validation
    participant Repo as Repository
    participant DB as Database

    User->>UI: Create OLT Device
    UI->>API: POST /api/olt
    API->>Val: Validate Input
    Val-->>API: Valid Data
    API->>Repo: create(data)
    Repo->>DB: INSERT INTO olt_inventory
    DB-->>Repo: Success
    Repo-->>API: OLT Object
    API-->>UI: 201 Created
    UI-->>User: Success Message

    User->>UI: View OLT List
    UI->>API: GET /api/olt?area=X
    API->>Repo: findAll(filters)
    Repo->>DB: SELECT * FROM olt_inventory
    DB-->>Repo: OLT Records
    Repo-->>API: OLT Array
    API-->>UI: 200 OK
    UI-->>User: Display Table
```

## Component Hierarchy

```mermaid
graph TD
    A[App Layout] --> B[Sidebar]
    A --> C[Main Content]
    
    C --> D[OLT Page]
    C --> E[ODC Page]
    C --> F[Vendor Page]
    
    D --> G[OltFilters]
    D --> H[DataTable]
    D --> I[FormModal]
    D --> J[CapacityCard]
    
    E --> K[OdcFilters]
    E --> L[DataTable]
    E --> M[FormModal]
    E --> N[CapacityCard]
    
    F --> O[VendorFilters]
    F --> P[DataTable]
    F --> Q[FormModal]
    F --> R[PerformanceCard]
    
    H --> S[TableHeader]
    H --> T[TableBody]
    H --> U[Pagination]
    
    I --> V[FormFields]
    I --> W[SubmitButton]
```

## API Endpoint Structure

```mermaid
graph LR
    A[/api] --> B[/olt]
    A --> C[/odc]
    A --> D[/vendors]
    
    B --> B1[GET - List All]
    B --> B2[POST - Create]
    B --> B3[/id]
    B --> B4[/stats]
    
    B3 --> B3A[GET - Get One]
    B3 --> B3B[PUT - Update]
    B3 --> B3C[DELETE - Delete]
    
    B4 --> B4A[GET - Statistics]
    
    C --> C1[GET - List All]
    C --> C2[POST - Create]
    C --> C3[/id]
    
    C3 --> C3A[GET - Get One]
    C3 --> C3B[PUT - Update]
    C3 --> C3C[DELETE - Delete]
    
    D --> D1[GET - List All]
    D --> D2[POST - Create]
    D --> D3[/id]
    
    D3 --> D3A[GET - Get One]
    D3 --> D3B[PUT - Update]
    D3 --> D3C[DELETE - Delete]
    D3 --> D3D[/performance]
    
    D3D --> D3D1[GET - Performance Metrics]
```

## File Structure

```
src/
├── app/
│   ├── (main)/
│   │   ├── olt/
│   │   │   └── page.tsx              # OLT Inventory Page
│   │   ├── odc/
│   │   │   └── page.tsx              # ODC Inventory Page
│   │   └── vendors/
│   │       └── page.tsx              # Vendor Management Page
│   └── api/
│       ├── olt/
│       │   ├── route.ts              # GET, POST /api/olt
│       │   ├── [id]/
│       │   │   └── route.ts          # GET, PUT, DELETE /api/olt/[id]
│       │   └── stats/
│       │       └── route.ts          # GET /api/olt/stats
│       ├── odc/
│       │   ├── route.ts              # GET, POST /api/odc
│       │   └── [id]/
│       │       └── route.ts          # GET, PUT, DELETE /api/odc/[id]
│       └── vendors/
│           ├── route.ts              # GET, POST /api/vendors
│           └── [id]/
│               ├── route.ts          # GET, PUT, DELETE /api/vendors/[id]
│               └── performance/
│                   └── route.ts      # GET /api/vendors/[id]/performance
├── components/
│   ├── features/
│   │   ├── olt/
│   │   │   ├── OltTable.tsx
│   │   │   ├── OltForm.tsx
│   │   │   └── OltFilters.tsx
│   │   ├── odc/
│   │   │   ├── OdcTable.tsx
│   │   │   ├── OdcForm.tsx
│   │   │   └── OdcFilters.tsx
│   │   └── vendors/
│   │       ├── VendorTable.tsx
│   │       ├── VendorForm.tsx
│   │       └── VendorPerformanceCard.tsx
│   ├── ui/
│   │   ├── DataTable.tsx             # Reusable table component
│   │   ├── FormModal.tsx             # Reusable modal component
│   │   └── CapacityGauge.tsx         # Capacity visualization
│   └── layout/
│       └── Sidebar.tsx               # Updated with new menu items
├── repositories/
│   ├── OltRepository.ts              # OLT CRUD operations
│   ├── OdcRepository.ts              # ODC CRUD operations
│   └── VendorRepository.ts           # Vendor CRUD operations
└── lib/
    ├── migrations.ts                 # Database migrations
    ├── validation.ts                 # Zod schemas
    └── db.ts                         # Database connection
```

## Technology Stack

```mermaid
graph TB
    subgraph "Frontend"
        A[Next.js 14]
        B[React 18]
        C[TypeScript]
        D[TailwindCSS]
        E[Lucide Icons]
    end

    subgraph "Backend"
        F[Next.js API Routes]
        G[Better-SQLite3]
        H[Zod Validation]
    end

    subgraph "Development"
        I[ESLint]
        J[Prettier]
        K[Vitest]
    end

    A --> F
    B --> A
    C --> A
    C --> F
    D --> B
    E --> B
    F --> G
    F --> H
```

## Implementation Phases

```mermaid
gantt
    title Phase 1 Implementation Timeline
    dateFormat YYYY-MM-DD
    section Week 1: Database
    Create Migrations           :a1, 2026-05-07, 2d
    Create Repositories         :a2, after a1, 3d
    section Week 2: API
    Add Validation Schemas      :b1, after a2, 1d
    Create OLT API             :b2, after b1, 2d
    Create ODC & Vendor API    :b3, after b2, 2d
    section Week 3: UI
    Create Reusable Components :c1, after b3, 2d
    Create OLT Page            :c2, after c1, 1d
    Create ODC & Vendor Pages  :c3, after c2, 2d
    section Week 4: Testing
    Update Sidebar             :d1, after c3, 1d
    Integration Testing        :d2, after d1, 2d
    Bug Fixes & Documentation  :d3, after d2, 2d
```

---

**Document Version**: 1.0  
**Created**: 2026-05-07  
**Status**: Architecture Design Complete