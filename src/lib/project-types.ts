import type { ProjectType } from '@/types/database';

export const PROJECT_TYPES: ProjectType[] = ['JPP', 'NODEB', 'HEM'];

export function isProjectType(value: unknown): value is ProjectType {
  return typeof value === 'string' && PROJECT_TYPES.includes(value as ProjectType);
}

export function parseProjectType(value: unknown, fallback: ProjectType = 'JPP'): ProjectType {
  return isProjectType(value) ? value : fallback;
}
