import { describe, it, expect, vi } from 'vitest';
import { buildAlertMessage, sendWahaAlert } from '../src/lib/waha-alert';
import type { RiskyProjectDTO } from '../src/types/dashboard';

function makeProject(overrides: Partial<RiskyProjectDTO> = {}): RiskyProjectDTO {
  return {
    uid: 'test-uid',
    nama_lop: 'LOP Test',
    branch: 'SUMUT',
    status: '3. PERIZINAN',
    risk_level: 'KRITIS',
    days_since_changed: 20,
    golive_target: null,
    ...overrides,
  };
}

describe('buildAlertMessage', () => {
  it('returns "semua aman" message when no at-risk projects', () => {
    const msg = buildAlertMessage({ kritisCount: 0, perhatianCount: 0, projects: [], totalProjects: 50 });
    expect(msg).toContain('Semua project aman');
    expect(msg).toContain('Alert Harian');
    expect(msg).not.toContain('KRITIS');
  });

  it('includes KRITIS count in header', () => {
    const projects = [makeProject({ risk_level: 'KRITIS' })];
    const msg = buildAlertMessage({ kritisCount: 1, perhatianCount: 0, projects, totalProjects: 50 });
    expect(msg).toContain('KRITIS: 1');
    expect(msg).toContain('PERHATIAN: 0');
  });

  it('includes project name, branch, and days in KRITIS section', () => {
    const projects = [makeProject({ nama_lop: 'LOP Medan', branch: 'SUMUT', days_since_changed: 25 })];
    const msg = buildAlertMessage({ kritisCount: 1, perhatianCount: 0, projects, totalProjects: 30 });
    expect(msg).toContain('LOP Medan');
    expect(msg).toContain('SUMUT');
    expect(msg).toContain('25 hari');
  });

  it('caps KRITIS list at 10 and shows overflow note', () => {
    const projects = Array.from({ length: 15 }, (_, i) =>
      makeProject({ uid: `uid-${i}`, nama_lop: `LOP ${i}`, risk_level: 'KRITIS' })
    );
    const msg = buildAlertMessage({ kritisCount: 15, perhatianCount: 0, projects, totalProjects: 50 });
    expect(msg).toContain('...dan 5 lainnya');
  });

  it('shows PERHATIAN projects when space remains after KRITIS', () => {
    const kritis = [makeProject({ risk_level: 'KRITIS' })];
    const perhatian = [makeProject({ risk_level: 'PERHATIAN', uid: 'p1', nama_lop: 'LOP Perhatian' })];
    const msg = buildAlertMessage({
      kritisCount: 1, perhatianCount: 1,
      projects: [...kritis, ...perhatian],
      totalProjects: 50,
    });
    expect(msg).toContain('LOP Perhatian');
    expect(msg).toContain('Project PERHATIAN');
  });

  it('omits PERHATIAN section when KRITIS fills the 10-item cap', () => {
    const projects = Array.from({ length: 10 }, (_, i) =>
      makeProject({ uid: `uid-${i}`, risk_level: 'KRITIS' })
    );
    const perhatianProject = makeProject({ uid: 'p1', risk_level: 'PERHATIAN', nama_lop: 'Tidak Muncul' });
    const msg = buildAlertMessage({
      kritisCount: 10, perhatianCount: 1,
      projects: [...projects, perhatianProject],
      totalProjects: 50,
    });
    expect(msg).not.toContain('Tidak Muncul');
  });

  it('handles project with no branch gracefully', () => {
    const projects = [makeProject({ branch: '' })];
    const msg = buildAlertMessage({ kritisCount: 1, perhatianCount: 0, projects, totalProjects: 10 });
    expect(msg).toContain('(-)');
    expect(() => buildAlertMessage({ kritisCount: 1, perhatianCount: 0, projects, totalProjects: 10 })).not.toThrow();
  });
});

describe('sendWahaAlert', () => {
  const mockConfig = {
    url: 'https://waha-api-test.com/',
    session: 'test-session',
    apiKey: 'test-api-key',
    groupIds: ['group-1', 'group-2'],
  };
  const mockMessage = '🚨 Test Alert Message';

  it('successfully sends message to all groups', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    await expect(sendWahaAlert(mockConfig, mockMessage)).resolves.not.toThrow();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    // Verifikasi pembersihan URL (trailing slash dihilangkan) dan headers/body
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://waha-api-test.com/api/sendText',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Api-Key': 'test-api-key',
        },
        body: JSON.stringify({
          session: 'test-session',
          chatId: 'group-1',
          text: mockMessage,
        }),
      })
    );
    vi.unstubAllGlobals();
  });

  it('throws Error with accumulated failures when all groups fail', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('Connection timeout'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(sendWahaAlert(mockConfig, mockMessage)).rejects.toThrow(
      /\[WahaAlert\] Partial failure:\nGroup group-1: Connection timeout\nGroup group-2: Connection timeout/
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.unstubAllGlobals();
  });

  it('throws Error when partial failure occurs (one succeeds, one fails)', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'Internal Server Error' });
    vi.stubGlobal('fetch', fetchMock);

    await expect(sendWahaAlert(mockConfig, mockMessage)).rejects.toThrow(
      /\[WahaAlert\] Partial failure:\nGroup group-2: HTTP 500 — Internal Server Error/
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.unstubAllGlobals();
  });
});
