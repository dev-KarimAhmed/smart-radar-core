import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendCaptainNotification } from './admin-notifications-helpers';

export async function handleRejectReceipt(adminId: string, body: any): Promise<NextResponse> {
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
      p_admin_id: adminId,
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
      rejected_by: adminId,
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
