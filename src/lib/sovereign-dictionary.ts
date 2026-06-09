/**
 * [SCR-2026-SSOT-DICT] القاموس السيادي الموحد للغات والواجهات
 * مصدر الحقيقة الوحيد (SSOT) لجميع نصوص النظام لمنع التكرار (Anti-Chatter).
 */
export const SovereignDict = {
    ERRORS: {
        GPS_DISABLED: { title: 'عطل ملاحي', description: 'تفعيل الـ GPS إلزامي للتشغيل دقيق المسار.' },
        EMPTY_LINK: { title: 'بريد مفقود', description: 'يرجى إدخال الرابط المختصر المناسب للموقع.' },
        PROXY_FAILED: { title: 'النهج سقط', description: 'فشل الكود السحابي في اختراق الرادار.' },
        CONSTITUTIONAL_BREACH: { title: 'العهد مهزوز', description: 'حدث خرق لبروتوكول المقصلة التقنية.' },
        CORS_FALLBACK_GUIDE: { title: 'بروتوكول الارتداد الذكي اللامركزي 📡', description: 'فشل الفك السحابي لبيئة Vite/CORS! يرجى نسخ الرابط الطويل (المباشر) من خرائط Google ولصقه هنا لمسح الإحداثيات محلياً 100% بصفر تكلفة.' },
        RATING_REQUIRED: { title: 'التقييم المطلوب', description: 'يجب تقييم الرحلة السابقة لتتمكن من إطلاق رادار جديد.' },
        SECURITY_BLOCK: { title: 'عائق أمني', description: 'نظام الكشف التلقائي رصد سلوكاً غير طبيعي.' }
    },
    WARNINGS: {
        BLIND_SPOT: { title: 'النوقطة العمياء', description: 'تعديت النطاق الجغرافي المعمول به، قد يتأخر التحديث.' },
        WRITE_DESTINATION: { title: 'تنبيه ملاحي', description: 'يرجى كتابة اسم وجهتك أولاً.' }
    },
    SUCCESS: {
        LINK_CAPTURED: { title: 'تم الاختراق Successfully', description: 'تم الاتصال بالرادار للبدء بالتتبع.' },
        CALCULATION_DONE: { title: 'الحسابات الميدانية مكتملة', description: 'تم استخراج الإحداثيات والمسافة بنجاح.' },
        RIDE_REQUESTED: { title: 'إطلاق رادار الرحلة 🚀', description: 'تتبع السائق واقترابه جاري.' }
    },
    SEARCH: {
        TITLE: 'مسح النطاق السيادي 📡',
        SUBTITLE: 'البحث في فقاعة الـ 1.5 كم • حصة الميدان',
        EMPTY_SLOT: 'خانة سيادية شاغرة ⏳',
        CANCEL_RADAR: 'إلغاء وإعادة تدوير العوامة 🚫'
    },
    BUSY: {
        TITLE: 'الناقل في طريقه إليك ⚡',
        SUBTITLE: 'لقد تمت المصافحة الذرية بنجاح.',
        DRIVER: 'الناقل السيادي',
        VEHICLE: 'المركبة والعتاد',
        PLATE: 'رقم كود اللوحة',
        CALL: 'اتصال مع الفارس',
        TRACK: 'تتبع المسار الملاحي',
        CANCEL: 'إلغاء الرحلة (حالة سيادية طارئة)'
    },
    RATING: {
        SEAL_TITLE: 'الختم السيادي للرحلة ⚖️',
        SEAL_DESC: 'تقييمك المزدوج يضمن عدالة الميدان ونقاء الأسطول السيادي.',
        SOUL_LABEL: 'تقييم الروح (الأداء المهني السيادي)',
        BODY_LABEL: 'تقييم الجسد (حالة المركبة والعتاد)',
        FAVORITE_LABEL: 'إضافة لكتيبة المفضلين؟ 🛡️',
        SUBMIT_BTN: 'اعتماد والعودة للميدان'
    },
    CHECKPOINT: {
        TITLE: 'نقطة تفتيش سيادية 🛑',
        DESCRIPTION: 'لقد تجاوز الناقل الزمن المحدد للوصول ولم يتم رصد حركة كافية بالـ GPS في فقاعة التوازن.',
        IGNORE_BTN: 'نحن نتحرك الآن (تجاهل الإشارة)',
        GUILLOTINE_BTN: 'هذا ناقل شبح (تنفيذ المقصلة الرقمية)'
    }
} as const;
