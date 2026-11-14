/**
 * Dynamic Notification Matcher: Administration Default Headers & Known Quick Templates.
 */

import {
  DynamicNotificationMatch,
  hasArabicScript,
  hasLatinLetters,
} from './notification-i18n-types';

export const KNOWN_ADMIN_HEADERS: Array<{ ar: string; en: string; aliases: string[] }> = [
  {
    ar: 'رسالة من إدارة المنظومة',
    en: 'Message from System Administration',
    aliases: ['رسالة من إدارة المنظومة', 'message from system administration', 'message from platform administration'],
  },
  {
    ar: 'توجيه من إدارة المنظومة',
    en: 'Directive from Platform Administration',
    aliases: ['توجيه من إدارة المنظومة', 'directive from platform administration'],
  },
  {
    ar: 'توجيه من إدارة المنظومة',
    en: 'Directive from System Administration',
    aliases: ['directive from system administration'],
  },
  {
    ar: 'إشعار توجيهي من إدارة المنظومة',
    en: 'Directive Notification from System Administration',
    aliases: ['إشعار توجيهي من إدارة المنظومة', 'directive notification from system administration'],
  },
  {
    ar: 'إشعار من إدارة المنظومة',
    en: 'Notice from System Administration',
    aliases: ['إشعار من إدارة المنظومة', 'notice from system administration'],
  },
  {
    ar: 'إشعار مالي من إدارة المنظومة',
    en: 'Financial Notice from System Administration',
    aliases: ['إشعار مالي من إدارة المنظومة', 'financial notice from system administration'],
  },
  {
    ar: 'إشعار بخصوص إيصال الشحن',
    en: 'Notification Regarding Recharge Receipt',
    aliases: ['إشعار بخصوص إيصال الشحن', 'notification regarding recharge receipt'],
  },
  {
    ar: 'إشعار إداري سيادي',
    en: 'Sovereign Admin Notice',
    aliases: ['إشعار إداري سيادي', 'sovereign admin notice'],
  },
  {
    ar: 'رسالة من الإدارة',
    en: 'Message from management',
    aliases: ['رسالة من الإدارة', 'message from management'],
  },
];

export const KNOWN_QUICK_TEMPLATE_BODIES: Array<{ ar: string; en: string; aliases?: string[] }> = [
  // Rider quick templates (riders-management-panel.tsx)
  {
    ar: 'مرحباً بك في بينكم - bynkcom! نتمنى لك تجربة رحلات ممتعة وآمنة دائماً.',
    en: 'Welcome to bynkcom! We wish you safe and pleasant rides always.',
  },
  {
    ar: 'تنبيه: نرجو الالتزام بعدم تكرار إلغاء الطلبات للحفاظ على تقييم حسابك.',
    en: 'Admin Notice: Please avoid consecutive cancellations to maintain your account trust score.',
  },
  {
    ar: 'تم تنشيط حسابك بنجاح، يمكنك الآن طلب الرحلات بشكل طبيعي.',
    en: 'Your account has been rehabilitated and activated successfully. You can now request rides normally.',
  },
  {
    ar: 'عروض وخصومات مميزة متوفرة الآن في منطقتك على رحلاتك القادمة.',
    en: 'Exclusive discounts and offers are now available in your area for your upcoming rides.',
  },
  {
    ar: 'يرجى التأكد من تشغيل الموقع (GPS) بدقة لضمان سرعة وصول السائق إليك.',
    en: 'Please ensure high-accuracy GPS is enabled to ensure faster driver pickup response.',
  },
  {
    ar: 'تحديث جديد في التطبيق: أصبح طلب الرحلات أسرع وأسهل الآن!',
    en: 'New App Update: Requesting rides is now faster and easier than ever!',
  },
  {
    ar: 'شكراً لثقتكم بتطبيق بينكم - bynkcom.',
    en: "Thank you for choosing bynkcom - Jordan's fastest and safest transport network.",
  },
  {
    ar: 'نتمنى لكم أسبوعاً سعيداً ورحلات موفقة مع بينكم - bynkcom.',
    en: 'Wishing you a wonderful week and safe journeys with bynkcom.',
  },
  // Captain Direct quick templates (drivers-management-tab.tsx)
  {
    ar: 'يرجى تجديد رخصة القيادة أو وثائق المركبة لتجنب إيقاف الحساب.',
    en: "Please renew your driver's license or vehicle documents to avoid account suspension.",
  },
  {
    ar: 'يرجى تجديد رخصة القيادة أو وثائق المركبة لتجنب تعليق الحساب.',
    en: 'Please renew driving license or vehicle documents to avoid account suspension.',
  },
  {
    ar: 'تمت مراجعة حسابك واعتماد بياناتك ووثائقك بنجاح.',
    en: 'Your account has been audited and verified successfully.',
  },
  {
    ar: 'تنبيه إداري: نرجو الالتزام بعدم إلغاء الرحلات بعد قبولها لضمان استقرار حسابك.',
    en: 'Administrative notice: Please avoid canceling accepted trips to preserve your account stability.',
  },
  {
    ar: 'شكر وتقدير من إدارة بينكم لأدائك المتميز والتزامك العالي.',
    en: 'Appreciation from byncom Administration for your exemplary service and commitment.',
    aliases: ['appreciation from bynkcom administration for your exemplary service and commitment.'],
  },
  {
    ar: 'يرجى التأكد من تشغيل محدد الموقع (GPS) بدقة عالية أثناء فترات العمل.',
    en: 'Please ensure GPS high-accuracy mode is enabled during active duty.',
  },
  // Captain Bulk quick templates (drivers-management-tab.tsx)
  {
    ar: 'بشرى سارة: تم شحن دقائق إضافية لحسابكم بمناسبة نهاية الأسبوع!',
    en: 'Good news: Extra flight minutes have been credited to your account for the weekend!',
  },
  {
    ar: 'تنبيه هام: يرجى تفعيل وضع الاتصال، الطلبات في منطقتك مرتفعة الآن!',
    en: 'Important alert: Please go online, order demand in your area is surging right now!',
  },
  {
    ar: 'إشعار تشغيلي: يرجى التأكد من استقرار إشارة GPS وتحديث التطبيق لأحدث إصدار.',
    en: 'Operational notice: Please ensure high GPS accuracy and update app to the latest version.',
  },
  {
    ar: 'شكر وتقدير: إدارة المنظومة تشكركم على التزامكم العالي وخدمتكم الممتازة.',
    en: 'Appreciation: System administration thanks you for your outstanding commitment and excellence.',
  },
  {
    ar: 'تنويه أمني: نذكركم بالالتزام بالتسعيرة الرسمية وعدم إلغاء الرحلات بعد قبولها.',
    en: 'Security notice: Reminder to adhere to official fare formulas and avoid trip cancellations.',
  },
  // Wallet Receipt quick templates (wallet-management-tab.tsx)
  {
    ar: 'يرجى إعادة رفع صورة إشعار التحويل بشكل أوضح تظهر كافة التفاصيل.',
    en: 'Please re-upload a clearer image of the transfer receipt showing all details.',
  },
  {
    ar: 'لم نتمكن من مطابقة الرقم المرجعي للحوالة، يرجى تزويدنا به للتأكيد.',
    en: 'Could not match transfer reference number. Please provide it to verify.',
  },
  {
    ar: 'تم استلام إيصال التحويل بنجاح وجاري مراجعته وإضافة الرصيد لمحفظتك.',
    en: 'Your transfer was received and is currently being audited and credited to your wallet.',
  },
  {
    ar: 'يرجى التأكد من التحويل إلى الرقم المعتمد للمحفظة.',
    en: "Please ensure the transfer was sent to the wallet's authorized number.",
  },
];

export function matchDynamicTemplateNotification(
  t: string,
  d: string
): DynamicNotificationMatch | null {
  const tLower = t.toLowerCase();
  const dLower = d.toLowerCase();
  const matchedHeader = KNOWN_ADMIN_HEADERS.find((h) => h.aliases.includes(tLower));
  const matchedBody = KNOWN_QUICK_TEMPLATE_BODIES.find(
    (b) => b.ar === d || b.en.toLowerCase() === dLower || (b.aliases ? b.aliases.includes(dLower) : false)
  );

  const isLicenseRenewalNotice =
    !matchedBody &&
    (dLower.includes("renew your driver's license") ||
      dLower.includes('renew driving license') ||
      d.includes('تجديد رخصة القيادة'));

  if (matchedHeader || matchedBody || isLicenseRenewalNotice) {
    const headerIsResolved = Boolean(matchedHeader) || (!hasArabicScript(t) && !hasLatinLetters(t));
    const bodyIsResolved =
      Boolean(matchedBody) || isLicenseRenewalNotice || (!hasArabicScript(d) && !hasLatinLetters(d));
    const resolvedBodyAr = matchedBody
      ? matchedBody.ar
      : isLicenseRenewalNotice
        ? 'يرجى تجديد رخصة القيادة أو وثائق المركبة لتجنب إيقاف الحساب.'
        : d;
    const resolvedBodyEn = matchedBody
      ? matchedBody.en
      : isLicenseRenewalNotice
        ? "Please renew your driver's license or vehicle documents to avoid account suspension."
        : d;
    return {
      titleAr: matchedHeader ? matchedHeader.ar : (t || 'رسالة من الإدارة'),
      descriptionAr: resolvedBodyAr,
      titleEn: matchedHeader ? matchedHeader.en : (t || 'Message from management'),
      descriptionEn: resolvedBodyEn,
      matched: true,
      titleMatched: matchedHeader ? true : (isLicenseRenewalNotice && !t) ? true : headerIsResolved,
      descriptionMatched: bodyIsResolved,
    };
  }

  return null;
}
