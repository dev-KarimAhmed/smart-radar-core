// src/core/RadarAntiCheatKernel.ts
// إنفاذ التجميد الدستوري وتثبيت قفل مسح العوامة الصامتة وحظر التلاعب (V2.6-Secured)

export const RadarAntiCheatKernel = Object.freeze({
  
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
});

Object.freeze(RadarAntiCheatKernel);
