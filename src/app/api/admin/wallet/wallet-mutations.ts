import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { encodeNotificationPayload, resolveDynamicNotification } from '@/shared/utils/notification-i18n';

// Generate human-friendly voucher codes
export function generateVoucherCode(minutes: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `RDR-${minutes}M-${rand}`;
}

export async function sendCaptainNotification(userId: string, id: string, title: string, description: string, type: string) {
  try {
    const notifId = `${id}_${Date.now()}`;
    const dynamic = resolveDynamicNotification(title, description);
    const encoded = dynamic.matched
      ? encodeNotificationPayload(dynamic.titleAr, dynamic.descriptionAr, dynamic.titleEn, dynamic.descriptionEn)
      : { title, description };

    await supabaseAdmin.from('user_notifications').insert({
      id: notifId,
      user_id: userId,
      title: encoded.title,
      description: encoded.description,
      type,
      is_read: false,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[Admin Wallet] Failed to send notification:', err);
  }
}

export async function handleApproveReceipt(admin: { id: string }, body: any) {
  const { transactionId, creditType = 'CASH', minutesToGrant = 0, adminNote } = body;
  if (!transactionId) {
    return NextResponse.json({ success: false, error: 'transactionId is required' }, { status: 400 });
  }

  const minsNum = creditType === 'MINUTES' ? (Number(minutesToGrant) || 0) : 0;

  // Try atomic PostgreSQL RPC first
  try {
    const { data: rpcRes, error: rpcErr } = await supabaseAdmin.rpc('approve_wallet_receipt', {
      p_transaction_id: transactionId,
      p_credit_type: creditType,
      p_minutes: minsNum,
      p_admin_id: admin.id,
      p_admin_note: adminNote || null,
    });

    if (!rpcErr && rpcRes && rpcRes.success) {
      const profileId = rpcRes.profile_id;
      const grantedMinutes = rpcRes.minutes_credited || 0;
      const creditedAmount = rpcRes.amount_credited || rpcRes.amount || 0;
      const cur = rpcRes.currency || 'د.أ';

      const notifMsg = creditType === 'MINUTES'
        ? `تمت الموافقة على إيصالك وتغذية حسابك بـ ${grantedMinutes} دقيقة.`
        : `تمت الموافقة على إيصالك وإيداع ${creditedAmount} ${cur} في رصيد محفظتك.`;

      await sendCaptainNotification(
        profileId,
        `notif_rcpt_app_${transactionId}`,
        'تم اعتماد إيصال الشحن بنجاح ⚡',
        notifMsg,
        'WALLET_CREDIT'
      );

      return NextResponse.json({
        success: true,
        message: creditType === 'MINUTES'
          ? `تم اعتماد الإيصال وإضافة ${grantedMinutes} دقيقة رادار لحساب الكابتن المعلن بنجاح.`
          : `تم اعتماد الإيصال وإيداع ${creditedAmount} ${cur} في رصيد الكابتن المعلن بنجاح.`,
      });
    }
  } catch (rpcCatch) {
    console.warn('[Admin Wallet API] approve_wallet_receipt RPC warning, falling back to direct update:', rpcCatch);
  }

  // Fallback: Fetch transaction
  const { data: tx, error: fetchTxErr } = await supabaseAdmin
    .from('wallet_transactions')
    .select('*')
    .eq('id', transactionId)
    .single();

  if (fetchTxErr || !tx) {
    return NextResponse.json({ success: false, error: 'لم يتم العثور على الإيصال المطلوب' }, { status: 404 });
  }

  if (tx.status === 'COMPLETED') {
    return NextResponse.json({ success: false, error: 'تم اعتماد هذا الإيصال مسبقاً' }, { status: 400 });
  }

  const captainId = tx.profile_id;
  const amount = Number(tx.amount || 0);

  // Fetch captain profile to resolve currency accurately
  const { data: capProfile } = await supabaseAdmin
    .from('profiles')
    .select('country_id, phone')
    .eq('id', captainId)
    .single();

  const isEgypt = capProfile?.country_id === 2 || String(capProfile?.phone || '').startsWith('+20');
  const captainCurrency = tx.currency_ar || (isEgypt ? 'ج.م' : 'د.أ');
  const captainCurrencyCode = tx.currency_code || (isEgypt ? 'EGP' : 'JOD');

  // Fetch or create wallet
  const { data: existingWallet } = await supabaseAdmin
    .from('wallet_accounts')
    .select('*')
    .eq('profile_id', captainId)
    .maybeSingle();

  if (creditType === 'MINUTES') {
    const grantedMins = Number(minutesToGrant) > 0 ? Number(minutesToGrant) : Math.round(amount * 60);
    const currentMins = Number(existingWallet?.paid_minutes_remaining || 0);
    const newMins = currentMins + grantedMins;

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    await supabaseAdmin.from('wallet_accounts').upsert({
      profile_id: captainId,
      paid_minutes_remaining: newMins,
      currency_code: captainCurrencyCode,
      time_bundle_expires_at: expiryDate.toISOString(),
      active_package_name: `شحن إيصال (${grantedMins} دقيقة)`,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'profile_id' });

    // Update transaction
    const { error: updateTxErr } = await supabaseAdmin.from('wallet_transactions').update({
      status: 'COMPLETED',
      currency_ar: captainCurrency,
      currency_code: captainCurrencyCode,
      description_ar: `تمت الموافقة على الإيصال وتخصيص ${grantedMins} دقيقة رادار.`,
      metadata: {
        ...(tx.metadata || {}),
        approved_by: admin.id,
        approved_at: new Date().toISOString(),
        credit_type: 'MINUTES',
        minutes_credited: grantedMins,
        currency: captainCurrency,
        admin_note: adminNote || null,
      },
      updated_at: new Date().toISOString(),
    }).eq('id', transactionId);

    if (updateTxErr) {
      console.error('[Admin Wallet API] Failed to update transaction status:', updateTxErr);
      return NextResponse.json({
        success: false,
        error: `فشل تحديث حالة الإيصال في قاعدة البيانات: ${updateTxErr.message}. يرجى تطبيق كود الـ SQL في Supabase أولاً.`,
      }, { status: 400 });
    }

    // Push in-app notification to captain
    await sendCaptainNotification(
      captainId,
      `notif_rcpt_app_${transactionId}`,
      'تم اعتماد إيصال الشحن بنجاح ⚡',
      `تمت الموافقة على إيصالك وتغذية حسابك بـ ${grantedMins} دقيقة.`,
      'WALLET_CREDIT'
    );

    return NextResponse.json({
      success: true,
      message: `تم اعتماد الإيصال وإضافة ${grantedMins} دقيقة رادار لحساب الكابتن المعلن بنجاح.`,
    });
  } else {
    // Credit as CASH (dynamically in captain currency)
    const currentBalance = Number(existingWallet?.balance || 0);
    const newBalance = Number((currentBalance + amount).toFixed(2));

    await supabaseAdmin.from('wallet_accounts').upsert({
      profile_id: captainId,
      balance: newBalance,
      currency_code: captainCurrencyCode,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'profile_id' });

    // Update transaction
    const { error: updateTxErr } = await supabaseAdmin.from('wallet_transactions').update({
      status: 'COMPLETED',
      currency_ar: captainCurrency,
      currency_code: captainCurrencyCode,
      description_ar: `تمت الموافقة على الإيصال وإيداع ${amount.toFixed(2)} ${captainCurrency} في الرصيد النقدي.`,
      metadata: {
        ...(tx.metadata || {}),
        approved_by: admin.id,
        approved_at: new Date().toISOString(),
        credit_type: 'CASH',
        amount_credited: amount,
        currency: captainCurrency,
        admin_note: adminNote || null,
      },
      updated_at: new Date().toISOString(),
    }).eq('id', transactionId);

    if (updateTxErr) {
      console.error('[Admin Wallet API] Failed to update transaction status:', updateTxErr);
      return NextResponse.json({
        success: false,
        error: `فشل تحديث حالة الإيصال في قاعدة البيانات: ${updateTxErr.message}. يرجى تطبيق كود الـ SQL في Supabase أولاً.`,
      }, { status: 400 });
    }

    // Push in-app notification to captain
    await sendCaptainNotification(
      captainId,
      `notif_rcpt_app_${transactionId}`,
      'تم اعتماد إيصال الشحن بنجاح 💰',
      `تمت الموافقة على إيصالك وإيداع ${amount.toFixed(2)} ${captainCurrency} في رصيد محفظتك. يمكنك تخصيص الرصيد لدقائق رادار بأي وقت.`,
      'WALLET_CREDIT'
    );

    return NextResponse.json({
      success: true,
      message: `تم اعتماد الإيصال وإيداع ${amount.toFixed(2)} ${captainCurrency} في رصيد الكابتن المعلن بنجاح.`,
    });
  }
}

export async function handleRejectReceipt(admin: { id: string }, body: any) {
  const { transactionId, reason } = body;
  if (!transactionId) {
    return NextResponse.json({ success: false, error: 'transactionId is required' }, { status: 400 });
  }

  const rejectReason = reason || 'الإيصال غير واضح أو لم يتم استلام التحويل';

  // Try atomic PostgreSQL RPC first
  try {
    const { data: rpcRes, error: rpcErr } = await supabaseAdmin.rpc('reject_wallet_receipt', {
      p_transaction_id: transactionId,
      p_reason: rejectReason,
      p_admin_id: admin.id,
    });

    if (!rpcErr && rpcRes && rpcRes.success) {
      const profileId = rpcRes.profile_id;
      await sendCaptainNotification(
        profileId,
        `notif_rcpt_rej_${transactionId}`,
        'تنبيه: تعذر قبول إيصال الشحن ⚠️',
        `تم رفض الإيصال للأسباب التالية: ${rejectReason}. يرجى مراجعة الإدارة أو إعادة المحاولة بإيصال واضح.`,
        'WALLET_ALERT'
      );

      return NextResponse.json({
        success: true,
        message: 'تم رفض الإيصال وإشعار الكابتن المعلن بالسبب.',
      });
    }
  } catch (rpcCatch) {
    console.warn('[Admin Wallet API] reject_wallet_receipt RPC warning, falling back to direct update:', rpcCatch);
  }

  // Fallback: Fetch transaction
  const { data: tx, error: fetchErr } = await supabaseAdmin
    .from('wallet_transactions')
    .select('*')
    .eq('id', transactionId)
    .single();

  if (fetchErr || !tx) {
    return NextResponse.json({ success: false, error: 'لم يتم العثور على الإيصال' }, { status: 404 });
  }

  const { error: updateTxErr } = await supabaseAdmin.from('wallet_transactions').update({
    status: 'REJECTED',
    description_ar: `تم رفض الإيصال: ${rejectReason}`,
    metadata: {
      ...(tx.metadata || {}),
      rejected_by: admin.id,
      rejected_at: new Date().toISOString(),
      reject_reason: rejectReason,
    },
    updated_at: new Date().toISOString(),
  }).eq('id', transactionId);

  if (updateTxErr) {
    console.error('[Admin Wallet API] Failed to reject receipt in database:', updateTxErr);
    return NextResponse.json({
      success: false,
      error: `فشل رفض الإيصال في قاعدة البيانات: ${updateTxErr.message}. يرجى تطبيق كود الـ SQL في Supabase أولاً.`,
    }, { status: 400 });
  }

  // Notify captain
  await sendCaptainNotification(
    tx.profile_id,
    `notif_rcpt_rej_${transactionId}`,
    'تنبيه: تعذر قبول إيصال الشحن ⚠️',
    `تم رفض الإيصال للأسباب التالية: ${rejectReason}. يرجى مراجعة الإدارة أو إعادة المحاولة بإيصال واضح.`,
    'WALLET_ALERT'
  );

  return NextResponse.json({
    success: true,
    message: 'تم رفض الإيصال وإشعار الكابتن المعلن بالسبب.',
  });
}

export async function handleDirectTopup(admin: { id: string }, body: any) {
  const { captainId, cashAmount = 0, minutes = 0, extendDays = 30, note } = body;
  if (!captainId) {
    return NextResponse.json({ success: false, error: 'captainId is required' }, { status: 400 });
  }

  const cashNum = Number(cashAmount) || 0;
  const minutesNum = Math.round(Number(minutes)) || 0;

  if (cashNum === 0 && minutesNum === 0) {
    return NextResponse.json({ success: false, error: 'يرجى تحديد مبلغ نقدي أو عدد دقائق للشحن' }, { status: 400 });
  }

  // Fetch captain profile to resolve currency accurately
  const { data: capProfile } = await supabaseAdmin
    .from('profiles')
    .select('country_id, phone')
    .eq('id', captainId)
    .single();

  const isEgypt = capProfile?.country_id === 2 || String(capProfile?.phone || '').startsWith('+20');
  const capCurrency = isEgypt ? 'ج.م' : 'د.أ';
  const capCurrencyCode = isEgypt ? 'EGP' : 'JOD';

  const { data: existingWallet } = await supabaseAdmin
    .from('wallet_accounts')
    .select('*')
    .eq('profile_id', captainId)
    .maybeSingle();

  const currentBalance = Number(existingWallet?.balance || 0);
  const currentMinutes = Number(existingWallet?.paid_minutes_remaining || 0);

  const newBalance = Number((currentBalance + cashNum).toFixed(2));
  const newMinutes = currentMinutes + minutesNum;

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + Number(extendDays || 30));

  await supabaseAdmin.from('wallet_accounts').upsert({
    profile_id: captainId,
    balance: newBalance,
    paid_minutes_remaining: newMinutes,
    currency_code: capCurrencyCode,
    time_bundle_expires_at: minutesNum > 0 ? expiryDate.toISOString() : existingWallet?.time_bundle_expires_at,
    active_package_name: minutesNum > 0 ? `شحن إداري (${minutesNum} دقيقة)` : existingWallet?.active_package_name,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'profile_id' });

  // Log transaction
  await supabaseAdmin.from('wallet_transactions').insert({
    profile_id: captainId,
    type: 'admin_topup',
    transaction_type: 'admin_topup',
    amount: cashNum,
    paid_minutes_delta: minutesNum,
    currency_ar: capCurrency,
    currency_code: capCurrencyCode,
    status: 'COMPLETED',
    description_ar: note || `شحن إداري مباشر: ${cashNum > 0 ? cashNum + ' ' + capCurrency + ' ' : ''}${minutesNum > 0 ? minutesNum + ' دقيقة' : ''}`,
    metadata: {
      admin_id: admin.id,
      cash_added: cashNum,
      minutes_added: minutesNum,
      currency: capCurrency,
      note: note || null,
    },
  });

  // Notify captain
  await sendCaptainNotification(
    captainId,
    `notif_admin_top_${Date.now()}`,
    'شحن رصيد من الإدارة ⚡',
    `تم شحن حسابك من قِبل إدارة النظام: ${cashNum > 0 ? `+${cashNum} ${capCurrency} ` : ''}${minutesNum > 0 ? `+${minutesNum} دقيقة رادار` : ''}.`,
    'WALLET_CREDIT'
  );

  return NextResponse.json({
    success: true,
    message: `تم الشحن بنجاح: ${cashNum > 0 ? `+${cashNum} ${capCurrency} ` : ''}${minutesNum > 0 ? `+${minutesNum} دقيقة` : ''}`,
  });
}
