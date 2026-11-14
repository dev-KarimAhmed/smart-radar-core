import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { buildBilingualNotificationServer } from '@/shared/server/translate';
import { generateVoucherCode, sendCaptainNotification } from './admin-wallet-helpers';

export async function handleDirectTopup(body: any, admin: { id: string }) {
  const { captainId, cashAmount = 0, minutes = 0, extendDays = 30, note } = body;
  if (!captainId) {
    return NextResponse.json({ success: false, error: 'captainId is required' }, { status: 400 });
  }

  const cashNum = Number(cashAmount) || 0;
  const minutesNum = Math.round(Number(minutes)) || 0;

  if (cashNum === 0 && minutesNum === 0) {
    return NextResponse.json({ success: false, error: 'يرجى تحديد مبلغ نقدي أو عدد دقائق للشحن' }, { status: 400 });
  }

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

export async function handleGenerateVouchers(body: any) {
  const { count = 1, minutesValue = 60 } = body;
  const totalToCreate = Math.min(50, Math.max(1, Number(count) || 1));
  const mins = Math.max(15, Number(minutesValue) || 60);

  const newVouchers: any[] = [];
  for (let i = 0; i < totalToCreate; i++) {
    newVouchers.push({
      code: generateVoucherCode(mins),
      status: 'UNUSED',
      minutes_value: mins,
      created_at: new Date().toISOString(),
    });
  }

  const { error: insErr } = await supabaseAdmin
    .from('wallet_vouchers')
    .insert(newVouchers);

  if (insErr) throw insErr;

  return NextResponse.json({
    success: true,
    message: `تم توليد ${totalToCreate} قسيمة شحن بقيمة ${mins} دقيقة بنجاح.`,
    codes: newVouchers.map((v) => v.code),
  });
}

export async function handleToggleSelfTopup(body: any) {
  const { enabled } = body;
  const isEnabled = Boolean(enabled);

  const { error: flagErr } = await supabaseAdmin
    .from('app_flags')
    .upsert({
      flag: 'captain_self_topup',
      enabled: isEnabled,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'flag' });

  if (flagErr) throw flagErr;

  return NextResponse.json({
    success: true,
    message: `تم ${isEnabled ? 'تفعيل' : 'إيقاف'} ميزة الشحن الذاتي التجريبي للكباتن.`,
    enabled: isEnabled,
  });
}

export async function handleSendWalletMessage(body: any) {
  const { captainId, title, message, type, titleEn, messageEn, title_en, message_en } = body;
  if (!captainId || !message || !String(message).trim()) {
    return NextResponse.json({ success: false, error: 'captainId ونص الرسالة مطلوبان' }, { status: 400 });
  }

  const msgTitle = title && String(title).trim() ? String(title).trim() : 'إشعار مالي من إدارة المنظومة';
  const enTitle = (titleEn || title_en || '').trim();
  const enMessage = (messageEn || message_en || '').trim();

  const { data: recipientProfile } = await supabaseAdmin
    .from('profiles')
    .select('preferred_language')
    .eq('id', captainId)
    .maybeSingle();

  const bilingual = await buildBilingualNotificationServer({
    title: msgTitle,
    description: String(message).trim(),
    titleEn: enTitle,
    descriptionEn: enMessage,
    preferredLanguage: recipientProfile?.preferred_language,
  });

  const { data: notif, error: notifErr } = await supabaseAdmin
    .from('user_notifications')
    .insert({
      user_id: captainId,
      title: bilingual.title,
      description: bilingual.description,
      type: type || 'admin_message',
      is_read: false,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (notifErr) throw notifErr;

  return NextResponse.json({
    success: true,
    message: 'تم إرسال الرسالة إلى الكابتن المعلن بنجاح عبر الإشعار اللحظي.',
    notification: notif,
  });
}
