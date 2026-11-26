/**
 * Verification, Language, Tier, and Trip Unfreeze Actions for Admin Users API.
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { insertDualNotification } from './users-shared';

export { handleUpdateStatus } from './users-status-update';

export async function handleUpdateLanguage(body: any, userId: string) {
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

export async function handleUpdateTier(body: any, userId: string) {
  const tier = String(body.tier).toUpperCase();
  if (!['DIAMOND', 'PLATINUM', 'GOLD', 'BRONZE', 'SILVER'].includes(tier)) {
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

  return NextResponse.json({ success: true, message: 'تم فك تعليق الرحلة وإعادة الكابتن المعلن لوضع الجاهزية (IDLE).' });
}
