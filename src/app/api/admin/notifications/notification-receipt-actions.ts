import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { encodeNotificationPayload, resolveDynamicNotification } from '@/shared/utils/notification-i18n';

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
    console.warn('[Admin Notifications] Failed to send notification to user:', err);
  }
}

export async function handleApproveReceipt(admin: { id: string }, body: any) {
  const { transactionId, creditType = 'MINUTES', minutesToGrant, adminNote } = body;
  if (!transactionId) {
    return NextResponse.json({ success: false, error: 'معرف معاملة الإيصال مطلوب' }, { status: 400 });
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
        : `تمت الموافقة على إيصالك وإيداع ${creditedAmount} ${cur} في رصيد محفظتك النقدي.`;

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
          ? `تم اعتماد الإيصال بنجاح وتخصيص ${grantedMinutes} دقيقة رادار للكابتن المعلن.`
          : `تم اعتماد الإيصال وإيداع ${creditedAmount} ${cur} في رصيد الكابتن المعلن.`,
      });
    }
  } catch (rpcCatch) {
    console.warn('[Admin Notifications API] approve_wallet_receipt RPC warning, falling back to direct update:', rpcCatch);
  }

  // Fallback: Fetch transaction
  const { data: tx, error: txErr } = await supabaseAdmin
    .from('wallet_transactions')
    .select('*')
    .eq('id', transactionId)
    .maybeSingle();

  if (txErr || !tx) {
    return NextResponse.json({ success: false, error: 'معاملة الإيصال غير موجودة' }, { status: 404 });
  }

  if (tx.status !== 'PENDING') {
    return NextResponse.json({ success: false, error: 'تمت معالجة هذا الإيصال مسبقاً.' }, { status: 400 });
  }

  const captainId = tx.profile_id;
  const amount = Number(tx.amount || 0);

  // Resolve captain's currency
  const { data: capProfile } = await supabaseAdmin
    .from('profiles')
    .select('country_id, phone')
    .eq('id', captainId)
    .maybeSingle();

  const isEgypt = capProfile?.country_id === 2 || String(capProfile?.phone || '').startsWith('+20');
  const captainCurrency = tx.currency_ar || (isEgypt ? 'ج.م' : 'د.أ');
  const captainCurrencyCode = tx.currency_code || (isEgypt ? 'EGP' : 'JOD');

  // Fetch or initialize wallet
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
      console.error('[Admin Notifications API] Failed to update transaction status:', updateTxErr);
      return NextResponse.json({
        success: false,
        error: `فشل تحديث حالة الإيصال في قاعدة البيانات: ${updateTxErr.message}. يرجى تطبيق كود الـ SQL في Supabase أولاً.`,
      }, { status: 400 });
    }

    await sendCaptainNotification(
      captainId,
      `notif_rcpt_app_${transactionId}`,
      'تم اعتماد إيصال الشحن بنجاح ⚡',
      `تمت الموافقة على إيصالك وتغذية حسابك بـ ${grantedMins} دقيقة.`,
      'WALLET_CREDIT'
    );

    return NextResponse.json({
      success: true,
      message: `تم اعتماد الإيصال بنجاح وتخصيص ${grantedMins} دقيقة رادار للكابتن المعلن.`,
    });
  } else {
    // Credit as CASH
    const currentBalance = Number(existingWallet?.balance || 0);
    const newBalance = Number((currentBalance + amount).toFixed(2));

    await supabaseAdmin.from('wallet_accounts').upsert({
      profile_id: captainId,
      balance: newBalance,
      currency_code: captainCurrencyCode,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'profile_id' });

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
      console.error('[Admin Notifications API] Failed to update transaction status:', updateTxErr);
      return NextResponse.json({
        success: false,
        error: `فشل تحديث حالة الإيصال في قاعدة البيانات: ${updateTxErr.message}. يرجى تطبيق كود الـ SQL في Supabase أولاً.`,
      }, { status: 400 });
    }

    await sendCaptainNotification(
      captainId,
      `notif_rcpt_app_${transactionId}`,
      'تم اعتماد إيصال الشحن بنجاح ⚡',
      `تمت الموافقة على إيصالك وإيداع ${amount.toFixed(2)} ${captainCurrency} في رصيد محفظتك النقدي.`,
      'WALLET_CREDIT'
    );

    return NextResponse.json({
      success: true,
      message: `تم اعتماد الإيصال وإيداع ${amount.toFixed(2)} ${captainCurrency} في رصيد الكابتن المعلن.`,
    });
  }
}

export async function handleRejectReceipt(admin: { id: string }, body: any) {
  const { transactionId, rejectionReason } = body;
  if (!transactionId) {
    return NextResponse.json({ success: false, error: 'معرف معاملة الإيصال مطلوب' }, { status: 400 });
  }

  const reason = rejectionReason || 'الإيصال غير واضح أو المبلغ لا يطابق عملية التحويل.';

  // Try atomic PostgreSQL RPC first
  try {
    const { data: rpcRes, error: rpcErr } = await supabaseAdmin.rpc('reject_wallet_receipt', {
      p_transaction_id: transactionId,
      p_reason: reason,
      p_admin_id: admin.id,
    });

    if (!rpcErr && rpcRes && rpcRes.success) {
      const profileId = rpcRes.profile_id;
      await sendCaptainNotification(
        profileId,
        `notif_rcpt_rej_${transactionId}`,
        'تعذر اعتماد إيصال الشحن ⚠️',
        `تم رفض إيصال الشحن للسبب التالي: ${reason}. يمكنك إعادة إرسال إيصال صحيح.`,
        'WALLET_ALERT'
      );

      return NextResponse.json({
        success: true,
        message: 'تم رفض الإيصال وإشعار الكابتن المعلن بسبب الرفض.',
      });
    }
  } catch (rpcCatch) {
    console.warn('[Admin Notifications API] reject_wallet_receipt RPC warning, falling back to direct update:', rpcCatch);
  }

  const { data: tx, error: txErr } = await supabaseAdmin
    .from('wallet_transactions')
    .select('*')
    .eq('id', transactionId)
    .maybeSingle();

  if (txErr || !tx) {
    return NextResponse.json({ success: false, error: 'معاملة الإيصال غير موجودة' }, { status: 404 });
  }

  if (tx.status !== 'PENDING') {
    return NextResponse.json({ success: false, error: 'تمت معالجة هذا الإيصال مسبقاً.' }, { status: 400 });
  }

  const { error: updateTxErr } = await supabaseAdmin.from('wallet_transactions').update({
    status: 'REJECTED',
    description_ar: `تم رفض الإيصال: ${reason}`,
    metadata: {
      ...(tx.metadata || {}),
      rejected_by: admin.id,
      rejected_at: new Date().toISOString(),
      rejection_reason: reason,
    },
    updated_at: new Date().toISOString(),
  }).eq('id', transactionId);

  if (updateTxErr) {
    console.error('[Admin Notifications API] Failed to reject receipt in database:', updateTxErr);
    return NextResponse.json({
      success: false,
      error: `فشل رفض الإيصال في قاعدة البيانات: ${updateTxErr.message}. يرجى تطبيق كود الـ SQL في Supabase أولاً.`,
    }, { status: 400 });
  }

  await sendCaptainNotification(
    tx.profile_id,
    `notif_rcpt_rej_${transactionId}`,
    'تعذر اعتماد إيصال الشحن ⚠️',
    `تم رفض إيصال الشحن للسبب التالي: ${reason}. يمكنك إعادة إرسال إيصال صحيح.`,
    'WALLET_ALERT'
  );

  return NextResponse.json({
    success: true,
    message: 'تم رفض الإيصال وإشعار الكابتن المعلن بسبب الرفض.',
  });
}
