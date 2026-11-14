/**
 * Dynamic Notification Matcher: Admin Operational Status, Sanctions, Tier Promotions & Trip State.
 */

import {
  DynamicNotificationMatch,
} from './notification-i18n-types';

export function matchDynamicAdminNotification(
  t: string,
  d: string
): DynamicNotificationMatch | null {
  // 15. Admin Status Updates (Activated / Idle / Suspended / Banned / Generic Operational Status)
  if (t.includes('تم تنشيط حسابك على الرادار')) {
    const isRiderMsg = d.includes('لطلب الرحلات');
    return {
      titleAr: 'تم تنشيط حسابك على الرادار ⚡',
      descriptionAr: d,
      titleEn: 'Your Radar Account Is Now Active ⚡',
      descriptionEn: isRiderMsg
        ? 'Administration has activated your account immediately, and you are now ready to request rides and connect with verified advertiser captains on the radar.'
        : 'Administration has activated your account immediately, and you are now connected to the radar and ready to receive ride requests.',
      matched: true,
    };
  }

  if (t.includes('تم ضبط حسابك إلى وضع الجاهزية') || t.includes('تم ضبط وضعك إلى خامل')) {
    const isRiderMsg = t.includes('حسابك إلى وضع الجاهزية') || d.includes('طلب الرحلات');
    return {
      titleAr: t,
      descriptionAr: d,
      titleEn: isRiderMsg ? 'Account Set to Ready Mode 🛑' : 'Status Set to Standby (Idle) 🛑',
      descriptionEn: isRiderMsg
        ? 'You are now in Ready mode and can request rides via the radar at any time.'
        : 'You are now in Standby (Idle) mode and can go online on the radar whenever you wish.',
      matched: true,
    };
  }

  if (t.includes('تم تعليق حساب') && t.includes('مؤقتاً')) {
    return {
      titleAr: t,
      descriptionAr: d,
      titleEn: 'Administrative Notice: Account Temporarily Suspended ⚠️',
      descriptionEn:
        'Your account has been temporarily suspended by operations management for activity or behavioral integrity review. Please contact support to lift the suspension.',
      matched: true,
    };
  }

  if (t.includes('تحديث في الحالة التشغيلية')) {
    const statusMatch = d.match(/إلى:\s*([A-Z_]+)/i);
    const statusCode = statusMatch ? statusMatch[1].toUpperCase() : 'UPDATED';
    return {
      titleAr: 'تحديث في الحالة التشغيلية',
      descriptionAr: d || `قامت الإدارة بتحديث حالتك إلى: ${statusCode}`,
      titleEn: 'Operational Status Update',
      descriptionEn: `Administration has updated your account status to: ${statusCode}`,
      matched: true,
    };
  }

  // 16. Account Permanently Banned / Suspended
  if (t.includes('تم حظر') || t.includes('حظر حسابك') || t.includes('حظر حساب المستخدم')) {
    const isRiderMsg = t.includes('حساب المستخدم') || d.includes('إيقاف إمكانية طلب الرحلات');
    return {
      titleAr: t.includes('إشعار أمني') ? t : 'تم حظر الحساب 🚫',
      descriptionAr: d || 'تم حظر حسابك نهائياً من قبل إدارة المنظومة لمخالفة المعايير التشغيلية والسيادية.',
      titleEn: t.includes('إشعار أمني') ? 'Security Notice: Account Permanently Banned 🚫' : 'Account Suspended 🚫',
      descriptionEn: isRiderMsg
        ? 'Your account has been permanently banned by administration for violating operational and system standards. Ride requests and radar access have been disabled.'
        : 'Your account has been permanently suspended by administration for violating operational standards.',
      matched: true,
    };
  }

  // 17. Reset Penalties & Behavioral Integrity Rehabilitation
  if (t.includes('سجل المخالفات وكوابح السوق')) {
    return {
      titleAr: 'سجل المخالفات وكوابح السوق 🛡️',
      descriptionAr: d || 'تمت مراجعة حسابك وتصفير سجل المخالفات بالكامل، واستعادة مؤشر الأمان والنزاهة السلوكية إلى 5.0 نجوم بنجاح.',
      titleEn: 'Violations Log & Market Brakes Cleared 🛡️',
      descriptionEn: 'Your account has been reviewed, all violations have been cleared, and your safety & behavioral integrity index has been restored to 5.0 stars.',
      matched: true,
    };
  }

  if (t.includes('إعادة تأهيل الحساب والنزاهة السلوكية')) {
    return {
      titleAr: 'إعادة تأهيل الحساب والنزاهة السلوكية 🛡️',
      descriptionAr: d || 'تمت إعادة تأهيل حسابك واستعادة مؤشر النزاهة والمناعة السلوكية إلى 5.0 نجوم كاملة وتصفير أي عقوبات سابقة بنجاح.',
      titleEn: 'Account Rehabilitation & Behavioral Integrity 🛡️',
      descriptionEn: 'Your account has been rehabilitated, all previous penalties cleared, and your behavioral immunity index restored to a full 5.0 stars.',
      matched: true,
    };
  }

  // 24. Sovereign Tier Promotion
  if (t.includes('ترقية سيادية') || t.includes('أصبحت رتبتك')) {
    let tierEn = 'Higher Tier 🏆';
    if (t.includes('البلاتينية') || d.includes('البلاتينية')) tierEn = 'Platinum 💎';
    else if (t.includes('الذهبية') || d.includes('الذهبية')) tierEn = 'Gold 🥇';
    else if (t.includes('البرونزية') || d.includes('البرونزية')) tierEn = 'Bronze 🥉';
    else if (t.includes('الفضية') || d.includes('الفضية')) tierEn = 'Silver 🥈';

    return {
      titleAr: t,
      descriptionAr: d || 'تهانينا! تمت ترقية رتبتك بناءً على أدائك المتميز في المنظومة.',
      titleEn: `Sovereign Promotion: Your rank is now ${tierEn} 🏆`.replace('💎 🏆', '💎').replace('🥇 🏆', '🥇').replace('🥉 🏆', '🥉').replace('🥈 🏆', '🥈'),
      descriptionEn: `Congratulations Captain! Administration has upgraded your rank to (${tierEn}), unlocking better pricing and offer privileges on the radar.`,
      matched: true,
    };
  }

  // 25. Trip Unfrozen
  if (t.includes('فك تعليق الرحلة')) {
    const isIdleReset = d.includes('IDLE') || d.includes('الجاهزية');
    return {
      titleAr: 'فك تعليق الرحلة ⚡',
      descriptionAr: d || 'تم فك تعليق رحلتك وإعادتها للحالة النشطة بنجاح من قبل الإدارة.',
      titleEn: 'Trip Unfrozen ⚡',
      descriptionEn: isIdleReset
        ? 'Your trip suspension was cleared by administration and your status has been reset to Standby (IDLE) to receive new requests.'
        : 'Your trip has been resumed to active status by administration.',
      matched: true,
    };
  }

  return null;
}
