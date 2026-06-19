import { ProjectRepository } from '@/repositories/ProjectRepository';
import { ColumnConfigRepository } from '@/repositories/ColumnConfigRepository';
import type { Project } from '@/types/database';
import DashboardRecap from '@/components/features/dashboard/DashboardRecap';

export const dynamic = 'force-dynamic';

export default async function JppKpiReportPage() {
  let projects: Project[] = [];

  try {
    projects = ProjectRepository.findAllByRegion('SUMBAGTENG');
  } catch (error) {
    console.error('Failed to fetch JPP projects from DB:', error);
    throw new Error('Gagal mengambil data JPP dari database.');
  }

  return <DashboardRecap projects={projects} colMap={ColumnConfigRepository.getMap('JPP')} projectLabel="JPP" />;
}
