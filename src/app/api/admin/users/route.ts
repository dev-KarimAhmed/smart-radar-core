import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdminCaller, hasAdminSectorAccess } from '@/lib/admin-auth-verifier';
import { isValidUuid } from '@/shared/server/api-auth-guard';
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
  const roleFilter = (searchParams.get('role') || 'CAPTAIN').toUpperCase();
  if (!['CAPTAIN', 'RIDER'].includes(roleFilter)) {
    return NextResponse.json({ success: false, error: 'Invalid role filter' }, { status: 400 });
  }

  const hasAccess =
    roleFilter === 'CAPTAIN'
      ? hasAdminSectorAccess(admin, 'captains') || hasAdminSectorAccess(admin, 'wallet')
      : hasAdminSectorAccess(admin, 'riders');

  if (!hasAccess) {
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
    if (!action || typeof action !== 'string') {
      return NextResponse.json({ success: false, error: 'action is required' }, { status: 400 });
    }

    const isBulkAction = action.startsWith('bulk_') || action === 'run_inactivity_check';
    const effectiveUserId = typeof userId === 'string' ? userId.trim() : typeof body?.riderId === 'string' ? body.riderId.trim() : '';

    if (!isBulkAction && !isValidUuid(effectiveUserId)) {
      return NextResponse.json({ success: false, error: 'valid userId is required' }, { status: 400 });
    }

    if (isBulkAction) {
      if (action === 'run_inactivity_check') {
        if (!hasAdminSectorAccess(admin, 'riders')) {
          return NextResponse.json({ success: false, error: 'غير مصرح بالوصول لقطاع الركاب' }, { status: 403 });
        }
        return await handleRunInactivityCheck(body);
      }

      const bulkRole = String(body?.role || 'CAPTAIN').toUpperCase();
      if (!['CAPTAIN', 'RIDER'].includes(bulkRole)) {
        return NextResponse.json({ success: false, error: 'الدور المستهدف غير مسموح' }, { status: 400 });
      }
      const requiredSector = bulkRole === 'CAPTAIN' ? 'captains' : 'riders';
      const allowed =
        action === 'bulk_topup'
          ? hasAdminSectorAccess(admin, requiredSector) || hasAdminSectorAccess(admin, 'wallet')
          : hasAdminSectorAccess(admin, requiredSector);
      if (!allowed) {
        return NextResponse.json({ success: false, error: 'غير مصرح لك بتنفيذ هذا الإجراء الجماعي' }, { status: 403 });
      }

      if (action === 'bulk_send_message') return await handleBulkSendMessage(body);
      if (action === 'bulk_topup') return await handleBulkTopup(body);
      return NextResponse.json({ success: false, error: `إجراء غير معروف: ${action}` }, { status: 400 });
    }

    const { data: targetProfile, error: targetErr } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', effectiveUserId)
      .maybeSingle();

    if (targetErr || !targetProfile) {
      return NextResponse.json({ success: false, error: 'المستخدم المستهدف غير موجود' }, { status: 404 });
    }

    const targetRole = String(targetProfile.role || '').toUpperCase();
    if (targetRole === 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'غير مسموح بتعديل الحسابات الإدارية من هذه الواجهة' },
        { status: 403 }
      );
    }

    const targetSector = targetRole === 'CAPTAIN' || targetRole === 'DRIVER' ? 'captains' : 'riders';
    const isWalletTopupAction = action === 'topup_minutes' || action === 'adjust_balance';
    const isCaptainOnlyAction =
      action === 'update_verification' || action === 'update_tier' || action === 'force_clear_trip';
    const isRiderSimAction = action === 'simulate_rider_activity';

    if (isCaptainOnlyAction && !hasAdminSectorAccess(admin, 'captains')) {
      return NextResponse.json({ success: false, error: 'غير مصرح بالوصول لقطاع الكباتن' }, { status: 403 });
    }
    if (isRiderSimAction && !hasAdminSectorAccess(admin, 'riders')) {
      return NextResponse.json({ success: false, error: 'غير مصرح بالوصول لقطاع الركاب' }, { status: 403 });
    }
    if (isWalletTopupAction && !(hasAdminSectorAccess(admin, targetSector) || hasAdminSectorAccess(admin, 'wallet'))) {
      return NextResponse.json({ success: false, error: 'غير مصرح بالوصول لعمليات الشحن' }, { status: 403 });
    }
    if (!isCaptainOnlyAction && !isRiderSimAction && !isWalletTopupAction && !hasAdminSectorAccess(admin, targetSector)) {
      return NextResponse.json({ success: false, error: 'غير مصرح بالوصول لهذا القطاع' }, { status: 403 });
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
      case 'update_language':
        return await handleUpdateLanguage(effectiveUserId, body);
      case 'simulate_rider_activity':
        return await handleSimulateRiderActivity(effectiveUserId, body);
      default:
        return NextResponse.json({ success: false, error: `إجراء غير معروف: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Admin Users API] Mutation error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء معالجة الطلب' },
      { status: 500 }
    );
  }
}
