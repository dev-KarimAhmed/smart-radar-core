/**
 * Dynamic Notification Matcher: Welcome, Legal Log, Declarations, Referral & Documents.
 */

import {
  DynamicNotificationMatch,
  hasArabicScript,
} from './notification-i18n-types';

export function matchDynamicOnboardingNotification(
  t: string,
  d: string
): DynamicNotificationMatch | null {
  // 1. Welcome to Bynkcom Digital Ad Network 🌟
  if (t.includes('مرحباً بك في شبكة بينكم') || t.toLowerCase().includes('welcome to bynkcom')) {
    const hasPlatformSuffix =
      d.includes('أهلاً بك في منصة بينكم') || d.toLowerCase().includes('welcome to bynkcom digital ad network');
    return {
      titleAr: 'مرحباً بك في شبكة بينكم للإعلان الرقمي 🌟',
      descriptionAr: hasPlatformSuffix
        ? 'تم تفعيل حسابك بنجاح وأصبح جاهزاً للاستخدام بالكامل. أهلاً بك في منصة بينكم للإعلان الرقمي.'
        : d || 'تم تفعيل حسابك بنجاح وأصبح جاهزاً للاستخدام بالكامل.',
      titleEn: 'Welcome to Bynkcom Digital Ad Network 🌟',
      descriptionEn: hasPlatformSuffix
        ? 'Your account has been successfully activated and is now ready for full use. Welcome to Bynkcom Digital Ad Network.'
        : 'Your account has been successfully activated and is now ready for full use.',
      matched: true,
    };
  }

  // 2. Electronic Legal Log Verification 🛡️
  if (
    t.includes('توثيق السجل القانوني الإلكتروني') ||
    t.toLowerCase().includes('electronic legal log verification')
  ) {
    return {
      titleAr: 'توثيق السجل القانوني الإلكتروني 🛡️',
      descriptionAr: d || 'تم توثيق الإقرار وحفظه في السجل القانوني الإلكتروني في شاشة سجلاتي.',
      titleEn: 'Electronic Legal Log Verification 🛡️',
      descriptionEn: 'The declaration has been verified and saved in the Electronic Legal Log on the My Records screen.',
      matched: true,
    };
  }

  // 3. Electronic Legal Declaration Audit Notification
  if (t.includes('إقرار قانوني إلكتروني:')) {
    const labelAr = t.replace('إقرار قانوني إلكتروني:', '').trim();
    const labelEn =
      labelAr.includes('تسجيل حساب جديد')
        ? 'New Account Registration'
        : labelAr.includes('تعديل بيانات الحساب الشخصي') && labelAr.includes('والمركبة')
          ? 'Personal Account & Vehicle Details Update'
          : labelAr.includes('تعديل بيانات المركبة')
            ? 'Vehicle Details Update'
            : labelAr.includes('تعديل بيانات الحساب')
              ? 'Account Details Update'
              : labelAr || 'Legal Declaration';
    const decMatch = d.match(/رقم الإقرار:\s*([^\s|]+)/);
    const userMatch = d.match(/المستخدم:\s*([^\s|]+)/);
    const timeMatch = d.match(/التوقيت:\s*([^—]+?)(?:\s*—|$)/);

    return {
      titleAr: t,
      descriptionAr: d,
      titleEn: `Electronic Legal Declaration: ${labelEn}`,
      descriptionEn:
        decMatch && userMatch
          ? `Declaration ID: ${decMatch[1]} | User: ${userMatch[1]}${timeMatch ? ` | Time: ${timeMatch[1].trim()}` : ''} — Verified and saved in the Electronic Legal Log on My Records.`
          : 'The legal declaration was verified and saved in the Electronic Legal Log on My Records.',
      matched: true,
      titleMatched: !hasArabicScript(labelEn),
      descriptionMatched: true,
    };
  }

  // 4. Welcome Gift Radar Hours 🎁⚡
  if (t.includes('هدية ترحيبية:') || t.toLowerCase().includes('welcome gift:')) {
    const hoursMatch = t.match(/(\d+)/) || d.match(/\((\d+)\)/);
    const hours = hoursMatch ? hoursMatch[1] : '24';
    const validityMatch = d.match(/لـ\s*(\d+)\s*يوماً/) || d.match(/for\s*(\d+)\s*days/i);
    const days = validityMatch ? validityMatch[1] : null;
    return {
      titleAr: `هدية ترحيبية: ${hours} ساعة رادار مجاناً 🎁⚡`,
      descriptionAr: days
        ? `أهلاً بك يا كابتن! تم إيداع رصيد ترحيبي قدره (${hours}) ساعة طيران رادار في محفظتك بنجاح وتمديد الصلاحية لـ ${days} يوماً لتنطلق في استقبال الرحلات فوراً.`
        : `أهلاً بك يا كابتن! تم إيداع رصيد ترحيبي قدره (${hours}) ساعة طيران رادار في محفظتك بنجاح لتنطلق في استقبال الرحلات فوراً. نتمنى لك رحلات موفقة وأرباحاً وفيرة!`,
      titleEn: `Welcome Gift: ${hours} Free Radar Hours 🎁⚡`,
      descriptionEn: days
        ? `Welcome Captain! A welcome credit of (${hours}) radar flight hours has been deposited into your wallet, valid for ${days} days, to start accepting rides immediately.`
        : `Welcome Captain! A welcome credit of (${hours}) radar flight hours has been deposited into your wallet to start accepting rides immediately. Wishing you successful trips!`,
      matched: true,
    };
  }

  // 11. New Referral Rider Joined (Captain - Party emoji 🎉)
  if (t.includes('انضمام راكب جديد') || t.includes('رابط الإحالة')) {
    const riderMatch = d.match(/انضم الراكب\s*\((.+?)\)/);
    const riderName = riderMatch ? riderMatch[1].trim() : '';

    return {
      titleAr: 'انضمام راكب جديد عبر رابط الإحالة 🎉',
      descriptionAr: riderName
        ? `انضم الراكب (${riderName}) عبر رابط الإحالة الخاص بك وتمت إضافته إلى قائمة الركاب المفضلين لديك.`
        : 'انضم راكب جديد عبر رابط الإحالة الخاص بك وتمت إضافته إلى قائمة الركاب المفضلين لديك.',
      titleEn: 'New Referral Rider Joined 🎉',
      descriptionEn: riderName
        ? `Rider (${riderName}) joined via your referral link and was added to your favorite riders list.`
        : 'A new rider joined via your referral link and was added to your favorite riders list.',
      matched: true,
    };
  }

  // 12. Referral Inactivity Alert (Captain - Warning emoji ⚠️)
  if (t.includes('تنبيه عدم نشاط راكب')) {
    const match = d.match(/الراكب\s*\((.+?)\)\s*غير متفاعل منذ\s*(\d+)\s*يوماً/);
    const riderName = match ? match[1].trim() : 'المسجل برابطك';
    const days = match ? match[2] : '10';

    return {
      titleAr: 'تنبيه عدم نشاط راكب ⚠️',
      descriptionAr: `الراكب (${riderName}) غير متفاعل منذ ${days} يوماً. عدم تفاعله في طلب الرحلات أو مشاهدة الإعلانات يضيع عليك تجميع النقاط وترقية رتبتك! تواصل معه وشجعه على التفاعل والاستفادة من خدماتك.`,
      titleEn: 'Rider Inactivity Alert ⚠️',
      descriptionEn: `Rider (${riderName}) has been inactive for ${days} days. Reconnect with them to encourage trip requests and ad views to maintain your points and rank!`,
      matched: true,
    };
  }

  // 13. Captain Document Verification Approved (Trophy emoji 🏆)
  if (t.includes('تم اعتماد وتوثيق حسابك') || t.includes('كابتن معلن موثق')) {
    return {
      titleAr: 'تهانينا يا كابتن معلن! تم اعتماد وتوثيق حسابك رسمياً 🏆',
      descriptionAr: 'تمت مراجعة وتدقيق هويتك ومستنداتك بنجاح من قبل إدارة المنظومة، ومُنحت شارة «كابتن معلن موثق رسمياً ✓».',
      titleEn: 'Congratulations Captain! Account Officially Verified 🏆',
      descriptionEn: 'Your identity and documents were successfully reviewed and verified by administration, granting you the Officially Verified Captain badge ✓.',
      matched: true,
    };
  }

  // 14. Captain Document Verification Warning (Warning emoji ⚠️)
  if (t.includes('مراجعة وثائق الكابتن')) {
    const isDefaultBody = !d || d.includes('يرجى إعادة رفع وثائق واضحة ومطابقة');
    return {
      titleAr: 'تنبيه: مراجعة وثائق الكابتن المعلن ⚠️',
      descriptionAr: d || 'يرجى إعادة رفع وثائق واضحة ومطابقة للشروط والتعليمات لتأكيد اعتماد الحساب.',
      titleEn: 'Notice: Review Captain Documents ⚠️',
      descriptionEn: isDefaultBody
        ? 'Please re-upload clear documents meeting operational standards to confirm account verification.'
        : d,
      matched: true,
      titleMatched: true,
      descriptionMatched: isDefaultBody || !hasArabicScript(d),
    };
  }

  return null;
}
