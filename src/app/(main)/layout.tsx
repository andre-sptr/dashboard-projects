'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': {
    title: 'Dashboard',
    subtitle: 'Rekapan status SLA project Sumbagteng.',
  },
  '/projects': {
    title: 'Projects Data',
    subtitle: 'Sistem pelacakan durasi perubahan status SLA project.',
  },
  '/aanwijzing': {
    title: 'Catatan AANWIJZING',
    subtitle: 'Form pencatatan aanwijzing project.',
  },
};

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const meta =
    PAGE_META[pathname] ||
    Object.entries(PAGE_META).find(([key]) => pathname.startsWith(key))?.[1] ||
    { title: 'Sumbagteng Dashboard', subtitle: '' };

  return (
    <div className="min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Topbar
          title={meta.title}
          subtitle={meta.subtitle}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
