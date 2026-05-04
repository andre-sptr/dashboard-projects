import { getAllProjects, Project } from '@/lib/db';
import ReportClient from '@/components/ReportClient';

export const dynamic = 'force-dynamic';

export default async function ReportPage() {
  let projects: Project[] = [];

  try {
    projects = getAllProjects.all('SUMBAGTENG') as Project[];
  } catch (error) {
    console.error('Failed to fetch projects from DB:', error);
    throw new Error('Gagal mengambil data dari database.');
  }

  return <ReportClient initialProjects={projects} />;
}
