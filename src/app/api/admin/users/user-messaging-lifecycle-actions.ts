import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { encodeNotificationPayload } from '@/shared/utils/notification-i18n';
import { insertDualNotification } from './user-notification-helper';

export async function handleUpdateTier(userId: string, body: any) {
  const tier = String(body.tier).toUpperCase();
  if (!['PLATINUM', 'GOLD', 'BRONZE', 'SILVER'].includes(tier)) {
    return NextResponse.json({ success: false, error: 'الرتبة غير صحيحة' }, { status: 400 });
  }

  const { data: currProfile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  const originalRole = currProfile?.role || 'CAPTAIN';

  const { error: err1 } = await supabaseAdmin
    .from('profiles')
    .update({
      role: 'RIDER',
      tier,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (err1) throw err1;

  const { error: err2 } = await supabaseAdmin
    .from('profiles')
    .update({
      role: originalRole,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (err2) throw err2;

  try {
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { tier, rank: tier },
    });
  } catch (authErr) {
    console.warn('[Admin API] update_tier auth metadata update skipped:', authErr);
  }

  const tierNames: Record<string, string> = {
    PLATINUM: 'البلاتينية 💎',
    GOLD: 'الذهبية 🥇',
    BRONZE: 'البرونزية 🥉',
    SILVER: 'الفضية 🥈',
  };

  await insertDualNotification({
    id: `notif_tier_${userId}_${Date.now()}`,
    user_id: userId,
    title: `ترقية سيادية: أصبحت رتبتك ${tierNames[tier] || tier} 🏆`,
    description: `تهانينا يا كابتن معلن! قامت الإدارة بترقية رتبتك إلى (${tierNames[tier] || tier})، مما يمنحك مميزات تسعير وعروض أفضل على الرادار.`,
    type: 'admin_message',
    is_read: false,
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({ success: true, message: `تم تحديث الرتبة إلى ${tier}` });
}

export async function handleForceClearTrip(userId: string) {
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      status: 'IDLE',
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) throw error;

  await supabaseAdmin
    .from('ride_requests')
    .update({
      status: 'CANCELLED',
      updated_at: new Date().toISOString(),
    })
    .eq('captain_id', userId)
    .in('status', ['ACCEPTED', 'ARRIVED', 'IN_PROGRESS', 'PICKED_UP', 'STARTED']);

  await insertDualNotification({
    id: `notif_clear_trip_${userId}_${Date.now()}`,
    user_id: userId,
    title: 'فك تعليق الرحلة ⚡',
    description: 'تم فك تعليق رحلتك من قبل الإدارة وإعادتك لوضع الجاهزية (IDLE) لاستقبال طلبات جديدة.',
    type: 'admin_message',
    is_read: false,
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({
    success: true,
    message: 'تم فك تعليق الرحلة وإعادة الكابتن المعلن لوضع الجاهزية (IDLE).',
  });
}

export async function handleSendMessage(userId: string, body: any) {
  const { title, message, type, titleEn, messageEn, title_en, message_en } = body;
  if (!message || !String(message).trim()) {
    return NextResponse.json({ success: false, error: 'نص الرسالة مطلوب' }, { status: 400 });
  }

  const msgTitle = title && String(title).trim() ? String(title).trim() : 'رسالة من إدارة المنظومة';
  const msgType = type || 'admin_message';
  const enTitle = (titleEn || title_en || '').trim();
  const enMessage = (messageEn || message_en || '').trim();

  const { data: recipientProfile } = await supabaseAdmin
    .from('profiles')
    .select('preferred_language')
    .eq('id', userId)
    .maybeSingle();

  const isEn = (recipientProfile?.preferred_language || '').toLowerCase() === 'en';
  const userTitle = isEn && enTitle ? enTitle : msgTitle;
  const encodedPayload = encodeNotificationPayload(
    msgTitle,
    String(message).trim(),
    enTitle || msgTitle,
    enMessage || String(message).trim()
  );

  const { data: notif, error: notifErr } = await supabaseAdmin
    .from('user_notifications')
    .insert({
      user_id: userId,
      title: userTitle,
      description: encodedPayload.description,
      type: msgType,
      is_read: false,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (notifErr) throw notifErr;

  return NextResponse.json({
    success: true,
    message: 'تم إرسال الرسالة بنجاح عبر الإشعار اللحظي وفق لغة الكابتن.',
    notification: notif,
  });
}

export async function handleBulkSendMessage(body: any) {
  const { title, message, type, titleEn, messageEn, title_en, message_en, userIds, role = 'CAPTAIN' } = body;
  if (!message || !String(message).trim()) {
    return NextResponse.json({ success: false, error: 'نص الرسالة مطلوب' }, { status: 400 });
  }

  const msgTitle = title && String(title).trim() ? String(title).trim() : 'رسالة من إدارة المنظومة';
  const msgType = type || 'admin_message';
  const enTitle = (titleEn || title_en || '').trim();
  const enMessage = (messageEn || message_en || '').trim();

  let targetProfiles: Array<{ id: string; preferred_language?: string }> = [];

  if (Array.isArray(userIds) && userIds.length > 0) {
    const { data: usersData, error: uErr } = await supabaseAdmin
      .from('profiles')
      .select('id, preferred_language')
      .in('id', userIds);

    if (uErr) throw uErr;
    targetProfiles = usersData || userIds.map((id) => ({ id, preferred_language: 'ar' }));
  } else {
    const { data: captainsData, error: capErr } = await supabaseAdmin
      .from('profiles')
      .select('id, preferred_language')
      .eq('role', role);

    if (capErr) throw capErr;
    targetProfiles = captainsData || [];
  }

  if (targetProfiles.length === 0) {
    return NextResponse.json(
      { success: false, error: 'لم يتم العثور على أي مستخدمين لإرسال الإشعار إليهم' },
      { status: 400 }
    );
  }

  const notifications = targetProfiles.map((p) => {
    const isEn = (p.preferred_language || '').toLowerCase() === 'en';
    const userTitle = isEn && enTitle ? enTitle : msgTitle;
    const encodedPayload = encodeNotificationPayload(
      msgTitle,
      String(message).trim(),
      enTitle || msgTitle,
      enMessage || String(message).trim()
    );

    return {
      user_id: p.id,
      title: userTitle,
      description: encodedPayload.description,
      type: msgType,
      is_read: false,
      created_at: new Date().toISOString(),
    };
  });

  const CHUNK_SIZE = 500;
  for (let i = 0; i < notifications.length; i += CHUNK_SIZE) {
    const chunk = notifications.slice(i, i + CHUNK_SIZE);
    const { error: insertErr } = await supabaseAdmin.from('user_notifications').insert(chunk);
    if (insertErr) throw insertErr;
  }

  return NextResponse.json({
    success: true,
    count: targetProfiles.length,
    message: `تم إرسال الإشعار اللحظي بنجاح إلى (${targetProfiles.length}) مستخدم وفقاً للغة كل كابتن.`,
  });
}

export async function handleUpdateLanguage(userId: string, body: any) {
  const targetLang = String(body.language || 'ar').toLowerCase() === 'en' ? 'en' : 'ar';
  const { error: langErr } = await supabaseAdmin
    .from('profiles')
    .update({
      preferred_language: targetLang,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (langErr) throw langErr;

  return NextResponse.json({
    success: true,
    userId,
    preferred_language: targetLang,
    message: targetLang === 'en' ? 'تم ضبط لغة الكابتن إلى الإنجليزية بنجاح.' : 'تم ضبط لغة الكابتن إلى العربية بنجاح.',
  });
}

export async function handleBulkTopup(body: any) {
  const { topupType = 'minutes', minutes, extendDays = 30, amount, userIds, role = 'CAPTAIN' } = body;

  let targetIds: string[] = [];

  if (Array.isArray(userIds) && userIds.length > 0) {
    targetIds = userIds;
  } else {
    const { data: captainsData, error: capErr } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('role', role);

    if (capErr) throw capErr;
    targetIds = (captainsData || []).map((c) => c.id);
  }

  if (targetIds.length === 0) {
    return NextResponse.json({ success: false, error: 'لم يتم العثور على كباتن لتنفيذ الشحن' }, { status: 400 });
  }

  const CHUNK_SIZE = 500;

  if (topupType === 'minutes') {
    const numMinutes = Number(minutes);
    if (isNaN(numMinutes) || numMinutes <= 0) {
      return NextResponse.json({ success: false, error: 'عدد الدقائق غير صحيح' }, { status: 400 });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + Number(extendDays || 30));

    const { data: existingWallets, error: wErr } = await supabaseAdmin
      .from('wallet_accounts')
      .select('profile_id, paid_minutes_remaining, balance')
      .in('profile_id', targetIds);

    if (wErr) throw wErr;

    const walletMap = new Map((existingWallets || []).map((w) => [w.profile_id, w]));

    const upsertRows = targetIds.map((id) => {
      const current = walletMap.get(id);
      const currentMinutes = Number(current?.paid_minutes_remaining || 0);
      return {
        profile_id: id,
        balance: Number(current?.balance || 0),
        paid_minutes_remaining: currentMinutes + numMinutes,
        time_bundle_expires_at: expiresAt.toISOString(),
        active_package_name: `شحن جماعي (${numMinutes} دقيقة)`,
        updated_at: new Date().toISOString(),
      };
    });

    for (let i = 0; i < upsertRows.length; i += CHUNK_SIZE) {
      const chunk = upsertRows.slice(i, i + CHUNK_SIZE);
      const { error: upErr } = await supabaseAdmin
        .from('wallet_accounts')
        .upsert(chunk, { onConflict: 'profile_id' });
      if (upErr) throw upErr;
    }

    const notifs = targetIds.map((id) => ({
      user_id: id,
      title: '⚡ شحن دقائق رادار جماعي',
      description: `تمت إضافة (${numMinutes}) دقيقة رادار لحسابك بنجاح من قبل إدارة المنظومة وتمديد الصلاحية لـ ${extendDays} يوماً.`,
      type: 'deposit_confirmed',
      is_read: false,
      created_at: new Date().toISOString(),
    }));

    for (let i = 0; i < notifs.length; i += CHUNK_SIZE) {
      const chunk = notifs.slice(i, i + CHUNK_SIZE);
      await supabaseAdmin.from('user_notifications').insert(chunk);
    }

    return NextResponse.json({
      success: true,
      count: targetIds.length,
      message: `تم شحن ${numMinutes} دقيقة رادار لـ (${targetIds.length}) كابتن معلن بنجاح وإرسال إشعار لحظي لكل منهم.`,
    });
  } else {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount === 0) {
      return NextResponse.json({ success: false, error: 'المبلغ غير صحيح' }, { status: 400 });
    }

    const { data: existingWallets, error: wErr } = await supabaseAdmin
      .from('wallet_accounts')
      .select('profile_id, balance')
      .in('profile_id', targetIds);

    if (wErr) throw wErr;

    const walletMap = new Map((existingWallets || []).map((w) => [w.profile_id, w]));

    const upsertRows = targetIds.map((id) => {
      const current = walletMap.get(id);
      const currentBal = Number(current?.balance || 0);
      return {
        profile_id: id,
        balance: Math.max(0, currentBal + numAmount),
        updated_at: new Date().toISOString(),
      };
    });

    for (let i = 0; i < upsertRows.length; i += CHUNK_SIZE) {
      const chunk = upsertRows.slice(i, i + CHUNK_SIZE);
      const { error: upErr } = await supabaseAdmin
        .from('wallet_accounts')
        .upsert(chunk, { onConflict: 'profile_id' });
      if (upErr) throw upErr;
    }

    const notifs = targetIds.map((id) => ({
      user_id: id,
      title: '💰 إيداع رصيد نقدي',
      description: `تم إيداع مبلغ (${numAmount > 0 ? '+' : ''}${numAmount}) في محفظتك من قبل إدارة المنظومة.`,
      type: 'deposit_confirmed',
      is_read: false,
      created_at: new Date().toISOString(),
    }));

    for (let i = 0; i < notifs.length; i += CHUNK_SIZE) {
      const chunk = notifs.slice(i, i + CHUNK_SIZE);
      await supabaseAdmin.from('user_notifications').insert(chunk);
    }

    return NextResponse.json({
      success: true,
      count: targetIds.length,
      message: `تم تعديل الرصيد النقدي بمقدار (${numAmount}) لـ (${targetIds.length}) كابتن معلن بنجاح.`,
    });
  }
}

export async function handleSimulateRiderActivity(userId: string, body: any) {
  const { riderId, daysAgo = 0, captainId } = body;
  const targetRiderId = riderId || userId;
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
  const newInteractedAt =
    daysNum <= 0
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
    message:
      daysNum <= 0
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
    message:
      count > 0
        ? `تم فحص عدم النشاط وإرسال (${count}) إشعار تنبيه للكباتن بنجاح 🚀`
        : 'تم فحص عدم النشاط: لا توجد إشعارات جديدة مستحقة حالياً.',
    data: resData,
    notificationsDispatched: count,
  });
}
