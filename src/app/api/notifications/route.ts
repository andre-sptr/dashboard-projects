import { successResponse, errorResponse } from '@/lib/response';
import { NotificationRepository } from '@/repositories/NotificationRepository';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'system'; // Default to system for now
    
    const notifications = NotificationRepository.getByUserId(userId);
    const unreadCount = NotificationRepository.getUnreadCount(userId);

    return successResponse({
      notifications,
      unreadCount
    });
  } catch (error) {
    return errorResponse('Gagal mengambil notifikasi', 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, userId, all } = body;

    if (all && userId) {
      NotificationRepository.markAllAsRead(userId);
    } else if (id) {
      NotificationRepository.markAsRead(id);
    } else {
      return errorResponse('ID notifikasi diperlukan', 400);
    }

    return successResponse(null, 'Berhasil memperbarui status notifikasi');
  } catch (error) {
    return errorResponse('Gagal memperbarui notifikasi', 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return errorResponse('ID notifikasi diperlukan', 400);
    
    NotificationRepository.delete(id);
    return successResponse(null, 'Berhasil menghapus notifikasi');
  } catch (error) {
    return errorResponse('Gagal menghapus notifikasi', 500);
  }
}
