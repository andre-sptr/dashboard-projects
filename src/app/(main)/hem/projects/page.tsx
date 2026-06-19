import type { Project } from '@/types/database';
import { ProjectRepository } from '@/repositories/ProjectRepository';
import DashboardClient from '@/components/features/dashboard/DashboardClient';
import { getProjectColumnConfig } from '@/lib/project-config';

export const dynamic = 'force-dynamic';

export default async function HemProjectsPage() {
  let projects: Project[] = [];

  try {
    projects = ProjectRepository.findAllByProjectType('HEM');
  } catch (error) {
    console.error('Failed to fetch HEM projects from DB:', error);
    throw new Error('Gagal mengambil data HEM dari database.');
  }

  return (
    <DashboardClient
      initialProjects={projects}
      columnConfig={getProjectColumnConfig('HEM')}
      projectType="HEM"
    />
  );
}
