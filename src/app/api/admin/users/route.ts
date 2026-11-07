import { NextResponse } from 'next/server';
import { verifyAdminCaller, hasAdminSectorAccess } from '@/lib/admin-auth-verifier';
import { fetchAdminUsers } from './user-query-service';
import {
  handleUpdateStatus,
  handleUpdateVerification,
  handleTopupMinutes,
  handleAdjustBalance,
  handleResetPenalties,
} from './user-status-balance-actions';
import {
  handleUpdateTier,
  handleForceClearTrip,
  handleSendMessage,
  handleBulkSendMessage,
  handleUpdateLanguage,
  handleBulkTopup,
  handleSimulateRiderActivity,
  handleRunInactivityCheck,
} from './user-messaging-lifecycle-actions';

export async function GET(req: Request) {
  const admin = await verifyAdminCaller(req);
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const roleFilter = searchParams.get('role')?.toUpperCase() || 'CAPTAIN';
  const targetSector = roleFilter === 'CAPTAIN' ? 'captains' : 'riders';

  if (!hasAdminSectorAccess(admin, targetSector)) {
    return NextResponse.json(
      { success: false, error: 'غير مصرح: ليس لديك صلاحية الوصول لهذا القطاع' },
      { status: 403 }
    );
  }

  return fetchAdminUsers(roleFilter);
}

export async function POST(req: Request) {
  const admin = await verifyAdminCaller(req);
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required' }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch (err: any) {
    console.error('[Admin Users API] Error parsing JSON body:', err);
    return NextResponse.json({ success: false, error: 'تعذر قراءة بيانات الطلب (Invalid JSON body)' }, { status: 400 });
  }

  try {
    const { action, userId } = body || {};
    const isBulkAction = action?.startsWith('bulk_') || action === 'run_inactivity_check';
    const effectiveUserId = userId || body?.riderId;

    if (!isBulkAction && !effectiveUserId) {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
    }

    switch (action) {
      case 'update_status':
        return await handleUpdateStatus(effectiveUserId, body);
      case 'update_verification':
        return await handleUpdateVerification(effectiveUserId, body);
      case 'topup_minutes':
        return await handleTopupMinutes(effectiveUserId, body);
      case 'adjust_balance':
        return await handleAdjustBalance(effectiveUserId, body);
      case 'reset_penalties':
        return await handleResetPenalties(effectiveUserId);
      case 'update_tier':
        return await handleUpdateTier(effectiveUserId, body);
      case 'force_clear_trip':
        return await handleForceClearTrip(effectiveUserId);
      case 'send_message':
        return await handleSendMessage(effectiveUserId, body);
      case 'bulk_send_message':
        return await handleBulkSendMessage(body);
      case 'update_language':
        return await handleUpdateLanguage(effectiveUserId, body);
      case 'bulk_topup':
        return await handleBulkTopup(body);
      case 'simulate_rider_activity':
        return await handleSimulateRiderActivity(effectiveUserId, body);
      case 'run_inactivity_check':
        return await handleRunInactivityCheck(body);
      default:
        return NextResponse.json({ success: false, error: `إجراء غير معروف: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Admin Users API] Mutation error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'حدث خطأ أثناء معالجة الطلب' },
      { status: 500 }
    );
  }
}
