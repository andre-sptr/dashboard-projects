import { ProjectRepository } from '@/repositories/ProjectRepository';
import { AanwijzingRepository } from '@/repositories/AanwijzingRepository';

import { parseJsonArray } from '@/utils/json';

export interface OdpData {
    id: string;
    name: string;
    type: 'ODP';
    status: string;
    plannedPorts: number;
    realizedPorts: number;
}

export interface OdcData {
    name: string;
    type: 'ODC';
    status: string;
    plannedPorts: number;
    realizedPorts: number;
    odps: OdpData[];
}

export interface OltData {
    name: string;
    type: 'OLT';
    status: string;
    plannedPorts: number;
    realizedPorts: number;
    odcs: Record<string, OdcData>;
}

export type BranchData = Record<string, OltData>;
export type AreaData = Record<string, BranchData>;
export type TopologyHierarchy = Record<string, AreaData>;

export interface TopologyNode {
    id: string;
    name: string;
    type: 'OLT' | 'ODC' | 'ODP';
    status: string;
    plannedPorts: number;
    realizedPorts: number;
    children: TopologyNode[];
}

const COLUMNS = {
    AREA: 4,
    STO: 5,
    BRANCH: 7,
    ODP_COUNT: 9,
    PLANNED_PORTS: 10,
    ODP_DATA: 28,
    REALIZED_PORTS: 29
};

// Build network hierarchy from projects and aanwijzing data
export function getNetworkHierarchy(): TopologyHierarchy {
    const projects = ProjectRepository.findAllByRegion('SUMBAGTENG');
    const aanwijzing = AanwijzingRepository.findAll();

    const hierarchy: TopologyHierarchy = {};

    projects.forEach(p => {
        const fd = parseJsonArray(p.full_data || '[]');

        const sto = fd[COLUMNS.STO] || 'UNKNOWN STO';
        const area = fd[COLUMNS.AREA] || 'UNKNOWN AREA';
        const branch = fd[COLUMNS.BRANCH] || 'UNKNOWN BRANCH';

        const matchAan = aanwijzing.find(a => a.id_ihld === p.id_ihld);
        const oltName = matchAan?.gpon || `OLT-${sto}`;

        const odcName = p.nama_lop || `ODC-${p.id_ihld}`;
        const plannedPorts = Number(fd[COLUMNS.PLANNED_PORTS]) || 0;
        const realizedPorts = Number(fd[COLUMNS.REALIZED_PORTS]) || 0;
        const status = p.status || 'PLANNED';

        if (!hierarchy[area]) hierarchy[area] = {};
        if (!hierarchy[area][branch]) hierarchy[area][branch] = {};
        if (!hierarchy[area][branch][oltName]) hierarchy[area][branch][oltName] = {
            name: oltName,
            type: 'OLT',
            status: 'LIVE',
            plannedPorts: 0,
            realizedPorts: 0,
            odcs: {}
        };

        const olt = hierarchy[area][branch][oltName];
        olt.plannedPorts += plannedPorts;
        olt.realizedPorts += realizedPorts;

        if (!olt.odcs[odcName]) {
            olt.odcs[odcName] = {
                name: odcName,
                type: 'ODC',
                status: status,
                plannedPorts: plannedPorts,
                realizedPorts: realizedPorts,
                odps: []
            };
        } else {
            olt.odcs[odcName].plannedPorts += plannedPorts;
            olt.odcs[odcName].realizedPorts += realizedPorts;
        }

        const odpData = fd[COLUMNS.ODP_DATA] || '';
        if (odpData && typeof odpData === 'string' && odpData.includes('#')) {
            const odpIds = odpData.split('#');
            odpIds.forEach(id => {
                olt.odcs[odcName].odps.push({
                    id: id,
                    name: `ODP-${id}`,
                    type: 'ODP',
                    status: status,
                    plannedPorts: 8,
                    realizedPorts: status.toLowerCase().includes('done') ? 8 : 0
                });
            });
        } else {
            const odpCount = Number(fd[COLUMNS.ODP_COUNT]) || 1;
            for (let i = 1; i <= odpCount; i++) {
                olt.odcs[odcName].odps.push({
                    id: `${p.id_ihld}-${i}`,
                    name: `ODP-${sto}-${i}`,
                    type: 'ODP',
                    status: status,
                    plannedPorts: 8,
                    realizedPorts: status.toLowerCase().includes('done') ? 8 : 0
                });
            }
        }
    });

    return hierarchy;
}
