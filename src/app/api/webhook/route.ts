import { SyncService } from '@/lib/sync-service';
import { successResponse, errorResponse } from '@/lib/response';

export async function POST() {
  try {
    const result = await SyncService.syncProjects();

    if (!result.success) {
      const errorMessage = 'message' in result ? result.message : 'Gagal sinkronisasi data';

      return errorResponse(errorMessage, 400);
    }

    return successResponse(result, 'Sync project berhasil');
  } catch (error) {
    console.error('Webhook error:', error);
    return errorResponse((error as Error).message);
  }
}
