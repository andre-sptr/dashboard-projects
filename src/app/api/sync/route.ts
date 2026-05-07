import { SyncService } from '@/lib/sync-service';
import { successResponse, errorResponse } from '@/lib/response';

export async function POST() {
  try {
    const result = await SyncService.syncProjects();
    return successResponse(result, 'Sync project berhasil dimulai secara manual');
  } catch (error) {
    console.error('Manual sync error:', error);
    return errorResponse((error as Error).message);
  }
}
