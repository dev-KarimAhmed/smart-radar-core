// [SCR-PROTO-087] محرك مؤشر التوازن ورتب الميدان المحصن
export interface PackagedSovereignBundle {
  basePrice: number;   // السعر الأساسي (يجب أن يكون >= 1 دينار)
  perKmPrice: number;  // سعر الكيلومتر الإضافي
  perMinPrice: number; // سعر الدقيقة
}

export interface GlobalPulseDoc {
  market_base_avg: number;
  market_km_avg: number;
  market_min_avg: number;
  last_updated: number;
}

export const RadarBundleIntegrityKernel = {
  // الثوابت الحاكمة المقفلة دستورياً
  VIRTUAL_METRICS: Object.freeze({
    TEST_KM: 5,            // المسافة المعيارية للفحص الجنائي
    TEST_MIN: 10,          // الوقت المعياري للفحص الجنائي
    WARN_THRESHOLD: 0.10,  // عتبة التحذير وخفض الرتبة (10%)
    BLOCK_THRESHOLD: 0.15, // عتبة الحظر والمنع المطلق (15%)
  }),

  /**
   * دالة الفحص الجراحي لتوزيع أرقام الحزمة ومنع التلاعب بالحزم
   * @param driverBundle كائن الحزمة المدخلة من السائق
   * @param pulseDoc وثيقة النبض العام المستدعاة مرة واحدة لكل لواء
   */
  validateBundleIntegrity: function(
    driverBundle: PackagedSovereignBundle, 
    pulseDoc: GlobalPulseDoc
  ): {
    status: 'SUCCESS_SOVEREIGN' | 'APPROVED_WITH_WARNING' | 'REJECTED';
    alertType: 'NONE' | 'WARN' | 'BLOCK';
    message: string;
    assignedRankEffect?: string;
    isDumpingTriggered: boolean;
  } {
    // 1. منع النبض الزائف الأولي (القيم الصفرية) تماشياً مع المادة (10) من الدستور الرئيسي
    if (driverBundle.basePrice < 1.0 || driverBundle.perKmPrice <= 0 || driverBundle.perMinPrice <= 0) {
      return {
        status: 'REJECTED',
        alertType: 'BLOCK',
        message: '🚫 خطأ في المداخلات: القيمة غير منطقية تشغيلياً. الرادار الذكي لا يقبل نبضاً يهدد استدامة الميدان. يرجى مراجعة قيم التسعير.',
        isDumpingTriggered: true
      };
    }

    // 2. حساب الرحلة الافتراضية المعيارية بناءً على المؤشر الحيوي الصامت للسوق (Price_ref)
    const marketRefPrice = 
      pulseDoc.market_base_avg + 
      (pulseDoc.market_km_avg * this.VIRTUAL_METRICS.TEST_KM) + 
      (pulseDoc.market_min_avg * this.VIRTUAL_METRICS.TEST_MIN);

    // 3. حساب حزمة السائق المدخلة تحت نفس ظروف الفحص الجنائي (Fare_test)
    const driverFareTest = 
      driverBundle.basePrice + 
      (driverBundle.perKmPrice * this.VIRTUAL_METRICS.TEST_KM) + 
      (driverBundle.perMinPrice * this.VIRTUAL_METRICS.TEST_MIN);

    // 4. احتساب نسبة الانحراف السعري الإجمالية لمعرفة الشذوذ
    const deviationRatio = (marketRefPrice - driverFareTest) / marketRefPrice;

    // 5. مصفوفة كوابح السوق والردع الصامت بناءً على النسبة الإجمالية للحزمة
    if (deviationRatio >= this.VIRTUAL_METRICS.BLOCK_THRESHOLD) {
      // منطقة الحظر الصارم (تجاوز الـ 15% هبوطاً)
      return {
        status: 'REJECTED',
        alertType: 'BLOCK',
        message: '🚫 خطأ في المداخلات: القيمة غير منطقية تشغيلياً. الرادار الذكي لا يقبل نبضاً يهدد استدامة الميدان. يرجى مراجعة قيم التسعير.',
        isDumpingTriggered: true
      };
    } 
    
    if (deviationRatio >= this.VIRTUAL_METRICS.WARN_THRESHOLD) {
      // منطقة التحذير الشديد وخفض الرتبة (بين 10% و 14.9%)
      return {
        status: 'APPROVED_WITH_WARNING',
        alertType: 'WARN',
        message: '⚠️ تنبيه سيادي: سعرك الحالي يبتعد عن استقرار السوق. هذا النبض قد يؤثر سلباً على "تقييم الوسيط" ورتبتك في الرادار، مما يقلل من ظهورك للركاب.',
        assignedRankEffect: 'Silver_or_Bronze',
        isDumpingTriggered: true
      };
    }

    // الحزمة سليمة وموزعة بعدالة، تمنح استحقاق بلاتيني أو ذهبي حسب تقييم السائق السلوكي
    return {
      status: 'SUCCESS_SOVEREIGN',
      alertType: 'NONE',
      message: '✅ النبض السعري متزن ومتوافق مع ميزان استقرار السوق.',
      assignedRankEffect: 'Maintain_High_Rank',
      isDumpingTriggered: false
    };
  }
};

// AdSovereignPass Interface [SCR-AD-INTEGRITY-112]
export interface AdSovereignPass {
  adId: string;
  targetScale: 'Governorate' | 'District';
  targetLocationName: string;
  adType: 'RIDER_BENEFIT' | 'CAPTAIN_PROFESSIONAL'; // إعلانات منفعة للراكب أو مهنية للسائق
  bannerUrl: string;
}

// [SCR-AD-INTEGRITY-112] المحرك النسيجي لربط شذوذ الأسعار ببطاقات المعلنين
// محصن ومغلق دستورياً - يعمل بالكامل عند حافة الشبكة لضمان صفر كلفة
export const RadarSovereignIntegrationKernel = {
  /**
   * دالة المزاوجة الذكية: تطلق الإعلان المناسب فوراً بناءً على مخرجات كوابح السوق وحرق الأسعار
   * @param deviationRatio نسبة انحراف حزمة السائق المحتسبة معيارياً (Fare_test)
   * @param userProfile ملف المستخدم الحالي في الميدان
   * @param activeAds مصفوفة الإعلانات المحملة محلياً في الذاكرة الحافة IndexedDB
   */
  triggerContextualAdStream: function(
    deviationRatio: number, 
    userProfile: { role: 'rider' | 'captain'; district: string; governorate: string; },
    activeAds: AdSovereignPass[]
  ): AdSovereignPass | null {
    
    // 1. تصفية الإعلانات جغرافياً أولاً حسب لواء ومحافظة المستخدم الحالي لمنع الهدر
    const localAds = activeAds.filter(ad => 
      ad.targetLocationName === userProfile.district || ad.targetLocationName === userProfile.governorate
    );

    // 2. تطبيق المادة (3) والمادة (4) من دستور كوابح السوق لتوجيه الإعلان
    if (deviationRatio >= 0.15) {
      // السائق مجمّد بسبب تجاوز عتبة الـ 15% -> يتم بث إعلان مهني موجه له فوراً في قمرة العمليات
      if (userProfile.role === 'captain') {
        const found = localAds.find(ad => ad.adType === 'CAPTAIN_PROFESSIONAL');
        if (found) return found;
      }
    } 
    
    if (deviationRatio >= 0.10) {
      // السائق في منطقة حرق الأسعار (10%) -> الراكب يرى وسم "السعر المحروق"، وبالموازاة يظهر له إعلان "المنفعة والمكافآت" لتهدئته وجذبه للمعلن
      if (userProfile.role === 'rider') {
        const found = localAds.find(ad => ad.adType === 'RIDER_BENEFIT');
        if (found) return found;
      }
    }

    // في حال استقرار النبض السعري تماماً، يتم تدوير الإعلانات المحلية العادية كل 5 ثوانٍ بانتظام
    return localAds[Math.floor(Math.random() * localAds.length)] || null;
  }
};

// قفل الكائن برمجياً لمنع التلاعب الجنائي بالقيم داخل المتصفح (Runtime Freeze)
try {
  Object.freeze(RadarBundleIntegrityKernel);
  Object.freeze(RadarSovereignIntegrationKernel);
} catch (e) {
  console.warn("Failed to freeze SovereignMarketKernel structures, fallback applied:", e);
}
