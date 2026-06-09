// [SCR-PROTO-087] محرك مؤشر التوازن ورتب الميدان المحصن
export interface DriverOfferInput {
  driverId: string;
  basePrice: number;
  perKmPrice: number;
  perMinPrice: number;
  currentRating: number;
}

export const SovereignMarketKernel = {
  // 1. المؤشر الحيوي الصامت لأسعار السوق
  GHOST_REFERENCE: Object.freeze({
    B_ref: 1.00,  // متوسط فتح العداد في الأردن/العراق (دينار)
    K_ref: 0.25,  // متوسط سعر الكيلومتر
    T_ref: 0.05,  // متوسط سعر الدقيقة
    SAFE_CORRIDOR_FACTOR: 0.70 // حظر الهبوط عن 70% من سعر السوق المرجعي (كبح الأسعار)
  }),

  // 2. خوارزمية فحص الشذوذ السعري وحماية الميدان من الحرق
  evaluateSovereignRank: function(
    currentRating: number,
    driverActualPrice: number,
    distance: number,
    duration: number
  ): {
    isDumping: boolean;
    assignedRank: 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
    displayTarget: 'basic_9' | 'reserve_3' | 'hidden';
  } {
    // حساب السعر المرجعي الصامت للرحلة
    const marketRefPrice = 
      this.GHOST_REFERENCE.B_ref + 
      (this.GHOST_REFERENCE.K_ref * distance) + 
      (this.GHOST_REFERENCE.T_ref * duration);

    // منع النبض الزائف (القيم الصفرية)
    if (driverActualPrice <= 0) {
      return { isDumping: true, assignedRank: 'Bronze', displayTarget: 'hidden' };
    }

    // احتساب نسبة الانحراف السعري للتسعيرة الحالية للناقل بضرب الـ Haversine
    const deviationRatio = marketRefPrice ? (marketRefPrice - driverActualPrice) / marketRefPrice : 0;

    // تفعيل فحص حرق الأسعار (Dumping Trigger) عند تجاوز عتبة الـ 10% المعتمدة في الباب الثاني
    const isDumping = deviationRatio >= 0.10 || driverActualPrice < (marketRefPrice * this.GHOST_REFERENCE.SAFE_CORRIDOR_FACTOR);

    // احتساب الرتبة السيادية بناءً على دمج التقييم وحالة السعر تماشياً مع الباب الثاني (Captain Rank Matrix)
    let assignedRank: 'Platinum' | 'Gold' | 'Silver' | 'Bronze' = 'Bronze';
    let displayTarget: 'basic_9' | 'reserve_3' | 'hidden' = 'reserve_3';

    if (currentRating < 4.2) {
      // صمام الأمان (حظر تلقائي سيادي بموجب بروتوكول 30)
      return { isDumping: true, assignedRank: 'Bronze', displayTarget: 'hidden' };
    }

    if (currentRating >= 4.9 && !isDumping) {
      // 💎 رتبة البلاتيني (Platinum Matrix)
      assignedRank = 'Platinum';
      displayTarget = 'basic_9';
    } else if (currentRating >= 4.7 && currentRating < 4.9 && !isDumping) {
      // 🥇 رتبة الذهبي (Gold Matrix)
      assignedRank = 'Gold';
      displayTarget = 'basic_9';
    } else if ((currentRating >= 4.4 && currentRating < 4.7) || (currentRating >= 4.4 && isDumping)) {
      // 🥈 رتبة الفضي (Silver Matrix): تقييم من 4.4 إلى 4.69 أو ممارسة انحراف متقطع بنسبة 10%
      assignedRank = 'Silver';
      displayTarget = 'reserve_3';
    } else {
      // 🥉 رتبة البرونزي (Bronze Matrix): تقييم من 4.2 إلى 4.33 أو ممارسة حرق مستمر
      assignedRank = 'Bronze';
      displayTarget = 'reserve_3';
    }

    return { isDumping, assignedRank, displayTarget };
  }
};

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

// قفل الكائن برمجياً لمنع التلاعب الجنائي بالقيم داخل المتصفح (Runtime Freeze)
try {
  Object.freeze(SovereignMarketKernel);
  Object.freeze(RadarBundleIntegrityKernel);
} catch (e) {
  console.warn("Failed to freeze SovereignMarketKernel structures, fallback applied:", e);
}
