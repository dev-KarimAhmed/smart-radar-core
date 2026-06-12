import { SovereignTimeCounter, RiderRequestThrottle } from '../types/sovereign-kernel';

export const RadarAntiCheatKernel = {
  
  /**
   * 1. علاج ثغرة الوقت: كشف ومنع التلاعب بساعة الهاتف يدوياً
   * @param wallet عداد الوقت الحالي للسائق
   * @param clientNow التوقيت الحالي لهاتف السائق أثناء النبضة
   */
  validateTimeIntegrity: function(
    wallet: SovereignTimeCounter, 
    clientNow: number
  ): { isTimeTampered: boolean; correctedNow: number } {
    
    // احتساب الوقت الفعلي بناءً على ميزان الوقت المقفل وليس ساعة الهاتف المتغيرة
    const expectedServerTime = clientNow + wallet.localTimeDeltaMs;
    
    // الفحص الجنائي: إذا تبين أن التوقيت الحالي أقل من آخر توقيت موثق ومسجل، فهناك تلاعب حتمي
    if (expectedServerTime < wallet.lastServerSyncedTimestamp) {
      console.warn("🚫 [صعق جنائي]: تم رصد تلاعب يدوي بساعة الهاتف لتجميد استهلاك الباقة!");
      return { isTimeTampered: true, correctedNow: wallet.lastServerSyncedTimestamp };
    }

    return { isTimeTampered: false, correctedNow: expectedServerTime };
  },

  /**
   * 2. علاج ثغرة الإغراق: كبح طلبات الركاب الزائفة وحماية صالة المزاد
   * @param rider ملف التحكم السلوكي للراكب عند الحافة
   */
  throttleRiderFloodAttack: function(rider: RiderRequestThrottle): { allowRequest: boolean; updatedRider: RiderRequestThrottle } {
    
    // صمام أمان 1: يُمنع الراكب من بث أكثر من طلب واحد نشط في نفس اللحظة منعاً للإغراق
    if (rider.activeRequestsCount >= 1) {
      console.warn("⚠️ حظر نسيجي: لا يمكن بث طلب جديد وهناك رحلة معلقة في صالة المزاد.");
      return { allowRequest: false, updatedRider: rider };
    }

    // صمام أمان 2: كبح الإلغاء المتتالي (مؤشر الهجوم الزائف)
    if (rider.consecutiveCancellations >= 3) {
      rider.trustRating = Math.max(4.0, rider.trustRating - 0.5); // خصم فوري وحاد من المناعة
      console.warn(`⚠️ عقوبة سلوكية: إلغاء متكرر. هبوط رصيد ثقة الراكب إلى ${rider.trustRating}`);
      
      if (rider.trustRating <= 4.2) {
        console.warn("🚫 [تطهير تلقائي]: تم إسقاط حساب الراكب لإغراقه الميدان بطلب وهمي.");
        return { allowRequest: false, updatedRider: rider };
      }
    }

    return { allowRequest: true, updatedRider: rider };
  }
};

// تجميد النواة بالكامل لإنفاذ الحصانة التشغيلية
Object.freeze(RadarAntiCheatKernel);
