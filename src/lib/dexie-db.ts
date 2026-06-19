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
}

class SovereignFavoritesDatabase extends Dexie {
  favoriteCaptains!: Table<FavoriteCaptain>;

  constructor() {
    super('SovereignFavoritesDatabase');
    this.version(1).stores({
      favoriteCaptains: '++id, tripId, captainPhone, captainName'
    });
  }
}

export const dexieDb = new SovereignFavoritesDatabase();

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

