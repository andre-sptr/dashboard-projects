// Spreadsheet column mapping configuration
import { ColumnConfigRepository } from '@/repositories/ColumnConfigRepository';
import ColumnConfigClient from '@/components/features/settings/ColumnConfigClient';
import { getAllProjectConfigs } from '@/lib/project-config';
import type { ProjectType } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function ColumnConfigPage() {
  const projectOptions = getAllProjectConfigs().map((config) => ({
    type: config.type,
    label: config.label,
  }));
  const initialConfigs = Object.fromEntries(
    projectOptions.map((project) => [project.type, ColumnConfigRepository.getAll(project.type)])
  ) as Record<ProjectType, ReturnType<typeof ColumnConfigRepository.getAll>>;

  return (
    <ColumnConfigClient
      initialConfigs={initialConfigs}
      initialProjectType="JPP"
      projectOptions={projectOptions}
    />
  );
}
