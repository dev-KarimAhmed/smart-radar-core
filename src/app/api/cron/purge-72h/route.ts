import { NextRequest, NextResponse } from 'next/server';
import { runSovereign72hPurge } from '@/server/cron/purge-72h-ledger';
import { requireAdminAccess } from '@/features/admin/lib/admin-auth-server';
import { extractBearerToken, timingSafeCompare } from '@/shared/server/api-auth-guard';

export const dynamic = 'force-dynamic';

async function isAuthorizedCronOrAdmin(req: NextRequest): Promise<{ ok: boolean; status: number; error: string }> {
  const configuredSecret = (process.env.CRON_SECRET || '').trim();
  const headerSecret = (req.headers.get('x-cron-secret') || '').trim();
  const bearerToken = extractBearerToken(req) || '';

  if (configuredSecret) {
    if (
      (headerSecret && timingSafeCompare(headerSecret, configuredSecret)) ||
      (bearerToken && timingSafeCompare(bearerToken, configuredSecret))
    ) {
      return { ok: true, status: 200, error: '' };
    }
  }

  const adminAuth = await requireAdminAccess(req, { requireGeneralAdmin: true });
  if (adminAuth.ok) {
    return { ok: true, status: 200, error: '' };
  }

  return { ok: false, status: adminAuth.status, error: 'Unauthorized: Valid CRON_SECRET or GENERAL_ADMIN session required' };
}

/**
 * Endpoint for triggering the 72-hour sovereign database purge on demand or via cron.
 * GET /api/cron/purge-72h
 * POST /api/cron/purge-72h
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await isAuthorizedCronOrAdmin(req);
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const result = await runSovereign72hPurge();
    return NextResponse.json({
      success: true,
      message: '72h sovereign purge executed successfully',
      data: result,
    });
  } catch (error) {
    console.error('[cron/purge-72h] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Purge failed' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
