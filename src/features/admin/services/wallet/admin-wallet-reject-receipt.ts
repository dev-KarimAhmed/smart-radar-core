import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendCaptainNotification } from './admin-wallet-helpers';

export async function handleRejectReceipt(body: any, admin: { id: string }) {
  const { transactionId, reason } = body;
  if (!transactionId) {
    return NextResponse.json({ success: false, error: 'transactionId is required' }, { status: 400 });
  }

  const rejectReason = reason || 'الإيصال غير واضح أو لم يتم استلام التحويل';

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
