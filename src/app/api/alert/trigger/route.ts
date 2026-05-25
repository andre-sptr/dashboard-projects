import { NextRequest, NextResponse } from 'next/server';
import { AlertScheduler } from '@/lib/alert-scheduler';

// POST /api/alert/trigger — manually fire the at-risk WhatsApp alert (for testing)
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
      return NextResponse.json({ error: 'Unauthorized access. Invalid or missing API key.' }, { status: 401 });
    }
  }

  if (process.env.WAHA_ALERT_ENABLED !== 'true') {
    return NextResponse.json({ error: 'Alert disabled. Set WAHA_ALERT_ENABLED=true.' }, { status: 403 });
  }

  try {
    await AlertScheduler.triggerNow();
    return NextResponse.json({ ok: true, message: 'Alert sent.' });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
