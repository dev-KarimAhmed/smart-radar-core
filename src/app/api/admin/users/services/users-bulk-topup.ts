/**
 * Bulk Top-Up Action (Minutes and Cash) for Admin Users API.
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { encodeNotificationPayload } from '@/shared/utils/notification-i18n';

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
    targetIds = (captainsData || []).map(c => c.id);
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

    const walletMap = new Map((existingWallets || []).map(w => [w.profile_id, w]));

    const upsertRows = targetIds.map(id => {
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

    const bulkMinPayload = encodeNotificationPayload(
      '⚡ شحن دقائق رادار جماعي',
      `تمت إضافة (${numMinutes}) دقيقة رادار لحسابك بنجاح من قبل إدارة المنظومة وتمديد الصلاحية لـ ${extendDays} يوماً.`,
      'Bulk Radar Minutes Top-Up ⚡',
      `Successfully credited (${numMinutes}) radar minutes to your account by administration and extended validity for ${extendDays} days.`
    );

    const notifs = targetIds.map(id => ({
      user_id: id,
      title: bulkMinPayload.title,
      description: bulkMinPayload.description,
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

    const walletMap = new Map((existingWallets || []).map(w => [w.profile_id, w]));

    const upsertRows = targetIds.map(id => {
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

    const amountDisplay = `${numAmount > 0 ? '+' : ''}${numAmount}`;
    const bulkCashPayload = encodeNotificationPayload(
      '💰 إيداع رصيد نقدي',
      `تم إيداع مبلغ (${amountDisplay}) في محفظتك من قبل إدارة المنظومة.`,
      'Wallet Cash Deposit 💰',
      `An amount of (${amountDisplay}) was deposited into your wallet by administration.`
    );

    const notifs = targetIds.map(id => ({
      user_id: id,
      title: bulkCashPayload.title,
      description: bulkCashPayload.description,
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
