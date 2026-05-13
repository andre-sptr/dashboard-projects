import type { DashboardStats, RiskyProjectDTO } from '@/types/dashboard';

const PDF_CAP = 30;

function sortRiskyProjects(projects: RiskyProjectDTO[]): RiskyProjectDTO[] {
  return [...projects].sort((a, b) => {
    if (a.risk_level !== b.risk_level) {
      return a.risk_level === 'KRITIS' ? -1 : 1;
    }
    return b.days_since_changed - a.days_since_changed;
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lastY(doc: any): number {
  return doc.lastAutoTable?.finalY ?? 0;
}

export async function exportDashboardPDF(
  stats: DashboardStats,
  riskyProjects: RiskyProjectDTO[]
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const { autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const today = new Date().toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  const now = new Date().toLocaleString('id-ID');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  // ── Title ─────────────────────────────────────────────────────────────────
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Laporan Status Project Sumbagteng', pageWidth / 2, 20, { align: 'center' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(today, pageWidth / 2, 28, { align: 'center' });
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, 33, pageWidth - margin, 33);

  // ── Summary Stats ──────────────────────────────────────────────────────────
  let y = 40;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Ringkasan', margin, y);
  y += 6;

  const realization = stats.totalPorts > 0
    ? Math.round((stats.donePorts / stats.totalPorts) * 100)
    : 0;

  autoTable(doc, {
    head: [['Metrik', 'Nilai']],
    body: [
      ['Total Project', String(stats.total)],
      ['Total Port Plan', stats.totalPorts.toLocaleString('id-ID')],
      ['Port Done', stats.donePorts.toLocaleString('id-ID')],
      ['Port In Progress', stats.progressPorts.toLocaleString('id-ID')],
      ['Port Cancelled', stats.cancelledPorts.toLocaleString('id-ID')],
      ['Realisasi Keseluruhan', `${realization}%`],
    ],
    startY: y,
    headStyles: { fillColor: [59, 130, 246] as [number, number, number] },
    styles: { fontSize: 9 },
    margin: { left: margin, right: margin },
  });

  // ── Branch Traffic Light ───────────────────────────────────────────────────
  y = lastY(doc) + 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Status Branch (Realisasi Port)', margin, y);
  y += 6;

  const branchRows = stats.branchRankingData.map((b) => {
    if (b.planned === 0) return [b.name, '-', '-', 'N/A'];
    const pct = Math.round((b.actual / b.planned) * 100);
    const level = pct >= 70 ? 'AMAN' : pct >= 40 ? 'PERHATIAN' : 'KRITIS';
    return [b.name, b.planned.toLocaleString('id-ID'), b.actual.toLocaleString('id-ID'), `${pct}% — ${level}`];
  });

  autoTable(doc, {
    head: [['Branch', 'Plan', 'Realisasi', 'Status']],
    body: branchRows,
    startY: y,
    headStyles: { fillColor: [59, 130, 246] as [number, number, number] },
    styles: { fontSize: 9 },
    margin: { left: margin, right: margin },
  });

  // ── At-Risk Projects ───────────────────────────────────────────────────────
  y = lastY(doc) + 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Project Berisiko', margin, y);
  y += 6;

  const sorted = sortRiskyProjects(riskyProjects);
  const capped = sorted.slice(0, PDF_CAP);
  const wasCapped = sorted.length > PDF_CAP;

  if (capped.length === 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Semua project aman — tidak ada yang perlu tindak lanjut.', margin, y);
    y += 8;
  } else {
    autoTable(doc, {
      head: [['Nama LOP', 'Branch', 'Status', 'Risiko', 'Tidak Berubah']],
      body: capped.map((p) => [
        p.nama_lop,
        p.branch || '-',
        p.status,
        p.risk_level,
        `${p.days_since_changed} hari`,
      ]),
      startY: y,
      headStyles: { fillColor: [239, 68, 68] as [number, number, number] },
      styles: { fontSize: 8 },
      columnStyles: { 3: { fontStyle: 'bold' } },
      margin: { left: margin, right: margin },
    });

    y = lastY(doc) + 4;

    if (wasCapped) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(120, 120, 120);
      doc.text(
        `Menampilkan ${PDF_CAP} dari ${sorted.length} project berdasarkan risiko.`,
        margin,
        y
      );
      doc.setTextColor(0, 0, 0);
    }
  }

  // ── Footer ─────────────────────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Dibuat: ${now}  ·  Halaman ${i} dari ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    );
    doc.setTextColor(0, 0, 0);
  }

  doc.save(`Laporan-Sumbagteng-${today.replace(/\s/g, '-')}.pdf`);
}
