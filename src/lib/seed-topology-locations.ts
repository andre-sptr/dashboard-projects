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
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  source?: string;
  confidence?: TopologyLocationConfidence;
  notes?: string;
}

interface ResolvedSeedCoordinates {
  latitude: number;
  longitude: number;
}

function resolveSeedCoordinates(row: SeedTopologyLocationRow) {
  return {
    latitude: row.latitude ?? row.lat,
    longitude: row.longitude ?? row.lng,
  };
}

function hasValidSeedCoordinates(
  coordinates: ReturnType<typeof resolveSeedCoordinates>
): coordinates is ResolvedSeedCoordinates {
  return Number.isFinite(coordinates.latitude)
    && Number.isFinite(coordinates.longitude);
}

function isValidSeedRow(
  row: SeedTopologyLocationRow,
  coordinates: ReturnType<typeof resolveSeedCoordinates>
): coordinates is ResolvedSeedCoordinates {
  return Boolean(row.entity_type)
    && Boolean(row.entity_name)
    && hasValidSeedCoordinates(coordinates);
}

export function seedTopologyLocationsFromRows(rows: SeedTopologyLocationRow[]) {
  for (const row of rows) {
    const coordinates = resolveSeedCoordinates(row);
    if (!isValidSeedRow(row, coordinates)) continue;

    TopologyLocationRepository.upsert({
      entity_type: row.entity_type,
      entity_name: row.entity_name,
      area: row.area ?? '',
      sto: row.sto ?? '',
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
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
