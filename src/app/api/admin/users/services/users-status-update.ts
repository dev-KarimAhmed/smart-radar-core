/**
 * Operational Status Update Action for Admin Users API.
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { insertDualNotification } from './users-shared';

export async function handleUpdateStatus(body: any, userId: string) {
  const { status } = body;
  const normalizedStatus = String(status).toUpperCase();
  if (!['ACTIVE', 'IDLE', 'BUSY', 'SUSPENDED', 'BANNED'].includes(normalizedStatus)) {
    return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
  }

  const dbStatus = normalizedStatus === 'SUSPENDED' ? 'BANNED' : normalizedStatus === 'BUSY' ? 'ACTIVE' : normalizedStatus;

  const { data: currProfile } = await supabaseAdmin
    .from('profiles')
    .select('role, rank_audit_log')
    .eq('id', userId)
    .single();

  const originalRole = currProfile?.role || 'CAPTAIN';
  let currentLogs: string[] = Array.isArray(currProfile?.rank_audit_log) ? [...currProfile.rank_audit_log] : [];

  if (normalizedStatus === 'SUSPENDED') {
    if (!currentLogs.includes('ACCOUNT_SUSPENDED')) {
      currentLogs.push('ACCOUNT_SUSPENDED');
    }
  } else {
    currentLogs = currentLogs.filter(l => l !== 'ACCOUNT_SUSPENDED');
  }

  if (originalRole === 'CAPTAIN' || originalRole === 'DRIVER') {
    const { error: err1 } = await supabaseAdmin
      .from('profiles')
      .update({
        role: 'RIDER',
        status: dbStatus,
        rank_audit_log: currentLogs,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (err1) throw err1;

    const { error: err2 } = await supabaseAdmin
      .from('profiles')
      .update({
        role: originalRole,
        status: dbStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (err2) throw err2;
  } else {
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        status: dbStatus,
        rank_audit_log: currentLogs,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;
  }

  try {
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        status: normalizedStatus,
        security_status: (normalizedStatus === 'SUSPENDED' || normalizedStatus === 'BANNED') ? normalizedStatus : null,
      },
    });
  } catch (authErr) {
    console.warn('[Admin API] update_status auth metadata update skipped:', authErr);
  }

  if (normalizedStatus === 'SUSPENDED' || normalizedStatus === 'BANNED') {
    await supabaseAdmin
      .from('ride_requests')
      .update({
        status: 'CANCELLED',
        cancelled_at: new Date().toISOString(),
      })
      .eq('rider_id', userId)
      .eq('status', 'PENDING');
  }

  let notifTitle = 'تحديث في الحالة التشغيلية';
  let notifDesc = `قامت الإدارة بتحديث حالتك إلى: ${normalizedStatus}`;
  let notifType: 'admin_message' | 'warning' | 'urgent' = 'admin_message';

  const isRider = originalRole === 'RIDER';

  if (normalizedStatus === 'ACTIVE') {
    notifTitle = 'تم تنشيط حسابك على الرادار ⚡';
    notifDesc = isRider
      ? 'قامت إدارة المنظومة بتنشيط حسابك فورياً، وأصبحت جاهزاً لطلب الرحلات والتواصل مع الكباتن المعلنين عبر الرادار.'
      : 'قامت إدارة المنظومة بتنشيط حسابك فورياً، وأصبحت متصلاً بالرادار وجاهزاً لاستقبال طلبات المستخدمين.';
  } else if (normalizedStatus === 'IDLE') {
    notifTitle = isRider ? 'تم ضبط حسابك إلى وضع الجاهزية 🛑' : 'تم ضبط وضعك إلى خامل (جاهز) 🛑';
    notifDesc = isRider
      ? 'أنت الآن في وضع الجاهزية، يمكنك طلب الرحلات عبر الرادار في أي وقت.'
      : 'أنت الآن في وضع الجاهزية والخمول، يمكنك تفعيل الاتصال بالرادار متى شئت.';
  } else if (normalizedStatus === 'SUSPENDED') {
    notifTitle = isRider ? 'تنبيه إداري: تم تعليق حساب المستخدم مؤقتاً ⚠️' : 'تنبيه إداري: تم تعليق حسابك مؤقتاً ⚠️';
    notifDesc = 'تم تعليق حسابك مؤقتاً من قبل إدارة العمليات لمراجعة النشاط أو المناعة السلوكية. يرجى مراجعة الإدارة أو التواصل مع الدعم لفك التعليق.';
    notifType = 'warning';
  } else if (normalizedStatus === 'BANNED') {
    notifTitle = isRider ? 'إشعار أمني: تم حظر حساب المستخدم نهائياً 🚫' : 'إشعار أمني: تم حظر حسابك نهائياً 🚫';
    notifDesc = isRider
      ? 'تم حظر حسابك نهائياً من قبل إدارة المنظومة لمخالفة المعايير التشغيلية والسيادية. تم إيقاف إمكانية طلب الرحلات والاتصال بالرادار.'
      : 'تم حظر حسابك نهائياً من قبل إدارة المنظومة لمخالفة المعايير التشغيلية والسيادية.';
    notifType = 'urgent';
  }

  await insertDualNotification({
    id: `notif_status_${userId}_${Date.now()}`,
    user_id: userId,
    title: notifTitle,
    description: notifDesc,
    type: notifType,
    is_read: false,
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({ success: true, message: `تم تحديث الحالة إلى ${normalizedStatus}` });
}
