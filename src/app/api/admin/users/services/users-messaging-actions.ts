/**
 * Messaging Actions (Single & Bulk) tailored by language for Admin Users API.
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { buildBilingualNotificationServer } from '@/shared/server/translate';

export async function handleSendMessage(body: any, userId: string) {
  const { title, message, type, titleEn, messageEn, title_en, message_en } = body;
  if (!message || !String(message).trim()) {
    return NextResponse.json({ success: false, error: 'نص الرسالة مطلوب' }, { status: 400 });
  }

  const msgTitle = title && String(title).trim() ? String(title).trim() : 'رسالة من إدارة المنظومة';
  const msgType = type || 'admin_message';
  const enTitle = (titleEn || title_en || '').trim();
  const enMessage = (messageEn || message_en || '').trim();

  const { data: recipientProfile } = await supabaseAdmin
    .from('profiles')
    .select('preferred_language')
    .eq('id', userId)
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
      user_id: userId,
      title: bilingual.title,
      description: bilingual.description,
      type: msgType,
      is_read: false,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (notifErr) throw notifErr;

  return NextResponse.json({
    success: true,
    message: 'تم إرسال الرسالة بنجاح عبر الإشعار اللحظي وفق لغة الكابتن.',
    notification: notif,
  });
}

export async function handleBulkSendMessage(body: any) {
  const { title, message, type, titleEn, messageEn, title_en, message_en, userIds, role = 'CAPTAIN' } = body;
  if (!message || !String(message).trim()) {
    return NextResponse.json({ success: false, error: 'نص الرسالة مطلوب' }, { status: 400 });
  }

  const msgTitle = title && String(title).trim() ? String(title).trim() : 'رسالة من إدارة المنظومة';
  const msgType = type || 'admin_message';
  const enTitle = (titleEn || title_en || '').trim();
  const enMessage = (messageEn || message_en || '').trim();

  let targetProfiles: Array<{ id: string; preferred_language?: string }> = [];

  if (Array.isArray(userIds) && userIds.length > 0) {
    const { data: usersData, error: uErr } = await supabaseAdmin
      .from('profiles')
      .select('id, preferred_language')
      .in('id', userIds);

    if (uErr) throw uErr;
    targetProfiles = usersData || userIds.map((id) => ({ id, preferred_language: 'ar' }));
  } else {
    const { data: captainsData, error: capErr } = await supabaseAdmin
      .from('profiles')
      .select('id, preferred_language')
      .eq('role', role);

    if (capErr) throw capErr;
    targetProfiles = captainsData || [];
  }

  if (targetProfiles.length === 0) {
    return NextResponse.json({ success: false, error: 'لم يتم العثور على أي مستخدمين لإرسال الإشعار إليهم' }, { status: 400 });
  }

  const bilingual = await buildBilingualNotificationServer({
    title: msgTitle,
    description: String(message).trim(),
    titleEn: enTitle,
    descriptionEn: enMessage,
  });

  const notifications = targetProfiles.map((p) => {
    const isEn = (p.preferred_language || '').toLowerCase() === 'en';
    const userTitle = isEn && bilingual.titleEn ? bilingual.titleEn : bilingual.titleAr;

    return {
      user_id: p.id,
      title: userTitle,
      description: bilingual.description,
      type: msgType,
      is_read: false,
      created_at: new Date().toISOString(),
    };
  });

  const CHUNK_SIZE = 500;
  for (let i = 0; i < notifications.length; i += CHUNK_SIZE) {
    const chunk = notifications.slice(i, i + CHUNK_SIZE);
    const { error: insertErr } = await supabaseAdmin
      .from('user_notifications')
      .insert(chunk);
    if (insertErr) throw insertErr;
  }

  return NextResponse.json({
    success: true,
    count: targetProfiles.length,
    message: `تم إرسال الإشعار اللحظي بنجاح إلى (${targetProfiles.length}) مستخدم وفقاً للغة كل كابتن.`,
  });
}
