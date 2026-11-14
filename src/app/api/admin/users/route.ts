/**
 * Admin Users API Route.
 * Dispatches management actions for Captains & Riders under SC55 & 250-line rule.
 */

import { NextResponse } from 'next/server';
import { verifyAdminCaller } from '@/lib/admin-auth-verifier';
import { handleUsersGet } from './services/users-get-handler';
import {
  handleUpdateStatus,
  handleUpdateVerification,
  handleUpdateLanguage,
  handleUpdateTier,
  handleForceClearTrip,
} from './services/users-status-actions';
import {
  handleTopupMinutes,
  handleAdjustBalance,
  handleBulkTopup,
} from './services/users-financial-actions';
import {
  handleSendMessage,
  handleBulkSendMessage,
} from './services/users-messaging-actions';
import {
  handleResetPenalties,
  handleSimulateRiderActivity,
  handleRunInactivityCheck,
} from './services/users-referrals-actions';

export async function GET(req: Request) {
  const admin = await verifyAdminCaller(req);
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required' }, { status: 401 });
  }

  return handleUsersGet(req, admin);
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
        return await handleUpdateStatus(body, effectiveUserId);
      case 'update_verification':
        return await handleUpdateVerification(body, effectiveUserId);
      case 'update_language':
        return await handleUpdateLanguage(body, effectiveUserId);
      case 'update_tier':
        return await handleUpdateTier(body, effectiveUserId);
      case 'force_clear_trip':
        return await handleForceClearTrip(effectiveUserId);
      case 'topup_minutes':
        return await handleTopupMinutes(body, effectiveUserId);
      case 'adjust_balance':
        return await handleAdjustBalance(body, effectiveUserId);
      case 'bulk_topup':
        return await handleBulkTopup(body);
      case 'send_message':
        return await handleSendMessage(body, effectiveUserId);
      case 'bulk_send_message':
        return await handleBulkSendMessage(body);
      case 'reset_penalties':
        return await handleResetPenalties(body, effectiveUserId);
      case 'simulate_rider_activity':
        return await handleSimulateRiderActivity(body, effectiveUserId);
      case 'run_inactivity_check':
        return await handleRunInactivityCheck(body);
      default:
        return NextResponse.json({ success: false, error: `إجراء غير معروف: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Admin Users API] Mutation error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'حدث خطأ أثناء معالجة الطلب' }, { status: 500 });
  }
}
