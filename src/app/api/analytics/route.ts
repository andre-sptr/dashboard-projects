import { successResponse, errorResponse } from '@/lib/response';
import { AnalyticsService } from '@/lib/analytics';

export async function GET() {
  try {
    const [kpis, distribution, durations, trends, predictions] = await Promise.all([
      AnalyticsService.getKPIs(),
      AnalyticsService.getStatusDistribution(),
      AnalyticsService.getDurationStats(),
      AnalyticsService.getTrendData(),
      AnalyticsService.getPredictiveInsights()
    ]);

    return successResponse({
      kpis,
      distribution,
      durations,
      trends,
      predictions
    });
  } catch (error) {
    console.error('[AnalyticsAPI] Failed to fetch analytics:', error);
    return errorResponse('Gagal mengambil data analitik', 500);
  }
}
