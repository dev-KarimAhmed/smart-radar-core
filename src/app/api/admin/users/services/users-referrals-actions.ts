/**
 * Penalties, Rehabilitation, and Referral Inactivity Actions for Admin Users API.
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { insertDualNotification } from './users-shared';

export async function handleResetPenalties(body: any, userId: string) {
  const { data: currProfile } = await supabaseAdmin
    .from('profiles')
    .select('role, rank_audit_log')
    .eq('id', userId)
    .single();

  const originalRole = currProfile?.role || 'CAPTAIN';
  let currentLogs: string[] = Array.isArray(currProfile?.rank_audit_log) ? [...currProfile.rank_audit_log] : [];
  currentLogs = currentLogs.filter(l => l !== 'ACCOUNT_SUSPENDED');
  currentLogs.push(`RESET_PENALTIES_${Date.now()}`);

  const updatePayload: Record<string, any> = {
    penalty_count: 0,
    rating: 5.0,
    trust_score: 5.0,
    trust_rating: 5.0,
    behavior_rating: 5.0,
    rank_penalty_expires_at: null,
    rank_audit_log: currentLogs,
    status: 'IDLE',
    updated_at: new Date().toISOString(),
  };

  if (originalRole === 'CAPTAIN' || originalRole === 'DRIVER') {
    const { error: err1 } = await supabaseAdmin
      .from('profiles')
      .update({
        role: 'RIDER',
        ...updatePayload,
      })
      .eq('id', userId);

    if (err1) throw err1;

    const { error: err2 } = await supabaseAdmin
      .from('profiles')
      .update({
        role: originalRole,
        status: 'IDLE',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (err2) throw err2;
  } else {
    const { error } = await supabaseAdmin
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId);

    if (error) throw error;
  }

  try {
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        status: 'IDLE',
        security_status: null,
      },
    });
  } catch (authErr) {
    console.warn('[Admin API] reset_penalties auth metadata update skipped:', authErr);
  }

  await insertDualNotification({
    id: `notif_reset_penalties_${userId}_${Date.now()}`,
    user_id: userId,
    title: originalRole === 'CAPTAIN' || originalRole === 'DRIVER'
      ? 'سجل المخالفات وكوابح السوق 🛡️'
      : 'إعادة تأهيل الحساب والنزاهة السلوكية 🛡️',
    description: originalRole === 'CAPTAIN' || originalRole === 'DRIVER'
      ? 'تمت مراجعة حسابك وتصفير سجل المخالفات بالكامل، واستعادة مؤشر الأمان والنزاهة السلوكية إلى 5.0 نجوم بنجاح.'
      : 'تمت إعادة تأهيل حسابك واستعادة مؤشر النزاهة والمناعة السلوكية إلى 5.0 نجوم كاملة وتصفير أي عقوبات سابقة بنجاح.',
    type: 'admin_message',
    is_read: false,
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({
    success: true,
    message: 'تم تصفير عداد المخالفات واستعادة مؤشر النزاهة السلوكية إلى 5.0 نجوم بنجاح.',
  });
}

export async function handleSimulateRiderActivity(body: any, effectiveUserId: string) {
  const { riderId, daysAgo = 0, captainId } = body;
  const targetRiderId = riderId || effectiveUserId;
  if (!targetRiderId) {
    return NextResponse.json({ success: false, error: 'riderId is required' }, { status: 400 });
  }

  let { data: refRow } = await supabaseAdmin
    .from('captain_rider_referrals')
    .select('id, captain_id')
    .eq('rider_id', targetRiderId)
    .maybeSingle();

  if (!refRow) {
    let targetCaptainId = captainId;
    if (!targetCaptainId) {
      const { data: firstCap } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('role', 'CAPTAIN')
        .limit(1)
        .maybeSingle();
      targetCaptainId = firstCap?.id;
    }

    if (targetCaptainId) {
      const { data: newRef, error: createRefErr } = await supabaseAdmin
        .from('captain_rider_referrals')
        .insert({
          rider_id: targetRiderId,
          captain_id: targetCaptainId,
          last_interacted_at: new Date().toISOString(),
        })
        .select('id, captain_id')
        .single();

      if (!createRefErr && newRef) {
        refRow = newRef;
      }
    }
  }

  const daysNum = Math.max(0, Number(daysAgo) || 0);
  const newInteractedAt = daysNum <= 0
    ? new Date().toISOString()
    : new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000).toISOString();

  if (refRow?.id) {
    const { error: updErr } = await supabaseAdmin
      .from('captain_rider_referrals')
      .update({
        last_interacted_at: newInteractedAt,
        last_inactivity_notified_at: null,
      })
      .eq('id', refRow.id);

    if (updErr) throw updErr;
  }

  await supabaseAdmin
    .from('profiles')
    .update({
      updated_at: new Date().toISOString(),
    })
    .eq('id', targetRiderId);

  return NextResponse.json({
    success: true,
    message: daysNum <= 0
      ? 'تم تنشيط الراكب واعتباره متفاعلاً اليوم بنجاح ⚡'
      : `تمت محاكاة عدم نشاط الراكب منذ ${daysNum} يوماً بنجاح ⏳`,
    simulatedDaysAgo: daysNum,
    lastInteractedAt: newInteractedAt,
    captainId: refRow?.captain_id || null,
  });
}

export async function handleRunInactivityCheck(body: any) {
  const { captainId } = body;
  let resData: any;
  if (captainId) {
    const { data, error } = await supabaseAdmin.rpc('check_captain_inactive_riders', {
      p_captain_id: captainId,
    });
    if (error) throw error;
    resData = data;
  } else {
    const { data, error } = await supabaseAdmin.rpc('check_and_notify_inactive_referred_riders');
    if (error) throw error;
    resData = data;
  }

  const count = resData?.notifications_dispatched || resData?.total_notifications_dispatched || 0;

  return NextResponse.json({
    success: true,
    message: count > 0
      ? `تم فحص عدم النشاط وإرسال (${count}) إشعار تنبيه للكباتن بنجاح 🚀`
      : 'تم فحص عدم النشاط: لا توجد إشعارات جديدة مستحقة حالياً.',
    data: resData,
    notificationsDispatched: count,
  });
}
