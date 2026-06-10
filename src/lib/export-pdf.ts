import type { DashboardStats } from '@/types/dashboard';

// Palette mirrors the dashboard (Tailwind 600 accents + neutral text/border).
type RGB = [number, number, number];
const C = {
  blue: [37, 99, 235] as RGB,
  emerald: [5, 150, 105] as RGB,
  indigo: [79, 70, 229] as RGB,
  red: [220, 38, 38] as RGB,
  amber: [217, 119, 6] as RGB,
  white: [255, 255, 255] as RGB,
  textDark: [17, 24, 39] as RGB,
  textMuted: [107, 114, 128] as RGB,
  border: [226, 232, 240] as RGB,
  track: [241, 245, 249] as RGB,
  rowAlt: [248, 250, 252] as RGB,
};

// Chart fills match the dashboard charts (Tailwind 500 shades).
const PIE = {
  done: '#10b981',
  progress: '#3b82f6',
  cancelled: '#ef4444',
  other: '#f59e0b',
};
const BAR_INDIGO = '#6366f1';
const BAR_EMERALD = '#10b981';
const BAR_GRAY = '#9ca3af';
const BAR_RED = '#ef4444';

const STATUS_COLS = [
  '0. DROP',
  '1. AANWIJZING',
  '2. DONE AANWIJZING',
  '3. PERIZINAN',
  '4. MATDEL',
  '5. INSTALASI',
  '6. FINISH INSTALASI',
  '7. GOLIVE',
  '8. UJI TERIMA',
] as const;

const SHORT_STATUS_LABELS: Record<string, string> = {
  '0. DROP': 'DROP',
  '1. AANWIJZING': 'AANWJ',
  '2. DONE AANWIJZING': 'DONE',
  '3. PERIZINAN': 'IZIN',
  '4. MATDEL': 'MATDEL',
  '5. INSTALASI': 'INST',
  '6. FINISH INSTALASI': 'F.INST',
  '7. GOLIVE': 'GL',
  '8. UJI TERIMA': 'UT',
};

function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

interface ExportOptions {
  periodLabel?: string;
  batchLabel?: string;
  // Status breakdown as shown on the dashboard's Status card (batch-filtered).
  statusStats?: DashboardStats;
  // Timeline source — dashboard always shows the unfiltered set.
  timelineStats?: DashboardStats;
}

export async function exportDashboardPDF(
  stats: DashboardStats,
  options: ExportOptions = {}
): Promise<void> {
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const today = new Date().toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  const now = new Date().toLocaleString('id-ID');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const usableWidth = pageWidth - margin * 2;

  // ── Drawing helpers ─────────────────────────────────────────────────────────
  const panel = (x: number, yy: number, w: number, h: number) => {
    doc.setFillColor(...C.white);
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, yy, w, h, 2, 2, 'FD');
  };

  const panelHeader = (x: number, yy: number, w: number, title: string, accent: RGB) => {
    doc.setFillColor(...C.rowAlt);
    doc.roundedRect(x, yy, w, 13, 2, 2, 'F');
    doc.setFillColor(...accent);
    doc.roundedRect(x + 5, yy + 4, 3.2, 3.2, 0.8, 0.8, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.textDark);
    doc.text(title, x + 11, yy + 7);
  };

  const sectionTitle = (text: string, yy: number, accent: RGB) => {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.textDark);
    doc.text(text, margin, yy);
    doc.setDrawColor(...accent);
    doc.setLineWidth(0.8);
    doc.line(margin, yy + 1.5, margin + doc.getTextWidth(text), yy + 1.5);
    doc.setLineWidth(0.2);
  };

  const drawDonut = (
    cx: number, cy: number, rOut: number, rIn: number,
    segs: { value: number; color: string }[]
  ) => {
    const total = segs.reduce((s, x) => s + x.value, 0);
    if (total <= 0) return;
    let a0 = -Math.PI / 2;
    for (const seg of segs) {
      const a1 = a0 + (seg.value / total) * Math.PI * 2;
      doc.setFillColor(...hexToRgb(seg.color));
      const steps = Math.max(2, Math.ceil(((a1 - a0) / Math.PI) * 45));
      let px = cx + rOut * Math.cos(a0);
      let py = cy + rOut * Math.sin(a0);
      for (let i = 1; i <= steps; i++) {
        const a = a0 + (a1 - a0) * (i / steps);
        const x = cx + rOut * Math.cos(a);
        const y = cy + rOut * Math.sin(a);
        doc.triangle(cx, cy, px, py, x, y, 'F');
        px = x; py = y;
      }
      a0 = a1;
    }
    doc.setFillColor(...C.white);
    doc.circle(cx, cy, rIn, 'F');
  };

  const hBar = (
    x: number, yy: number, w: number, pct: number, color: string
  ) => {
    doc.setFillColor(...C.track);
    doc.roundedRect(x, yy, w, 1.8, 0.9, 0.9, 'F');
    const fillW = Math.max(0, Math.min(w, (w * pct) / 100));
    if (fillW > 0.2) {
      doc.setFillColor(...hexToRgb(color));
      doc.roundedRect(x, yy, fillW, 1.8, 0.9, 0.9, 'F');
    }
  };

  // ── Header band ─────────────────────────────────────────────────────────────
  doc.setFillColor(...C.blue);
  doc.rect(0, 0, pageWidth, 30, 'F');
  doc.setTextColor(...C.white);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Laporan Status Project', margin, 14);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Monitoring project region Sumbagteng', margin, 21);
  doc.setFontSize(9);
  doc.text(today, pageWidth - margin, 12, { align: 'right' });
  doc.setFontSize(8);
  if (options.periodLabel) {
    doc.text(`Periode: ${options.periodLabel}`, pageWidth - margin, 18, { align: 'right' });
  }
  if (options.batchLabel) {
    doc.text(`Batch: ${options.batchLabel}`, pageWidth - margin, 23, { align: 'right' });
  }

  // ── KPI cards (mirror dashboard) ────────────────────────────────────────────
  const pct = (n: number) =>
    stats.totalPorts > 0 ? Math.round((n / stats.totalPorts) * 100) : 0;

  const cards: { label: string; value: string; sub: string; accent: RGB }[] = [
    {
      label: 'Total Port Plan',
      value: stats.totalPorts.toLocaleString('id-ID'),
      sub: `${stats.total} Projects`,
      accent: C.blue,
    },
    {
      label: 'Done Ports',
      value: stats.donePorts.toLocaleString('id-ID'),
      sub: `${stats.overallAchiev.toFixed(2)}% capaian`,
      accent: C.emerald,
    },
    {
      label: 'In Progress Ports',
      value: stats.progressPorts.toLocaleString('id-ID'),
      sub: `${pct(stats.progressPorts)}% dari total`,
      accent: C.indigo,
    },
    {
      label: 'Cancelled Ports',
      value: stats.cancelledPorts.toLocaleString('id-ID'),
      sub: `${pct(stats.cancelledPorts)}% dari total`,
      accent: C.red,
    },
  ];

  const gap = 4;
  const cardW = (usableWidth - gap * (cards.length - 1)) / cards.length;
  const cardH = 25;
  const cardY = 38;

  cards.forEach((card, i) => {
    const x = margin + i * (cardW + gap);
    panel(x, cardY, cardW, cardH);
    doc.setFillColor(...card.accent);
    doc.roundedRect(x + cardW - 9, cardY + 4, 5, 5, 1, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...C.textMuted);
    doc.text(card.label.toUpperCase(), x + 4, cardY + 8);

    doc.setFontSize(15);
    doc.setTextColor(...C.textDark);
    doc.text(card.value, x + 4, cardY + 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...C.textMuted);
    doc.text(card.sub, x + 4, cardY + 21);
  });

  // ── Distribusi Status (donut) + Status (bars) — two columns ─────────────────
  const colGap = 6;
  const colW = (usableWidth - colGap) / 2;
  const leftX = margin;
  const rightX = margin + colW + colGap;
  const panelTop = cardY + cardH + 12;
  const panelH = 96;

  // Left: donut
  panel(leftX, panelTop, colW, panelH);
  panelHeader(leftX, panelTop, colW, 'Distribusi Status (by Port)', C.blue);

  const pieSegs = [
    { name: 'Done', value: stats.donePorts, color: PIE.done },
    { name: 'Progress', value: stats.progressPorts, color: PIE.progress },
    { name: 'Cancelled', value: stats.cancelledPorts, color: PIE.cancelled },
    { name: 'Other', value: stats.otherPorts, color: PIE.other },
  ].filter((s) => s.value > 0);
  const pieTotal = pieSegs.reduce((s, x) => s + x.value, 0);

  if (pieTotal > 0) {
    const cx = leftX + colW / 2;
    const cy = panelTop + 38;
    drawDonut(cx, cy, 20, 12, pieSegs);
    // Center total
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.textDark);
    doc.text(pieTotal.toLocaleString('id-ID'), cx, cy - 0.5, { align: 'center' });
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.textMuted);
    doc.text('PORT', cx, cy + 3.5, { align: 'center' });

    // Legend
    let ly = panelTop + 65;
    const lx = leftX + 10;
    doc.setFontSize(7.5);
    for (const seg of pieSegs) {
      const p = ((seg.value / pieTotal) * 100).toFixed(1);
      doc.setFillColor(...hexToRgb(seg.color));
      doc.roundedRect(lx, ly - 2.4, 3, 3, 0.6, 0.6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.textDark);
      doc.text(seg.name, lx + 5, ly);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...C.textMuted);
      doc.text(`${seg.value.toLocaleString('id-ID')} (${p}%)`, leftX + colW - 6, ly, { align: 'right' });
      ly += 5;
    }

    const branchRows = stats.branchGoliveData.slice(0, 4);
    if (branchRows.length > 0) {
      const tableY = panelTop + 78;
      doc.setDrawColor(...C.border);
      doc.line(leftX + 5, tableY - 4, leftX + colW - 5, tableY - 4);
      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.textMuted);
      doc.text('BRANCH', leftX + 7, tableY);
      doc.text('GL', leftX + colW - 24, tableY, { align: 'right' });
      doc.text('ACHIEV', leftX + colW - 7, tableY, { align: 'right' });
      let by = tableY + 4;
      for (const b of branchRows) {
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.textDark);
        doc.text(b.name, leftX + 7, by, { maxWidth: colW - 42 });
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...C.textMuted);
        doc.text(b.done.toLocaleString('id-ID'), leftX + colW - 24, by, { align: 'right' });
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...(b.achiev >= 90 ? C.emerald : b.achiev >= 70 ? C.blue : C.amber));
        doc.text(`${b.achiev.toFixed(2)}%`, leftX + colW - 7, by, { align: 'right' });
        by += 4;
      }
    }
  } else {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...C.textMuted);
    doc.text('Belum ada data.', leftX + 5, panelTop + 30);
  }

  // Right: Status horizontal bars (batch-filtered)
  const statusSource = options.statusStats ?? stats;
  panel(rightX, panelTop, colW, panelH);
  panelHeader(rightX, panelTop, colW, 'Status', C.indigo);
  if (options.batchLabel) {
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.textMuted);
    doc.text(options.batchLabel, rightX + colW - 5, panelTop + 8, { align: 'right' });
  }

  const statusBars = statusSource.statusList;
  const stTotal = statusSource.totalPorts;
  if (statusBars.length && stTotal > 0) {
    const sx = rightX + 5;
    const sw = colW - 10;
    const rowH = Math.min(8, (panelH - 26) / statusBars.length);
    let sy = panelTop + 20;
    for (const s of statusBars) {
      const p = (s.count / stTotal) * 100;
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.textDark);
      doc.text(s.name || '-', sx, sy);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...C.textMuted);
      doc.text(`${s.count.toLocaleString('id-ID')} (${p.toFixed(1)}%)`, sx + sw, sy, { align: 'right' });
      hBar(sx, sy + 1.6, sw, p, BAR_INDIGO);
      sy += rowH;
    }
  } else {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...C.textMuted);
    doc.text('Belum ada data.', rightX + 5, panelTop + 30);
  }

  let y = panelTop + panelH + 12;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 16) {
      doc.addPage();
      y = 20;
    }
  };

  // ── Branch Performance Ranking (dashboard-style status table) ───────────────
  ensureSpace(20);
  sectionTitle('Branch Performance Ranking', y, C.blue);
  y += 7;

  const branches = stats.branchRankingData;
  if (branches.length) {
    const tableX = margin;
    const branchW = 38;
    const achW = 25;
    const statusW = (usableWidth - branchW - achW) / STATUS_COLS.length;
    const headerH = 9;
    const rowH = 8;

    const drawBranchHeader = () => {
      panel(tableX, y, usableWidth, headerH);
      doc.setFillColor(...C.rowAlt);
      doc.roundedRect(tableX, y, usableWidth, headerH, 2, 2, 'F');
      doc.setFontSize(5.6);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.textMuted);
      doc.text('BRANCH', tableX + 4, y + 5.8);
      STATUS_COLS.forEach((status, index) => {
        doc.text(
          SHORT_STATUS_LABELS[status] ?? status,
          tableX + branchW + statusW * index + statusW / 2,
          y + 5.8,
          { align: 'center' }
        );
      });
      doc.text('ACHIEV', tableX + usableWidth - 4, y + 5.8, { align: 'right' });
      y += headerH;
    };

    drawBranchHeader();
    branches.forEach((b, i) => {
      ensureSpace(rowH + headerH + 2);
      if (y < 25) drawBranchHeader();
      if (i % 2 === 1) {
        doc.setFillColor(...C.rowAlt);
        doc.rect(tableX, y, usableWidth, rowH, 'F');
      }
      doc.setDrawColor(...C.border);
      doc.setLineWidth(0.15);
      doc.line(tableX, y + rowH, tableX + usableWidth, y + rowH);

      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.textMuted);
      doc.text(`${i + 1}`, tableX + 3, y + 5);
      doc.setTextColor(...C.textDark);
      doc.text(b.name, tableX + 8, y + 5, { maxWidth: branchW - 10 });

      STATUS_COLS.forEach((status, index) => {
        const value = b.statusCounts?.[status] ?? 0;
        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...C.textMuted);
        doc.text(
          value.toLocaleString('id-ID'),
          tableX + branchW + statusW * index + statusW / 2,
          y + 5,
          { align: 'center' }
        );
      });

      const ach = b.achievement;
      const color = ach >= 90 ? BAR_EMERALD : ach >= 70 ? '#3b82f6' : '#f59e0b';
      hBar(tableX + usableWidth - achW, y + 2, 12, Math.min(100, ach), color);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.textDark);
      doc.text(`${ach.toFixed(2)}%`, tableX + usableWidth - 4, y + 5, { align: 'right' });
      y += rowH;
    });
  } else {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...C.textMuted);
    doc.text('Belum ada data.', margin, y);
    y += 6;
  }

  // ── Tanggal Golive per Bulan (vertical bar chart) ───────────────────────────
  const timelineSource = options.timelineStats ?? stats;
  const months = timelineSource.goliveMonthList;
  y += 6;
  ensureSpace(70);
  sectionTitle('Tanggal Golive per Bulan (by Port)', y, C.emerald);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.emerald);
  doc.text(
    `${timelineSource.totalGolivePorts.toLocaleString('id-ID')} total port komitmen`,
    margin + usableWidth, y, { align: 'right' }
  );
  doc.setTextColor(...C.textDark);
  y += 5;

  const chartH = 50;
  panel(margin, y, usableWidth, chartH);
  if (months.some((m) => m.totalPorts > 0)) {
    const maxC = Math.max(1, ...months.map((m) => m.totalPorts));
    const padL = 6;
    const chartBottom = y + chartH - 9;
    const chartTop = y + 6;
    const plotH = chartBottom - chartTop;
    const plotX = margin + padL;
    const plotW = usableWidth - padL * 2;
    // baseline
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.2);
    doc.line(plotX, chartBottom, plotX + plotW, chartBottom);

    const slot = plotW / months.length;
    const barW = Math.min(slot * 0.6, 11);
    months.forEach((m, i) => {
      const bx = plotX + slot * i + (slot - barW) / 2;
      const segments = [
        { value: m.onTimePorts, color: BAR_EMERALD },
        { value: m.pendingPorts, color: BAR_GRAY },
        { value: m.latePorts, color: BAR_RED },
      ];
      let top = chartBottom;

      for (const segment of segments) {
        const h = (segment.value / maxC) * plotH;
        if (h <= 0) continue;
        top -= h;
        doc.setFillColor(...hexToRgb(segment.color));
        doc.rect(bx, top, barW, h, 'F');
      }

      if (m.totalPorts > 0) {
        doc.setFontSize(5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.textDark);
        doc.text(m.totalPorts.toLocaleString('id-ID'), bx + barW / 2, top - 1, { align: 'center' });
      }
      doc.setFontSize(5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...C.textMuted);
      doc.text(m.name, plotX + slot * i + slot / 2, chartBottom + 4, { align: 'center' });
    });
    doc.setTextColor(...C.textDark);
    y += chartH + 10;
  } else {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...C.textMuted);
    doc.text('Belum ada data tanggal golive.', margin + 5, y + chartH / 2);
    doc.setTextColor(...C.textDark);
    y += chartH + 10;
  }


  // ── Footer ─────────────────────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.textMuted);
    doc.text(`Dashboard Sumbagteng · Dibuat ${now}`, margin, pageHeight - 7);
    doc.text(`Halaman ${i} dari ${pageCount}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
    doc.setTextColor(...C.textDark);
  }

  doc.save(`Laporan-Sumbagteng-${today.replace(/\s/g, '-')}.pdf`);
}
