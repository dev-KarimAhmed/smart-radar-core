/**
 * Financial & Wallet Actions (Single Top-up & Balance Adjustment) for Admin Users API.
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { insertDualNotification } from './users-shared';

export { handleBulkTopup } from './users-bulk-topup';

export async function handleTopupMinutes(body: any, userId: string) {
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
    const { error } = await supabaseAdmin
      .from('wallet_accounts')
      .insert({
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

export async function handleAdjustBalance(body: any, userId: string) {
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
    .upsert({
      profile_id: userId,
      balance: newBalance,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'profile_id' });

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
