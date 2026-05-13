import { NextResponse } from 'next/server';
import { AlertScheduler } from '@/lib/alert-scheduler';

// POST /api/alert/trigger — manually fire the at-risk WhatsApp alert (for testing)
export async function POST() {
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
