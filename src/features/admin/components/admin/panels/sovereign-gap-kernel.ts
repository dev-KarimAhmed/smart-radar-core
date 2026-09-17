export interface CaptainSovereignState {
  captainId: string;
  homeDistrict: string;
  currentDistrict: string;
  walletHours: number;
  isBanned: boolean;
}

export const RadarGapLockdownKernel = {
  /**
   * 1. معالجة الارتحال الجغرافي: تحديث المنطقة الإحصائي تلقائياً عند الحافة
   */
  handleDistrictCommute: function(
    currentState: CaptainSovereignState,
    newDistrictFromH3: string
  ): CaptainSovereignState {
    if (currentState.currentDistrict !== newDistrictFromH3) {
      currentState.currentDistrict = newDistrictFromH3;
    }
    return currentState;
  },

  /**
   * 2. آلية الشحن الميداني (أكواد الشحن المشفرة للمندوبين)
   */
  redeemVoucherHours: function(
    currentWallet: { paidHours: number },
    voucherCode: string,
    secureServerKey: string
  ): { success: boolean; hoursAdded: number } {
    // [BANNED-CLIENT-SIDE] منطق التحقق مرحّل كلياً للسيرفر الخلفي الآمن لمنع إضافة الساعات
    throw new Error("يُحظر التحقق من بطاقات الشحن من جهة العميل. منطق التحقق مرحّل كلياً للسيرفر الخلفي الآمن.");
  },

  /**
   * 3. الصندوق الأسود للمشرف: الحذف القاطع وقطع صلاحيات طيران الحسابات
   */
  enforceAdminBlackBoxAction: function(
    captain: CaptainSovereignState,
    action: 'WARN' | 'BAN'
  ): CaptainSovereignState {
    if (action === 'BAN') {
      captain.isBanned = true;
      captain.walletHours = 0;
    }
    return captain;
  }
};

Object.freeze(RadarGapLockdownKernel);
