// Comprehensive project tracking and data management page
import type { Project } from '@/types/database';
import { ProjectRepository } from '@/repositories/ProjectRepository';
import { ColumnConfigRepository } from '@/repositories/ColumnConfigRepository';
import type { ColumnConfigEntry } from '@/lib/sheet-columns';
import DashboardClient from '@/components/features/dashboard/DashboardClient';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  let projects: Project[] = [];
  let columnConfig: ColumnConfigEntry[] = [];

  try {
    columnConfig = ColumnConfigRepository.getAll();
    projects = ProjectRepository.findAllByRegion('SUMBAGTENG');
  } catch (error) {
    console.error('Failed to fetch projects from DB:', error);
    throw new Error('Gagal mengambil data dari database.');
  }

  return <DashboardClient initialProjects={projects} columnConfig={columnConfig} projectType="JPP" />;
}
