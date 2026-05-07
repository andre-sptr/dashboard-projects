import { SyncLogRepository } from '@/repositories/SyncLogRepository';
import { successResponse } from '@/lib/response';

export async function GET() {
  const history = SyncLogRepository.findAll(20);
  return successResponse(history);
}
