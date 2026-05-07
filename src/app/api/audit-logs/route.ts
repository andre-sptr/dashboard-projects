import { NextResponse } from 'next/server';
import { AuditLogRepository } from '@/repositories/AuditLogRepository';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  const projectUid = searchParams.get('projectUid') || undefined;

  try {
    const logs = await AuditLogRepository.getRecentLogs(limit, offset, projectUid);
    return NextResponse.json(logs);
  } catch (error) {
    console.error('[API Audit Logs] Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch audit logs';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
