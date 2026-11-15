import type { Offer } from '@/core/types';
import type { AppLanguage } from '@/lib/i18n/simple-copy';

export function notifyNewCaptainOffer(
  offer: Offer,
  offerId: string,
  language: AppLanguage,
  toast: (opts: any) => void
) {
  if (typeof window === 'undefined') return;
  const captainName = offer.driverName || (language === 'ar' ? 'كابتن معلن' : 'Captain');
  const currencyLabel = language === 'ar' ? 'ج.م' : 'EGP';
  const price = offer.price ? `${offer.price} ${currencyLabel}` : '';
  const eta = offer.pickup_eta_minutes
    ? language === 'ar'
      ? ` (وصول خلال ${offer.pickup_eta_minutes} د)`
      : ` (arrival in ${offer.pickup_eta_minutes} min)`
    : '';

  toast({
    title: language === 'ar' ? 'عرض كابتن معلن جديد 🚗' : 'New Captain Offer 🚗',
    description: language === 'ar'
      ? `وصلك عرض بقيمة ${price} من الكابتن المعلن ${captainName}${eta}`
      : `Offer of ${price} received from ${captainName}${eta}`,
    duration: 5000,
  });

  window.dispatchEvent(
    new CustomEvent('app-notification', {
      detail: {
        id: `notif_offer_${offerId}`,
        title: language === 'ar' ? 'عرض كابتن معلن جديد 🚗' : 'New Captain Offer 🚗',
        description: language === 'ar'
          ? `وصلك عرض بقيمة ${price} من الكابتن المعلن ${captainName}${eta}`
          : `Offer of ${price} received from ${captainName}${eta}`,
        type: 'offer',
      },
    })
  );
}

