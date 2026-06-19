// Authenticated layout with sidebar and topbar navigation
'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': {
    title: 'Dashboard',
    subtitle: 'Rekapan status SLA project Sumbagteng.',
  },
  '/projects': {
    title: 'Projects Data',
    subtitle: 'Sistem pelacakan durasi perubahan status SLA project.',
  },
  '/boq': {
    title: 'BoQ Plan',
    subtitle: 'Form pencatatan bill of quantity plan.',
  },
  '/boq-tracking': {
    title: 'BoQ Tracking',
    subtitle: 'Monitoring sisa designator AANWIJZING dan cost BoQ UT.',
  },
  '/cek-boq': {
    title: 'Cek BoQ',
    subtitle: 'Perbandingan BOQ upload dengan data UT/AANWIJZING.',
  },
  '/aanwijzing': {
    title: 'Catatan AANWIJZING',
    subtitle: 'Form pencatatan aanwijzing project.',
  },
  '/ut': {
    title: 'Rekap UT',
    subtitle: 'Form pencatatan hasil UT (Uji Terima).',
  },
  '/report': {
    title: 'Report & Analytics',
    subtitle: 'Laporan mendalam performa proyek dan realisasi port.',
  },
  '/kpi-report/jpp': {
    title: 'KPI Report — JPP',
    subtitle: '',
  },
  '/nodeb/projects': { title: 'Projects Data — NodeB', subtitle: '' },
  '/nodeb/boq': { title: 'BoQ Plan — NodeB', subtitle: '' },
  '/nodeb/aanwijzing': { title: 'AANWIJZING — NodeB', subtitle: '' },
  '/nodeb/ut': { title: 'Rekap UT — NodeB', subtitle: '' },
  '/nodeb/report': { title: 'Report — NodeB', subtitle: '' },
  '/nodeb/kpi-report': { title: 'KPI Report — NodeB', subtitle: '' },
  '/hem/projects': { title: 'Projects Data — HEM', subtitle: '' },
  '/hem/boq': { title: 'BoQ Plan — HEM', subtitle: '' },
  '/hem/aanwijzing': { title: 'AANWIJZING — HEM', subtitle: '' },
  '/hem/ut': { title: 'Rekap UT — HEM', subtitle: '' },
  '/hem/report': { title: 'Report — HEM', subtitle: '' },
  '/hem/kpi-report': { title: 'KPI Report — HEM', subtitle: '' },
  '/topology': {
    title: 'Network Topology',
    subtitle: 'Visualisasi hirarki perangkat OLT, ODC, dan ODP.',
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
