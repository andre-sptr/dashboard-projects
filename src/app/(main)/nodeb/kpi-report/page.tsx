import { ProjectRepository } from '@/repositories/ProjectRepository';
import { ColumnConfigRepository } from '@/repositories/ColumnConfigRepository';
import type { Project } from '@/types/database';
import DashboardRecap from '@/components/features/dashboard/DashboardRecap';

export const dynamic = 'force-dynamic';

export default async function NodebKpiReportPage() {
  let projects: Project[] = [];

  try {
    projects = ProjectRepository.findAllByProjectType('NODEB');
  } catch (error) {
    console.error('Failed to fetch NodeB projects from DB:', error);
    throw new Error('Gagal mengambil data NodeB dari database.');
  }

  return <DashboardRecap projects={projects} colMap={ColumnConfigRepository.getMap('NODEB')} projectLabel="NodeB" />;
}
