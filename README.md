# Dashboard Projects Sumbagteng

A comprehensive Next.js dashboard application for tracking and managing SLA project status changes in the Sumbagteng region. This system provides real-time monitoring, historical tracking, and detailed reporting for telecommunications infrastructure projects.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Development Workflow](#development-workflow)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

Dashboard Projects Sumbagteng is a specialized project management system designed for tracking telecommunications infrastructure projects. It provides:

- **Real-time Status Tracking**: Monitor project status changes with automatic duration calculations
- **Historical Data**: Complete history of status transitions with timestamps
- **Data Synchronization**: Webhook-based integration with external Excel data sources
- **Network Topology**: Visual representation of GPON network infrastructure
- **BoQ Management**: Bill of Quantities tracking and management
- **Aanwijzing & UT**: Site survey and user testing documentation
- **Comprehensive Reporting**: Analytics and performance metrics across multiple dimensions

## ✨ Features

### Core Features
- 📊 **Dashboard Overview**: Real-time project status with KPI cards and charts
- 🔄 **Automatic Sync**: Webhook integration for automatic data updates from Excel sources
- 📈 **Analytics & Reports**: Branch rankings, performance charts, and distribution analysis
- 🗺️ **Network Topology**: Interactive visualization of GPON network structure
- 📝 **Project Management**: CRUD operations for projects, aanwijzing, UT, and BoQ
- ⏱️ **Duration Tracking**: Automatic calculation of time spent in each status
- 🔍 **Advanced Filtering**: Filter by status, sub-status, batch, and date ranges
- 📱 **Responsive Design**: Mobile-friendly interface with Tailwind CSS

### Data Management
- **Projects**: Track project lifecycle from planning to completion
- **Aanwijzing**: Site survey documentation with GPON details
- **UT (User Testing)**: Testing results and findings management
- **BoQ (Bill of Quantities)**: Material and resource tracking
- **Network Topology**: GPON frame, slot, and port management

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 16.2.4](https://nextjs.org/) (App Router)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **UI Library**: [React 19.2.4](https://react.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts 3.8.1](https://recharts.org/)

### Backend
- **Runtime**: Node.js 20+
- **Database**: [SQLite](https://www.sqlite.org/) with [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- **Excel Parsing**: [xlsx 0.18.5](https://sheetjs.com/)

### Development Tools
- **Linting**: ESLint 9 with Next.js config
- **Type Checking**: TypeScript strict mode
- **Package Manager**: npm

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 20.x or higher
- **npm**: Version 10.x or higher (comes with Node.js)
- **Git**: For version control

Check your versions:
```bash
node --version  # Should be v20.x.x or higher
npm --version   # Should be 10.x.x or higher
```

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd dashboard-projects-sumbagteng
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js and React
- TypeScript and type definitions
- Tailwind CSS
- better-sqlite3 for database
- xlsx for Excel parsing
- Other dependencies

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Copy from example (if available)
cp .env.example .env.local

# Or create manually
touch .env.local
```

See [Environment Variables](#environment-variables) section for required variables.

### 4. Initialize Database

The database will be automatically created on first run. The SQLite database file will be created at:
```
data/projects.db
```

The schema includes tables for:
- `projects` - Main project tracking
- `aanwijzing` - Site survey data
- `ut` - User testing records
- `boq` - Bill of Quantities
- `boq_aanwijzing` - BoQ linked to aanwijzing
- `boq_ut` - BoQ linked to UT

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
dashboard-projects-sumbagteng/
├── .agents/                 # AI agent configurations
├── data/                    # SQLite database storage
│   └── projects.db         # Main database file
├── public/                  # Static assets
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── scratch/                 # Utility scripts
│   ├── check_ut_aanwijzing.js
│   └── find_gpon.js
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── (main)/        # Main layout group
│   │   │   ├── layout.tsx # Sidebar + Topbar layout
│   │   │   ├── dashboard/ # Dashboard page
│   │   │   ├── projects/  # Projects list page
│   │   │   ├── report/    # Reports page
│   │   │   ├── aanwijzing/# Aanwijzing management
│   │   │   ├── ut/        # UT management
│   │   │   ├── boq/       # BoQ management
│   │   │   └── topology/  # Network topology
│   │   ├── api/           # API routes
│   │   │   ├── aanwijzing/
│   │   │   ├── boq/
│   │   │   ├── topology/
│   │   │   ├── ut/
│   │   │   └── webhook/   # Data sync endpoint
│   │   ├── layout.tsx     # Root layout
│   │   ├── page.tsx       # Home page
│   │   ├── error.tsx      # Error boundary
│   │   ├── loading.tsx    # Loading state
│   │   ├── globals.css    # Global styles
│   │   └── favicon.ico
│   ├── components/         # React components
│   │   ├── dashboard/     # Dashboard-specific
│   │   ├── recap/         # Recap/analytics
│   │   ├── report/        # Report components
│   │   ├── ut/            # UT components
│   │   ├── DashboardClient.tsx
│   │   ├── DashboardRecap.tsx
│   │   ├── NetworkTopology.tsx
│   │   ├── ReportClient.tsx
│   │   ├── Sidebar.tsx
│   │   ├── SyncButton.tsx
│   │   └── Topbar.tsx
│   ├── lib/               # Core business logic
│   │   ├── db.ts          # Database connection & queries
│   │   ├── schema.ts      # Database schema & migrations
│   │   ├── response.ts    # API response helpers
│   │   ├── parseExcel.ts  # Excel parsing utilities
│   │   ├── aanwijzing.ts  # Aanwijzing logic
│   │   ├── boq.ts         # BoQ logic
│   │   ├── topology.ts    # Topology logic
│   │   └── ut.ts          # UT logic
│   └── utils/             # Utility functions
│       ├── duration.ts    # Duration calculations
│       └── project.ts     # Project utilities
├── .gitignore
├── eslint.config.mjs      # ESLint configuration
├── maintenance-plan.md    # Project maintenance plan
├── next.config.ts         # Next.js configuration
├── package.json           # Dependencies & scripts
├── postcss.config.mjs     # PostCSS configuration
├── README.md              # This file
└── tsconfig.json          # TypeScript configuration
```

### Key Directories

- **`src/app/`**: Next.js 13+ App Router with file-based routing
- **`src/components/`**: Reusable React components organized by feature
- **`src/lib/`**: Core business logic, database operations, and utilities
- **`src/utils/`**: Helper functions and utilities
- **`data/`**: SQLite database storage (auto-created)

## 🔐 Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Application
NODE_ENV=development

# Database (optional - defaults to data/projects.db)
DATABASE_PATH=./data/projects.db

# Google Sheets Configuration (for webhook sync)
# Get these from your Google Sheets URL:
# https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit#gid={SHEET_ID}
SPREADSHEET_ID=your_spreadsheet_id_here
SHEET_ID=your_sheet_id_here

# Optional: API Keys or Authentication
# API_KEY=your_api_key_here

# Optional: Public URL
# NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Environment Variable Descriptions

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Application environment (development/production/test) |
| `DATABASE_PATH` | No | `./data/projects.db` | Path to SQLite database file |
| `SPREADSHEET_ID` | Yes* | - | Google Sheets spreadsheet ID for webhook sync |
| `SHEET_ID` | Yes* | - | Google Sheets sheet ID (gid) for webhook sync |
| `API_KEY` | No | - | API key for external service authentication |
| `NEXT_PUBLIC_APP_URL` | No | - | Public URL of the application |

**Note**: The application will work without `SPREADSHEET_ID` and `SHEET_ID`, but the webhook sync feature will not function. Both are required together for the sync feature to work.

## 📜 Available Scripts

### Development

```bash
# Start development server with hot reload
npm run dev
```
Starts the development server at `http://localhost:3000`

### Production

```bash
# Build for production
npm run build

# Start production server
npm run start
```

The build process:
1. Compiles TypeScript
2. Optimizes React components
3. Generates static pages where possible
4. Creates optimized bundles

### Code Quality

```bash
# Run ESLint
npm run lint
```

Checks code for:
- TypeScript errors
- React best practices
- Next.js specific rules
- Code style issues

## 🔌 API Endpoints

All API routes are located in `src/app/api/` and follow RESTful conventions.

### Projects & Sync

#### `POST /api/webhook`
Synchronize project data from external Excel source.

**Request**: No body required
**Response**:
```json
{
  "success": true,
  "data": {
    "processed": 150,
    "message": "Data berhasil disinkronkan"
  }
}
```

### Aanwijzing (Site Survey)

#### `GET /api/aanwijzing`
Get all aanwijzing records with associated BoQ data.

**Response**:
```json
{
  "success": true,
  "data": {
    "aanwijzing": [...],
    "projects": [...]
  }
}
```

#### `POST /api/aanwijzing`
Create or update aanwijzing record.

**Request Body**:
```json
{
  "id": "AAN-123456",
  "nama_lop": "Project Name",
  "id_ihld": "IHLD123",
  "tanggal_aanwijzing": "2024-01-15",
  "gpon": "GPON-001",
  "frame": 1,
  "slot_awal": 1,
  "slot_akhir": 4,
  // ... other fields
}
```

#### `DELETE /api/aanwijzing?id=AAN-123456`
Delete aanwijzing record by ID.

### UT (User Testing)

#### `GET /api/ut`
Get all UT records with associated BoQ data.

#### `POST /api/ut`
Create or update UT record.

#### `DELETE /api/ut?id=UT-123456`
Delete UT record by ID.

### BoQ (Bill of Quantities)

#### `GET /api/boq`
Get all BoQ records.

#### `POST /api/boq`
Upload and parse BoQ Excel file.

**Request**: `multipart/form-data`
- `file`: Excel file (.xlsx or .xls)
- `nama_lop`: Project name
- `id_ihld`: Project ID

#### `POST /api/boq/parse`
Parse BoQ Excel file without saving.

#### `DELETE /api/boq?id=BOQ-123456`
Delete BoQ record by ID.

### Network Topology

#### `GET /api/topology`
Get network hierarchy (GPON → Frame → Slot → Port).

**Response**:
```json
{
  "success": true,
  "data": {
    "gpon_list": [...],
    "hierarchy": {
      "GPON-001": {
        "frames": {
          "1": {
            "slots": {
              "1": ["port1", "port2", ...]
            }
          }
        }
      }
    }
  }
}
```

### Response Format

All API endpoints return responses in this format:

**Success**:
```json
{
  "success": true,
  "data": { ... }
}
```

**Error**:
```json
{
  "success": false,
  "error": "Error message"
}
```

## 🗄️ Database Schema

The application uses SQLite with the following main tables:

### `projects`
Main project tracking table.

| Column | Type | Description |
|--------|------|-------------|
| `uid` | TEXT (PK) | Unique identifier (id_ihld::batch) |
| `id_ihld` | TEXT | Project ID |
| `batch_program` | TEXT | Batch/program identifier |
| `nama_lop` | TEXT | Project name |
| `region` | TEXT | Region (SUMBAGTENG) |
| `status` | TEXT | Current status |
| `sub_status` | TEXT | Current sub-status |
| `full_data` | TEXT | JSON array of all project data |
| `last_changed_at` | DATETIME | Last status change timestamp |
| `history` | TEXT | JSON array of status history |

### `aanwijzing`
Site survey documentation.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (PK) | Unique identifier |
| `nama_lop` | TEXT | Project name |
| `id_ihld` | TEXT | Project ID |
| `tematik` | TEXT | Theme/category |
| `tanggal_aanwijzing` | TEXT | Survey date |
| `gpon` | TEXT | GPON identifier |
| `frame` | INTEGER | Frame number |
| `slot_awal` | INTEGER | Starting slot |
| `slot_akhir` | INTEGER | Ending slot |
| `port_awal` | INTEGER | Starting port |
| `port_akhir` | INTEGER | Ending port |
| `wa_spang` | TEXT | WhatsApp contact |
| `ut` | TEXT | UT reference |
| `created_at` | DATETIME | Creation timestamp |
| `updated_at` | DATETIME | Last update timestamp |

### `ut`
User testing records.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (PK) | Unique identifier |
| `nama_lop` | TEXT | Project name |
| `id_ihld` | TEXT | Project ID |
| `witel` | TEXT | Witel area |
| `tematik` | TEXT | Theme/category |
| `sto` | TEXT | STO location |
| `tim_ut` | TEXT | UT team |
| `commtest_ut` | TEXT | Commtest result |
| `jumlah_odp` | INTEGER | Number of ODPs |
| `jumlah_port` | INTEGER | Number of ports |
| `tanggal_ct_ut` | TEXT | Testing date |
| `temuan` | TEXT | Findings |
| `follow_up_mitra` | INTEGER | Partner follow-up count |
| `mitra` | TEXT | Partner name |
| `jumlah_temuan` | INTEGER | Number of findings |
| `wa_spang` | TEXT | WhatsApp contact |
| `komitmen_penyelesaian` | TEXT | Completion commitment |
| `created_at` | DATETIME | Creation timestamp |
| `updated_at` | DATETIME | Last update timestamp |

### `boq`
Bill of Quantities.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (PK) | Unique identifier |
| `nama_lop` | TEXT | Project name |
| `id_ihld` | TEXT | Project ID |
| `sto` | TEXT | STO location |
| `batch_program` | TEXT | Batch/program |
| `project_name` | TEXT | Full project name |
| `region` | TEXT | Region |
| `full_data` | TEXT | JSON array of BoQ items |
| `created_at` | DATETIME | Creation timestamp |
| `updated_at` | DATETIME | Last update timestamp |

### `boq_aanwijzing` & `boq_ut`
Junction tables linking BoQ to aanwijzing and UT records.

## 💻 Development Workflow

### 1. Local Development

```bash
# Start development server
npm run dev

# In another terminal, watch for TypeScript errors
npx tsc --watch --noEmit
```

### 2. Making Changes

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the project structure

3. **Test your changes** locally

4. **Lint your code**:
   ```bash
   npm run lint
   ```

5. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: description of your changes"
   ```

### 3. Code Style Guidelines

- Use TypeScript for all new files
- Follow existing naming conventions
- Add JSDoc comments for complex functions
- Keep components small and focused
- Use Tailwind CSS for styling
- Prefer server components over client components when possible

### 4. Database Changes

If you need to modify the database schema:

1. Update `src/lib/schema.ts`
2. Add migration logic in `initializeSchema()`
3. Test with a fresh database
4. Document changes in commit message

### 5. Adding New API Routes

1. Create route file in `src/app/api/[route-name]/route.ts`
2. Implement GET, POST, PUT, DELETE as needed
3. Use `successResponse()` and `errorResponse()` helpers
4. Add input validation
5. Update this README with endpoint documentation

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

## 📄 License

This project is private and proprietary. All rights reserved.

## 🆘 Support

For issues, questions, or contributions:

1. Check existing issues in the repository
2. Create a new issue with detailed description
3. Contact the development team

## 🔄 Version History

- **v0.1.0** (Current) - Initial release
  - Core dashboard functionality
  - Project tracking with status history
  - Aanwijzing, UT, and BoQ management
  - Network topology visualization
  - Webhook-based data synchronization
  - Comprehensive reporting

## 🚀 Roadmap

See [maintenance-plan.md](maintenance-plan.md) for detailed improvement plans including:

- Input validation with Zod
- Enhanced error handling
- Environment variable validation
- Code refactoring and optimization
- Testing infrastructure
- Performance improvements

---

**Built with ❤️ for Sumbagteng Region Telecommunications Infrastructure Management**