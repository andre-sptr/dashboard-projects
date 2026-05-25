# Flow Trace Maps Topology Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a second Network Topology view named "Map Trace" that shows STO, OLT, and ODC locations on a map while preserving the existing hierarchy/slot-port view as the default option.

**Architecture:** Keep `NetworkTopology.tsx` as the page-level coordinator with a segmented view switcher: `Hierarchy` renders the existing UI and `Map Trace` renders a new map context view. Store coordinates in a separate `topology_locations` table so imported `olt_odc_map` topology rows remain unchanged. Build map nodes and trace paths through pure utilities, then render them with `react-leaflet` in a dynamically loaded client component to avoid SSR issues.

**Tech Stack:** Next.js App Router, React 19, TypeScript, better-sqlite3, Vitest, React Testing Library, Leaflet, react-leaflet, Tailwind CSS.

---

## Scope

In scope:
- Add `Map Trace` as an optional view on `/topology`.
- Keep the current hierarchy topology view unchanged and selected by default.
- Add location metadata storage for `core`, `area`, `sto`, `olt`, and `odc` entities.
- Show map markers only for entities with verified coordinates.
- Show a clear missing-location panel for entities that do not have coordinates.
- Draw selected trace lines from Core -> Area/STO -> OLT -> Port/ODC when coordinates are available.
- Use existing source colors: master ports in emerald/green and AANWIJZING allocations in amber.

Out of scope:
- Do not replace the existing topology hierarchy view.
- Do not fake exact OLT/ODC coordinates.
- Do not implement ODC coverage polygons in this plan.
- Do not add a full coordinate management admin page in this plan.

## File Structure

- Modify `src/lib/migrations.ts`
  - Add migration `23` for `topology_locations`.
- Modify `src/types/database.ts`
  - Add `TopologyLocation` and related union types.
- Create `src/repositories/TopologyLocationRepository.ts`
  - Read and upsert verified map coordinates.
- Create `src/lib/topology-map.ts`
  - Pure utilities for flattening topology, joining location metadata, selecting traces, and reporting missing coordinates.
- Modify `src/app/(main)/topology/page.tsx`
  - Load locations on the server and pass them to `NetworkTopology`.
- Modify `src/components/features/topology/NetworkTopology.tsx`
  - Add view switcher, keep hierarchy view as default, pass map data into the new map view.
- Create `src/components/features/topology/TopologyMapView.tsx`
  - Client-only Leaflet map, side search panel, markers, trace lines, and missing-location panel.
- Modify `src/app/globals.css`
  - Import Leaflet CSS.
- Create `tests/topology-map.test.ts`
  - Unit tests for map context and trace building.
- Create `tests/network-topology-views.test.tsx`
  - UI tests for old view preservation and switching to Map Trace.

---

### Task 1: Add Topology Location Persistence

**Files:**
- Modify: `src/lib/migrations.ts`
- Modify: `src/types/database.ts`
- Create: `src/repositories/TopologyLocationRepository.ts`
- Test: `tests/topology-map.test.ts`

- [ ] **Step 1: Write failing repository tests**

Create `tests/topology-map.test.ts` with the repository test first:

```ts
import Database from 'better-sqlite3';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initializeSchema } from '../src/lib/schema';

const state = vi.hoisted(() => ({
  db: null as unknown as Database.Database,
}));

vi.mock('../src/lib/db', () => ({
  get db() {
    return state.db;
  },
}));

vi.mock('@/lib/db', () => ({
  get db() {
    return state.db;
  },
}));

async function setupDb() {
  vi.resetModules();
  state.db = new Database(':memory:');
  state.db.pragma('foreign_keys = ON');
  initializeSchema(state.db);
}

describe('TopologyLocationRepository', () => {
  beforeEach(async () => {
    await setupDb();
  });

  it('stores and returns verified topology map locations ordered by entity type and name', async () => {
    const { TopologyLocationRepository } = await import('../src/repositories/TopologyLocationRepository');

    TopologyLocationRepository.upsert({
      entity_type: 'odc',
      entity_name: 'ODC-AMK-FQ',
      area: 'AMK',
      sto: 'AMK-01',
      latitude: -0.9471,
      longitude: 100.4172,
      source: 'manual',
      confidence: 'verified',
      notes: 'Verified from field data',
    });

    const rows = TopologyLocationRepository.findAll();

    expect(rows).toMatchObject([
      {
        entity_type: 'odc',
        entity_name: 'ODC-AMK-FQ',
        area: 'AMK',
        sto: 'AMK-01',
        latitude: -0.9471,
        longitude: 100.4172,
        source: 'manual',
        confidence: 'verified',
      },
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
rtk npm run test:run -- tests/topology-map.test.ts
```

Expected: FAIL because `TopologyLocationRepository` does not exist.

- [ ] **Step 3: Add database type definitions**

Append this to the Topology Tables section in `src/types/database.ts`:

```ts
export type TopologyLocationEntityType = 'core' | 'area' | 'sto' | 'olt' | 'odc';
export type TopologyLocationConfidence = 'verified' | 'estimated';

/** Row from the `topology_locations` table. */
export interface TopologyLocation {
  id: number;
  entity_type: TopologyLocationEntityType;
  entity_name: string;
  area: string;
  sto: string;
  latitude: number;
  longitude: number;
  source: string;
  confidence: TopologyLocationConfidence;
  notes: string;
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 4: Add migration 23**

In `src/lib/migrations.ts`, update the header comment to include migration `23`, then append this migration before the closing `];`:

```ts
  {
    id: 23,
    name: 'create_topology_locations',
    run: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS topology_locations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          entity_type TEXT NOT NULL CHECK (entity_type IN ('core', 'area', 'sto', 'olt', 'odc')),
          entity_name TEXT NOT NULL,
          area TEXT DEFAULT '',
          sto TEXT DEFAULT '',
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          source TEXT DEFAULT 'manual',
          confidence TEXT NOT NULL DEFAULT 'verified' CHECK (confidence IN ('verified', 'estimated')),
          notes TEXT DEFAULT '',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(entity_type, entity_name, area, sto)
        );

        CREATE INDEX IF NOT EXISTS idx_topology_locations_entity
          ON topology_locations(entity_type, entity_name);
        CREATE INDEX IF NOT EXISTS idx_topology_locations_area_sto
          ON topology_locations(area, sto);
      `);
    }
  },
```

- [ ] **Step 5: Add repository**

Create `src/repositories/TopologyLocationRepository.ts`:

```ts
import { db } from '@/lib/db';
import type {
  TopologyLocation,
  TopologyLocationConfidence,
  TopologyLocationEntityType,
} from '@/types/database';

export interface TopologyLocationInput {
  entity_type: TopologyLocationEntityType;
  entity_name: string;
  area?: string;
  sto?: string;
  latitude: number;
  longitude: number;
  source?: string;
  confidence?: TopologyLocationConfidence;
  notes?: string;
}

export class TopologyLocationRepository {
  static findAll(): TopologyLocation[] {
    return db.prepare(`
      SELECT id, entity_type, entity_name, area, sto, latitude, longitude,
             source, confidence, notes, created_at, updated_at
      FROM topology_locations
      ORDER BY entity_type, area, sto, entity_name
    `).all() as TopologyLocation[];
  }

  static upsert(input: TopologyLocationInput): void {
    db.prepare(`
      INSERT INTO topology_locations (
        entity_type, entity_name, area, sto, latitude, longitude, source, confidence, notes, updated_at
      ) VALUES (
        @entity_type, @entity_name, @area, @sto, @latitude, @longitude, @source, @confidence, @notes, CURRENT_TIMESTAMP
      )
      ON CONFLICT(entity_type, entity_name, area, sto) DO UPDATE SET
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        source = excluded.source,
        confidence = excluded.confidence,
        notes = excluded.notes,
        updated_at = CURRENT_TIMESTAMP
    `).run({
      entity_type: input.entity_type,
      entity_name: input.entity_name,
      area: input.area ?? '',
      sto: input.sto ?? '',
      latitude: input.latitude,
      longitude: input.longitude,
      source: input.source ?? 'manual',
      confidence: input.confidence ?? 'verified',
      notes: input.notes ?? '',
    });
  }
}
```

- [ ] **Step 6: Run repository test**

Run:

```bash
rtk npm run test:run -- tests/topology-map.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/migrations.ts src/types/database.ts src/repositories/TopologyLocationRepository.ts tests/topology-map.test.ts
git commit -m "feat: add topology location metadata"
```

---

### Task 2: Build Pure Map Context Utilities

**Files:**
- Modify: `tests/topology-map.test.ts`
- Create: `src/lib/topology-map.ts`

- [ ] **Step 1: Add failing utility tests**

Append these tests to `tests/topology-map.test.ts`:

```ts
import type { TopologyHierarchy } from '../src/lib/topology';
import type { TopologyLocation } from '../src/types/database';
import { buildTopologyMapContext } from '../src/lib/topology-map';

const sampleTopology: TopologyHierarchy = {
  AMK: {
    'AMK-01': {
      'GPON00-D1-AMK-2': {
        name: 'GPON00-D1-AMK-2',
        type: 'OLT',
        oltType: 'big',
        portBase: 0,
        status: 'LIVE',
        plannedPorts: 16,
        realizedPorts: 2,
        maxSlot: 17,
        slots: [
          {
            slot: 1,
            frame: '1',
            maxPort: 15,
            ports: [
              null,
              {
                port: 1,
                odc_name: 'ODC-AMK-FQ',
                port_str: '1/1/1',
                source: 'master',
              },
              {
                port: 2,
                odc_name: 'ODC-AMK-FQ',
                port_str: '1/1/2',
                source: 'allocation',
                id_ihld: 'IHLD-2408',
                nama_lop: 'RKP AMK FQ',
              },
            ],
          },
        ],
      },
    },
  },
};

const sampleLocations: TopologyLocation[] = [
  {
    id: 1,
    entity_type: 'core',
    entity_name: 'SUMBAGTENG',
    area: '',
    sto: '',
    latitude: -0.9471,
    longitude: 100.4172,
    source: 'manual',
    confidence: 'verified',
    notes: '',
    created_at: '2026-05-25',
    updated_at: '2026-05-25',
  },
  {
    id: 2,
    entity_type: 'sto',
    entity_name: 'AMK-01',
    area: 'AMK',
    sto: 'AMK-01',
    latitude: -0.95,
    longitude: 100.42,
    source: 'manual',
    confidence: 'verified',
    notes: '',
    created_at: '2026-05-25',
    updated_at: '2026-05-25',
  },
  {
    id: 3,
    entity_type: 'olt',
    entity_name: 'GPON00-D1-AMK-2',
    area: 'AMK',
    sto: 'AMK-01',
    latitude: -0.951,
    longitude: 100.421,
    source: 'manual',
    confidence: 'verified',
    notes: '',
    created_at: '2026-05-25',
    updated_at: '2026-05-25',
  },
  {
    id: 4,
    entity_type: 'odc',
    entity_name: 'ODC-AMK-FQ',
    area: 'AMK',
    sto: 'AMK-01',
    latitude: -0.952,
    longitude: 100.423,
    source: 'manual',
    confidence: 'verified',
    notes: '',
    created_at: '2026-05-25',
    updated_at: '2026-05-25',
  },
];

describe('buildTopologyMapContext', () => {
  it('builds map nodes, traces, and missing-location summaries from topology data', () => {
    const context = buildTopologyMapContext(sampleTopology, sampleLocations, 'ODC-AMK-FQ');

    expect(context.nodes.map(node => `${node.entityType}:${node.name}`)).toEqual([
      'core:SUMBAGTENG',
      'sto:AMK-01',
      'olt:GPON00-D1-AMK-2',
      'odc:ODC-AMK-FQ',
    ]);
    expect(context.traces).toHaveLength(2);
    expect(context.traces[0]).toMatchObject({
      area: 'AMK',
      sto: 'AMK-01',
      oltName: 'GPON00-D1-AMK-2',
      odcName: 'ODC-AMK-FQ',
      source: 'master',
      portStr: '1/1/1',
    });
    expect(context.traces[1]).toMatchObject({
      source: 'allocation',
      portStr: '1/1/2',
      idIhld: 'IHLD-2408',
    });
    expect(context.missingLocations).toEqual([]);
  });

  it('does not create fake markers when location metadata is missing', () => {
    const context = buildTopologyMapContext(sampleTopology, [], 'ODC-AMK-FQ');

    expect(context.nodes).toEqual([]);
    expect(context.traces).toEqual([]);
    expect(context.missingLocations).toEqual([
      { entityType: 'core', name: 'SUMBAGTENG', area: '', sto: '' },
      { entityType: 'sto', name: 'AMK-01', area: 'AMK', sto: 'AMK-01' },
      { entityType: 'olt', name: 'GPON00-D1-AMK-2', area: 'AMK', sto: 'AMK-01' },
      { entityType: 'odc', name: 'ODC-AMK-FQ', area: 'AMK', sto: 'AMK-01' },
    ]);
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
rtk npm run test:run -- tests/topology-map.test.ts
```

Expected: FAIL because `src/lib/topology-map.ts` does not exist.

- [ ] **Step 3: Add pure topology map builder**

Create `src/lib/topology-map.ts`:

```ts
import type { TopologyHierarchy, PortEntry } from '@/lib/topology';
import type { TopologyLocation, TopologyLocationEntityType } from '@/types/database';

export interface TopologyMapNode {
  id: string;
  entityType: TopologyLocationEntityType;
  name: string;
  area: string;
  sto: string;
  latitude: number;
  longitude: number;
  confidence: TopologyLocation['confidence'];
}

export interface TopologyMapTrace {
  id: string;
  area: string;
  sto: string;
  oltName: string;
  odcName: string;
  portStr: string;
  source: PortEntry['source'];
  idIhld?: string;
  namaLop?: string;
  pathNodeIds: string[];
}

export interface MissingTopologyLocation {
  entityType: TopologyLocationEntityType;
  name: string;
  area: string;
  sto: string;
}

export interface TopologyMapContext {
  nodes: TopologyMapNode[];
  traces: TopologyMapTrace[];
  missingLocations: MissingTopologyLocation[];
}

const CORE_NAME = 'SUMBAGTENG';

function key(entityType: TopologyLocationEntityType, name: string, area: string, sto: string) {
  return `${entityType}|${name}|${area}|${sto}`;
}

function nodeId(entityType: TopologyLocationEntityType, name: string, area: string, sto: string) {
  return `${entityType}:${area}:${sto}:${name}`;
}

function getLocationMap(locations: TopologyLocation[]) {
  return new Map(
    locations.map(location => [
      key(location.entity_type, location.entity_name, location.area, location.sto),
      location,
    ])
  );
}

function addNode(
  nodes: Map<string, TopologyMapNode>,
  missing: Map<string, MissingTopologyLocation>,
  locationMap: Map<string, TopologyLocation>,
  entityType: TopologyLocationEntityType,
  name: string,
  area: string,
  sto: string
) {
  const exactKey = key(entityType, name, area, sto);
  const fallbackKey = key(entityType, name, '', '');
  const location = locationMap.get(exactKey) ?? locationMap.get(fallbackKey);
  const id = nodeId(entityType, name, area, sto);

  if (!location) {
    missing.set(id, { entityType, name, area, sto });
    return null;
  }

  const node: TopologyMapNode = {
    id,
    entityType,
    name,
    area,
    sto,
    latitude: location.latitude,
    longitude: location.longitude,
    confidence: location.confidence,
  };
  nodes.set(id, node);
  missing.delete(id);
  return node;
}

export function buildTopologyMapContext(
  topology: TopologyHierarchy | null,
  locations: TopologyLocation[],
  query = ''
): TopologyMapContext {
  if (!topology) {
    return { nodes: [], traces: [], missingLocations: [] };
  }

  const locationMap = getLocationMap(locations);
  const nodes = new Map<string, TopologyMapNode>();
  const missing = new Map<string, MissingTopologyLocation>();
  const traces: TopologyMapTrace[] = [];
  const normalizedQuery = query.trim().toLowerCase();

  addNode(nodes, missing, locationMap, 'core', CORE_NAME, '', '');

  for (const [area, stoMap] of Object.entries(topology)) {
    for (const [sto, oltMap] of Object.entries(stoMap)) {
      addNode(nodes, missing, locationMap, 'sto', sto, area, sto);

      for (const [oltName, olt] of Object.entries(oltMap)) {
        addNode(nodes, missing, locationMap, 'olt', oltName, area, sto);

        for (const slot of olt.slots) {
          for (const port of slot.ports) {
            if (!port) continue;
            const haystack = `${area} ${sto} ${oltName} ${port.odc_name} ${port.port_str} ${port.id_ihld ?? ''} ${port.nama_lop ?? ''}`.toLowerCase();
            if (normalizedQuery && !haystack.includes(normalizedQuery)) continue;

            const odcNode = addNode(nodes, missing, locationMap, 'odc', port.odc_name, area, sto);
            const stoNodeId = nodeId('sto', sto, area, sto);
            const oltNodeId = nodeId('olt', oltName, area, sto);
            const odcNodeId = nodeId('odc', port.odc_name, area, sto);

            if (nodes.has(stoNodeId) && nodes.has(oltNodeId) && odcNode) {
              traces.push({
                id: `${oltName}:${port.port_str}:${port.odc_name}`,
                area,
                sto,
                oltName,
                odcName: port.odc_name,
                portStr: port.port_str,
                source: port.source,
                idIhld: port.id_ihld,
                namaLop: port.nama_lop,
                pathNodeIds: [
                  nodeId('core', CORE_NAME, '', ''),
                  stoNodeId,
                  oltNodeId,
                  odcNodeId,
                ],
              });
            }
          }
        }
      }
    }
  }

  return {
    nodes: Array.from(nodes.values()),
    traces,
    missingLocations: Array.from(missing.values()),
  };
}
```

- [ ] **Step 4: Run utility tests**

Run:

```bash
rtk npm run test:run -- tests/topology-map.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/topology-map.ts tests/topology-map.test.ts
git commit -m "feat: build topology map context"
```

---

### Task 3: Wire Locations Into the Topology Page

**Files:**
- Modify: `src/app/(main)/topology/page.tsx`
- Modify: `src/components/features/topology/NetworkTopology.tsx`

- [ ] **Step 1: Extend `NetworkTopology` props without changing rendered output**

In `src/components/features/topology/NetworkTopology.tsx`, add the location type import:

```ts
import type { TopologyLocation } from '@/types/database';
```

Change the component signature:

```ts
interface NetworkTopologyProps {
  initialData: TopologyHierarchy | null;
  initialLocations?: TopologyLocation[];
}

export default function NetworkTopology({
  initialData,
  initialLocations = [],
}: NetworkTopologyProps) {
```

Add this memo near existing state declarations so the prop is used:

```ts
  const mapLocations = useMemo(() => initialLocations, [initialLocations]);
```

- [ ] **Step 2: Pass locations from the server page**

Modify `src/app/(main)/topology/page.tsx`:

```ts
import NetworkTopology from '@/components/features/topology/NetworkTopology';
import { getNetworkHierarchy } from '@/lib/topology';
import { seedOltOdcIfEmpty } from '@/lib/seed-olt-odc';
import { TopologyLocationRepository } from '@/repositories/TopologyLocationRepository';

export const dynamic = 'force-dynamic';

export default function TopologyPage() {
  seedOltOdcIfEmpty();
  const data = getNetworkHierarchy();
  const locations = TopologyLocationRepository.findAll();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            NETWORK <span className="text-blue-600">TOPOLOGY</span>
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            Visualisasi hirarki infrastruktur OLT (GPON) -&gt; ODC -&gt; ODP.
          </p>
        </div>
      </div>

      <NetworkTopology initialData={data} initialLocations={locations} />
    </div>
  );
}
```

- [ ] **Step 3: Run typecheck**

Run:

```bash
rtk npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(main)/topology/page.tsx" src/components/features/topology/NetworkTopology.tsx
git commit -m "feat: pass topology locations to topology page"
```

---

### Task 4: Add the View Switcher While Preserving the Old View

**Files:**
- Modify: `src/components/features/topology/NetworkTopology.tsx`
- Create: `tests/network-topology-views.test.tsx`

- [ ] **Step 1: Write failing UI test for view preservation**

Create `tests/network-topology-views.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import NetworkTopology from '../src/components/features/topology/NetworkTopology';
import type { TopologyHierarchy } from '../src/lib/topology';

vi.mock('next/dynamic', () => ({
  default: () => function MockTopologyMapView() {
    return <div data-testid="topology-map-view">Map Trace View</div>;
  },
}));

const topology: TopologyHierarchy = {
  AMK: {
    'AMK-01': {
      'GPON00-D1-AMK-2': {
        name: 'GPON00-D1-AMK-2',
        type: 'OLT',
        oltType: 'big',
        portBase: 0,
        status: 'LIVE',
        plannedPorts: 16,
        realizedPorts: 1,
        maxSlot: 17,
        slots: [
          {
            slot: 1,
            frame: '1',
            maxPort: 15,
            ports: [
              null,
              {
                port: 1,
                odc_name: 'ODC-AMK-FQ',
                port_str: '1/1/1',
                source: 'master',
              },
            ],
          },
        ],
      },
    },
  },
};

describe('NetworkTopology view modes', () => {
  it('keeps the hierarchy view as the default and switches to Map Trace on demand', () => {
    render(<NetworkTopology initialData={topology} initialLocations={[]} />);

    expect(screen.getByText('Core Network')).toBeInTheDocument();
    expect(screen.queryByTestId('topology-map-view')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Map Trace' }));

    expect(screen.getByTestId('topology-map-view')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Hierarchy' }));

    expect(screen.getByText('Core Network')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run UI test to verify failure**

Run:

```bash
rtk npm run test:run -- tests/network-topology-views.test.tsx
```

Expected: FAIL because the `Map Trace` button does not exist.

- [ ] **Step 3: Add dynamic map import and view state**

In `src/components/features/topology/NetworkTopology.tsx`, add imports:

```ts
import dynamic from 'next/dynamic';
import { MapPinned, Rows3 } from 'lucide-react';
import type { TopologyMapContext } from '@/lib/topology-map';
import { buildTopologyMapContext } from '@/lib/topology-map';
```

Add this after imports:

```ts
const TopologyMapView = dynamic(() => import('./TopologyMapView'), {
  ssr: false,
  loading: () => (
    <div className="glass-panel p-8 rounded-3xl border border-gray-200 dark:border-gray-800 min-h-[600px] flex items-center justify-center">
      <p className="text-xs font-black uppercase tracking-widest text-gray-400">Loading Map Trace...</p>
    </div>
  ),
});

type TopologyViewMode = 'hierarchy' | 'map';
```

Add state and map context inside the component:

```ts
  const [activeView, setActiveView] = useState<TopologyViewMode>('hierarchy');
  const mapContext = useMemo<TopologyMapContext>(
    () => buildTopologyMapContext(filteredData, mapLocations, searchQuery),
    [filteredData, mapLocations, searchQuery]
  );
```

- [ ] **Step 4: Add segmented view buttons to the toolbar**

Place this in the top toolbar before the collapse/fullscreen buttons:

```tsx
          <div className="flex items-center gap-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-1">
            <button
              type="button"
              onClick={() => setActiveView('hierarchy')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors ${
                activeView === 'hierarchy'
                  ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-900 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <Rows3 size={13} />
              Hierarchy
            </button>
            <button
              type="button"
              onClick={() => setActiveView('map')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors ${
                activeView === 'map'
                  ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-900 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <MapPinned size={13} />
              Map Trace
            </button>
          </div>
```

- [ ] **Step 5: Conditionally render the old view and the map view**

Wrap the existing main hierarchy panel and legend in a conditional:

```tsx
      {activeView === 'hierarchy' ? (
        <>
          {/* existing hierarchy panel stays here without behavior changes */}
          {/* existing legend stays here without behavior changes */}
        </>
      ) : (
        <TopologyMapView
          topology={filteredData}
          mapContext={mapContext}
          searchQuery={searchQuery}
          selectedArea={selectedArea}
          selectedSto={selectedSto}
        />
      )}
```

Move the existing hierarchy panel and legend into the `activeView === 'hierarchy'` branch. Do not edit the slot/port rendering logic while doing this step.

- [ ] **Step 6: Run UI test**

Run:

```bash
rtk npm run test:run -- tests/network-topology-views.test.tsx
```

Expected: FAIL because `TopologyMapView` has not been created.

- [ ] **Step 7: Commit after the failure is correct**

Do not commit this task until Task 5 creates the map component and the test passes.

---

### Task 5: Implement the Leaflet Map Trace View

**Files:**
- Create: `src/components/features/topology/TopologyMapView.tsx`
- Modify: `src/app/globals.css`
- Test: `tests/network-topology-views.test.tsx`

- [ ] **Step 1: Add Leaflet CSS import**

At the top of `src/app/globals.css`, keep Tailwind first and add Leaflet immediately after it:

```css
@import "tailwindcss";
@import "leaflet/dist/leaflet.css";
```

- [ ] **Step 2: Create the map component**

Create `src/components/features/topology/TopologyMapView.tsx`:

```tsx
'use client';

import { useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer } from 'react-leaflet';
import { AlertTriangle, Box, Database, MapPinned, Network, Search, Zap } from 'lucide-react';
import type { TopologyHierarchy } from '@/lib/topology';
import type {
  MissingTopologyLocation,
  TopologyMapContext,
  TopologyMapNode,
  TopologyMapTrace,
} from '@/lib/topology-map';

interface TopologyMapViewProps {
  topology: TopologyHierarchy | null;
  mapContext: TopologyMapContext;
  searchQuery: string;
  selectedArea: string;
  selectedSto: string;
}

const DEFAULT_CENTER: [number, number] = [-0.9471, 100.4172];

const markerStyle: Record<TopologyMapNode['entityType'], { color: string; fillColor: string; radius: number }> = {
  core: { color: '#1d4ed8', fillColor: '#2563eb', radius: 11 },
  area: { color: '#4f46e5', fillColor: '#6366f1', radius: 9 },
  sto: { color: '#0f172a', fillColor: '#1e293b', radius: 9 },
  olt: { color: '#059669', fillColor: '#10b981', radius: 8 },
  odc: { color: '#d97706', fillColor: '#f59e0b', radius: 8 },
};

function getTraceColor(trace: TopologyMapTrace) {
  return trace.source === 'allocation' ? '#f59e0b' : '#10b981';
}

function getCenter(nodes: TopologyMapNode[]): [number, number] {
  if (nodes.length === 0) return DEFAULT_CENTER;
  const lat = nodes.reduce((sum, node) => sum + node.latitude, 0) / nodes.length;
  const lng = nodes.reduce((sum, node) => sum + node.longitude, 0) / nodes.length;
  return [lat, lng];
}

function MissingLocations({ rows }: { rows: MissingTopologyLocation[] }) {
  if (rows.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/30">
      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
        <AlertTriangle size={16} />
        <h3 className="text-xs font-black uppercase tracking-widest">Missing Location Metadata</h3>
      </div>
      <p className="mt-2 text-xs font-medium text-amber-700/80 dark:text-amber-200/80">
        Marker hanya ditampilkan untuk entity yang punya koordinat. Tambahkan koordinat pada tabel topology_locations untuk entity berikut.
      </p>
      <div className="mt-3 max-h-40 space-y-1 overflow-y-auto">
        {rows.slice(0, 12).map(row => (
          <div key={`${row.entityType}-${row.area}-${row.sto}-${row.name}`} className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-2 text-[11px] font-bold text-amber-800 dark:bg-gray-900/40 dark:text-amber-200">
            <span>{row.entityType.toUpperCase()} - {row.name}</span>
            <span className="text-amber-600/70 dark:text-amber-300/70">{row.area || 'GLOBAL'} {row.sto}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TopologyMapView({
  topology,
  mapContext,
  searchQuery,
  selectedArea,
  selectedSto,
}: TopologyMapViewProps) {
  const [selectedTraceId, setSelectedTraceId] = useState<string>('');
  const center = useMemo(() => getCenter(mapContext.nodes), [mapContext.nodes]);
  const nodesById = useMemo(
    () => new Map(mapContext.nodes.map(node => [node.id, node])),
    [mapContext.nodes]
  );
  const selectedTrace = mapContext.traces.find(trace => trace.id === selectedTraceId) ?? mapContext.traces[0] ?? null;

  const tracePositions = (trace: TopologyMapTrace) => trace.pathNodeIds
    .map(id => nodesById.get(id))
    .filter((node): node is TopologyMapNode => Boolean(node))
    .map(node => [node.latitude, node.longitude] as [number, number]);

  if (!topology) {
    return (
      <div className="glass-panel min-h-[600px] rounded-3xl border border-gray-200 p-8 dark:border-gray-800">
        <p className="text-sm font-bold text-gray-500">Topology data belum tersedia.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="space-y-4">
        <div className="glass-panel rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <MapPinned size={16} />
            <h2 className="text-xs font-black uppercase tracking-widest">Map Trace</h2>
          </div>
          <div className="mt-4 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-500 dark:border-gray-700 dark:bg-gray-900">
            <Search size={13} className="mr-2 inline text-gray-400" />
            {searchQuery || 'Cari ODC, OLT, STO, Port...'}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
              {selectedArea || 'All Areas'}
            </span>
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:bg-gray-800 dark:text-gray-300">
              {selectedSto || 'All STO'}
            </span>
          </div>
        </div>

        <div className="glass-panel rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Trace Results</h3>
          <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
            {mapContext.traces.map(trace => (
              <button
                key={trace.id}
                type="button"
                onClick={() => setSelectedTraceId(trace.id)}
                className={`w-full rounded-xl border px-3 py-2 text-left transition-colors ${
                  selectedTrace?.id === trace.id
                    ? 'border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-950/30 dark:text-blue-200'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black">{trace.odcName}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${
                    trace.source === 'allocation'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                  }`}>
                    {trace.source}
                  </span>
                </div>
                <p className="mt-1 text-[11px] font-medium text-gray-500 dark:text-gray-400">
                  {trace.oltName} - {trace.portStr}
                </p>
              </button>
            ))}
            {mapContext.traces.length === 0 && (
              <p className="rounded-xl border border-dashed border-gray-300 p-4 text-xs font-medium text-gray-500 dark:border-gray-700">
                Tidak ada trace yang cocok dengan filter saat ini.
              </p>
            )}
          </div>
        </div>

        <MissingLocations rows={mapContext.missingLocations} />
      </aside>

      <section className="glass-panel overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-800">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-4 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <Network size={18} className="text-blue-600" />
            <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white">Geographic Trace Context</h3>
              <p className="text-xs font-medium text-gray-500">Klik marker atau trace untuk melihat detail teknis.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-500">
            <span className="inline-flex items-center gap-1.5"><Database size={12} /> STO</span>
            <span className="inline-flex items-center gap-1.5"><Zap size={12} /> OLT</span>
            <span className="inline-flex items-center gap-1.5"><Box size={12} /> ODC</span>
          </div>
        </div>

        <div className="h-[620px]">
          <MapContainer center={center} zoom={10} scrollWheelZoom className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {mapContext.traces.map(trace => {
              const positions = tracePositions(trace);
              if (positions.length < 2) return null;
              return (
                <Polyline
                  key={trace.id}
                  positions={positions}
                  pathOptions={{
                    color: getTraceColor(trace),
                    weight: selectedTrace?.id === trace.id ? 6 : 4,
                    opacity: selectedTrace?.id === trace.id ? 0.95 : 0.55,
                  }}
                  eventHandlers={{ click: () => setSelectedTraceId(trace.id) }}
                />
              );
            })}
            {mapContext.nodes.map(node => {
              const style = markerStyle[node.entityType];
              return (
                <CircleMarker
                  key={node.id}
                  center={[node.latitude, node.longitude]}
                  radius={style.radius}
                  pathOptions={{
                    color: style.color,
                    fillColor: style.fillColor,
                    fillOpacity: 0.9,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div className="space-y-1">
                      <p className="text-sm font-bold">{node.name}</p>
                      <p className="text-xs">{node.entityType.toUpperCase()} {node.area} {node.sto}</p>
                      <p className="text-xs">Location: {node.confidence}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Run UI test**

Run:

```bash
rtk npm run test:run -- tests/network-topology-views.test.tsx
```

Expected: PASS.

- [ ] **Step 4: Commit Tasks 4 and 5 together**

```bash
git add src/app/globals.css src/components/features/topology/NetworkTopology.tsx src/components/features/topology/TopologyMapView.tsx tests/network-topology-views.test.tsx
git commit -m "feat: add map trace topology view"
```

---

### Task 6: Add Seed Support for Location Metadata

**Files:**
- Create: `data/topology-locations.json`
- Create: `src/lib/seed-topology-locations.ts`
- Modify: `src/app/(main)/topology/page.tsx`
- Test: `tests/topology-map.test.ts`

- [ ] **Step 1: Add failing seed test**

Append this test to `tests/topology-map.test.ts`:

```ts
describe('seedTopologyLocations', () => {
  beforeEach(async () => {
    await setupDb();
  });

  it('seeds topology locations from JSON rows', async () => {
    const { seedTopologyLocationsFromRows } = await import('../src/lib/seed-topology-locations');
    const { TopologyLocationRepository } = await import('../src/repositories/TopologyLocationRepository');

    seedTopologyLocationsFromRows([
      {
        entity_type: 'core',
        entity_name: 'SUMBAGTENG',
        latitude: -0.9471,
        longitude: 100.4172,
        source: 'seed',
        confidence: 'verified',
      },
    ]);

    expect(TopologyLocationRepository.findAll()).toMatchObject([
      {
        entity_type: 'core',
        entity_name: 'SUMBAGTENG',
        latitude: -0.9471,
        longitude: 100.4172,
        source: 'seed',
        confidence: 'verified',
      },
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
rtk npm run test:run -- tests/topology-map.test.ts
```

Expected: FAIL because `seed-topology-locations` does not exist.

- [ ] **Step 3: Add seed file with an empty verified dataset**

Create `data/topology-locations.json`:

```json
[]
```

This file is intentionally empty in code. Real coordinates are deployment data and should be filled with verified rows before relying on exact marker positions.

- [ ] **Step 4: Add seed helper**

Create `src/lib/seed-topology-locations.ts`:

```ts
import fs from 'fs';
import path from 'path';
import type {
  TopologyLocationConfidence,
  TopologyLocationEntityType,
} from '@/types/database';
import { TopologyLocationRepository } from '@/repositories/TopologyLocationRepository';

interface SeedTopologyLocationRow {
  entity_type: TopologyLocationEntityType;
  entity_name: string;
  area?: string;
  sto?: string;
  latitude: number;
  longitude: number;
  source?: string;
  confidence?: TopologyLocationConfidence;
  notes?: string;
}

function isValidSeedRow(row: SeedTopologyLocationRow) {
  return Boolean(row.entity_type)
    && Boolean(row.entity_name)
    && Number.isFinite(row.latitude)
    && Number.isFinite(row.longitude);
}

export function seedTopologyLocationsFromRows(rows: SeedTopologyLocationRow[]) {
  for (const row of rows) {
    if (!isValidSeedRow(row)) continue;
    TopologyLocationRepository.upsert({
      entity_type: row.entity_type,
      entity_name: row.entity_name,
      area: row.area ?? '',
      sto: row.sto ?? '',
      latitude: row.latitude,
      longitude: row.longitude,
      source: row.source ?? 'seed',
      confidence: row.confidence ?? 'verified',
      notes: row.notes ?? '',
    });
  }
}

export function seedTopologyLocationsIfPresent() {
  const filePath = path.join(process.cwd(), 'data', 'topology-locations.json');
  if (!fs.existsSync(filePath)) return;

  const raw = fs.readFileSync(filePath, 'utf8');
  const rows = JSON.parse(raw) as SeedTopologyLocationRow[];
  seedTopologyLocationsFromRows(rows);
}
```

- [ ] **Step 5: Seed locations on the topology page**

Modify `src/app/(main)/topology/page.tsx`:

```ts
import { seedTopologyLocationsIfPresent } from '@/lib/seed-topology-locations';
```

Then call it after `seedOltOdcIfEmpty()`:

```ts
  seedOltOdcIfEmpty();
  seedTopologyLocationsIfPresent();
```

- [ ] **Step 6: Run seed tests**

Run:

```bash
rtk npm run test:run -- tests/topology-map.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add data/topology-locations.json src/lib/seed-topology-locations.ts "src/app/(main)/topology/page.tsx" tests/topology-map.test.ts
git commit -m "feat: seed topology map locations"
```

---

### Task 7: Final Verification

**Files:**
- Verify all files changed in previous tasks.

- [ ] **Step 1: Run focused tests**

```bash
rtk npm run test:run -- tests/topology-map.test.ts tests/network-topology-views.test.tsx tests/topology-allocation.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run lint**

```bash
rtk npm run lint
```

Expected: PASS.

- [ ] **Step 3: Run typecheck**

```bash
rtk npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Run production build**

```bash
rtk npm run build
```

Expected: PASS.

- [ ] **Step 5: Manual QA in browser**

Start the app:

```bash
rtk npm run dev
```

Open `/topology` and verify:
- The default view is still the existing hierarchy topology view.
- The old Area -> STO -> OLT expand/collapse behavior still works.
- The old slot/port matrix still shows Master, AANWIJZING Allocation, Selected, and Empty legend colors.
- Clicking `Map Trace` switches to the new map view.
- When `data/topology-locations.json` is empty, the map still renders and the missing-location panel explains which entities need coordinates.
- After adding a verified row to `data/topology-locations.json`, the corresponding marker appears after reload.
- Searching for an ODC filters the trace list and map traces.
- Switching back to `Hierarchy` restores the old view without losing search/filter values.

- [ ] **Step 6: Final commit if verification requires fixes**

If verification fixes are needed, commit them separately:

```bash
git add src tests data
git commit -m "fix: stabilize topology map trace view"
```

---

## Self-Review

Spec coverage:
- Preserve old view: covered by Task 4 and `network-topology-views.test.tsx`.
- Add Map Trace optional view: covered by Tasks 4 and 5.
- Integrate maps: covered by Task 5 with Leaflet and react-leaflet.
- Keep topology data unchanged: covered by Task 1 using a separate `topology_locations` table.
- Support missing coordinates safely: covered by Task 2 utility behavior and Task 5 UI panel.
- Load coordinate metadata: covered by Task 1 repository and Task 6 seed support.

Placeholder scan:
- No implementation step depends on undefined functions after its task completes.
- No fake exact coordinate generation is included.
- Empty `data/topology-locations.json` is explicit deployment data scaffolding, not a code placeholder.

Type consistency:
- `TopologyLocation.entity_type` maps to `TopologyMapNode.entityType`.
- `TopologyMapTrace.source` reuses `PortEntry['source']`.
- `NetworkTopology` receives `initialLocations?: TopologyLocation[]` and passes a `TopologyMapContext` into `TopologyMapView`.
