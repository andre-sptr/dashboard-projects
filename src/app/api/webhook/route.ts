import { NextRequest } from 'next/server';
import { SyncService } from '@/lib/sync-service';
import { successResponse, errorResponse } from '@/lib/response';

export async function POST(request: NextRequest) {
  // Simple API key verification if configured in environment
  const configuredApiKey = process.env.API_KEY;
  if (configuredApiKey) {
    const headerKey = request.headers.get('x-api-key');
    const authHeader = request.headers.get('authorization');
    const queryKey = new URL(request.url).searchParams.get('api_key');
    
    let bearerKey = '';
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      bearerKey = authHeader.substring(7);
    }
    
    if (headerKey !== configuredApiKey && bearerKey !== configuredApiKey && queryKey !== configuredApiKey) {
      return errorResponse('Unauthorized access. Invalid or missing API key.', 401);
    }
  }

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
