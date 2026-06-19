import type { Project } from '@/types/database';
import { ProjectRepository } from '@/repositories/ProjectRepository';
import DashboardClient from '@/components/features/dashboard/DashboardClient';
import { getProjectColumnConfig } from '@/lib/project-config';

export const dynamic = 'force-dynamic';

export default async function NodebProjectsPage() {
  let projects: Project[] = [];

  try {
    projects = ProjectRepository.findAllByProjectType('NODEB');
  } catch (error) {
    console.error('Failed to fetch NodeB projects from DB:', error);
    throw new Error('Gagal mengambil data NodeB dari database.');
  }

  return (
    <DashboardClient
      initialProjects={projects}
      columnConfig={getProjectColumnConfig('NODEB')}
      projectType="NODEB"
    />
  );
}
