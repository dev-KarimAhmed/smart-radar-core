import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { isMissingRpcError, isValidUuid } from '@/shared/server/api-auth-guard';
import { encodeNotificationPayload, resolveDynamicNotification } from '@/shared/utils/notification-i18n';

function mapWalletReceiptRpcFailure(rpcErrorCode: unknown) {
  const code = String(rpcErrorCode || '').trim();
  if (code === 'receipt_not_found') {
    return NextResponse.json({ success: false, error: 'لم يتم العثور على الإيصال المطلوب' }, { status: 404 });
  }
  if (code === 'receipt_already_approved' || code === 'cannot_reject_completed_receipt') {
    return NextResponse.json({ success: false, error: 'تم اعتماد هذا الإيصال مسبقاً ولا يمكن تعديله' }, { status: 409 });
  }
  if (code === 'receipt_already_rejected' || code === 'receipt_not_pending') {
    return NextResponse.json({ success: false, error: 'تمت معالجة هذا الإيصال مسبقاً' }, { status: 409 });
  }
  return NextResponse.json({ success: false, error: 'تعذّر معالجة الإيصال حالياً' }, { status: 400 });
}

// Generate cryptographically random voucher codes
export function generateVoucherCode(minutes: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 8; i++) {
    rand += chars.charAt(crypto.randomInt(0, chars.length));
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
  const { transactionId, creditType = 'CASH', minutesToGrant = 0, adminNote } = body || {};
  if (!isValidUuid(transactionId)) {
    return NextResponse.json({ success: false, error: 'معرف الإيصال غير صالح' }, { status: 400 });
  }

  const normalizedCreditType = String(creditType || 'CASH').toUpperCase() === 'MINUTES' ? 'MINUTES' : 'CASH';
  const parsedMinutes = Number(minutesToGrant ?? 0);
  if (!Number.isFinite(parsedMinutes) || parsedMinutes < 0 || parsedMinutes > 50_000) {
    return NextResponse.json({ success: false, error: 'عدد الدقائق المحدد غير صالح' }, { status: 400 });
  }
  const minsNum = normalizedCreditType === 'MINUTES' ? Math.round(parsedMinutes) : 0;

  // Try atomic PostgreSQL RPC first
  const { data: rpcRes, error: rpcErr } = await supabaseAdmin.rpc('approve_wallet_receipt', {
    p_transaction_id: transactionId,
    p_credit_type: normalizedCreditType,
    p_minutes: minsNum,
    p_admin_id: admin.id,
    p_admin_note: adminNote || null,
  });

  if (!rpcErr && rpcRes) {
    if (!rpcRes.success) {
      return mapWalletReceiptRpcFailure(rpcRes.error);
    }

    const profileId = rpcRes.profile_id;
    const grantedMinutes = rpcRes.minutes_credited || 0;
    const creditedAmount = rpcRes.amount_credited || rpcRes.amount || 0;
    const cur = rpcRes.currency || 'د.أ';

    const notifMsg = normalizedCreditType === 'MINUTES'
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
      message: normalizedCreditType === 'MINUTES'
        ? `تم اعتماد الإيصال وإضافة ${grantedMinutes} دقيقة رادار لحساب الكابتن المعلن بنجاح.`
        : `تم اعتماد الإيصال وإيداع ${creditedAmount} ${cur} في رصيد الكابتن المعلن بنجاح.`,
    });
  }

  if (rpcErr && !isMissingRpcError(rpcErr)) {
    console.error('[Admin Wallet API] approve_wallet_receipt RPC failed:', rpcErr);
    return NextResponse.json({ success: false, error: 'تعذّر اعتماد الإيصال في قاعدة البيانات' }, { status: 500 });
  }

  // Fallback ONLY if RPC does not exist: Fetch transaction and atomically claim PENDING before wallet mutation
  const { data: tx, error: fetchTxErr } = await supabaseAdmin
    .from('wallet_transactions')
    .select('*')
    .eq('id', transactionId)
    .maybeSingle();

  if (fetchTxErr || !tx) {
    return NextResponse.json({ success: false, error: 'لم يتم العثور على الإيصال المطلوب' }, { status: 404 });
  }

  if (tx.status !== 'PENDING') {
    return NextResponse.json({ success: false, error: 'تمت معالجة هذا الإيصال مسبقاً' }, { status: 409 });
  }

  const captainId = tx.profile_id;
  const amount = Number(tx.amount || 0);

  // Fetch captain profile to resolve currency accurately
  const { data: capProfile } = await supabaseAdmin
    .from('profiles')
    .select('country_id, phone')
    .eq('id', captainId)
    .maybeSingle();

  const isEgypt = capProfile?.country_id === 2 || String(capProfile?.phone || '').startsWith('+20');
  const captainCurrency = tx.currency_ar || (isEgypt ? 'ج.م' : 'د.أ');
  const captainCurrencyCode = tx.currency_code || (isEgypt ? 'EGP' : 'JOD');

  // Fetch existing wallet
  const { data: existingWallet } = await supabaseAdmin
    .from('wallet_accounts')
    .select('*')
    .eq('profile_id', captainId)
    .maybeSingle();

  if (normalizedCreditType === 'MINUTES') {
    const grantedMins = minsNum > 0 ? minsNum : Math.round(amount * 60);

    const { data: claimedTx, error: updateTxErr } = await supabaseAdmin
      .from('wallet_transactions')
      .update({
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
      })
      .eq('id', transactionId)
      .eq('status', 'PENDING')
      .select('id')
      .maybeSingle();

    if (updateTxErr) {
      console.error('[Admin Wallet API] Failed to update transaction status:', updateTxErr);
      return NextResponse.json({
        success: false,
        error: 'فشل تحديث حالة الإيصال في قاعدة البيانات.',
      }, { status: 500 });
    }
    if (!claimedTx) {
      return NextResponse.json({ success: false, error: 'تمت معالجة هذا الإيصال مسبقاً' }, { status: 409 });
    }

    const currentMins = Number(existingWallet?.paid_minutes_remaining || 0);
    const newMins = currentMins + grantedMins;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    const { error: walletErr } = await supabaseAdmin.from('wallet_accounts').upsert({
      profile_id: captainId,
      paid_minutes_remaining: newMins,
      currency_code: captainCurrencyCode,
      time_bundle_expires_at: expiryDate.toISOString(),
      active_package_name: `شحن إيصال (${grantedMins} دقيقة)`,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'profile_id' });

    if (walletErr) {
      console.error('[Admin Wallet API] Failed to credit wallet minutes:', walletErr);
      return NextResponse.json({ success: false, error: 'فشل تحديث رصيد الدقائق في المحفظة' }, { status: 500 });
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
    const { data: claimedTx, error: updateTxErr } = await supabaseAdmin
      .from('wallet_transactions')
      .update({
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
      })
      .eq('id', transactionId)
      .eq('status', 'PENDING')
      .select('id')
      .maybeSingle();

    if (updateTxErr) {
      console.error('[Admin Wallet API] Failed to update transaction status:', updateTxErr);
      return NextResponse.json({
        success: false,
        error: 'فشل تحديث حالة الإيصال في قاعدة البيانات.',
      }, { status: 500 });
    }
    if (!claimedTx) {
      return NextResponse.json({ success: false, error: 'تمت معالجة هذا الإيصال مسبقاً' }, { status: 409 });
    }

    const currentBalance = Number(existingWallet?.balance || 0);
    const newBalance = Number((currentBalance + amount).toFixed(2));

    const { error: walletErr } = await supabaseAdmin.from('wallet_accounts').upsert({
      profile_id: captainId,
      balance: newBalance,
      currency_code: captainCurrencyCode,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'profile_id' });

    if (walletErr) {
      console.error('[Admin Wallet API] Failed to credit cash wallet:', walletErr);
      return NextResponse.json({ success: false, error: 'فشل تحديث الرصيد النقدي في المحفظة' }, { status: 500 });
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
  const { transactionId, reason } = body || {};
  if (!isValidUuid(transactionId)) {
    return NextResponse.json({ success: false, error: 'معرف الإيصال غير صالح' }, { status: 400 });
  }

  const rejectReason = reason ? String(reason).trim().slice(0, 500) : 'الإيصال غير واضح أو لم يتم استلام التحويل';

  // Try atomic PostgreSQL RPC first
  const { data: rpcRes, error: rpcErr } = await supabaseAdmin.rpc('reject_wallet_receipt', {
    p_transaction_id: transactionId,
    p_reason: rejectReason,
    p_admin_id: admin.id,
  });

  if (!rpcErr && rpcRes) {
    if (!rpcRes.success) {
      return mapWalletReceiptRpcFailure(rpcRes.error);
    }

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

  if (rpcErr && !isMissingRpcError(rpcErr)) {
    console.error('[Admin Wallet API] reject_wallet_receipt RPC failed:', rpcErr);
    return NextResponse.json({ success: false, error: 'تعذّر رفض الإيصال في قاعدة البيانات' }, { status: 500 });
  }

  // Fallback ONLY if RPC does not exist: Fetch transaction
  const { data: tx, error: fetchErr } = await supabaseAdmin
    .from('wallet_transactions')
    .select('*')
    .eq('id', transactionId)
    .maybeSingle();

  if (fetchErr || !tx) {
    return NextResponse.json({ success: false, error: 'لم يتم العثور على الإيصال' }, { status: 404 });
  }

  if (tx.status !== 'PENDING') {
    return NextResponse.json({ success: false, error: 'تمت معالجة هذا الإيصال مسبقاً' }, { status: 409 });
  }

  const { data: claimedTx, error: updateTxErr } = await supabaseAdmin
    .from('wallet_transactions')
    .update({
      status: 'REJECTED',
      description_ar: `تم رفض الإيصال: ${rejectReason}`,
      metadata: {
        ...(tx.metadata || {}),
        rejected_by: admin.id,
        rejected_at: new Date().toISOString(),
        reject_reason: rejectReason,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', transactionId)
    .eq('status', 'PENDING')
    .select('id')
    .maybeSingle();

  if (updateTxErr) {
    console.error('[Admin Wallet API] Failed to reject receipt in database:', updateTxErr);
    return NextResponse.json({
      success: false,
      error: 'فشل رفض الإيصال في قاعدة البيانات.',
    }, { status: 500 });
  }

  if (!claimedTx) {
    return NextResponse.json({ success: false, error: 'تمت معالجة هذا الإيصال مسبقاً' }, { status: 409 });
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
  const { captainId, cashAmount = 0, minutes = 0, extendDays = 30, note } = body || {};
  if (!isValidUuid(captainId)) {
    return NextResponse.json({ success: false, error: 'معرف الكابتن غير صالح' }, { status: 400 });
  }

  const cashNum = Number(cashAmount) || 0;
  const minutesNum = Math.round(Number(minutes)) || 0;
  const safeDays = Math.min(365, Math.max(1, Math.round(Number(extendDays) || 30)));

  if (!Number.isFinite(cashNum) || !Number.isFinite(minutesNum) || Math.abs(cashNum) > 50_000 || Math.abs(minutesNum) > 50_000) {
    return NextResponse.json({ success: false, error: 'قيم الشحن غير صالحة أو تتجاوز الحد المسموح' }, { status: 400 });
  }

  if (cashNum === 0 && minutesNum === 0) {
    return NextResponse.json({ success: false, error: 'يرجى تحديد مبلغ نقدي أو عدد دقائق للشحن' }, { status: 400 });
  }

  // Fetch captain profile to resolve currency accurately
  const { data: capProfile, error: capErr } = await supabaseAdmin
    .from('profiles')
    .select('id, role, country_id, phone')
    .eq('id', captainId)
    .maybeSingle();

  if (capErr || !capProfile) {
    return NextResponse.json({ success: false, error: 'الكابتن المحدد غير موجود' }, { status: 404 });
  }

  if (String(capProfile.role || '').toUpperCase() === 'ADMIN') {
    return NextResponse.json({ success: false, error: 'غير مسموح بشحن الحسابات الإدارية' }, { status: 403 });
  }

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

  const newBalance = Math.max(0, Number((currentBalance + cashNum).toFixed(2)));
  const newMinutes = Math.max(0, currentMinutes + minutesNum);

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + safeDays);

  const { error: walletErr } = await supabaseAdmin.from('wallet_accounts').upsert({
    profile_id: captainId,
    balance: newBalance,
    paid_minutes_remaining: newMinutes,
    currency_code: capCurrencyCode,
    time_bundle_expires_at: minutesNum > 0 ? expiryDate.toISOString() : existingWallet?.time_bundle_expires_at,
    active_package_name: minutesNum > 0 ? `شحن إداري (${minutesNum} دقيقة)` : existingWallet?.active_package_name,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'profile_id' });

  if (walletErr) {
    console.error('[Admin Wallet API] handleDirectTopup wallet upsert error:', walletErr);
    return NextResponse.json({ success: false, error: 'فشل تحديث رصيد المحفظة في قاعدة البيانات' }, { status: 500 });
  }

  // Log transaction
  const { error: txErr } = await supabaseAdmin.from('wallet_transactions').insert({
    profile_id: captainId,
    type: 'admin_topup',
    transaction_type: 'admin_topup',
    amount: cashNum,
    paid_minutes_delta: minutesNum,
    currency_ar: capCurrency,
    currency_code: capCurrencyCode,
    status: 'COMPLETED',
    description_ar: note || `شحن إداري مباشر: ${cashNum !== 0 ? cashNum + ' ' + capCurrency + ' ' : ''}${minutesNum !== 0 ? minutesNum + ' دقيقة' : ''}`,
    metadata: {
      admin_id: admin.id,
      cash_added: cashNum,
      minutes_added: minutesNum,
      currency: capCurrency,
      note: note || null,
    },
  });

  if (txErr) {
    console.error('[Admin Wallet API] handleDirectTopup log transaction warning:', txErr);
  }

  // Notify captain
  const notifDesc =
    cashNum < 0 || minutesNum < 0
      ? `تم تعديل رصيد حسابك من قِبل إدارة النظام: ${cashNum !== 0 ? `${cashNum} ${capCurrency} ` : ''}${minutesNum !== 0 ? `${minutesNum} دقيقة رادار` : ''}.`
      : `تم شحن حسابك من قِبل إدارة النظام: ${cashNum > 0 ? `+${cashNum} ${capCurrency} ` : ''}${minutesNum > 0 ? `+${minutesNum} دقيقة رادار` : ''}.`;

  await sendCaptainNotification(
    captainId,
    `notif_admin_top_${Date.now()}`,
    cashNum < 0 || minutesNum < 0 ? 'تعديل رصيد من الإدارة 💰' : 'شحن رصيد من الإدارة ⚡',
    notifDesc,
    'WALLET_CREDIT'
  );

  return NextResponse.json({
    success: true,
    message: `تم الشحن بنجاح: ${cashNum !== 0 ? `${cashNum > 0 ? '+' : ''}${cashNum} ${capCurrency} ` : ''}${minutesNum !== 0 ? `${minutesNum > 0 ? '+' : ''}${minutesNum} دقيقة` : ''}`,
  });
}
