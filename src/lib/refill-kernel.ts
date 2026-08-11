// [SCR-GEO-REFILL-158] محرك الشحن الرقمي اللامركزي الموجه حسب اللواء الجغرافي
// محصن ومغلق تقنياً - يعمل بالكامل بصفر كلفة سحابية وصفر تدخل للمندوبين

export interface CaptainGeoWallet {
  captainId: string;
  homeDistrict: string;     // وتد اللواء الحاكم للشحن (مثل: ناعور، عمان، اربد)
  paidMinutesRemaining: number;
  bonusMinutesRemaining: number;
  captainRank: 'PLATINUM' | 'GOLD' | 'BRONZE';
}

export interface GeoPaymentGateway {
  districtName: string;
  localWalletMerchantId: string; // رقم المحفظة الإلكترونية المخصصة للواء
}

export const RadarGeoRefillKernel = {
  
  // مصفوفة مكافآت الرتب الحاكمة المقفلة تقنياً لمنع الاجتهاد
  RANK_BONUS_FACTORS: Object.freeze({
    PLATINUM: 1.25, // بونص +25% ساعات حرة
    GOLD: 1.15,     // بونص +15% ساعات حرة
    BRONZE: 1.00    // صفر بونص لحارقي الأسعار
  }),

  /**
   * دالة معالجة نبضة الشحن الرقمية الموجهة جغرافياً
   * @param wallet محفظة الساعات الحالية للكابتن عند الحافة
   * @param amountPaid المبلغ المدفوع بالدينار الأردني (1 أو 10 دنانير)
   * @param gatewayNode كائن بوابة الدفع الموجهة محلياً للواء السائق
   */
  executeSovereignRefillByDistrict: function(
    wallet: CaptainGeoWallet,
    amountPaid: number,
    gatewayNode: GeoPaymentGateway
  ): { success: boolean; updatedWallet: CaptainGeoWallet; logMessage: string } {
    
    // 1. صمام الأمان: التحقق الجغرافي من تطابق وتد اللواء مع بوابة الدفع لضمان منع تلوث الأموال
    if (wallet.homeDistrict !== gatewayNode.districtName) {
      return { 
        success: false, 
        updatedWallet: wallet, 
        logMessage: "🚫 خطأ جنائي: محاولة شحن عبر بوابة لواء مغاير لوتد التسجيل." 
      };
    }

    // 2. احتساب الساعات الأساسية بناءً على القيمة المعتدلة المقرة تقنياً
    let baseMinutesToAdd = 0;
    if (amountPaid === 1) baseMinutesToAdd = 24 * 60;   // باقة الـ 24 ساعة صافية
    if (amountPaid === 10) baseMinutesToAdd = 100 * 60; // باقة الـ 100 ساعة صافية

    if (baseMinutesToAdd === 0) {
      return { 
        success: false, 
        updatedWallet: wallet, 
        logMessage: "🚫 خطأ في المدخلات: قيمة الشحن غير مطابقة للباقات المعتمدة." 
      };
    }

    // 3. احتساب ساعات البونص المستحقة بناءً على رتبة السائق دون المساس بالإيراد النقدي
    const bonusFactor = this.RANK_BONUS_FACTORS[wallet.captainRank];
    const totalMinutesWithBonus = baseMinutesToAdd * bonusFactor;
    const bonusMinutesToAdd = totalMinutesWithBonus - baseMinutesToAdd;

    // 4. حقن الساعات في محفظة الحافة وتحديث البيانات بنبضة واحدة
    const updatedWallet = { ...wallet };
    updatedWallet.paidMinutesRemaining += baseMinutesToAdd;
    updatedWallet.bonusMinutesRemaining += bonusMinutesToAdd;

    return {
      success: true,
      updatedWallet,
      logMessage: `✅ شحن ناجح! لواء [${wallet.homeDistrict}]: تم إضافة ${baseMinutesToAdd / 60} ساعة مدفوعة و ${bonusMinutesToAdd / 60} ساعة بونص رتبة لنواة الكابتن.`
    };
  }
};

// تجميد النواة البرمجية للشحن لمنع أي اختراق أو تلاعب في الـ Runtime
Object.freeze(RadarGeoRefillKernel);
Object.freeze(RadarGeoRefillKernel.RANK_BONUS_FACTORS);
