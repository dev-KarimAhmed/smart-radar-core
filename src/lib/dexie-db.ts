import Dexie, { type Table } from 'dexie';

export interface FavoriteCaptain {
  id?: number;
  tripId: string;
  captainName: string;
  captainRank: 'PLATINUM' | 'GOLD' | 'BRONZE';
  captainPhone: string;
  vehicleInfo: string;
  finalPrice: number;
  timestamp: number;
  heartedAt: number;
  captainType?: 'uber' | 'careem' | 'independent';
}

export interface CaptainSovereignLog {
  id?: number;
  captainId: string;
  type: 'status_change' | 'system_action' | 'district_exit';
  event: string;
  details: string;
  timestamp: number;
  timeString: string;
}

export interface RiderTripLedgerEntry {
  id?: number;
  tripId: string;
  captainName: string;
  captainRank: 'PLATINUM' | 'GOLD' | 'BRONZE';
  captainPhone: string;
  vehicleInfo: string;
  finalPrice: number;
  timestamp: number;
  purgeAt: number;
}

class SovereignFavoritesDatabase extends Dexie {
  favoriteCaptains!: Table<FavoriteCaptain>;
  captainSovereignLogs!: Table<CaptainSovereignLog>;
  riderTripLedger!: Table<RiderTripLedgerEntry>;

  constructor() {
    super('SovereignFavoritesDatabase');
    this.version(1).stores({
      favoriteCaptains: '++id, tripId, captainPhone, captainName'
    });
    this.version(2).stores({
      favoriteCaptains: '++id, tripId, captainPhone, captainName',
      captainSovereignLogs: '++id, captainId, type, timestamp, event'
    });
    this.version(3).stores({
      favoriteCaptains: '++id, tripId, captainPhone, captainName',
      captainSovereignLogs: '++id, captainId, type, timestamp, event',
      riderTripLedger: '++id, &tripId, timestamp, purgeAt, captainPhone'
    });
  }
}

export const dexieDb = new SovereignFavoritesDatabase();

export const addCaptainSovereignLog = async (
  captainId: string,
  type: 'status_change' | 'system_action' | 'district_exit',
  event: string,
  details: string
) => {
  try {
    const timestamp = Date.now();
    const timeString = new Date(timestamp).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + new Date(timestamp).toLocaleDateString('ar-JO');
    await dexieDb.captainSovereignLogs.add({
      captainId,
      type,
      event,
      details,
      timestamp,
      timeString
    });
    console.log(`🛡️ [Sovereign Log]: Recorded event [${event}] of type [${type}] successfully.`);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sovereign-log-added', { detail: { captainId, type, event } }));
    }
  } catch (err) {
    console.error("Failed to add sovereign log:", err);
  }
};

// [SCR-FAVORITE-PROTO-142] محرك تفضيل الكباتن وحماية المفقودات عند الحافة
// يعمل بالكامل في المتصفح (IndexedDB / LocalStorage) بصفر كلفة سحابية

export interface CaptainCardNode {
  captainId: string;
  fullName: string;
  phoneNumber: string;
  captainType: 'uber' | 'careem' | 'independent';
  vehicleSpecs: string;
  savedTimestamp: number;
}

export const RadarCaptainFavoriteKernel = {
  /**
   * بروتوكول المصادقة والتخليد: ينقذ الناقل المفضل من التطهير التلقائي بعد 3 د أيام
   * @param expiredTrip الكائن التشغيلي للرحلة التي حان وقت حذفها (72 ساعة)
   * @param isHeartChecked هل قام الراكب بنقر القلب الأخضر لتخليد الكابتن؟
   */
  mummifyTrustedCaptain: function(expiredTrip: any, isHeartChecked: boolean): void {
    if (!isHeartChecked) {
      console.log("🕒 بروتوكول التطهير: لم يتم تفعيل التفضيل، إبادة سجل الرحلة والبيانات نهائياً.");
      return; // يُمحى تلقائياً لحفظ المساحة
    }

    const sanitizeText = (str: string | null | undefined): string => {
      if (!str) return '';
      return str.replace(/<[^>]*>/g, '');
    };

    try {
      // تفعيل التفضيل -> نقل كارت الناقل فوراً لخزنة الهاتف المستقرة
      const favoriteKey = `radar_preferred_captain_${expiredTrip.captainId || expiredTrip.tripId}`;
      const captainData: CaptainCardNode = {
        captainId: expiredTrip.captainId || expiredTrip.tripId,
        fullName: sanitizeText(expiredTrip.captainName),
        phoneNumber: expiredTrip.captainPhone,
        captainType: expiredTrip.captainType || 'independent',
        vehicleSpecs: sanitizeText(expiredTrip.vehicleInfo),
        savedTimestamp: Date.now()
      };

      localStorage.setItem(favoriteKey, JSON.stringify(captainData));
      console.log("💚 التعديل العظيم: تم إنقاذ الكابتن وتخليده وتطهيره في هاتف الراكب لحماية المفقودات والاتصال الدائم.");
    } catch (err) {
      console.error("⚠️ فشل في تخزين الكابتن محلياً (تجاوز حصة التخزين المحلي أو وضع التصفح الخفي نشط):", err);
    }
  }
};

Object.freeze(RadarCaptainFavoriteKernel);

