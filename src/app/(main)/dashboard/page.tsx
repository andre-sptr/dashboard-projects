// Main performance dashboard with project status summaries
import { ProjectRepository } from '@/repositories/ProjectRepository';
import { Project } from '@/lib/db';
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

  return <DashboardRecap projects={projects} />;
}
