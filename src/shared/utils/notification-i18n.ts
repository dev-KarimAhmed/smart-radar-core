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
}

const I18N_TAG_REGEX = /<!--i18n:([\s\S]*?)-->/;

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
  } else {
    if (cur.toUpperCase() === 'EGP') return 'ج.م';
    if (cur.toUpperCase() === 'JOD') return 'د.أ';
    return cur || 'ج.م';
  }
}

/**
 * Dynamic rule-based translator for standard backend notifications lacking metadata tags.
 */
export function resolveDynamicNotification(
  rawTitle: string,
  rawDesc: string
): { titleAr: string; descriptionAr: string; titleEn: string; descriptionEn: string; matched: boolean } {
  const t = rawTitle.trim();
  const d = rawDesc.trim();

  // 1. Trip Completed (Captain - Money emoji 💰)
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

  // 2. Trip Completed (Rider - Checkmark emoji ✅)
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

  // 3. Trip Accepted (Captain - Party emoji 🎉)
  if (t.includes('تم قبول عرضك')) {
    const riderMatch = d.match(/وافق\s+(.+?)\s+على عرضك/);
    const riderName = riderMatch ? riderMatch[1].trim() : '';
    const descAr = riderName
      ? `وافق ${riderName} على عرضك. ابدأ بالتحرك نحو نقطة الانطلاق الآن.`
      : 'وافق الراكب على عرضك. ابدأ بالتحرك نحو نقطة الانطلاق الآن.';
    const descEn = riderName
      ? `${riderName} accepted your offer. Please start heading to the pickup location now.`
      : 'The rider accepted your offer. Please start heading to the pickup location now.';

    return {
      titleAr: 'تم قبول عرضك 🎉',
      descriptionAr: descAr,
      titleEn: 'Your Offer Was Accepted 🎉',
      descriptionEn: descEn,
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

  // 4. Captain Arrived (Rider - Pin emoji 📍)
  if (t.includes('وصل الكابتن إلى موقعك')) {
    const capMatch = d.match(/الكابتن\s*(.*?)\s*بانتظارك الآن في نقطة الانطلاق/);
    const capName = capMatch ? capMatch[1].trim() : '';
    const descAr = capName
      ? `الكابتن ${capName} بانتظارك الآن في نقطة الانطلاق.`
      : 'الكابتن بانتظارك الآن في نقطة الانطلاق.';
    const descEn = capName
      ? `Captain ${capName} is waiting for you at the pickup location.`
      : 'The captain is waiting for you at the pickup location.';

    return {
      titleAr: 'وصل الكابتن إلى موقعك 📍',
      descriptionAr: descAr,
      titleEn: 'Captain Arrived At Your Location 📍',
      descriptionEn: descEn,
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

  // 5. Trip Started (Rider - Car emoji 🚗)
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

  // 6. New Captain Offer (Rider - Car emoji 🚗)
  if (t.includes('عرض كابتن جديد')) {
    const offerMatch = d.match(/وصلك عرض بقيمة\s*([\d.]+)\s*([^\s]+)?\s*من الكابتن\s*(.*?)(?:\s*\(وصول خلال\s*(\d+)\s*د\))?$/);
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

  // 7. New Referral Rider Joined (Captain - Party emoji 🎉)
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

  // 8. Referral Inactivity Alert (Captain - Warning emoji ⚠️)
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

  // 9. Captain Document Verification Approved (Trophy emoji 🏆)
  if (t.includes('تم اعتماد وتوثيق حسابك') || t.includes('كابتن معلن موثق')) {
    return {
      titleAr: 'تهانينا يا كابتن معلن! تم اعتماد وتوثيق حسابك رسمياً 🏆',
      descriptionAr: 'تمت مراجعة وتدقيق هويتك ومستنداتك بنجاح من قبل إدارة المنظومة، ومُنحت شارة «كابتن معلن موثق رسمياً ✓».',
      titleEn: 'Congratulations Captain! Account Officially Verified 🏆',
      descriptionEn: 'Your identity and documents were successfully reviewed and verified by administration, granting you the Officially Verified Captain badge ✓.',
      matched: true,
    };
  }

  // 10. Captain Document Verification Warning (Warning emoji ⚠️)
  if (t.includes('مراجعة وثائق الكابتن')) {
    return {
      titleAr: 'تنبيه: مراجعة وثائق الكابتن المعلن ⚠️',
      descriptionAr: d || 'يرجى إعادة رفع وثائق واضحة ومطابقة للشروط والتعليمات لتأكيد اعتماد الحساب.',
      titleEn: 'Notice: Review Captain Documents ⚠️',
      descriptionEn: 'Please re-upload clear documents meeting operational standards to confirm account verification.',
      matched: true,
    };
  }

  // 11. Account Suspended
  if (t.includes('تم حظر') || t.includes('حظر حسابك')) {
    return {
      titleAr: 'تم حظر الحساب 🚫',
      descriptionAr: d || 'تم حظر حسابك نهائياً من قبل إدارة المنظومة لمخالفة المعايير التشغيلية والسيادية.',
      titleEn: 'Account Suspended 🚫',
      descriptionEn: 'Your account has been permanently suspended by administration for violating operational standards.',
      matched: true,
    };
  }

  // 12. Recharge Receipt Approved
  if (t.includes('اعتماد إيصال الشحن') || t.includes('الموافقة على إيصال')) {
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
      return {
        titleAr: 'تم اعتماد إيصال الشحن بنجاح ⚡',
        descriptionAr: `تمت الموافقة على إيصالك وإيداع ${amount} ${cur} في رصيد محفظتك.`,
        titleEn: 'Recharge Receipt Approved Successfully ⚡',
        descriptionEn: `Your receipt was approved and ${amount} ${normalizeCurrency(cur, 'en')} has been deposited into your wallet.`,
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

  // 13. Recharge Receipt Rejected
  if (t.includes('رفض إيصال الشحن')) {
    return {
      titleAr: 'تم رفض إيصال الشحن ❌',
      descriptionAr: d || 'تم رفض إيصال الشحن من قبل الإدارة. يرجى مراجعة التفاصيل وإعادة المحاولة.',
      titleEn: 'Recharge Receipt Rejected ❌',
      descriptionEn: 'Your recharge receipt was rejected by administration. Please verify details and retry.',
      matched: true,
    };
  }

  // 14. Minutes / Balance Recharged
  if (t.includes('شحن رصيد دقائق') || t.includes('شحن دقائق')) {
    const minMatch = d.match(/(\d+)\s*دقيقة/);
    const minutes = minMatch ? minMatch[1] : '';
    return {
      titleAr: 'شحن رصيد دقائق الرادار ⚡',
      descriptionAr: minutes
        ? `تم شحن (${minutes}) دقيقة رادار حسابك بنجاح من قبل الإدارة. أصبحت جاهزة للاستخدام الآن!`
        : d,
      titleEn: 'Radar Minutes Recharged ⚡',
      descriptionEn: minutes
        ? `Successfully credited (${minutes}) radar minutes to your account by administration. Ready to use now!`
        : 'Radar minutes have been credited to your account by administration.',
      matched: true,
    };
  }

  // 15. Wallet Cash Deposit
  if (t.includes('إيداع نقدي') || t.includes('إيداع رصيد')) {
    return {
      titleAr: 'إيداع نقدي في المحفظة 💰',
      descriptionAr: d || 'تم إيداع رصيد نقدي في محفظتك بنجاح من قبل الإدارة.',
      titleEn: 'Wallet Cash Deposit 💰',
      descriptionEn: 'Cash credit has been deposited into your wallet by administration.',
      matched: true,
    };
  }

  // 16. Management Notice: Driver's license / documents
  if (
    t.toLowerCase().includes('management') ||
    t.includes('رسالة من الإدارة') ||
    d.toLowerCase().includes("driver's license") ||
    d.includes('رخصة القيادة')
  ) {
    return {
      titleAr: 'رسالة من الإدارة',
      descriptionAr: 'يرجى تجديد رخصة القيادة أو وثائق المركبة لتجنب إيقاف الحساب.',
      titleEn: 'Message from management',
      descriptionEn: "Please renew your driver's license or vehicle documents to avoid account suspension.",
      matched: true,
    };
  }

  // 17. Sovereign Tier Promotion
  if (t.includes('ترقية سيادية') || t.includes('أصبحت رتبتك')) {
    return {
      titleAr: t,
      descriptionAr: d || 'تهانينا! تمت ترقية رتبتك بناءً على أدائك المتميز في المنظومة.',
      titleEn: 'Tier Promotion 🏆',
      descriptionEn: 'Congratulations! Your rank has been upgraded based on your performance.',
      matched: true,
    };
  }

  // 18. Trip Unfrozen
  if (t.includes('فك تعليق الرحلة')) {
    return {
      titleAr: 'فك تعليق الرحلة ⚡',
      descriptionAr: d || 'تم فك تعليق رحلتك وإعادتها للحالة النشطة بنجاح من قبل الإدارة.',
      titleEn: 'Trip Resumed ⚡',
      descriptionEn: 'Your trip has been resumed to active status by administration.',
      matched: true,
    };
  }

  return {
    titleAr: t,
    descriptionAr: d,
    titleEn: t,
    descriptionEn: d,
    matched: false,
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

      const titleAr = payload.title_ar || rawTitle;
      const descriptionAr = payload.body_ar || cleanBody;
      const titleEn = payload.title_en || rawTitle;
      const descriptionEn = payload.body_en || cleanBody;

      const hasTranslation = Boolean(
        (payload.title_en && payload.title_en !== payload.title_ar) ||
          (payload.body_en && payload.body_en !== payload.body_ar)
      );

      return {
        title: isArabic ? titleAr : (titleEn || titleAr),
        description: isArabic ? descriptionAr : (descriptionEn || descriptionAr),
        hasTranslation,
        titleAr,
        descriptionAr,
        titleEn,
        descriptionEn,
      };
    } catch (e) {
      console.warn('[parseNotificationContent] Failed to parse i18n payload:', e);
    }
  }

  // 2. Fallback to dynamic rule-based translation for standard backend notifications
  const cleanDesc = rawDesc.replace(I18N_TAG_REGEX, '').trim();
  const dynamic = resolveDynamicNotification(rawTitle, cleanDesc);

  if (dynamic.matched) {
    return {
      title: isArabic ? dynamic.titleAr : dynamic.titleEn,
      description: isArabic ? dynamic.descriptionAr : dynamic.descriptionEn,
      hasTranslation: true,
      titleAr: dynamic.titleAr,
      descriptionAr: dynamic.descriptionAr,
      titleEn: dynamic.titleEn,
      descriptionEn: dynamic.descriptionEn,
    };
  }

  // 3. Fallback for custom unmapped notifications
  return {
    title: rawTitle,
    description: cleanDesc,
    hasTranslation: false,
    titleAr: rawTitle,
    descriptionAr: cleanDesc,
    titleEn: rawTitle,
    descriptionEn: cleanDesc,
  };
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

  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: trimmed, targetLang }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.success && data?.translatedText) {
        return data.translatedText;
      }
    }
  } catch (err) {
    console.warn('[requestTranslation] API call failed, falling back:', err);
  }

  // Fallback directly from client if API fails
  try {
    const fallbackRes = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(
        trimmed
      )}`
    );
    if (fallbackRes.ok) {
      const data = await fallbackRes.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        return data[0].map((c: any) => (c && c[0] ? c[0] : '')).join('').trim();
      }
    }
  } catch {}

  return trimmed;
}
