// [SCR-COMMUTE-PROTO-155] محرك الارتحال اللحظي والذوبان في صالة مزاد اللواء الجديد
// محصن ومغلق تقنياً - يعمل بالكامل عند الحافة (Edge-Runtime) بصفر كلفة سحابية

import { getDistrictFromCoords, latLngToH3Cell } from '@/core/logic/geospatial-kernel';

export interface SovereignCaptainMovement {
  captainId: string;
  homeDistrict: string;     // وتد التسجيل الثابت (للإحصاء والإعلانات الموجهة)
  currentH3Cell: string;    // الخلية السداسية الحالية المقروءة من الـ GPS محلياً
  currentDistrict: string;  // اللواء الحالي الذي ارتحل إليه الناقل
  isVehicleOccupied: boolean; // شرط عدم انشغال المركبة (الحالة التشغيلية)
  isRadarActive: boolean;   // شرط تفعيل قمرة العمليات وسريان باقة الساعات
  localPaidRemaining: number; // الساعات المتبقية المدفوعة محلياً
  localBonusRemaining: number; // ساعات البونص المتبقية محلياً
  storedHash?: string;       // الختم الرقمي المجزأ المخزن بالمتصفح
}

// محاكاة محرك H3 المحلي عالي السرعة Resolution 9 بصفر كلفة سحابية
export const geoEngine = {
  latLngToCell: (lat: number, lng: number, res: number): string => {
    if (!lat || !lng) return latLngToH3Cell(31.9539, 35.9106, res);
    // توليد خلية سداسية سحرية مشفرة بأسرة التشفير التقني
    return latLngToH3Cell(lat, lng, res);
  },
  getDistrictFromCell: (cell: string, lat?: number, lng?: number): string => {
    if (lat !== undefined && lng !== undefined) {
      const res = getDistrictFromCoords(lat, lng);
      return res.district || 'وادي السير';
    }
    return 'وادي السير';
  }
};

export const RadarSovereignCommuteKernel = {
  
  /**
   * توليد البصمة الماستر لقفل الهيكل المانع للتزوير الكاشي
   */
  generateStateHash: function(captainId: string, paid: number, bonus: number): string {
    const salt = "sovereign_radar_lock_salt_SC-278";
    const raw = `${captainId}:${paid}:${bonus}:${salt}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `SHAKE_V55_${Math.abs(hash).toString(16).toUpperCase()}`;
  },

  /**
   * دالة الفحص والذوبان اللحظي: تُستدعى آلياً فور تغير موقع الكابتن أو إنهاء رحلته
   * @param captain الحالة التشغيلية الحالية للكابتن
   * @param engine مكتبة H3 المحلية لتحويل الإحداثيات دون سيرفر
   * @param currentLatLng الإحداثيات اللحظية لهاتف السائق
   */
  syncLocationAndFetchTrips: function(
    captain: SovereignCaptainMovement,
    engine: { latLngToCell: (lat: number, lng: number, res: number) => string, getDistrictFromCell: (cell: string, lat?: number, lng?: number) => string },
    currentLatLng: { lat: number; lng: number }
  ): { allowedToSeeLocalTrips: boolean; activeDistrictPool: string; nextH3Cell: string; isDisconnectionLockActive: boolean } {
    
    // 1. فحص قفل المصافحة الجداري لشحنة الساعات (صمام منع التصفير والتلاعب)
    const computedHash = this.generateStateHash(captain.captainId, captain.localPaidRemaining, captain.localBonusRemaining);
    const isLockViolated = captain.storedHash ? (captain.storedHash !== computedHash) : false;

    // إذا تم تفعيل قمرة الاستقبال وهناك تلاعب كاشي بالرصيد، يتم الإغلاق الجبائي الفوري للمزاد عليه ومطالبته بالمصافحة الآمنة
    if (isLockViolated && captain.isRadarActive) {
      console.warn(`🚨 انتهاك قفل المصافحة: تم تجميد صالات المزاد للناقل [${captain.captainId}] لعدم مطابقة بصمة الرصيد.`);
      return {
        allowedToSeeLocalTrips: false,
        activeDistrictPool: captain.currentDistrict,
        nextH3Cell: captain.currentH3Cell || latLngToH3Cell(31.9539, 35.9106, 9),
        isDisconnectionLockActive: true
      };
    }

    // 2. شرط صمام الأمان: إذا كانت المركبة مشغولة برحلة حالية، يُحظر بث طلبات صالة المزاد له
    if (captain.isVehicleOccupied || !captain.isRadarActive) {
      return { 
        allowedToSeeLocalTrips: false, 
        activeDistrictPool: captain.currentDistrict,
        nextH3Cell: captain.currentH3Cell || latLngToH3Cell(31.9539, 35.9106, 9),
        isDisconnectionLockActive: false
      };
    }

    // 3. معالجة الحافة (المادة 1): تحويل الإحداثيات لخلية H3 محلياً وفورياً بصفر كلفة
    const newCell = engine.latLngToCell(currentLatLng.lat, currentLatLng.lng, 9); // Resolution 9 الحاد
    const newDistrict = engine.getDistrictFromCell(newCell, currentLatLng.lat, currentLatLng.lng);

    // 4. بروتوكول الذوبان: إذا ارتحل الكابتن إلى لواء جديد، يتم نقله برمجياً لصالة ركاب اللواء الجديد
    let updatedDistrict = captain.currentDistrict;
    if (captain.currentDistrict !== newDistrict) {
      console.log(`📡 نبض الارتحال: الكابتن حر وطليق. تم نقله من لواء [${captain.currentDistrict}] إلى صالة ركاب [${newDistrict}].`);
      updatedDistrict = newDistrict;
    }

    // السماح الفوري برؤية طلبات المنطقة الحالية ودخول المزاد
    return {
      allowedToSeeLocalTrips: true,
      activeDistrictPool: updatedDistrict, // يغذي الواجهة بطلبات اللواء الجديد فوراً
      nextH3Cell: newCell,
      isDisconnectionLockActive: false
    };
  }
};

// تجميد النواة البرمجية لمنع التلاعب الجنائي في الميدان
Object.freeze(geoEngine);
Object.freeze(RadarSovereignCommuteKernel);
