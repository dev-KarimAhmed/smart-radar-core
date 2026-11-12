/**
 * Notification Internationalization (i18n) Engine.
 * Enables zero-cost dual-language storage and automatic language delivery for notifications and admin directives.
 */

export interface NotificationI18nPayload {
  title_ar: string;
  body_ar: string;
  title_en: string;
  body_en: string;
}

export interface ParsedNotificationContent {
  title: string;
  description: string;
  hasTranslation: boolean;
  titleAr: string;
  descriptionAr: string;
  titleEn: string;
  descriptionEn: string;
  titleNeedsTranslation: boolean;
  descriptionNeedsTranslation: boolean;
}

export interface DynamicNotificationMatch {
  titleAr: string;
  descriptionAr: string;
  titleEn: string;
  descriptionEn: string;
  matched: boolean;
  titleMatched?: boolean;
  descriptionMatched?: boolean;
}

const I18N_TAG_REGEX = /<!--i18n:([\s\S]*?)-->/;
const RUNTIME_TRANSLATION_CACHE_KEY = 'radar_notif_i18n_cache_v1';
const MAX_CACHE_ENTRIES = 250;

export function hasArabicScript(text: string | null | undefined): boolean {
  return /[\u0600-\u06FF]/.test(text || '');
}

export function hasLatinLetters(text: string | null | undefined): boolean {
  return /[A-Za-z]/.test(text || '');
}

function isDominantlyLatinText(text: string | null | undefined): boolean {
  const s = (text || '').trim();
  if (!s) return false;
  const arabicCount = (s.match(/[\u0600-\u06FF]/g) || []).length;
  const latinCount = (s.match(/[A-Za-z]/g) || []).length;
  return latinCount > 0 && (arabicCount === 0 || latinCount >= arabicCount * 1.5);
}

function isTranslationErrorBanner(text: string | null | undefined): boolean {
  return /mymemory\s*warning|query\s+length\s+limit|please\s+select\s+two\s+distinct\s+languages|invalid\s+language\s+pair/i.test(
    text || ''
  );
}

function isValidClientTranslation(
  translated: string,
  source: string,
  targetLang: 'ar' | 'en'
): boolean {
  const tr = (translated || '').trim();
  const src = (source || '').trim();
  if (!tr || tr === src || isTranslationErrorBanner(tr)) {
    return false;
  }
  return targetLang === 'en' ? hasLatinLetters(tr) : hasArabicScript(tr);
}

/**
 * Encodes a dual-language notification message into clean, standard-compatible title and description.
 */
export function encodeNotificationPayload(
  titleAr: string,
  bodyAr: string,
  titleEn?: string,
  bodyEn?: string
): { title: string; description: string } {
  const cleanTitleAr = (titleAr || '').trim();
  const cleanBodyAr = (bodyAr || '').trim();
  const cleanTitleEn = (titleEn || '').trim();
  const cleanBodyEn = (bodyEn || '').trim();

  // If only one language is provided, store standard clean text
  if (!cleanTitleEn && !cleanBodyEn) {
    return {
      title: cleanTitleAr,
      description: cleanBodyAr,
    };
  }

  if (!cleanTitleAr && !cleanBodyAr) {
    return {
      title: cleanTitleEn,
      description: cleanBodyEn,
    };
  }

  // Dual-language package
  const meta: NotificationI18nPayload = {
    title_ar: cleanTitleAr || cleanTitleEn,
    body_ar: cleanBodyAr || cleanBodyEn,
    title_en: cleanTitleEn || cleanTitleAr,
    body_en: cleanBodyEn || cleanBodyAr,
  };

  const primaryTitle = cleanTitleAr || cleanTitleEn;
  const primaryBody = cleanBodyAr || cleanBodyEn;

  return {
    title: primaryTitle,
    description: `${primaryBody}\n\n<!--i18n:${JSON.stringify(meta)}-->`,
  };
}

/**
 * Normalizes currency symbols between Arabic and English notations.
 */
function normalizeCurrency(currency: string, targetLang: 'ar' | 'en'): string {
  const cur = (currency || '').trim();
  if (targetLang === 'en') {
    if (cur === 'ج.م' || cur === 'جنيه') return 'EGP';
    if (cur === 'د.أ' || cur === 'د' || cur === 'دينار') return 'JOD';
    return cur || 'EGP';
  }
  if (cur.toUpperCase() === 'EGP') return 'ج.م';
  if (cur.toUpperCase() === 'JOD') return 'د.أ';
  return cur || 'ج.م';
}

function translateKnownReceiptRejectionReason(reason: string): string | null {
  const r = reason.trim();
  if (!r) return 'The receipt is unclear or the transfer has not been received.';
  if (r.includes('غير واضح أو لم يتم استلام التحويل')) {
    return 'The receipt is unclear or the transfer has not been received.';
  }
  if (r.includes('غير واضح أو المبلغ لا يطابق')) {
    return 'The receipt is unclear or the amount does not match the transfer.';
  }
  if (!hasArabicScript(r)) {
    return r;
  }
  return null;
}

/**
 * Dynamic rule-based translator for standard backend/admin notifications lacking metadata tags.
 */
export function resolveDynamicNotification(
  rawTitle: string,
  rawDesc: string
): DynamicNotificationMatch {
  const t = rawTitle.trim();
  const d = rawDesc.trim();

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

  // 5. Trip Completed (Captain - Money emoji 💰)
  if (t.includes('اكتملت الرحلة بنجاح') && t.includes('💰')) {
    return {
      titleAr: 'اكتملت الرحلة بنجاح 💰',
      descriptionAr: d || 'تم تسجيل انتهاء الرحلة وأرباحك بنجاح.',
      titleEn: 'Trip Completed Successfully 💰',
      descriptionEn: 'Trip ended and your earnings have been recorded successfully.',
      matched: true,
    };
  }
  if (t.toLowerCase().includes('trip completed') && (t.includes('💰') || d.toLowerCase().includes('earnings'))) {
    return {
      titleAr: 'اكتملت الرحلة بنجاح 💰',
      descriptionAr: 'تم تسجيل انتهاء الرحلة وأرباحك بنجاح.',
      titleEn: 'Trip Completed Successfully 💰',
      descriptionEn: d || 'Trip ended and your earnings have been recorded successfully.',
      matched: true,
    };
  }

  // 6. Trip Completed (Rider - Checkmark emoji ✅)
  if (t.includes('اكتملت الرحلة بنجاح')) {
    return {
      titleAr: 'اكتملت الرحلة بنجاح ✅',
      descriptionAr: d || 'شكراً لاختيارك رادار. نأمل أن تكون قد استمتعت برحلتك.',
      titleEn: 'Trip Completed Successfully ✅',
      descriptionEn: 'Thank you for choosing Radar. We hope you enjoyed your ride.',
      matched: true,
    };
  }
  if (t.toLowerCase().includes('trip completed')) {
    return {
      titleAr: 'اكتملت الرحلة بنجاح ✅',
      descriptionAr: 'شكراً لاختيارك رادار. نأمل أن تكون قد استمتعت برحلتك.',
      titleEn: 'Trip Completed Successfully ✅',
      descriptionEn: d || 'Thank you for choosing Radar. We hope you enjoyed your ride.',
      matched: true,
    };
  }

  // 7. Trip Accepted (Captain - Party emoji 🎉)
  if (t.includes('تم قبول عرضك')) {
    const riderMatch = d.match(/وافق\s+(.+?)\s+على عرضك/);
    const riderName = riderMatch ? riderMatch[1].trim() : '';
    return {
      titleAr: 'تم قبول عرضك 🎉',
      descriptionAr: riderName
        ? `وافق ${riderName} على عرضك. ابدأ بالتحرك نحو نقطة الانطلاق الآن.`
        : 'وافق الراكب على عرضك. ابدأ بالتحرك نحو نقطة الانطلاق الآن.',
      titleEn: 'Your Offer Was Accepted 🎉',
      descriptionEn: riderName
        ? `${riderName} accepted your offer. Please start heading to the pickup location now.`
        : 'The rider accepted your offer. Please start heading to the pickup location now.',
      matched: true,
    };
  }
  if (t.toLowerCase().includes('offer') && t.toLowerCase().includes('accepted')) {
    const riderMatch = d.match(/(.+?)\s+accepted your offer/i);
    const riderName = riderMatch ? riderMatch[1].trim() : '';
    return {
      titleAr: 'تم قبول عرضك 🎉',
      descriptionAr: riderName
        ? `وافق ${riderName} على عرضك. ابدأ بالتحرك نحو نقطة الانطلاق الآن.`
        : 'وافق الراكب على عرضك. ابدأ بالتحرك نحو نقطة الانطلاق الآن.',
      titleEn: 'Your Offer Was Accepted 🎉',
      descriptionEn: d || 'Your offer was accepted. Please start heading to the pickup location now.',
      matched: true,
    };
  }

  // 8. Captain Arrived (Rider - Pin emoji 📍)
  if (t.includes('وصل الكابتن إلى موقعك')) {
    const capMatch = d.match(/الكابتن\s*(.*?)\s*بانتظارك الآن في نقطة الانطلاق/);
    const capName = capMatch ? capMatch[1].trim() : '';
    return {
      titleAr: 'وصل الكابتن إلى موقعك 📍',
      descriptionAr: capName
        ? `الكابتن ${capName} بانتظارك الآن في نقطة الانطلاق.`
        : 'الكابتن بانتظارك الآن في نقطة الانطلاق.',
      titleEn: 'Captain Arrived At Your Location 📍',
      descriptionEn: capName
        ? `Captain ${capName} is waiting for you at the pickup location.`
        : 'The captain is waiting for you at the pickup location.',
      matched: true,
    };
  }
  if (t.toLowerCase().includes('captain arrived') || t.toLowerCase().includes('captain has arrived')) {
    const capMatch = d.match(/captain\s*(.*?)\s*is waiting/i);
    const capName = capMatch ? capMatch[1].trim() : '';
    return {
      titleAr: 'وصل الكابتن إلى موقعك 📍',
      descriptionAr: capName
        ? `الكابتن ${capName} بانتظارك الآن في نقطة الانطلاق.`
        : 'الكابتن بانتظارك الآن في نقطة الانطلاق.',
      titleEn: 'Captain Arrived At Your Location 📍',
      descriptionEn: d || 'The captain is waiting for you at the pickup location.',
      matched: true,
    };
  }

  // 9. Trip Started (Rider - Car emoji 🚗)
  if (t.includes('بدأت الرحلة')) {
    return {
      titleAr: 'بدأت الرحلة 🚗',
      descriptionAr: d || 'نتمنى لك رحلة آمنة ومريحة مع رادار.',
      titleEn: 'Trip Started 🚗',
      descriptionEn: 'Wishing you a safe and comfortable trip with Radar.',
      matched: true,
    };
  }
  if (t.toLowerCase().includes('trip started')) {
    return {
      titleAr: 'بدأت الرحلة 🚗',
      descriptionAr: 'نتمنى لك رحلة آمنة ومريحة مع رادار.',
      titleEn: 'Trip Started 🚗',
      descriptionEn: d || 'Wishing you a safe and comfortable trip with Radar.',
      matched: true,
    };
  }

  // 10. New Captain Offer (Rider - Car emoji 🚗)
  if (t.includes('عرض كابتن جديد') || t.includes('عرض كابتن معلن جديد')) {
    const offerMatch = d.match(/وصلك عرض بقيمة\s*([\d.]+)\s*([^\s]+)?\s*من الكابتن(?:\s*المعلن)?\s*(.*?)(?:\s*\(وصول خلال\s*(\d+)\s*د\))?$/);
    if (offerMatch) {
      const fare = offerMatch[1];
      const curAr = offerMatch[2] || 'ج.م';
      const capName = offerMatch[3]?.trim() || 'كابتن';
      const eta = offerMatch[4] || '5';
      const curEn = normalizeCurrency(curAr, 'en');

      return {
        titleAr: 'عرض كابتن جديد 🚗',
        descriptionAr: `وصلك عرض بقيمة ${fare} ${curAr} من الكابتن ${capName} (وصول خلال ${eta} د)`,
        titleEn: 'New Captain Offer 🚗',
        descriptionEn: `You received an offer of ${fare} ${curEn} from Captain ${capName} (arrival in ${eta} min)`,
        matched: true,
      };
    }
    return {
      titleAr: 'عرض كابتن جديد 🚗',
      descriptionAr: d,
      titleEn: 'New Captain Offer 🚗',
      descriptionEn: 'You received a new offer from an advertiser captain.',
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

  // 18. Recharge Receipt Rejected (must check before approved because 'تعذر اعتماد إيصال الشحن' contains 'اعتماد إيصال الشحن')
  if (t.includes('رفض إيصال الشحن') || t.includes('تعذر اعتماد إيصال الشحن') || t.includes('تعذر قبول إيصال الشحن')) {
    const reasonMatch =
      d.match(/للأسباب التالية:\s*(.+?)\.\s*يرجى مراجعة الإدارة/) ||
      d.match(/للسبب التالي:\s*(.+?)\.\s*يمكنك إعادة إرسال/);
    const rawReason = reasonMatch ? reasonMatch[1].trim() : '';
    const translatedReason = rawReason ? translateKnownReceiptRejectionReason(rawReason) : null;

    if (!d) {
      return {
        titleAr: 'تم رفض إيصال الشحن ❌',
        descriptionAr: 'تم رفض إيصال الشحن من قبل الإدارة. يرجى مراجعة التفاصيل وإعادة المحاولة.',
        titleEn: 'Recharge Receipt Rejected ❌',
        descriptionEn: 'Your recharge receipt was rejected by administration. Please verify details and retry.',
        matched: true,
      };
    }

    if (translatedReason) {
      return {
        titleAr: t,
        descriptionAr: d,
        titleEn: 'Notice: Recharge Receipt Not Approved ⚠️',
        descriptionEn: `Your recharge receipt was rejected for the following reason: ${translatedReason} Please contact support or resubmit a clear receipt.`,
        matched: true,
      };
    }

    // Unknown custom Arabic reason: translate title immediately, allow runtime translation of description
    return {
      titleAr: t,
      descriptionAr: d,
      titleEn: 'Notice: Recharge Receipt Not Approved ⚠️',
      descriptionEn: d,
      matched: true,
      titleMatched: true,
      descriptionMatched: !hasArabicScript(d),
    };
  }

  // 19. Recharge Receipt Approved
  if (
    (t.includes('اعتماد إيصال الشحن') || t.includes('الموافقة على إيصال')) &&
    !t.includes('تعذر') &&
    !t.includes('رفض')
  ) {
    const minMatch = d.match(/تغذية حسابك بـ\s*(\d+)\s*دقيقة/);
    const cashMatch = d.match(/إيداع\s*([\d.]+)\s*([^\s]+)?\s*في رصيد/);

    if (minMatch) {
      const minutes = minMatch[1];
      return {
        titleAr: 'تم اعتماد إيصال الشحن بنجاح ⚡',
        descriptionAr: `تمت الموافقة على إيصالك وتغذية حسابك بـ ${minutes} دقيقة.`,
        titleEn: 'Recharge Receipt Approved Successfully ⚡',
        descriptionEn: `Your receipt was approved and ${minutes} minutes have been credited to your account.`,
        matched: true,
      };
    }
    if (cashMatch) {
      const amount = cashMatch[1];
      const cur = cashMatch[2] || 'د.أ';
      const hasRadarAllocHint = d.includes('تخصيص الرصيد لدقائق رادار');
      return {
        titleAr: t.includes('💰') ? 'تم اعتماد إيصال الشحن بنجاح 💰' : 'تم اعتماد إيصال الشحن بنجاح ⚡',
        descriptionAr: d || `تمت الموافقة على إيصالك وإيداع ${amount} ${cur} في رصيد محفظتك.`,
        titleEn: t.includes('💰') ? 'Recharge Receipt Approved Successfully 💰' : 'Recharge Receipt Approved Successfully ⚡',
        descriptionEn: hasRadarAllocHint
          ? `Your receipt was approved and ${amount} ${normalizeCurrency(cur, 'en')} was deposited into your wallet. You can allocate this balance to radar minutes anytime.`
          : `Your receipt was approved and ${amount} ${normalizeCurrency(cur, 'en')} has been deposited into your wallet.`,
        matched: true,
      };
    }

    return {
      titleAr: 'تم اعتماد إيصال الشحن بنجاح ⚡',
      descriptionAr: d || 'تمت الموافقة على إيصال الشحن وتحديث رصيد حسابك بنجاح.',
      titleEn: 'Recharge Receipt Approved Successfully ⚡',
      descriptionEn: 'Your recharge receipt was approved and your balance has been updated.',
      matched: true,
    };
  }

  // 20. Direct Top-Up from Administration (`شحن رصيد من الإدارة ⚡`)
  if (t.includes('شحن رصيد من الإدارة')) {
    const cashMatch = d.match(/([+-]?[\d.]+)\s*(د\.أ|ج\.م|EGP|JOD)/);
    const minsMatch = d.match(/([+-]?\d+)\s*دقيقة/);
    const parts: string[] = [];
    if (cashMatch) {
      parts.push(`${cashMatch[1]} ${normalizeCurrency(cashMatch[2], 'en')}`);
    }
    if (minsMatch) {
      parts.push(`${minsMatch[1]} radar minutes`);
    }
    return {
      titleAr: 'شحن رصيد من الإدارة ⚡',
      descriptionAr: d,
      titleEn: 'Balance Top-Up from Administration ⚡',
      descriptionEn:
        parts.length > 0
          ? `Your account has been credited by administration: ${parts.join(' ')}.`
          : 'Your account balance has been credited by system administration.',
      matched: true,
    };
  }

  // 21. Bulk & Individual Radar Minutes Recharged
  if (t.includes('شحن دقائق رادار جماعي') || t.includes('شحن رصيد دقائق') || t.includes('شحن دقائق')) {
    const minMatch = d.match(/(\d+)\s*دقيقة/);
    const daysMatch = d.match(/لـ\s*(\d+)\s*يوماً/);
    const minutes = minMatch ? minMatch[1] : '';
    const days = daysMatch ? daysMatch[1] : '';
    const isBulk = t.includes('جماعي');

    return {
      titleAr: t,
      descriptionAr: d || (minutes ? `تم شحن (${minutes}) دقيقة للحساب بنجاح.` : ''),
      titleEn: isBulk ? 'Bulk Radar Minutes Top-Up ⚡' : 'Radar Minutes Recharged ⚡',
      descriptionEn: minutes
        ? days
          ? `Successfully credited (${minutes}) radar minutes to your account by administration and extended validity for ${days} days.`
          : `Successfully credited (${minutes}) radar minutes to your account by administration. Ready to use now!`
        : 'Radar minutes have been credited to your account by administration.',
      matched: true,
    };
  }

  // 22. Wallet Cash Deposit (Individual or Bulk)
  if (t.includes('إيداع نقدي') || t.includes('إيداع رصيد نقدي') || t.includes('إيداع رصيد')) {
    const amountMatch = d.match(/مبلغ\s*\(([^)]+)\)/);
    const balMatch = d.match(/الرصيد المالي الحالي:\s*([\d.]+)/);
    const amountStr = amountMatch ? amountMatch[1].trim() : '';
    const balanceStr = balMatch ? balMatch[1].trim() : '';

    return {
      titleAr: t,
      descriptionAr: d || 'تم إيداع رصيد نقدي في محفظتك بنجاح من قبل الإدارة.',
      titleEn: 'Wallet Cash Deposit 💰',
      descriptionEn: amountStr
        ? balanceStr
          ? `An amount of (${amountStr}) was deposited into your wallet by administration. Current cash balance: ${balanceStr}.`
          : `An amount of (${amountStr}) was deposited into your wallet by administration.`
        : 'Cash credit has been deposited into your wallet by administration.',
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

  // 23 & 26. Standard Admin Default Headers + Known Quick Templates (supports both AR and EN inputs)
  const KNOWN_ADMIN_HEADERS: Array<{ ar: string; en: string; aliases: string[] }> = [
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

  const KNOWN_QUICK_TEMPLATE_BODIES: Array<{ ar: string; en: string; aliases?: string[] }> = [
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

  const tLower = t.toLowerCase();
  const dLower = d.toLowerCase();
  const matchedHeader = KNOWN_ADMIN_HEADERS.find((h) => h.aliases.includes(tLower));
  const matchedBody = KNOWN_QUICK_TEMPLATE_BODIES.find(
    (b) => b.ar === d || b.en.toLowerCase() === dLower || (b.aliases ? b.aliases.includes(dLower) : false)
  );

  // Driver's license / vehicle documents fallback (only when renewal phrasing is present; never clobber matched header/body)
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

  return {
    titleAr: t,
    descriptionAr: d,
    titleEn: t,
    descriptionEn: d,
    matched: false,
    titleMatched: false,
    descriptionMatched: false,
  };
}

/**
 * Parses a stored notification item, resolving the appropriate language based on the recipient's UI locale.
 */
export function parseNotificationContent(
  item: { title?: string; description?: string },
  isArabic: boolean
): ParsedNotificationContent {
  const rawTitle = (item.title || '').trim();
  const rawDesc = (item.description || '').trim();

  // 1. Check for embedded metadata tag <!--i18n:...-->
  const match = rawDesc.match(I18N_TAG_REGEX);

  if (match && match[1]) {
    try {
      const payload: NotificationI18nPayload = JSON.parse(match[1]);
      const cleanBody = rawDesc.replace(I18N_TAG_REGEX, '').trim();

      let titleAr = (payload.title_ar || rawTitle).trim();
      let descriptionAr = (payload.body_ar || cleanBody).trim();
      let titleEn = (payload.title_en || '').trim();
      let descriptionEn = (payload.body_en || '').trim();

      const dynamicFromAr = resolveDynamicNotification(titleAr, descriptionAr);
      const dynamicTitleOk = dynamicFromAr.matched && (dynamicFromAr.titleMatched ?? true);
      const dynamicDescOk = dynamicFromAr.matched && (dynamicFromAr.descriptionMatched ?? true);

      // Repair broken legacy <!--i18n--> envelopes where Arabic was duplicated into title_en / body_en
      const titleEnIsMissingOrArabicCopy =
        !titleEn || (titleEn === titleAr && hasArabicScript(titleAr));
      const bodyEnIsMissingOrArabicCopy =
        !descriptionEn || (descriptionEn === descriptionAr && hasArabicScript(descriptionAr));

      if (titleEnIsMissingOrArabicCopy && dynamicTitleOk) {
        titleEn = dynamicFromAr.titleEn;
      }
      if (bodyEnIsMissingOrArabicCopy && dynamicDescOk) {
        descriptionEn = dynamicFromAr.descriptionEn;
      }

      // Repair reverse case: English-authored row duplicated into title_ar / body_ar
      const titleArIsMissingOrEnglishCopy =
        !titleAr || (titleAr === titleEn && !hasArabicScript(titleEn) && hasLatinLetters(titleEn));
      const bodyArIsMissingOrEnglishCopy =
        !descriptionAr || (descriptionAr === descriptionEn && !hasArabicScript(descriptionEn) && hasLatinLetters(descriptionEn));

      if (titleArIsMissingOrEnglishCopy && titleEn) {
        const dynFromEn = resolveDynamicNotification(titleEn, descriptionEn);
        if (dynFromEn.matched && (dynFromEn.titleMatched ?? true)) {
          titleAr = dynFromEn.titleAr;
        }
      }
      if (bodyArIsMissingOrEnglishCopy && descriptionEn) {
        const dynFromEn = resolveDynamicNotification(titleEn, descriptionEn);
        if (dynFromEn.matched && (dynFromEn.descriptionMatched ?? true)) {
          descriptionAr = dynFromEn.descriptionAr;
        }
      }

      if (!titleEn) titleEn = titleAr;
      if (!descriptionEn) descriptionEn = descriptionAr;

      const resolvedTitle = isArabic ? titleAr : (titleEn || titleAr);
      const resolvedDesc = isArabic ? descriptionAr : (descriptionEn || descriptionAr);

      const hasDistinctTitleEn = Boolean(titleEn && titleEn !== titleAr);
      const hasDistinctBodyEn = Boolean(descriptionEn && descriptionEn !== descriptionAr);

      const titleNeedsTranslation = isArabic
        ? (!hasArabicScript(resolvedTitle) && hasLatinLetters(resolvedTitle))
        : (hasArabicScript(resolvedTitle) &&
          !(dynamicTitleOk && hasLatinLetters(resolvedTitle)) &&
          !(hasDistinctTitleEn && isDominantlyLatinText(resolvedTitle)));

      const descriptionNeedsTranslation = isArabic
        ? (!hasArabicScript(resolvedDesc) && hasLatinLetters(resolvedDesc))
        : (hasArabicScript(resolvedDesc) &&
          !(dynamicDescOk && hasLatinLetters(resolvedDesc)) &&
          !(hasDistinctBodyEn && isDominantlyLatinText(resolvedDesc)));

      const hasTranslation = hasDistinctTitleEn || hasDistinctBodyEn;

      return {
        title: resolvedTitle,
        description: resolvedDesc,
        hasTranslation,
        titleAr,
        descriptionAr,
        titleEn,
        descriptionEn,
        titleNeedsTranslation,
        descriptionNeedsTranslation,
      };
    } catch (e) {
      console.warn('[parseNotificationContent] Failed to parse i18n payload:', e);
    }
  }

  // 2. Fallback to dynamic rule-based translation for standard backend notifications
  const cleanDesc = rawDesc.replace(I18N_TAG_REGEX, '').trim();
  const dynamic = resolveDynamicNotification(rawTitle, cleanDesc);

  if (dynamic.matched) {
    const titleMatched = dynamic.titleMatched ?? true;
    const descMatched = dynamic.descriptionMatched ?? true;
    const title = isArabic ? dynamic.titleAr : dynamic.titleEn;
    const description = isArabic ? dynamic.descriptionAr : dynamic.descriptionEn;

    const titleNeedsTranslation = isArabic
      ? (!titleMatched && !hasArabicScript(title) && hasLatinLetters(title))
      : (!titleMatched && hasArabicScript(title));
    const descriptionNeedsTranslation = isArabic
      ? (!descMatched && !hasArabicScript(description) && hasLatinLetters(description))
      : (!descMatched && hasArabicScript(description));

    return {
      title,
      description,
      hasTranslation: titleMatched || descMatched,
      titleAr: dynamic.titleAr,
      descriptionAr: dynamic.descriptionAr,
      titleEn: dynamic.titleEn,
      descriptionEn: dynamic.descriptionEn,
      titleNeedsTranslation,
      descriptionNeedsTranslation,
    };
  }

  // 3. Fallback for custom unmapped notifications
  const titleNeedsTranslation = isArabic
    ? (!hasArabicScript(rawTitle) && hasLatinLetters(rawTitle))
    : hasArabicScript(rawTitle);
  const descriptionNeedsTranslation = isArabic
    ? (!hasArabicScript(cleanDesc) && hasLatinLetters(cleanDesc))
    : hasArabicScript(cleanDesc);

  return {
    title: rawTitle,
    description: cleanDesc,
    hasTranslation: false,
    titleAr: rawTitle,
    descriptionAr: cleanDesc,
    titleEn: rawTitle,
    descriptionEn: cleanDesc,
    titleNeedsTranslation,
    descriptionNeedsTranslation,
  };
}

// --- Client-Side Runtime Translation Cache & Batch Helper ---
const runtimeCache = new Map<string, string>();
let isRuntimeCacheHydrated = false;
const inFlightBatchTranslations = new Map<string, Promise<string>>();

function hydrateRuntimeCacheIfNeeded(): void {
  if (isRuntimeCacheHydrated || typeof window === 'undefined') return;
  isRuntimeCacheHydrated = true;
  try {
    const raw = window.localStorage.getItem(RUNTIME_TRANSLATION_CACHE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === 'string' && v.trim() && !isTranslationErrorBanner(v)) {
          runtimeCache.set(k, v);
        }
      }
    }
  } catch {}
}

function persistRuntimeCache(): void {
  if (typeof window === 'undefined') return;
  try {
    const entries = Array.from(runtimeCache.entries()).slice(-MAX_CACHE_ENTRIES);
    const obj: Record<string, string> = {};
    for (const [k, v] of entries) {
      obj[k] = v;
    }
    window.localStorage.setItem(RUNTIME_TRANSLATION_CACHE_KEY, JSON.stringify(obj));
  } catch {}
}

function makeCacheKey(text: string, targetLang: 'ar' | 'en'): string {
  return `${targetLang}::${text.trim()}`;
}

export function getCachedNotificationTranslation(
  text: string,
  targetLang: 'ar' | 'en'
): string | null {
  const trimmed = (text || '').trim();
  if (!trimmed) return null;
  hydrateRuntimeCacheIfNeeded();
  return runtimeCache.get(makeCacheKey(trimmed, targetLang)) ?? null;
}

/**
 * Resolves a notification item synchronously using both static rules / i18n payload
 * AND any previously cached client-side translations.
 */
export function resolveNotificationForDisplay(
  item: { title?: string; description?: string },
  isArabic: boolean
): ParsedNotificationContent {
  const parsed = parseNotificationContent(item, isArabic);
  const targetLang: 'ar' | 'en' = isArabic ? 'ar' : 'en';

  let title = parsed.title;
  let description = parsed.description;
  let titleNeedsTranslation = parsed.titleNeedsTranslation;
  let descriptionNeedsTranslation = parsed.descriptionNeedsTranslation;

  if (titleNeedsTranslation && title) {
    const cached = getCachedNotificationTranslation(title, targetLang);
    if (cached) {
      title = cached;
      titleNeedsTranslation = false;
    }
  }

  if (descriptionNeedsTranslation && description) {
    const cached = getCachedNotificationTranslation(description, targetLang);
    if (cached) {
      description = cached;
      descriptionNeedsTranslation = false;
    }
  }

  return {
    ...parsed,
    title,
    description,
    titleNeedsTranslation,
    descriptionNeedsTranslation,
  };
}

async function translateDirectViaGtx(text: string, targetLang: 'ar' | 'en'): Promise<string | null> {
  try {
    const fallbackRes = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(
        text
      )}`
    );
    if (fallbackRes.ok) {
      const data = await fallbackRes.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const tr = data[0].map((c: any) => (c && c[0] ? c[0] : '')).join('').trim();
        if (isValidClientTranslation(tr, text, targetLang)) {
          return tr;
        }
      }
    }
  } catch {}
  return null;
}

/**
 * Client-side helper to translate a list of texts on demand via /api/translate,
 * deduplicating concurrent requests and persisting results in cache.
 */
export async function requestBatchTranslation(
  texts: string[],
  targetLang: 'ar' | 'en' = 'en'
): Promise<Record<string, string>> {
  hydrateRuntimeCacheIfNeeded();
  const results: Record<string, string> = {};
  const uniquePending: string[] = [];
  const waitingPromises: Array<Promise<void>> = [];

  for (const raw of texts) {
    const trimmed = (raw || '').trim();
    if (!trimmed) continue;
    const key = makeCacheKey(trimmed, targetLang);
    const cached = runtimeCache.get(key);
    if (cached && !isTranslationErrorBanner(cached)) {
      results[trimmed] = cached;
      continue;
    }
    const inflight = inFlightBatchTranslations.get(key);
    if (inflight) {
      waitingPromises.push(
        inflight.then((tr) => {
          if (tr && isValidClientTranslation(tr, trimmed, targetLang)) {
            results[trimmed] = tr;
          }
        })
      );
      continue;
    }
    if (!uniquePending.includes(trimmed)) {
      uniquePending.push(trimmed);
    }
  }

  if (uniquePending.length > 0) {
    // Chunk by 30 (API MAX_BATCH_TEXTS)
    for (let i = 0; i < uniquePending.length; i += 30) {
      const chunk = uniquePending.slice(i, i + 30);
      const batchPromise = (async () => {
        let cacheUpdated = false;
        try {
          const res = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texts: chunk, targetLang }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data?.success && Array.isArray(data.translations)) {
              chunk.forEach((src, idx) => {
                const tr = typeof data.translations[idx] === 'string' ? data.translations[idx].trim() : '';
                if (isValidClientTranslation(tr, src, targetLang)) {
                  runtimeCache.set(makeCacheKey(src, targetLang), tr);
                  results[src] = tr;
                  cacheUpdated = true;
                }
              });
            }
          }
        } catch (err) {
          console.warn('[requestBatchTranslation] API batch failed:', err);
        }

        // Direct client-side GTX fallback for any items that failed or remained untranslated
        const remaining = chunk.filter((src) => !results[src]);
        if (remaining.length > 0) {
          await Promise.allSettled(
            remaining.slice(0, 10).map(async (src) => {
              const gtx = await translateDirectViaGtx(src, targetLang);
              if (gtx) {
                runtimeCache.set(makeCacheKey(src, targetLang), gtx);
                results[src] = gtx;
                cacheUpdated = true;
              }
            })
          );
        }

        if (cacheUpdated) persistRuntimeCache();
        return results;
      })();

      chunk.forEach((src) => {
        const key = makeCacheKey(src, targetLang);
        inFlightBatchTranslations.set(
          key,
          batchPromise.then((map) => map[src] || src).finally(() => {
            inFlightBatchTranslations.delete(key);
          })
        );
      });

      await batchPromise;
    }
  }

  if (waitingPromises.length > 0) {
    await Promise.allSettled(waitingPromises);
  }

  return results;
}

/**
 * Client-side helper to translate text on demand via /api/translate
 */
export async function requestTranslation(
  text: string,
  targetLang: 'ar' | 'en' = 'en'
): Promise<string> {
  const trimmed = (text || '').trim();
  if (!trimmed) return '';

  const cached = getCachedNotificationTranslation(trimmed, targetLang);
  if (cached && !isTranslationErrorBanner(cached)) return cached;

  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: trimmed, targetLang }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.success && data?.translatedText) {
        const tr = String(data.translatedText).trim();
        if (isValidClientTranslation(tr, trimmed, targetLang)) {
          runtimeCache.set(makeCacheKey(trimmed, targetLang), tr);
          persistRuntimeCache();
          return tr;
        }
      }
    }
  } catch (err) {
    console.warn('[requestTranslation] API call failed, falling back:', err);
  }

  // Fallback directly from client if API fails
  const gtx = await translateDirectViaGtx(trimmed, targetLang);
  if (gtx) {
    runtimeCache.set(makeCacheKey(trimmed, targetLang), gtx);
    persistRuntimeCache();
    return gtx;
  }

  return trimmed;
}
