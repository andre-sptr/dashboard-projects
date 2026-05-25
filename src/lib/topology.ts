import { OltOdcRepository } from '@/repositories/OltOdcRepository';
import { TopologyAllocationRepository } from '@/repositories/TopologyAllocationRepository';

export interface PortEntry {
  port: number;
  odc_name: string;
  port_str: string;
  source: 'master' | 'allocation';
  nama_lop?: string;
  id_ihld?: string;
  aanwijzing_id?: string;
}

export interface SlotData {
  slot: number;
  frame: string;
  maxPort: number;
  ports: (PortEntry | null)[];
}

export type OltType = 'mini' | 'big';

export interface OltData {
  name: string;
  type: 'OLT';
  oltType: OltType;
  /**
   * The first port number used by this OLT's vendor. HUAWEI numbers ports from
   * 0 (0–15), ZTE from 1 (1–16). Vendor is not stored in the source data, so
   * this is inferred from the ports actually present (see getNetworkHierarchy).
   */
  portBase: 0 | 1;
  status: string;
  plannedPorts: number;
  realizedPorts: number;
  slots: SlotData[];
  maxSlot: number;
}

/**
 * Classify an OLT as a "big" chassis OLT or a compact "mini" OLT based on its
 * name. The final dash-segment encodes the device: a purely numeric suffix
 * (e.g. "GPON00-D1-AMK-2", "GPON01-D1-AMK-3") is a big chassis OLT, while a
 * suffix carrying trailing letters (e.g. "GPON00-D1-AMK-2UKUI",
 * "GPON00-D1-AMK-3SGL") is a mini OLT.
 */
export function classifyOltType(oltName: string): OltType {
  const lastSegment = oltName.trim().split('-').pop() ?? '';
  return /[A-Za-z]/.test(lastSegment) ? 'mini' : 'big';
}

export type StoData = Record<string, OltData>;
export type AreaData = Record<string, StoData>;
export type TopologyHierarchy = Record<string, AreaData>;

export function getNetworkHierarchy(): TopologyHierarchy {
  const rows = OltOdcRepository.findAll();
  const allocations = TopologyAllocationRepository.findAll();
  const hierarchy: TopologyHierarchy = {};

  type SlotInfo = { frame: string; maxPort: number; portEntries: Map<number, PortEntry> };
  const slotMaps: Record<string, Record<string, Record<string, Map<number, SlotInfo>>>> = {};

  const addPort = (row: {
    area: string;
    sto: string;
    olt_name: string;
    odc_name: string;
    port_str: string;
    frame: string;
    slot: number;
    port: number;
    source: 'master' | 'allocation';
    nama_lop?: string;
    id_ihld?: string;
    aanwijzing_id?: string;
  }) => {
    if (!row.area || !row.sto || !row.olt_name) return;

    if (!hierarchy[row.area]) hierarchy[row.area] = {};
    if (!hierarchy[row.area][row.sto]) hierarchy[row.area][row.sto] = {};
    if (!hierarchy[row.area][row.sto][row.olt_name]) {
      hierarchy[row.area][row.sto][row.olt_name] = {
        name: row.olt_name,
        type: 'OLT',
        oltType: classifyOltType(row.olt_name),
        portBase: 1,
        status: 'LIVE',
        plannedPorts: 0,
        realizedPorts: 0,
        slots: [],
        maxSlot: 0,
      };
    }

    if (!slotMaps[row.area]) slotMaps[row.area] = {};
    if (!slotMaps[row.area][row.sto]) slotMaps[row.area][row.sto] = {};
    if (!slotMaps[row.area][row.sto][row.olt_name]) slotMaps[row.area][row.sto][row.olt_name] = new Map();

    const slotMap = slotMaps[row.area][row.sto][row.olt_name];
    if (!slotMap.has(row.slot)) {
      slotMap.set(row.slot, { frame: row.frame, maxPort: 0, portEntries: new Map() });
    }
    const slotInfo = slotMap.get(row.slot)!;
    if (row.port > slotInfo.maxPort) slotInfo.maxPort = row.port;
    slotInfo.portEntries.set(row.port, {
      port: row.port,
      odc_name: row.odc_name,
      port_str: row.port_str,
      source: row.source,
      nama_lop: row.nama_lop,
      id_ihld: row.id_ihld,
      aanwijzing_id: row.aanwijzing_id,
    });
  };

  for (const row of rows) {
    addPort({ ...row, source: 'master' });
  }

  for (const row of allocations) {
    addPort({
      area: row.area,
      sto: row.sto,
      olt_name: row.olt_name,
      odc_name: row.odc_name,
      port_str: row.port_str,
      frame: String(row.frame),
      slot: row.slot,
      port: row.port,
      source: 'allocation',
      nama_lop: row.nama_lop,
      id_ihld: row.id_ihld,
      aanwijzing_id: row.aanwijzing_id,
    });
  }

  for (const area of Object.keys(hierarchy)) {
    for (const sto of Object.keys(hierarchy[area])) {
      for (const oltName of Object.keys(hierarchy[area][sto])) {
        const slotMap = slotMaps[area]?.[sto]?.[oltName];
        if (!slotMap) continue;

        const olt = hierarchy[area][sto][oltName];
        const slotIndices = Array.from(slotMap.keys()).sort((a, b) => a - b);
        const maxSlotFromData = slotIndices.length > 0 ? slotIndices[slotIndices.length - 1] : 0;
        olt.maxSlot = Math.max(maxSlotFromData, 17);

        olt.slots = slotIndices.map(slotNum => {
          const info = slotMap.get(slotNum)!;
          const maxPort = Math.max(info.maxPort, 15);
          const ports: (PortEntry | null)[] = new Array(maxPort + 1).fill(null);
          for (const [portNum, entry] of info.portEntries) {
            ports[portNum] = entry;
          }
          return { slot: slotNum, frame: info.frame, maxPort, ports };
        });

        // Infer the vendor port base: if any port 0 is populated the OLT is
        // 0-based (HUAWEI), otherwise it is 1-based (ZTE).
        olt.portBase = olt.slots.some(s => s.ports[0] != null) ? 0 : 1;

        olt.realizedPorts = olt.slots.reduce((sum, s) => sum + s.ports.filter(Boolean).length, 0);
        olt.plannedPorts = olt.slots.reduce((sum, s) => sum + s.ports.length, 0);
      }
    }
  }

  return hierarchy;
}
