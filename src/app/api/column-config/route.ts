import { ColumnConfigRepository } from '@/repositories/ColumnConfigRepository';
import { SyncService } from '@/lib/sync-service';
import { successResponse, errorResponse } from '@/lib/response';
import { parseProjectType } from '@/lib/project-types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectType = parseProjectType(searchParams.get('projectType'));
    const config = ColumnConfigRepository.getAll(projectType);
    return successResponse(config);
  } catch (error) {
    console.error('Get column config error:', error);
    return errorResponse((error as Error).message);
  }
}

interface UpdatePayload {
  projectType?: string;
  entries?: { field_key: string; col_index: number; header_text?: string }[];
  reset?: boolean;
  resync?: boolean;
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as UpdatePayload;
    const projectType = parseProjectType(body.projectType);

    if (body.reset) {
      ColumnConfigRepository.resetDefaults(projectType);
    } else if (Array.isArray(body.entries)) {
      ColumnConfigRepository.updateMany(projectType, body.entries);
    } else {
      return errorResponse('Payload tidak valid: butuh "entries" atau "reset".', 400);
    }

    // Stored full_data is positional, so the new mapping only takes effect for
    // rows re-read from the sheet. Re-sync by default so the dashboard reflects
    // the new configuration immediately.
    let syncResult: unknown = null;
    if (body.resync !== false) {
      syncResult = await SyncService.syncProjects();
    }

    return successResponse(
      { config: ColumnConfigRepository.getAll(projectType), sync: syncResult },
      body.resync === false
        ? `Konfigurasi kolom ${projectType} disimpan. Jalankan sinkronisasi untuk menerapkan ke data.`
        : `Konfigurasi kolom ${projectType} disimpan dan data disinkronkan ulang.`
    );
  } catch (error) {
    console.error('Update column config error:', error);
    return errorResponse((error as Error).message);
  }
}
