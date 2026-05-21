// Main performance dashboard with project status summaries
import { ProjectRepository } from '@/repositories/ProjectRepository';
import { ColumnConfigRepository } from '@/repositories/ColumnConfigRepository';
import type { Project } from '@/types/database';
import DashboardRecap from '@/components/features/dashboard/DashboardRecap';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  let projects: Project[] = [];

  try {
    projects = ProjectRepository.findAllByRegion('SUMBAGTENG');
  } catch (error) {
    console.error('Failed to fetch projects from DB:', error);
    throw new Error('Gagal mengambil data dari database.');
  }

  const colMap = ColumnConfigRepository.getMap();

  return <DashboardRecap projects={projects} colMap={colMap} />;
}
