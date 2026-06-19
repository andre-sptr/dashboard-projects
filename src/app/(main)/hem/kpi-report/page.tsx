import { ProjectRepository } from '@/repositories/ProjectRepository';
import { ColumnConfigRepository } from '@/repositories/ColumnConfigRepository';
import type { Project } from '@/types/database';
import DashboardRecap from '@/components/features/dashboard/DashboardRecap';

export const dynamic = 'force-dynamic';

export default async function HemKpiReportPage() {
  let projects: Project[] = [];

  try {
    projects = ProjectRepository.findAllByProjectType('HEM');
  } catch (error) {
    console.error('Failed to fetch HEM projects from DB:', error);
    throw new Error('Gagal mengambil data HEM dari database.');
  }

  return <DashboardRecap projects={projects} colMap={ColumnConfigRepository.getMap('HEM')} projectLabel="HEM" />;
}
