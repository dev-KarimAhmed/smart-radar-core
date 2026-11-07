import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { insertDualNotification } from './user-notification-helper';

export async function handleUpdateStatus(userId: string, body: any) {
  const { status } = body;
  const normalizedStatus = String(status).toUpperCase();
  if (!['ACTIVE', 'IDLE', 'BUSY', 'SUSPENDED', 'BANNED'].includes(normalizedStatus)) {
    return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
  }

  const dbStatus =
    normalizedStatus === 'SUSPENDED' ? 'BANNED' : normalizedStatus === 'BUSY' ? 'ACTIVE' : normalizedStatus;

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
    currentLogs = currentLogs.filter((l) => l !== 'ACCOUNT_SUSPENDED');
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
        security_status:
          normalizedStatus === 'SUSPENDED' || normalizedStatus === 'BANNED' ? normalizedStatus : null,
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
    notifTitle = isRider ? 'تم تنشيط حسابك على الرادار ⚡' : 'تم تنشيط حسابك على الرادار ⚡';
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
    notifDesc =
      'تم تعليق حسابك مؤقتاً من قبل إدارة العمليات لمراجعة النشاط أو المناعة السلوكية. يرجى مراجعة الإدارة أو التواصل مع الدعم لفك التعليق.';
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

export async function handleUpdateVerification(userId: string, body: any) {
  const { verificationStatus, reason } = body;
  const normStatus = String(verificationStatus).toUpperCase();
  if (!['APPROVED', 'REJECTED', 'PENDING'].includes(normStatus)) {
    return NextResponse.json({ success: false, error: 'Invalid verification status' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('captain_profiles')
    .update({
      verification_status: normStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) throw error;

  if (normStatus === 'APPROVED') {
    await insertDualNotification({
      id: `notif_verif_${userId}_${Date.now()}`,
      user_id: userId,
      title: 'تهانينا يا كابتن معلن! تم اعتماد وتوثيق حسابك رسمياً 🏆',
      description:
        'تمت مراجعة وتدقيق هويتك ومستنداتك بنجاح من قبل إدارة المنظومة، ومُنحت شارة «كابتن معلن موثق رسمياً ✓».',
      type: 'admin_message',
      is_read: false,
      created_at: new Date().toISOString(),
    });
  } else if (normStatus === 'REJECTED') {
    await insertDualNotification({
      id: `notif_verif_rej_${userId}_${Date.now()}`,
      user_id: userId,
      title: 'تنبيه: مراجعة وثائق الكابتن المعلن ⚠️',
      description:
        reason || 'يرجى إعادة رفع وثائق واضحة ومطابقة للشروط والتعليمات لتأكيد اعتماد الحساب.',
      type: 'warning',
      is_read: false,
      created_at: new Date().toISOString(),
    });
  }

  return NextResponse.json({ success: true, message: `تم تحديث حالة الاعتماد إلى ${normStatus}` });
}

export async function handleTopupMinutes(userId: string, body: any) {
  const minutes = Number(body.minutes);
  if (isNaN(minutes) || minutes <= 0) {
    return NextResponse.json({ success: false, error: 'عدد الدقائق غير صحيح' }, { status: 400 });
  }

  const extendDays = Number(body.extendDays || 30);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + extendDays);

  const { data: existingWallet } = await supabaseAdmin
    .from('wallet_accounts')
    .select('*')
    .eq('profile_id', userId)
    .single();

  if (existingWallet) {
    const newMinutes = (Number(existingWallet.paid_minutes_remaining) || 0) + minutes;
    const { error } = await supabaseAdmin
      .from('wallet_accounts')
      .update({
        paid_minutes_remaining: newMinutes,
        time_bundle_expires_at: expiresAt.toISOString(),
        active_package_name: `شحن إداري (${minutes} دقيقة)`,
        updated_at: new Date().toISOString(),
      })
      .eq('profile_id', userId);

    if (error) throw error;
  } else {
    const { error } = await supabaseAdmin.from('wallet_accounts').insert({
      profile_id: userId,
      balance: 0,
      paid_minutes_remaining: minutes,
      bonus_minutes_remaining: 0,
      time_bundle_expires_at: expiresAt.toISOString(),
      active_package_name: `شحن إداري (${minutes} دقيقة)`,
      currency_code: 'JOD',
    });

    if (error) throw error;
  }

  await insertDualNotification({
    id: `notif_topup_min_${userId}_${Date.now()}`,
    user_id: userId,
    title: 'شحن رصيد دقائق الرادار ⚡',
    description: `تم شحن (${minutes}) دقيقة لحسابك بنجاح من قبل الإدارة. أصبحت الدقائق جاهزة للاستخدام الآن!`,
    type: 'admin_message',
    is_read: false,
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({
    success: true,
    message: `تم شحن ${minutes} دقيقة رادار بنجاح وتمديد الصلاحية لـ ${extendDays} يوماً.`,
  });
}

export async function handleAdjustBalance(userId: string, body: any) {
  const amount = Number(body.amount);
  if (isNaN(amount)) {
    return NextResponse.json({ success: false, error: 'المبلغ غير صحيح' }, { status: 400 });
  }

  const { data: existingWallet } = await supabaseAdmin
    .from('wallet_accounts')
    .select('balance')
    .eq('profile_id', userId)
    .single();

  const currentBalance = Number(existingWallet?.balance || 0);
  const newBalance = Math.max(0, currentBalance + amount);

  const { error } = await supabaseAdmin
    .from('wallet_accounts')
    .upsert(
      {
        profile_id: userId,
        balance: newBalance,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'profile_id' }
    );

  if (error) throw error;

  await insertDualNotification({
    id: `notif_adjust_bal_${userId}_${Date.now()}`,
    user_id: userId,
    title: 'إيداع نقدي في المحفظة 💰',
    description: `تم إيداع مبلغ (${amount}) في محفظتك بنجاح من قبل الإدارة. الرصيد المالي الحالي: ${newBalance.toFixed(2)}.`,
    type: 'admin_message',
    is_read: false,
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({
    success: true,
    message: `تم تعديل الرصيد بمقدار ${amount > 0 ? '+' : ''}${amount}. الرصيد الحالي: ${newBalance.toFixed(2)}`,
  });
}

export async function handleResetPenalties(userId: string) {
  const { data: currProfile } = await supabaseAdmin
    .from('profiles')
    .select('role, rank_audit_log')
    .eq('id', userId)
    .single();

  const originalRole = currProfile?.role || 'CAPTAIN';
  let currentLogs: string[] = Array.isArray(currProfile?.rank_audit_log) ? [...currProfile.rank_audit_log] : [];
  currentLogs = currentLogs.filter((l) => l !== 'ACCOUNT_SUSPENDED');
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
    const { error } = await supabaseAdmin.from('profiles').update(updatePayload).eq('id', userId);

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
    title:
      originalRole === 'CAPTAIN' || originalRole === 'DRIVER'
        ? 'سجل المخالفات وكوابح السوق 🛡️'
        : 'إعادة تأهيل الحساب والنزاهة السلوكية 🛡️',
    description:
      originalRole === 'CAPTAIN' || originalRole === 'DRIVER'
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
