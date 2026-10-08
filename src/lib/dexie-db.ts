import Dexie, { type Table } from 'dexie';

export interface FavoriteCaptain {
  id?: number;
  tripId: string;
  captainId?: string;
  captainName: string;
  captainRank: 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE';
  captainPhone: string;
  vehicleInfo: string;
  finalPrice: number;
  timestamp: number;
  heartedAt: number;
  captainType?: 'uber' | 'careem' | 'independent';
}

/**
 * Offline cache of the rider's favourites, keyed by CAPTAIN.
 *
 * `favoriteCaptains` above is keyed by tripId, which made a favourite mean "I tapped a heart
 * on this one receipt" — the same captain read as favourited on one trip and not on the next.
 * public.rider_favorite_captains is now the source of truth and is keyed by the pair; this
 * table is only its local mirror, so a rider offline still sees the right hearts.
 *
 * `favoriteCaptains` is deliberately still declared: it holds real favourites that never
 * reached the server, and pushFavoritesFromLegacyCache() migrates them before they are
 * ignored.
 */
export interface FavoriteCaptainId {
  captainId: string;
  heartedAt: number;
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
  captainId?: string;
  captainName: string;
  captainRank: 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE';
  captainPhone: string;
  vehicleInfo: string;
  finalPrice: number;
  timestamp: number;
  purgeAt: number;
  destinationAddressAr?: string;
  pickupAddressAr?: string;
  distanceKm?: number;
  durationMinutes?: number;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  rating?: number;
}

export interface CaptainLedgerEntry {
  id?: number;
  requestId: string;
  captainId: string;
  riderId?: string;
  destination: string;
  pickup?: string;
  finalFare: number;
  completedAt: number;
  purgeAt: number;
  paidMinutesRemaining?: number;
  bonusMinutesRemaining?: number;
}

class SovereignFavoritesDatabase extends Dexie {
  favoriteCaptains!: Table<FavoriteCaptain>;
  favoriteCaptainIds!: Table<FavoriteCaptainId>;
  captainSovereignLogs!: Table<CaptainSovereignLog>;
  riderTripLedger!: Table<RiderTripLedgerEntry>;
  captainLedger!: Table<CaptainLedgerEntry>;

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
    this.version(4).stores({
      favoriteCaptains: '++id, tripId, captainPhone, captainName',
      captainSovereignLogs: '++id, captainId, type, timestamp, event',
      riderTripLedger: '++id, &tripId, timestamp, purgeAt, captainPhone',
      captainLedger: '++id, &requestId, captainId, completedAt, purgeAt'
    });
    // captainId is the primary key, so a captain can appear at most once — the per-trip
    // table above allowed the same captain many times over, which is why local and server
    // counts never matched.
    this.version(5).stores({
      favoriteCaptains: '++id, tripId, captainPhone, captainName',
      captainSovereignLogs: '++id, captainId, type, timestamp, event',
      riderTripLedger: '++id, &tripId, timestamp, purgeAt, captainPhone',
      captainLedger: '++id, &requestId, captainId, completedAt, purgeAt',
      favoriteCaptainIds: 'captainId, heartedAt'
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
      if (expiredTrip?.tripId) {
        void dexieDb.riderTripLedger.where('tripId').equals(expiredTrip.tripId).delete();
      }
      void dexieDb.riderTripLedger.where('purgeAt').belowOrEqual(Date.now()).delete();
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

export async function purgeExpiredRiderTrips(): Promise<number> {
  try {
    return await dexieDb.riderTripLedger.where('purgeAt').belowOrEqual(Date.now()).delete();
  } catch (err) {
    console.error("Failed to purge expired trips from Dexie:", err);
    return 0;
  }
}

/**
 * Safely upsert a single entry into riderTripLedger.
 * If the tripId already exists, it updates the row using the auto-increment primary key `id`.
 * If it doesn't exist, it adds it, catching any concurrent ConstraintError gracefully.
 */
export async function upsertRiderTripLedgerEntry(entry: RiderTripLedgerEntry): Promise<void> {
  if (!entry?.tripId) return;
  try {
    const existing = await dexieDb.riderTripLedger.where('tripId').equals(entry.tripId).first();
    if (existing?.id !== undefined) {
      await dexieDb.riderTripLedger.update(existing.id, entry);
    } else {
      try {
        await dexieDb.riderTripLedger.add(entry);
      } catch (addError: any) {
        if (addError?.name === 'ConstraintError') {
          const duplicate = await dexieDb.riderTripLedger.where('tripId').equals(entry.tripId).first();
          if (duplicate?.id !== undefined) {
            await dexieDb.riderTripLedger.update(duplicate.id, entry);
          }
        } else {
          throw addError;
        }
      }
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Dexie upsertRiderTripLedgerEntry skipped]', err);
    }
  }
}

/**
 * Safely upsert an array of entries into riderTripLedger in sequential order.
 * Deduplicates the array by tripId first to avoid race conditions.
 */
export async function upsertRiderTripLedgerBatch(entries: RiderTripLedgerEntry[]): Promise<void> {
  if (!Array.isArray(entries) || entries.length === 0) return;
  const uniqueMap = new Map<string, RiderTripLedgerEntry>();
  for (const entry of entries) {
    if (entry?.tripId) {
      uniqueMap.set(entry.tripId, entry);
    }
  }
  for (const entry of uniqueMap.values()) {
    await upsertRiderTripLedgerEntry(entry);
  }
}

Object.freeze(RadarCaptainFavoriteKernel);


