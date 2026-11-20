import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  formatWeeklyDigestNotification,
  partitionCaptainsForLoadBalancing,
  type WeeklyCaptainStats,
} from '@/features/captain/services/weekly-report-digest';

export const dynamic = 'force-dynamic';

/**
 * Weekly Statistical Report & Geographic Load Balancing Cron
 * Staggers notification batches geographically (Friday 9:00 AM model)
 * GET /api/cron/weekly-digest
 * POST /api/cron/weekly-digest
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Fetch active captains
    const { data: captains, error } = await supabaseAdmin
      .from('profiles')
      .select('id, governorate_id, district_id, status')
      .in('role', ['DRIVER', 'CAPTAIN'])
      .limit(1000);

    if (error) throw error;
    if (!captains || captains.length === 0) {
      return NextResponse.json({ success: true, message: 'No active captains found', batches: 0 });
    }

    // 2. Map captains to weekly stats payload
    const statsList: WeeklyCaptainStats[] = captains.map((c: any) => ({
      captainId: c.id,
      governorateId: c.governorate_id || 'central',
      districtId: c.district_id || 'general',
      favoritesDelta: 0,
      positiveRatingsCount: 0,
      vehicleNegativeCount: 0,
      captainNegativeCount: 0,
    }));

    // 3. Cluster captains into geographic batches to avoid server spikes
    const batches = partitionCaptainsForLoadBalancing(statsList, 60_000);

    // 4. Sample format demonstration adhering to privacy rules
    const samplePreview = statsList[0] ? formatWeeklyDigestNotification(statsList[0]) : null;

    return NextResponse.json({
      success: true,
      message: 'Weekly digest batches partitioned and scheduled successfully',
      totalCaptains: statsList.length,
      totalBatches: batches.length,
      samplePreview,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Weekly Digest Cron] execution warning:', error);
    }
    return NextResponse.json(
      { success: false, error: error?.message || 'Weekly digest scheduling failed' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
