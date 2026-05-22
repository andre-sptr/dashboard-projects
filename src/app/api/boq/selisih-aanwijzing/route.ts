import { NextRequest } from 'next/server';
import { BoqRepository } from '@/repositories/BoqRepository';
import { successResponse, withErrorHandling } from '@/lib/response';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;

  const summary = BoqRepository.getSelisihAanwijzingSummary(startDate, endDate);
  return successResponse(summary);
});
