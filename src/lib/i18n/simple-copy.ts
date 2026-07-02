export type AppLanguage = 'ar' | 'en';

export type LocalizedText = {
  ar: string;
  en: string;
};

export const simpleCopy = {
  meta: {
    appName: { ar: 'الرادار الذكي', en: 'Smart Radar' },
    language: { ar: 'اللغة', en: 'Language' },
    arabic: { ar: 'العربية', en: 'Arabic' },
    english: { ar: 'الإنجليزية', en: 'English' },
  },

  roles: {
    rider: { ar: 'راكب', en: 'Rider' },
    driver: { ar: 'كابتن', en: 'Captain' },
    advertiser: { ar: 'معلن', en: 'Advertiser' },
    delegate: { ar: 'مندوب', en: 'Delegate' },
    admin: { ar: 'مشرف', en: 'Admin' },
    owner: { ar: 'مالك', en: 'Owner' },
  },

  nav: {
    home: { ar: 'الرئيسية', en: 'Home' },
    history: { ar: 'السجل', en: 'History' },
    wallet: { ar: 'المحفظة', en: 'Wallet' },
    vault: { ar: 'المحفوظات', en: 'Saved' },
    profile: { ar: 'حسابي', en: 'Profile' },
    dashboard: { ar: 'لوحة التحكم', en: 'Dashboard' },
    ads: { ar: 'الإعلانات', en: 'Ads' },
    delegates: { ar: 'المندوبون', en: 'Delegates' },
    drivers: { ar: 'الكباتن', en: 'Captains' },
    riders: { ar: 'الركاب', en: 'Riders' },
    settings: { ar: 'الإعدادات', en: 'Settings' },
  },

  actions: {
    continue: { ar: 'متابعة', en: 'Continue' },
    back: { ar: 'رجوع', en: 'Back' },
    cancel: { ar: 'إلغاء', en: 'Cancel' },
    save: { ar: 'حفظ', en: 'Save' },
    edit: { ar: 'تعديل', en: 'Edit' },
    delete: { ar: 'حذف', en: 'Delete' },
    archive: { ar: 'أرشفة', en: 'Archive' },
    approve: { ar: 'موافقة', en: 'Approve' },
    reject: { ar: 'رفض', en: 'Reject' },
    pause: { ar: 'إيقاف مؤقت', en: 'Pause' },
    resume: { ar: 'تشغيل', en: 'Resume' },
    freeze: { ar: 'تجميد', en: 'Freeze' },
    unfreeze: { ar: 'إلغاء التجميد', en: 'Unfreeze' },
    extend: { ar: 'تمديد', en: 'Extend' },
    call: { ar: 'اتصال', en: 'Call' },
    whatsapp: { ar: 'واتساب', en: 'WhatsApp' },
    openMap: { ar: 'فتح الخريطة', en: 'Open map' },
    addCampaign: { ar: 'إضافة حملة', en: 'Add campaign' },
    addDemoData: { ar: 'إضافة بيانات تجريبية', en: 'Add demo data' },
  },

  status: {
    active: { ar: 'نشط', en: 'Active' },
    idle: { ar: 'غير نشط', en: 'Idle' },
    busy: { ar: 'مشغول', en: 'Busy' },
    pending: { ar: 'بانتظار المراجعة', en: 'Pending review' },
    approved: { ar: 'مقبول', en: 'Approved' },
    rejected: { ar: 'مرفوض', en: 'Rejected' },
    paused: { ar: 'متوقف مؤقتاً', en: 'Paused' },
    frozen: { ar: 'مجمّد', en: 'Frozen' },
    expired: { ar: 'منتهي', en: 'Expired' },
    archived: { ar: 'مؤرشف', en: 'Archived' },
    completed: { ar: 'مكتمل', en: 'Completed' },
    failed: { ar: 'فشل', en: 'Failed' },
  },

  auth: {
    chooseRoleTitle: { ar: 'اختر نوع الحساب', en: 'Choose account type' },
    chooseRoleSubtitle: { ar: 'اختر الحساب المناسب لاستخدام التطبيق.', en: 'Choose the account that matches how you will use the app.' },
    personalTitle: { ar: 'المعلومات الشخصية', en: 'Personal information' },
    name: { ar: 'الاسم', en: 'Name' },
    phone: { ar: 'رقم الهاتف', en: 'Phone number' },
    governorate: { ar: 'المحافظة', en: 'Governorate' },
    district: { ar: 'اللواء', en: 'District' },
    register: { ar: 'إنشاء حساب', en: 'Create account' },
    login: { ar: 'تسجيل الدخول', en: 'Sign in' },
    requiredFields: { ar: 'يرجى تعبئة جميع الحقول المطلوبة.', en: 'Please fill in all required fields.' },
    invalidPhone: { ar: 'رقم الهاتف غير صحيح. استخدم الصيغة +9627xxxxxxxx.', en: 'Invalid phone number. Use +9627xxxxxxxx.' },
  },

  rider: {
    requestRide: { ar: 'طلب رحلة', en: 'Request ride' },
    searchingDrivers: { ar: 'نبحث عن كابتن قريب.', en: 'Looking for a nearby captain.' },
    driverOnWay: { ar: 'الكابتن في الطريق إليك.', en: 'Your captain is on the way.' },
    confirmArrival: { ar: 'تأكيد الوصول', en: 'Confirm arrival' },
    rateTrip: { ar: 'قيّم الرحلة', en: 'Rate trip' },
    noDrivers: { ar: 'لا يوجد كباتن قريبون حالياً.', en: 'No nearby captains right now.' },
  },

  driver: {
    goOnline: { ar: 'بدء استقبال الطلبات', en: 'Start receiving requests' },
    goOffline: { ar: 'إيقاف استقبال الطلبات', en: 'Stop receiving requests' },
    submitOffer: { ar: 'إرسال العرض', en: 'Submit offer' },
    offerSent: { ar: 'تم إرسال عرضك للراكب.', en: 'Your offer was sent to the rider.' },
    noBalance: { ar: 'لا يوجد رصيد كافٍ. يرجى شحن المحفظة.', en: 'Not enough balance. Please recharge your wallet.' },
  },

  ads: {
    adRiverTitle: { ar: 'إعلانات قريبة منك', en: 'Nearby ads' },
    campaignTitle: { ar: 'اسم الحملة', en: 'Campaign name' },
    description: { ar: 'وصف الإعلان', en: 'Ad description' },
    imageUrl: { ar: 'رابط الصورة', en: 'Image URL' },
    targetImpressions: { ar: 'عدد الظهور المطلوب', en: 'Target impressions' },
    currentImpressions: { ar: 'الظهور الحالي', en: 'Current impressions' },
    clicks: { ar: 'النقرات', en: 'Clicks' },
    startDate: { ar: 'تاريخ البداية', en: 'Start date' },
    endDate: { ar: 'تاريخ النهاية', en: 'End date' },
    saveAd: { ar: 'حفظ الإعلان', en: 'Save ad' },
    savedAds: { ar: 'الإعلانات المحفوظة', en: 'Saved ads' },
    emptyVault: { ar: 'لا توجد إعلانات محفوظة حالياً.', en: 'No saved ads yet.' },
    contactAdvertiser: { ar: 'تواصل مع المعلن', en: 'Contact advertiser' },
  },

  advertiser: {
    dashboardTitle: { ar: 'لوحة المعلن', en: 'Advertiser dashboard' },
    createCampaign: { ar: 'إنشاء حملة جديدة', en: 'Create new campaign' },
    chooseLocation: { ar: 'اختر المنطقة', en: 'Choose location' },
    choosePackage: { ar: 'اختر الباقة', en: 'Choose package' },
    estimatedCost: { ar: 'التكلفة المتوقعة', en: 'Estimated cost' },
    waitingApproval: { ar: 'بانتظار موافقة المشرف.', en: 'Waiting for admin approval.' },
    capacityFull: { ar: 'هذه المنطقة ممتلئة حالياً. جرّب منطقة قريبة.', en: 'This area is full right now. Try a nearby area.' },
  },

  admin: {
    dashboardTitle: { ar: 'لوحة المشرف', en: 'Admin dashboard' },
    reviewCampaigns: { ar: 'مراجعة الحملات', en: 'Review campaigns' },
    systemStatus: { ar: 'حالة النظام', en: 'System status' },
    reports: { ar: 'التقارير', en: 'Reports' },
    broadcast: { ar: 'إرسال تنبيه', en: 'Send broadcast' },
    killSwitch: { ar: 'إيقاف طارئ', en: 'Emergency stop' },
  },

  delegate: {
    dashboardTitle: { ar: 'لوحة المندوب', en: 'Delegate dashboard' },
    referralCode: { ar: 'كود الإحالة', en: 'Referral code' },
    magicLink: { ar: 'رابط دخول مؤقت', en: 'Temporary login link' },
    dailyTarget: { ar: 'الهدف اليومي', en: 'Daily target' },
    completedTasks: { ar: 'المهام المكتملة', en: 'Completed tasks' },
    pendingCommission: { ar: 'عمولة بانتظار التأكيد', en: 'Pending commission' },
    payableCommission: { ar: 'عمولة قابلة للسحب', en: 'Payable commission' },
  },

  wallet: {
    title: { ar: 'المحفظة', en: 'Wallet' },
    balance: { ar: 'الرصيد', en: 'Balance' },
    recharge: { ar: 'شحن الرصيد', en: 'Recharge' },
    pay: { ar: 'دفع', en: 'Pay' },
    paymentChannel: { ar: 'طريقة الدفع', en: 'Payment method' },
    paymentPending: { ar: 'تم إرسال طلب الدفع وينتظر التأكيد.', en: 'Payment request sent and waiting for confirmation.' },
  },

  errors: {
    generic: { ar: 'حدث خطأ. يرجى المحاولة مرة أخرى.', en: 'Something went wrong. Please try again.' },
    permissionDenied: { ar: 'ليس لديك صلاحية لتنفيذ هذه العملية.', en: 'You do not have permission to do this.' },
    network: { ar: 'تعذر الاتصال. تحقق من الإنترنت وحاول مرة أخرى.', en: 'Could not connect. Check your internet and try again.' },
    gpsDisabled: { ar: 'يرجى تفعيل الموقع لاستخدام هذه الميزة.', en: 'Please enable location to use this feature.' },
    activeTripLocked: { ar: 'لا يمكن تغيير الصفحة أثناء الرحلة الحالية.', en: 'You cannot change pages during the current trip.' },
  },
} as const;

export function text(value: LocalizedText, language: AppLanguage = 'ar') {
  return value[language] || value.ar;
}

export function direction(language: AppLanguage) {
  return language === 'ar' ? 'rtl' : 'ltr';
}

