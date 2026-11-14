/**
 * Dynamic Notification Matcher: Trips & Driver Offers.
 */

import {
  DynamicNotificationMatch,
  normalizeCurrency,
} from './notification-i18n-types';

export function matchDynamicTripNotification(
  t: string,
  d: string
): DynamicNotificationMatch | null {
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

  return null;
}
