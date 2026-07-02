import { simpleCopy } from './i18n/simple-copy';

/**
 * Shared UI copy used by older parts of the app.
 *
 * Keep this file in simple, normal Arabic. New screens should prefer
 * `src/lib/i18n/simple-copy.ts` so Arabic and English stay together.
 */
export const SovereignDict = {
  ERRORS: {
    GPS_DISABLED: {
      title: simpleCopy.errors.gpsDisabled.ar,
      description: 'يرجى السماح للتطبيق باستخدام الموقع حتى نحدد المسار بدقة.',
    },
    EMPTY_LINK: {
      title: 'الرابط مطلوب',
      description: 'يرجى إدخال رابط صحيح للموقع أو الوجهة.',
    },
    PROXY_FAILED: {
      title: 'تعذر قراءة الرابط',
      description: 'لم نتمكن من قراءة الرابط تلقائياً. جرّب إدخال العنوان أو الرابط الكامل.',
    },
    CONSTITUTIONAL_BREACH: {
      title: 'حدث خطأ في العملية',
      description: simpleCopy.errors.generic.ar,
    },
    CORS_FALLBACK_GUIDE: {
      title: 'تعذر فتح الرابط المختصر',
      description: 'انسخ الرابط الكامل من الخريطة والصقه هنا حتى نقرأ الموقع بشكل صحيح.',
    },
    RATING_REQUIRED: {
      title: 'التقييم مطلوب',
      description: 'يرجى تقييم الرحلة السابقة قبل طلب رحلة جديدة.',
    },
    SECURITY_BLOCK: {
      title: 'تم إيقاف العملية',
      description: 'رصد النظام عملية غير معتادة. يرجى المحاولة مرة أخرى أو التواصل مع الدعم.',
    },
  },
  WARNINGS: {
    BLIND_SPOT: {
      title: 'خارج النطاق',
      description: 'أنت خارج المنطقة المدعومة حالياً، لذلك قد يتأخر التحديث.',
    },
    WRITE_DESTINATION: {
      title: 'اكتب الوجهة',
      description: 'يرجى كتابة اسم الوجهة قبل المتابعة.',
    },
  },
  SUCCESS: {
    LINK_CAPTURED: {
      title: 'تم قراءة الرابط',
      description: 'تم تحديد الموقع بنجاح ويمكنك المتابعة.',
    },
    CALCULATION_DONE: {
      title: 'تم الحساب',
      description: 'تم حساب المسافة والموقع بنجاح.',
    },
    RIDE_REQUESTED: {
      title: simpleCopy.rider.requestRide.ar,
      description: simpleCopy.rider.searchingDrivers.ar,
    },
  },
  SEARCH: {
    TITLE: 'البحث عن كابتن',
    SUBTITLE: 'نبحث عن كباتن قريبين ضمن نطاق 1.5 كم.',
    EMPTY_SLOT: 'لا يوجد عرض حتى الآن',
    CANCEL_RADAR: 'إلغاء البحث',
  },
  BUSY: {
    TITLE: simpleCopy.rider.driverOnWay.ar,
    SUBTITLE: 'تم قبول العرض وتأكيد الرحلة.',
    DRIVER: simpleCopy.roles.driver.ar,
    VEHICLE: 'المركبة',
    PLATE: 'رقم اللوحة',
    CALL: 'اتصل بالكابتن',
    TRACK: 'تتبع الرحلة',
    CANCEL: 'إلغاء الرحلة',
  },
  RATING: {
    SEAL_TITLE: simpleCopy.rider.rateTrip.ar,
    SEAL_DESC: 'ساعدنا في تحسين جودة الرحلات بتقييمك.',
    SOUL_LABEL: 'تقييم تعامل الكابتن',
    BODY_LABEL: 'تقييم المركبة',
    FAVORITE_LABEL: 'حفظ الكابتن في المفضلة؟',
    SUBMIT_BTN: 'إرسال التقييم',
  },
  CHECKPOINT: {
    TITLE: 'تأكيد الرحلة',
    DESCRIPTION: 'لم نرصد حركة كافية بعد وصول الكابتن. هل بدأت الرحلة؟',
    IGNORE_BTN: 'نعم، بدأت الرحلة',
    GUILLOTINE_BTN: 'لا، أريد الإبلاغ',
  },
} as const;

