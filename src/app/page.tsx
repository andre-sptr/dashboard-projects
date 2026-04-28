import { getAllProjects, Project } from '@/lib/db';
import DashboardClient from '@/components/DashboardClient';
import SyncButton from '@/components/SyncButton';
import { Activity } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  let projects: Project[] = [];

  try {
    projects = getAllProjects.all('SUMBAGTENG') as Project[];
  } catch (error) {
    console.error('Failed to fetch projects from DB:', error);
    throw new Error('Gagal mengambil data dari database.');
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-600 rounded-lg text-white">
                <Activity size={24} />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                Sumbagteng Projects <span className="text-blue-600 dark:text-blue-500">Dashboard</span>
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-1 max-w-2xl">
              Sistem pelacakan durasi perubahan status SLA project.
            </p>
          </div>

          <div className="flex items-center self-start md:self-auto">
            <SyncButton />
          </div>
        </div>

        {/* Main Content Area */}
        <DashboardClient initialProjects={projects} />
      </div>
    </main>
  );
}
