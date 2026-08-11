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
  },

  /**
   * 3. بروتوكول المصافحة التصفوية الصامتة (Silent Handshake Verification Protocol)
   * يفصل ويقترن اقتراناً ضعيفاً لمنع تداخل شروط خصم الساعات الموضعية مع الواجهة
   */
  evaluateSilentHandshake: function(params: {
    isRadarActive: boolean;
    serverStatus: string;
    isOnline: boolean;
    clientNow: number;
    deviceNow: number;
  }): {
    isHandshakePassed: boolean;
    reason?: 'OFFLINE_SUSPENSION' | 'BROADCAST_DESYNC' | 'TIME_MANIPULATION_SUSPECTED';
  } {
    const { isRadarActive, serverStatus, isOnline, clientNow, deviceNow } = params;

    if (!isRadarActive) {
      return { isHandshakePassed: true };
    }

    // 1. شرط الاتصال المباشر بالمتصفح
    if (!isOnline) {
      return { isHandshakePassed: false, reason: 'OFFLINE_SUSPENSION' };
    }

    // 2. شرط مطابقة البث المركزي مع حالة رادار الهاتف المحلي
    const isServerRadarActive = serverStatus === 'active' || serverStatus === 'busy';
    if (!isServerRadarActive) {
      return { isHandshakePassed: false, reason: 'BROADCAST_DESYNC' };
    }

    // 3. شرط سلامة أمان الوقت ومطابقة الفرق الزمني التفاضلي
    const localTimeDeltaMs = clientNow - deviceNow;
    const isNetworkTimeSafe = Math.abs(localTimeDeltaMs) < 60000;
    if (!isNetworkTimeSafe) {
      return { isHandshakePassed: false, reason: 'TIME_MANIPULATION_SUSPECTED' };
    }

    return { isHandshakePassed: true };
  },

  validateDeviceTime: (networkTime: number, localTime: number): void => {
    const networkDelta = Math.abs(networkTime - localTime);
    if (networkDelta > 60000) { 
      throw new Error("SECURITY_ALERT: Device time manipulation detected. Kernel locked.");
    }
  },
  
  /**
   * صمام الأمان الجنائي لعوامة المسح (1.5 كم صارمة)
   * يرفض ويحجب أوتوماتيكياً أي عرض سعر قادم من سائق يتجاوز محيط العوامة المحدد للراكب
   */
  validateBuoyProximity: (riderLat: number, riderLon: number, driverLat: number, driverLon: number): boolean => {
    const R = 6371000; // نصف قطر الأرض بالمتر
    const dLat = (driverLat - riderLat) * Math.PI / 180;
    const dLon = (driverLon - riderLon) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(riderLat * Math.PI / 180) * Math.cos(driverLat * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceMeters = R * c;

    // قفل الحظر الصارم: 1500 متر حتمية (1.5 كم)
    if (distanceMeters > 1500) {
      throw new Error("SECURITY_ALERT: Driver proposal blocked. Outside the 1.5km sovereign perimeter.");
    }
    
    return true; 
  },

  /**
   * محرك الاستعلام من الحافة وإدارة الطوارئ الجغرافية
   */
  fetchSovereignRoute: async (
    osrmServerUrl: string, 
    originLngLat: [number, number], 
    destLngLat: [number, number]
  ): Promise<{ distanceKm: number; durationMins: number; isFallback: boolean }> => {
    const endpoint = `${osrmServerUrl}/route/v1/driving/${originLngLat[0]},${originLngLat[1]};${destLngLat[0]},${destLngLat[1]}?overview=false`;
    try {
      const response = await fetch(endpoint, { method: 'GET', headers: { 'Content-Type': 'application/json' }, cache: 'no-cache' });
      if (!response.ok) throw new Error('OSRM_NETWORK_REJECTED');
      const data = await response.json();
      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) throw new Error('ROUTE_NOT_FOUND');

      return {
        distanceKm: parseFloat((data.routes[0].distance / 1000).toFixed(2)),
        durationMins: Math.ceil(data.routes[0].duration / 60),
        isFallback: false
      };
    } catch (error) {
      // السقوط الآمن محلياً كلياً بدون إنترنت عند تعذر السيرفر (معامل الالتواء للأردن 1.3)
      const fallbackDistanceMeters = RadarAntiCheatKernel.calculateFallbackDistance(originLngLat[1], originLngLat[0], destLngLat[1], destLngLat[0]);
      return {
        distanceKm: parseFloat((fallbackDistanceMeters / 1000).toFixed(2)),
        durationMins: Math.ceil((fallbackDistanceMeters / 1000) * 1.5),
        isFallback: true
      };
    }
  },

  calculateFallbackDistance: (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1.3; 
  },

  /**
   * إدارة دورة حياة العوامة الصامتة للراكب وإنهاء الطلب تلقائياً عند انعدام الكباتن
   */
  evaluateBuoyLifeCycle: (elapsedSeconds: number): { scanLevel: number; shouldPurge: boolean; notifyNoCaptains: boolean } => {
    if (elapsedSeconds >= 180) {
      return { scanLevel: 2, shouldPurge: true, notifyNoCaptains: true };
    }
    const scanLevel = elapsedSeconds <= 15 ? 1 : 2;
    return { scanLevel, shouldPurge: false, notifyNoCaptains: false };
  },
  
  calculateOSRMFare: (baseFare: number, distanceKm: number, durationMins: number, tariffPerKm: number, tariffPerMin: number): number => {
    return Math.round((baseFare + (distanceKm * tariffPerKm) + (durationMins * tariffPerMin)) * 100) / 100;
  },
  
  enforceMarketBrakes: (proposedFare: number, standardFareTest: number): { status: 'NORMAL' | 'AMBER_WARNING' | 'CRIMSON_BLOCK' } => {
    const deviationPercent = ((standardFareTest - proposedFare) / standardFareTest) * 100;
    if (deviationPercent >= 15.0) return { status: 'CRIMSON_BLOCK' };
    if (deviationPercent >= 10.0) return { status: 'AMBER_WARNING' };
    return { status: 'NORMAL' };
  },

  enforceRiderFirewall: (rider: any) => {
    if (rider.consecutiveCancellations >= 3) {
      rider.behaviorSafetyScore -= 0.5;
      if (rider.behaviorSafetyScore < 4.2) {
        rider.isPurged = true;
        throw new Error("KERNEL_PURGE: Account terminated due to malicious behavior.");
      }
    }
  }
};

// تجميد النواة بالكامل لإنفاذ الحصانة التشغيلية
Object.freeze(RadarAntiCheatKernel);

