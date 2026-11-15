import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendCaptainNotification } from './admin-wallet-helpers';

export async function handleApproveReceipt(body: any, admin: { id: string }) {
  const { transactionId, creditType = 'CASH', minutesToGrant = 0, adminNote } = body;
  if (!transactionId) {
    return NextResponse.json({ success: false, error: 'transactionId is required' }, { status: 400 });
  }

  const minsNum = creditType === 'MINUTES' ? Number(minutesToGrant) || 0 : 0;

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

  const { data: capProfile } = await supabaseAdmin
    .from('profiles')
    .select('country_id, phone')
    .eq('id', captainId)
    .single();

  const isEgypt = capProfile?.country_id === 2 || String(capProfile?.phone || '').startsWith('+20');
  const captainCurrency = tx.currency_ar || (isEgypt ? 'ج.م' : 'د.أ');
  const captainCurrencyCode = tx.currency_code || (isEgypt ? 'EGP' : 'JOD');

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
      console.error('[Admin Wallet API] Failed to update transaction status:', updateTxErr);
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
      message: `تم اعتماد الإيصال وإضافة ${grantedMins} دقيقة رادار لحساب الكابتن المعلن بنجاح.`,
    });
  } else {
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
      console.error('[Admin Wallet API] Failed to update transaction status:', updateTxErr);
      return NextResponse.json({
        success: false,
        error: `فشل تحديث حالة الإيصال في قاعدة البيانات: ${updateTxErr.message}. يرجى تطبيق كود الـ SQL في Supabase أولاً.`,
      }, { status: 400 });
    }

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
