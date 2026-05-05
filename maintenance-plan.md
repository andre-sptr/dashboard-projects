# Dashboard Projects Sumbagteng - Maintenance Plan

**Document Version:** 1.0  
**Date:** May 5, 2026  
**Project Location:** `d:/dashboard-projects-sumbagteng`

---

## Executive Summary

This maintenance plan provides a comprehensive analysis of the Next.js dashboard project for tracking SLA project status in the Sumbagteng region. The project demonstrates solid foundational architecture with TypeScript, Next.js 16, and SQLite database integration. However, several areas require attention to improve long-term maintainability, scalability, and code quality.

**Overall Health Score:** 7/10

**Key Strengths:**
- Well-organized feature-based component structure
- Consistent use of TypeScript for type safety
- Proper separation of API routes and business logic
- Good use of Next.js App Router conventions

**Critical Areas for Improvement:**
- Missing comprehensive documentation (README, API docs)
- No error boundary implementation at component level
- Lack of environment variable validation
- Missing test coverage
- Inconsistent error handling patterns

---

## 1. Project Structure Analysis

### 1.1 Current Folder Organization

```
dashboard-projects-sumbagteng/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (main)/            # Main layout group
│   │   │   ├── aanwijzing/
│   │   │   ├── boq/
│   │   │   ├── dashboard/
│   │   │   ├── projects/
│   │   │   ├── report/
│   │   │   ├── topology/
│   │   │   └── ut/
│   │   └── api/               # API routes
│   │       ├── aanwijzing/
│   │       ├── boq/
│   │       ├── topology/
│   │       ├── ut/
│   │       └── webhook/
│   ├── components/            # React components
│   │   ├── dashboard/
│   │   ├── recap/
│   │   ├── report/
│   │   └── ut/
│   ├── lib/                   # Business logic & data access
│   └── utils/                 # Utility functions
├── data/                      # SQLite database storage
├── public/                    # Static assets
└── scratch/                   # Development scripts
```

**Assessment:** ✅ **Good**

The folder structure follows Next.js conventions and demonstrates clear separation of concerns:
- Route-based organization in `app/` directory
- Feature-based component grouping
- Separate `lib/` for business logic
- Clear distinction between utilities and libraries

**Priority:** Low

---

### 1.2 Component Hierarchy

**Current Organization:**

1. **Top-level Components** (7 files in `src/components/`)
   - `DashboardClient.tsx` - Main dashboard with filtering
   - `DashboardRecap.tsx` - Dashboard summary/recap view
   - `NetworkTopology.tsx` - Network visualization
   - `ReportClient.tsx` - Reporting interface
   - `Sidebar.tsx` - Navigation sidebar
   - `SyncButton.tsx` - Data synchronization
   - `Topbar.tsx` - Top navigation bar

2. **Feature-specific Components** (4 subdirectories)
   - `dashboard/` - DurationCounter, FilterSection, ProjectRow
   - `recap/` - DistributionCharts, KpiCard, RecentChanges, TimelineChart
   - `report/` - BranchRanking, PerformanceCharts, ReportFilters, ReportKpiGrid
   - `ut/` - (empty directory)

**Assessment:** ⚠️ **Needs Improvement**

**Issues Identified:**
1. **Inconsistent component placement**: Some feature components are at root level (e.g., `DashboardClient`, `ReportClient`) while others are in subdirectories
2. **Empty directory**: `src/components/ut/` exists but contains no files
3. **Mixed responsibilities**: `DashboardClient` handles both data fetching and UI rendering
4. **No shared/common directory**: Reusable components like buttons, inputs, cards are not centralized

**Priority:** Medium

---

### 1.3 API Route Organization

**Current Structure:**

```
src/app/api/
├── aanwijzing/route.ts       # GET, POST, DELETE
├── boq/
│   ├── route.ts              # GET, POST, DELETE
│   └── parse/route.ts        # POST (Excel parsing)
├── topology/route.ts         # GET
├── ut/route.ts               # GET, POST, DELETE
└── webhook/route.ts          # POST (sync from Google Sheets)
```

**Assessment:** ✅ **Good**

The API routes are well-organized with clear responsibilities. Each route handles a specific domain entity.

**Observations:**
- Consistent HTTP method usage (GET, POST, DELETE)
- Proper use of nested routes for related operations (`boq/parse`)
- All routes use `successResponse` and `errorResponse` helpers for consistency

**Priority:** Low

---

## 2. Code Organization Assessment

### 2.1 File Naming Conventions

**Analysis:**

| Category | Pattern | Consistency | Examples |
|----------|---------|-------------|----------|
| Components | PascalCase | ✅ Consistent | `DashboardClient.tsx`, `ProjectRow.tsx` |
| API Routes | lowercase | ✅ Consistent | `route.ts` (Next.js convention) |
| Libraries | camelCase | ✅ Consistent | `aanwijzing.ts`, `parseExcel.ts` |
| Utilities | camelCase | ✅ Consistent | `duration.ts`, `project.ts` |
| Types/Interfaces | PascalCase | ✅ Consistent | `Project`, `Aanwijzing`, `BoqRow` |

**Assessment:** ✅ **Excellent**

The project maintains consistent naming conventions across all file types, following TypeScript and React best practices.

**Priority:** Low

---

### 2.2 Module Boundaries and Dependencies

**Library Layer (`src/lib/`):**

```typescript
// Current dependencies:
aanwijzing.ts    → db.ts (database access)
boq.ts          → xlsx (external library)
db.ts           → better-sqlite3, schema.ts
parseExcel.ts   → xlsx, fs, path
topology.ts     → db.ts
ut.ts           → db.ts
schema.ts       → better-sqlite3
response.ts     → (no dependencies - pure utility)
```

**Assessment:** ⚠️ **Needs Improvement**

**Issues:**

1. **Tight coupling to database**: Most lib files directly import and use the database singleton
2. **No dependency injection**: Database instance is imported directly rather than passed as parameter
3. **Mixed concerns**: `parseExcel.ts` handles both HTTP fetching and file system operations
4. **No abstraction layer**: Direct SQL queries in multiple files without a repository pattern

**Recommendations:**
- Implement repository pattern for database access
- Create service layer for business logic
- Use dependency injection for better testability

**Priority:** High

---

### 2.3 Business Logic vs UI Components

**Current Separation:**

✅ **Good Practices:**
- API routes contain business logic in `src/app/api/`
- Data access layer in `src/lib/`
- Utility functions separated in `src/utils/`
- Components focus on presentation

⚠️**Issues:**

1. **Client components with business logic:**
   ```typescript
   // DashboardClient.tsx contains filtering logic
   const filteredProjects = useMemo(() => {
     return initialProjects.filter((p) => {
       // Complex filtering logic here
     });
   }, [/* dependencies */]);
   ```

2. **Data transformation in components:**
   ```typescript
   // ProjectRow.tsx parses JSON and formats data
   try {
     parsedHistory = JSON.parse(project.history || '[]');
   } catch { }
   ```

3. **Inline calculations:**
   ```typescript
   // ReportClient.tsx contains complex statistics calculations
   const stats = useMemo(() => {
     // 100+ lines of calculation logic
   }, [initialProjects]);
   ```

**Recommendations:**
- Extract filtering logic to custom hooks
- Move data transformation to utility functions
- Create dedicated service files for complex calculations

**Priority:** Medium

---

## 3. Maintainability Concerns

### 3.1 Code Duplication Patterns

**Identified Duplications:**

#### 3.1.1 JSON Parsing Pattern (High Priority)

**Location:** Multiple files  
**Occurrences:** 8+ instances

```typescript
// Pattern repeated across:
// - ProjectRow.tsx
// - DashboardClient.tsx
// - ReportClient.tsx
// - topology.ts
// - webhook/route.ts

try {
  const parsed = JSON.parse(data || '[]');
  return Array.isArray(parsed) ? parsed : [];
} catch {
  return [];
}
```

**Impact:** Medium  
**Recommendation:** Create utility function `safeJsonParse<T>(json: string, fallback: T): T`

**Priority:** High

---

#### 3.1.2 Date Formatting (Medium Priority)

**Location:** `project.ts`, `ProjectRow.tsx`  
**Occurrences:** 3 functions with similar logic

```typescript
// parseExcelDate, formatExcelDate, formatExcelDateShort
// All handle Excel date conversion with similar patterns
```

**Impact:** Low  
**Recommendation:** Consolidate into single function with options parameter

**Priority:** Medium

---

#### 3.1.3 Error Response Handling (Medium Priority)

**Location:** All API routes  
**Pattern:**

```typescript
try {
  // operation
  return successResponse(data, message);
} catch (error) {
  console.error('Error message:', error);
  return errorResponse('Gagal melakukan operasi');
}
```

**Impact:** Medium  
**Recommendation:** Create error handling middleware or wrapper function

**Priority:** Medium

---

#### 3.1.4 Database Query Patterns (Low Priority)

**Location:** `lib/aanwijzing.ts`, `lib/ut.ts`, `lib/boq.ts`  
**Pattern:** Similar prepared statement definitions

```typescript
export const getAllX = db.prepare('SELECT * FROM x');
export const upsertX = db.prepare('INSERT INTO x ...');
export const deleteX = db.prepare('DELETE FROM x WHERE id = ?');
```

**Impact:** Low  
**Recommendation:** Create generic repository class

**Priority:** Low

---

### 3.2 Error Handling Patterns

**Current State:**

✅ **Good Practices:**
- Consistent use of try-catch blocks in API routes
- Centralized error response formatting via `errorResponse()`
- Console logging for debugging

⚠️ **Issues:**

1. **Generic error messages:**
   ```typescript
   catch (error) {
     console.error('Error fetching aanwijzing:', error);
     return errorResponse('Gagal mengambil data'); // Too generic
   }
   ```

2. **No error type differentiation:**
   - Database errors
   - Validation errors
   - Network errors
   - All treated the same way

3. **Missing error boundaries:**
   - No React error boundaries for component errors
   - Only root-level `error.tsx` exists

4. **Silent failures in components:**
   ```typescript
   try {
     parsedHistory = JSON.parse(project.history || '[]');
   } catch { } // Silent failure, no logging
   ```

5. **No error tracking/monitoring:**
   - No integration with error tracking services (Sentry, etc.)
   - No structured error logging

**Recommendations:**

1. **Create error type hierarchy:**
   ```typescript
   class DatabaseError extends Error {}
   class ValidationError extends Error {}
   class ExternalServiceError extends Error {}
   ```

2. **Implement error boundaries:**
   - Add error boundaries for each major feature section
   - Create fallback UI components

3. **Enhance error messages:**
   - Include error codes
   - Provide actionable information
   - Log full error details server-side

4. **Add error monitoring:**
   - Integrate error tracking service
   - Implement structured logging

**Priority:** High

---

### 3.3 Configuration Management

**Current State:**

**Environment Variables Used:**
```typescript
// src/lib/parseExcel.ts
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_ID = process.env.SHEET_ID;
```

⚠️ **Critical Issues:**

1. **No validation:** Environment variables are used without validation
2. **No type safety:** Variables are `string | undefined`
3. **No centralized config:** Variables accessed directly in code
4. **No .env.example:** No template for required environment variables
5. **Runtime errors:** Missing variables cause runtime failures

**Current Error Handling:**
```typescript
if (!SPREADSHEET_ID || !SHEET_ID) {
  throw new Error('Environment variables SPREADSHEET_ID atau SHEET_ID belum diatur.');
}
```

**Recommendations:**

1. **Create centralized config file:**
   ```typescript
   // src/config/env.ts
   import { z } from 'zod';
   
   const envSchema = z.object({
     SPREADSHEET_ID: z.string().min(1),
     SHEET_ID: z.string().min(1),
     NODE_ENV: z.enum(['development', 'production', 'test']),
   });
   
   export const env = envSchema.parse(process.env);
   ```

2. **Create `.env.example`:**
   ```
   SPREADSHEET_ID=your_spreadsheet_id_here
   SHEET_ID=your_sheet_id_here
   ```

3. **Add startup validation:**
   - Validate all required environment variables on app start
   - Fail fast with clear error messages

**Priority:** High

---

### 3.4 Database Schema Management

**Current State:**

**Schema Definition:** `src/lib/schema.ts`

✅ **Good Practices:**
- Schema initialization on startup
- Migration logic for schema changes
- Use of WAL mode for better concurrency

⚠️ **Issues:**

1. **No migration versioning:**
   - Migrations are inline in `initializeSchema()`
   - No tracking of which migrations have been applied
   - Difficult to rollback changes

2. **No seed data:**
   - No way to populate database with test data
   - Manual data entry required for development

3. **No schema documentation:**
   - Table relationships not documented
   - Column purposes not explained
   - No ER diagram

4. **Hardcoded database path:**
   ```typescript
   const dbPath = path.join(process.cwd(), 'data/projects.db');
   ```

**Current Tables:**
- `projects` - Main project data
- `aanwijzing` - AANWIJZING records
- `boq` - Bill of Quantity data
- `boq_aanwijzing` - BoQ linked to AANWIJZING
- `ut` - UT (Uji Terima) records

**Recommendations:**

1. **Implement proper migrations:**
   - Use migration library (e.g., `better-sqlite3-migrations`)
   - Version each migration
   - Track applied migrations in database

2. **Create seed scripts:**
   ```typescript
   // scripts/seed.ts
   import db from '@/lib/db';
   // Populate with sample data
   ```

3. **Document schema:**
   - Create `docs/database-schema.md`
   - Include ER diagram
   - Document all tables, columns, and relationships

4. **Make database path configurable:**
   ```typescript
   const dbPath = process.env.DATABASE_PATH || 
                  path.join(process.cwd(), 'data/projects.db');
   ```

**Priority:** Medium

---

### 3.5 Type Safety and Validation

**Current State:**

✅ **Good Practices:**
- TypeScript enabled with strict mode
- Interfaces defined for main entities
- Type imports used consistently

⚠️ **Issues:**

1. **No runtime validation:**
   ```typescript
   // API routes accept any JSON without validation
   const body = await request.json();
   const { nama_lop, id_ihld, ... } = body; // No validation
   ```

2. **Type assertions without validation:**
   ```typescript
   const projects = getAllProjects.all('SUMBAGTENG') as Project[];
   ```

3. **Loose typing in components:**
   ```typescript
   // NetworkTopology.tsx
   export default function NetworkTopology({ initialData }: { initialData: any })
   ```

4. **No validation library:**
   - Manual validation checks scattered throughout code
   - Inconsistent validation patterns

**Recommendations:**

1. **Add validation library:**
   ```bash
   npm install zod
   ```

2. **Create validation schemas:**
   ```typescript
   // src/lib/validations/aanwijzing.ts
   import { z } from 'zod';
   
   export const aanwijzingSchema = z.object({
     nama_lop: z.string().min(1),
     id_ihld: z.string().min(1),
     tanggal_aanwijzing: z.string().datetime(),
     // ...
   });
   ```

3. **Validate API inputs:**
   ```typescript
   export async function POST(request: NextRequest) {
     const body = await request.json();
     const validated = aanwijzingSchema.parse(body); // Throws if invalid
     // ...
   }
   ```

4. **Type database results properly:**
   - Create type guards for database results
   - Validate data shape from database

**Priority:** High

---

## 4. Documentation Needs

### 4.1 Missing Documentation

**Critical Missing Documents:**

1. **README.md** ❌
   - No project overview
   - No setup instructions
   - No development guide
   - No deployment instructions

2. **API Documentation** ❌
   - No endpoint documentation
   - No request/response examples
   - No authentication details

3. **Component Documentation** ❌
   - No component usage examples
   - No prop documentation
   - No storybook or similar

4. **Database Documentation** ❌
   - No schema documentation
   - No relationship diagrams
   - No query examples

5. **Architecture Documentation** ❌
   - No system architecture overview
   - No data flow diagrams
   - No deployment architecture

**Priority:** High

---

### 4.2 Code Comments

**Current State:**

**Analysis of comment coverage:**
- API routes: Minimal comments
- Components: Almost no comments
- Utilities: No comments
- Libraries: No comments

**Examples of missing comments:**

```typescript
// src/lib/topology.ts - No explanation of column indices
const COLUMNS = {
    AREA: 4,
    STO: 5,
    BRANCH: 7,
    ODP_COUNT: 9,
    PLANNED_PORTS: 10,
    ODP_DATA: 28,
    REALIZED_PORTS: 29
};
```

```typescript
// src/utils/project.ts - No explanation of status classification
export function classifyStatus(status: string): StatusBucket {
  const s = status.toLowerCase();
  if (s.includes('done') || s.includes('golive')) return 'done';
  if (s.includes('progress') || s.includes('wip')) return 'progress';
  return 'other';
}
```

**Recommendations:**

1. **Add JSDoc comments for public APIs:**
   ```typescript
   /**
    * Classifies project status into predefined buckets
    * @param status - The raw status string from the project
    * @returns StatusBucket - 'done', 'progress', or 'other'
    * @example
    * classifyStatus('DONE - GOLIVE') // returns 'done'
    */
   export function classifyStatus(status: string): StatusBucket {
     // ...
   }
   ```

2. **Document complex logic:**
   - Add inline comments for non-obvious code
   - Explain business rules
   - Document magic numbers and constants

3. **Add file-level comments:**
   ```typescript
   /**
    * @fileoverview Handles network topology hierarchy construction
    * from project data and aanwijzing records. Builds OLT -> ODC -> ODP
    * tree structure for visualization.
    */
   ```

**Priority:** Medium

---

### 4.3 Recommended Documentation Structure

```
docs/
├── README.md                    # Project overview
├── SETUP.md                     # Setup and installation
├── DEVELOPMENT.md               # Development guide
├── DEPLOYMENT.md                # Deployment instructions
├── ARCHITECTURE.md              # System architecture
├── API.md                       # API documentation
├── DATABASE.md                  # Database schema
├── COMPONENTS.md                # Component library
├── TROUBLESHOOTING.md           # Common issues
└── CONTRIBUTING.md              # Contribution guidelines
```

**Priority:** High

---

## 5. Recommendations

### 5.1 High Priority (Immediate Action Required)

#### 5.1.1 Create Comprehensive README.md

**Effort:** 2-4 hours  
**Impact:** High  
**Difficulty:** Low

**Required Sections:**
- Project description and purpose
- Prerequisites (Node.js version, etc.)
- Installation steps
- Environment variable setup
- Running the development server
- Building for production
- Project structure overview
- Key features
- Technology stack

**Template:**
```markdown
# Dashboard Projects Sumbagteng

A Next.js dashboard for tracking SLA project status in the Sumbagteng region.

## Prerequisites
- Node.js 20.x or higher
- npm or pnpm

## Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and configure
4. Run development server: `npm run dev`

## Environment Variables
- `SPREADSHEET_ID` - Google Sheets spreadsheet ID
- `SHEET_ID` - Specific sheet ID within the spreadsheet

## Project Structure
...
```

---

#### 5.1.2 Implement Environment Variable Validation

**Effort:** 2-3 hours  
**Impact:** High  
**Difficulty:** Low

**Steps:**
1. Install validation library: `npm install zod`
2. Create `src/config/env.ts`
3. Define schema and validate on startup
4. Create `.env.example` file
5. Update documentation

**Implementation:**
```typescript
// src/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  SPREADSHEET_ID: z.string().min(1, 'SPREADSHEET_ID is required'),
  SHEET_ID: z.string().min(1, 'SHEET_ID is required'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_PATH: z.string().optional(),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
```

---

#### 5.1.3 Add Input Validation to API Routes

**Effort:** 4-6 hours  
**Impact:** High  
**Difficulty:** Medium

**Steps:**
1. Create validation schemas for each API endpoint
2. Add validation middleware or helper
3. Update error responses to include validation errors
4. Add tests for validation

**Example:**
```typescript
// src/lib/validations/aanwijzing.ts
import { z } from 'zod';

export const createAanwijzingSchema = z.object({
  nama_lop: z.string().min(1, 'Nama LOP wajib diisi'),
  id_ihld: z.string().min(1, 'ID IHLD wajib diisi'),
  tanggal_aanwijzing: z.string().datetime('Format tanggal tidak valid'),
  tematik: z.string().optional(),
  catatan: z.string().optional(),
  // ...
});

// In route.ts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createAanwijzingSchema.parse(body);
    // Use validated data
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400);
    }
    return errorResponse('Gagal menyimpan data');
  }
}
```

---

#### 5.1.4 Improve Error Handling

**Effort:** 6-8 hours  
**Impact:** High  
**Difficulty:** Medium

**Steps:**
1. Create custom error classes
2. Add error boundaries to components
3. Implement structured error logging
4. Add error tracking (optional: Sentry integration)
5. Improve error messages with actionable information

**Implementation:**
```typescript
// src/lib/errors.ts
export class DatabaseError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// src/components/ErrorBoundary.tsx
'use client';

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  // Implementation
}
```

---

#### 5.1.5 Extract Reusable Utility Functions

**Effort:** 3-4 hours  
**Impact:** Medium  
**Difficulty:** Low

**Steps:**
1. Create `src/utils/json.ts` for JSON parsing
2. Create `src/utils/validation.ts` for common validations
3. Consolidate date formatting functions
4. Update all usages across the codebase

**Implementation:**
```typescript
// src/utils/json.ts
export function safeJsonParse<T>(
  json: string,
  fallback: T
): T {
  try {
    const parsed = JSON.parse(json);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function safeJsonParseArray<T>(json: string): T[] {
  const parsed = safeJsonParse(json, []);
  return Array.isArray(parsed) ? parsed : [];
}
```

---

### 5.2 Medium Priority (Plan for Next Sprint)

#### 5.2.1 Reorganize Component Structure

**Effort:** 4-6 hours  
**Impact:** Medium  
**Difficulty:** Medium

**Proposed Structure:**
```
src/components/
├── common/              # Shared components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   └── Modal.tsx
├── layout/              # Layout components
│   ├── Sidebar.tsx
│   ├── Topbar.tsx
│   └── MainLayout.tsx
├── features/            # Feature-specific components
│   ├── dashboard/
│   ├── aanwijzing/
│   ├── boq/
│   ├── report/
│   ├── topology/
│   └── ut/
└── ui/                  # Pure UI components (shadcn/ui style)
```

**Steps:**
1. Create new directory structure
2. Move components to appropriate locations
3. Update all imports
4. Remove empty directories
5. Update documentation

---

#### 5.2.2 Implement Repository Pattern

**Effort:** 8-12 hours  
**Impact:** High  
**Difficulty:** High

**Benefits:**
- Better testability
- Cleaner separation of concerns
- Easier to swap database implementations
- Centralized query logic

**Implementation:**
```typescript
// src/lib/repositories/BaseRepository.ts
export abstract class BaseRepository<T> {
  constructor(protected db: Database) {}
  
  abstract getAll(): T[];
  abstract getById(id: string): T | undefined;
  abstract create(data: Partial<T>): T;
  abstract update(id: string, data: Partial<T>): T;
  abstract delete(id: string): void;
}

// src/lib/repositories/ProjectRepository.ts
export class ProjectRepository extends BaseRepository<Project> {
  getAll(): Project[] {
    return this.db.prepare('SELECT * FROM projects').all() as Project[];
  }
  
  getByRegion(region: string): Project[] {
    return this.db.prepare('SELECT * FROM projects WHERE region = ?')
      .all(region) as Project[];
  }
  
  // ... other methods
}
```

---

#### 5.2.3 Add Database Migration System

**Effort:** 6-8 hours  
**Impact:** Medium  
**Difficulty:** Medium

**Steps:**
1. Install migration library: `npm install better-sqlite3-migrations`
2. Create migrations directory
3. Extract current schema to initial migration
4. Update schema initialization
5. Create migration scripts
6. Document migration process

**Structure:**
```
migrations/
├── 001_initial_schema.sql
├── 002_add_batch_program.sql
└── 003_add_indexes.sql
```

---

#### 5.2.4 Consolidate Date Formatting

**Effort:** 2-3 hours  
**Impact:** Low  
**Difficulty:** Low

**Steps:**
1. Create single date utility with options
2. Replace all date formatting calls
3. Add tests for date utilities
4. Document date handling

**Implementation:**
```typescript
// src/utils/date.ts
export interface DateFormatOptions {
  format: 'full' | 'short' | 'iso';
  fallback?: string;
}

export function formatExcelDate(
  value: unknown,
  options: DateFormatOptions = { format: 'full', fallback: '-' }
): string {
  // Unified implementation
}
```

---

#### 5.2.5 Create API Documentation

**Effort:** 4-6 hours  
**Impact:** Medium  
**Difficulty:** Low

**Steps:**
1. Document all API endpoints
2. Include request/response examples
3. Document error codes
4. Add authentication details (if applicable)
5. Create Postman collection or OpenAPI spec

**Template:**
```markdown
# API Documentation

## Endpoints

### POST /api/aanwijzing

Create or update AANWIJZING record.

**Request Body:**
```json
{
  "nama_lop": "string (required)",
  "id_ihld": "string (required)",
  "tanggal_aanwijzing": "string (ISO 8601, required)",
  "catatan": "string (optional)"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { "id": "AAN-..." },
  "message": "Data AANWIJZING berhasil disimpan"
}
```

**Errors:**
- 400: Validation error
- 500: Server error
```

---

### 5.3 Low Priority (Future Enhancements)

#### 5.3.1 Add Unit Tests

**Effort:** 16-24 hours  
**Impact:** High  
**Difficulty:** Medium

**Steps:**
1. Install testing framework: `npm install -D vitest @testing-library/react`
2. Create test setup
3. Write tests for utilities
4. Write tests for API routes
5. Write tests for components
6. Set up CI/CD for tests

**Target Coverage:**
- Utilities: 90%+
- API routes: 80%+
- Components: 60%+

---

#### 5.3.2 Implement Logging System

**Effort:** 4-6 hours  
**Impact:** Medium  
**Difficulty:** Low

**Steps:**
1. Install logging library: `npm install pino`
2. Create logger configuration
3. Replace console.log/error with logger
4. Add request logging middleware
5. Configure log rotation

---

#### 5.3.3 Add Performance Monitoring

**Effort:** 6-8 hours  
**Impact:** Medium  
**Difficulty:** Medium

**Steps:**
1. Add performance metrics collection
2. Monitor database query performance
3. Track API response times
4. Monitor client-side performance
5. Set up dashboards

---

#### 5.3.4 Implement Caching Strategy

**Effort:** 8-12 hours  
**Impact:** Medium  
**Difficulty:** Medium

**Areas for caching:**
- Project list (with invalidation on sync)
- Network topology data
- Report statistics
- Filter options

**Implementation:**
```typescript
// Use Next.js built-in caching
export const revalidate = 300; // 5 minutes

// Or implement Redis caching for API routes
```

---

#### 5.3.5 Create Component Library/Storybook

**Effort:** 12-16 hours  
**Impact:** Low  
**Difficulty:** Medium

**Steps:**
1. Install Storybook: `npx storybook@latest init`
2. Create stories for common components
3. Document component props
4. Add interaction tests
5. Deploy Storybook

---

### 5.4 Refactoring Opportunities

#### 5.4.1 Extract Business Logic from Components

**Target Components:**
- `DashboardClient.tsx` - Extract filtering logic
- `ReportClient.tsx` - Extract statistics calculations
- `ProjectRow.tsx` - Extract data transformation

**Approach:**
```typescript
// Before (in component)
const stats = useMemo(() => {
  // 100+ lines of calculation
}, [projects]);

// After (in service)
// src/services/reportService.ts
export function calculateReportStats(projects: Project[]) {
  // Calculation logic
}

// In component
const stats = useMemo(
  () => calculateReportStats(projects),
  [projects]
);
```

---

#### 5.4.2 Create Custom Hooks

**Opportunities:**
- `useProjectFilters` - For dashboard filtering
- `useProjectStats` - For statistics calculation
- `useSyncStatus` - For sync button state
- `useNetworkTopology` - For topology data

**Example:**
```typescript
// src/hooks/useProjectFilters.ts
export function useProjectFilters(projects: Project[]) {
  const [filters, setFilters] = useState<FilterState>({});
  
  const filteredProjects = useMemo(
    () => applyFilters(projects, filters),
    [projects, filters]
  );
  
  return { filteredProjects, filters, setFilters };
}
```

---

#### 5.4.3 Standardize Error Handling in API Routes

**Current:** Each route has similar try-catch blocks  
**Proposed:** Create error handling wrapper

```typescript
// src/lib/api/withErrorHandling.ts
export function withErrorHandling<T>(
  handler: (request: NextRequest) => Promise<Response>
) {
  return async (request: NextRequest) => {
    try {
      return await handler(request);
    } catch (error) {
      if (error instanceof ValidationError) {
        return errorResponse(error.message, 400);
      }
      if (error instanceof DatabaseError) {
        return errorResponse('Database error', 500);
      }
      console.error('Unhandled error:', error);
      return errorResponse('Internal server error', 500);
    }
  };
}

// Usage
export const POST = withErrorHandling(async (request) => {
  // Handler logic
});
```

---

## 6. Best Practices to Adopt

### 6.1 Code Quality

1. **Enable stricter TypeScript rules:**
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "strict": true,
       "noUncheckedIndexedAccess": true,
       "noImplicitReturns": true,
       "noFallthroughCasesInSwitch": true
     }
   }
   ```

2. **Add ESLint rules:**
   ```bash
   npm install -D @typescript-eslint/eslint-plugin
   ```

3. **Add Prettier for code formatting:**
   ```bash
   npm install -D prettier eslint-config-prettier
   ```

4. **Set up pre-commit hooks:**
   ```bash
   npm install -D husky lint-staged
   ```

---

### 6.2 Development Workflow

1. **Use conventional commits:**
   - feat: New feature
   - fix: Bug fix
   - docs: Documentation
   - refactor: Code refactoring
   - test: Adding tests

2. **Implement code review process:**
   - Require PR reviews before merging
   - Use PR templates
   - Run automated checks

3. **Set up CI/CD pipeline:**
   - Run tests on PR
   - Run linting
   - Build verification
   - Automated deployment

---

### 6.3 Security

1. **Add security headers:**
   ```typescript
   // next.config.ts
   const nextConfig = {
     async headers() {
       return [
         {
           source: '/:path*',
           headers: [
             { key: 'X-Frame-Options', value: 'DENY' },
             { key: 'X-Content-Type-Options', value: 'nosniff' },
             // ... other headers
           ],
         },
       ];
     },
   };
   ```

2. **Implement rate limiting:**
   ```bash
   npm install @upstash/ratelimit
   ```

3. **Add input sanitization:**
   - Sanitize user inputs
   - Validate file uploads
   - Prevent SQL injection (already using prepared statements ✅)

4. **Secure environment variables:**
   - Never commit `.env` files
   - Use secrets management in production
   - Rotate credentials regularly

---

### 6.4 Performance

1. **Implement database indexes:**
   ```sql
   CREATE INDEX idx_projects_region ON projects(region);
   CREATE INDEX idx_projects_status ON projects(status);
   CREATE INDEX idx_projects_last_changed ON projects(last_changed_at);
   ```

2. **Optimize database queries:**
   - Use prepared statements (already done ✅)
   - Add pagination for large datasets
   - Use database views for complex queries

3. **Implement lazy loading:**
   - Lazy load heavy components
   - Use dynamic imports
   - Implement virtual scrolling for long lists

4. **Optimize bundle size:**
   - Analyze bundle with `@next/bundle-analyzer`
   - Remove unused dependencies
   - Use tree-shaking

---

### 6.5 Accessibility

1. **Add ARIA labels:**
   ```tsx
   <button aria-label="Close sidebar" onClick={onClose}>
     <X />
   </button>
   ```

2. **Ensure keyboard navigation:**
   - All interactive elements accessible via keyboard
   - Proper focus management
   - Skip links for navigation

3. **Add semantic HTML:**
   - Use proper heading hierarchy
   - Use semantic elements (nav, main, aside, etc.)
   - Add alt text for images

4. **Test with screen readers:**
   - Test with NVDA/JAWS
   - Ensure proper reading order
   - Test form accessibility

---

## 7. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

**Goal:** Establish documentation and critical fixes

- [ ] Create comprehensive README.md
- [ ] Implement environment variable validation
- [ ] Add input validation to API routes
- [ ] Create `.env.example` file
- [ ] Improve error handling
- [ ] Extract reusable utility functions

**Estimated Effort:** 20-25 hours

---

### Phase 2: Code Quality (Week 3-4)

**Goal:** Improve code organization and maintainability

- [ ] Reorganize component structure
- [ ] Implement repository pattern
- [ ] Add database migration system
- [ ] Consolidate date formatting
- [ ] Create API documentation
- [ ] Add JSDoc comments to public APIs

**Estimated Effort:** 30-35 hours

---

### Phase 3: Testing & Monitoring (Week 5-6)

**Goal:** Add testing and observability

- [ ] Set up testing framework
- [ ] Write unit tests for utilities
- [ ] Write integration tests for API routes
- [ ] Implement logging system
- [ ] Add error tracking (Sentry)
- [ ] Set up performance monitoring

**Estimated Effort:** 25-30 hours

---

### Phase 4: Optimization (Week 7-8)

**Goal:** Improve performance and user experience

- [ ] Implement caching strategy
- [ ] Add database indexes
- [ ] Optimize bundle size
- [ ] Implement lazy loading
- [ ] Add accessibility improvements
- [ ] Create component library/Storybook

**Estimated Effort:** 30-35 hours

---

## 8. Metrics and Success Criteria

### 8.1 Code Quality Metrics

**Target Metrics:**

| Metric | Current | Target | Priority |
|--------|---------|--------|----------|
| TypeScript Coverage | 100% | 100% | ✅ Maintain |
| Test Coverage | 0% | 70%+ | High |
| Documentation Coverage | 10% | 80%+ | High |
| ESLint Errors | Unknown | 0 | Medium |
| Bundle Size | Unknown | <500KB | Low |
| Lighthouse Score | Unknown | 90+ | Medium |

---

### 8.2 Maintainability Metrics

**Target Improvements:**

| Area | Current State | Target State |
|------|---------------|--------------|
| Setup Time | Unknown | <15 minutes |
| Onboarding Time | Unknown | <2 hours |
| Bug Fix Time | Unknown | <1 day |
| Feature Development | Unknown | Predictable |
| Code Review Time | Unknown | <1 hour |

---

### 8.3 Success Criteria

**Phase 1 Success:**
- ✅ All developers can set up project in <15 minutes
- ✅ No runtime errors due to missing environment variables
- ✅ All API inputs validated
- ✅ Clear error messages for all failures

**Phase 2 Success:**
- ✅ Component structure is intuitive
- ✅ Database queries centralized
- ✅ Schema changes tracked and versioned
- ✅ API documentation complete

**Phase 3 Success:**
- ✅ 70%+ test coverage
- ✅ All errors logged and tracked
- ✅ Performance metrics collected
- ✅ CI/CD pipeline operational

**Phase 4 Success:**
- ✅ Page load time <2 seconds
- ✅ Bundle size optimized
- ✅ Accessibility score 90+
- ✅ Component library documented

---

## 9. Risk Assessment

### 9.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Breaking changes during refactoring | High | High | Comprehensive testing, gradual rollout |
| Database migration failures | Medium | High | Backup strategy, rollback plan |
| Performance degradation | Low | Medium | Performance testing, monitoring |
| Third-party dependency issues | Medium | Medium | Lock versions, regular updates |
| Data loss during sync | Low | High | Transaction handling, error recovery |

---

### 9.2 Organizational Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Lack of time for maintenance | High | High | Prioritize high-impact items |
| Knowledge silos | Medium | High | Documentation, code reviews |
| Resistance to change | Medium | Medium | Gradual adoption, clear benefits |
| Insufficient testing resources | High | Medium | Automated testing, CI/CD |

---

## 10. Conclusion

This Next.js dashboard project demonstrates solid foundational architecture with good separation of concerns and consistent coding practices. However, to ensure long-term maintainability and scalability, several improvements are necessary:

**Immediate Actions Required:**
1. Create comprehensive documentation (README, API docs)
2. Implement environment variable validation
3. Add input validation to all API routes
4. Improve error handling with proper error types
5. Extract reusable utility functions

**Medium-term Improvements:**
1. Reorganize component structure
2. Implement repository pattern for database access
3. Add database migration system
4. Create comprehensive test suite
5. Implement logging and monitoring

**Long-term Enhancements:**
1. Performance optimization
2. Accessibility improvements
3. Component library development
4. Advanced caching strategies

By following this maintenance plan and implementing the recommendations in a phased approach, the project will become more maintainable, scalable, and robust. The estimated total effort for all phases is approximately 105-125 hours, which can be distributed over 8 weeks with proper planning and resource allocation.

---

**Document Status:** Draft v1.0  
**Next Review:** After Phase 1 completion  
**Maintained By:** Development Team  
**Last Updated:** May 5, 2026