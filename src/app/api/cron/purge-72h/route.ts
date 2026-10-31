import { NextRequest, NextResponse } from 'next/server';
import { runSovereign72hPurge } from '@/server/cron/purge-72h-ledger';

export const dynamic = 'force-dynamic';

/**
 * Endpoint for triggering the 72-hour sovereign database purge on demand or via cron.
 * GET /api/cron/purge-72h
 * POST /api/cron/purge-72h
 */
export async function GET(req: NextRequest) {
  try {
    const result = await runSovereign72hPurge();
    return NextResponse.json({
      success: true,
      message: '72h sovereign purge executed successfully',
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Purge failed' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
