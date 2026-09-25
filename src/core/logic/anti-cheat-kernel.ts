// [SCR-ANTI-CHEAT-KERNEL-109] محرك الحماية الجنائي وقفل الثغرات الثلاث
// Sovereign Anti-Cheat Kernel (Chapter 4, Sovereign Constitution V2.6-Secured)

export interface RiderImmunityRecord {
  riderId: string;
  immunityScore: number;
  consecutiveCancellations: number;
  isSuspended: boolean;
  lastCancellationTimestamp?: number;
}

export interface CancellationPenaltyResult {
  updatedRecord: RiderImmunityRecord;
  penaltyApplied: boolean;
  isSuspended: boolean;
  reason?: string;
}

export const AntiCheatKernel = {
  CONFIG: Object.freeze({
    DEFAULT_IMMUNITY_SCORE: 5.0,
    SUSPENSION_THRESHOLD: 4.2,
    CONSECUTIVE_CANCELLATION_TRIGGER: 3,
    PENALTY_POINTS: 0.5,
  }),

  createDefaultRecord(riderId: string): RiderImmunityRecord {
    return {
      riderId,
      immunityScore: this.CONFIG.DEFAULT_IMMUNITY_SCORE,
      consecutiveCancellations: 0,
      isSuspended: false,
    };
  },

  /**
   * ثغرة إغراق خلايا H3 بطلبات وهمية:
   * إذا ألغى الراكب 3 مرات متتالية، يُخصم 0.5 من رصيد مناعته السلوكية،
   * وإذا هبط عن 4.2 يُسقط حسابه كلياً بروتوكول التطهير التلقائي.
   */
  evaluateCancellationPenalty(
    record: RiderImmunityRecord,
    cancelledAt: number = Date.now(),
  ): CancellationPenaltyResult {
    if (record.isSuspended) {
      return {
        updatedRecord: { ...record, lastCancellationTimestamp: cancelledAt },
        penaltyApplied: false,
        isSuspended: true,
        reason: 'ACCOUNT_ALREADY_SUSPENDED',
      };
    }

    const nextConsecutive = record.consecutiveCancellations + 1;
    let nextScore = record.immunityScore;
    let penaltyApplied = false;

    // كل 3 إلغاءات متتالية تخصم 0.5 من نقاط المناعة السلوكية
    if (nextConsecutive % this.CONFIG.CONSECUTIVE_CANCELLATION_TRIGGER === 0) {
      nextScore = Number(Math.max(0, nextScore - this.CONFIG.PENALTY_POINTS).toFixed(2));
      penaltyApplied = true;
    }

    const isSuspended = nextScore < this.CONFIG.SUSPENSION_THRESHOLD;

    const updatedRecord: RiderImmunityRecord = {
      ...record,
      consecutiveCancellations: nextConsecutive,
      immunityScore: nextScore,
      isSuspended,
      lastCancellationTimestamp: cancelledAt,
    };

    return {
      updatedRecord,
      penaltyApplied,
      isSuspended,
      reason: isSuspended ? 'IMMUNITY_SCORE_DROPPED_BELOW_THRESHOLD' : undefined,
    };
  },

  /**
   * إنهاء الرحلة بنجاح يكسر سلسلة الإلغاءات المتتالية ويعيد العداد إلى الصفر
   */
  recordSuccessfulTrip(record: RiderImmunityRecord): RiderImmunityRecord {
    return {
      ...record,
      consecutiveCancellations: 0,
    };
  },

  /**
   * ثغرة التلاعب بالوقت المحلي للهاتف:
   * حساب فارق التوقيت الشبكي التفاضلي (Network Time Delta)
   */
  calculateNetworkTimeDelta(deviceTimeMs: number, serverTimeMs: number): number {
    return serverTimeMs - deviceTimeMs;
  },

  /**
   * احتساب التوقيت الفعلي المعتمد بناءً على النبض الشبكي المقروء
   */
  getEffectiveNetworkTime(deviceTimeMs: number, deltaMs: number): number {
    return deviceTimeMs + deltaMs;
  },
};

Object.freeze(AntiCheatKernel);

const RIDER_IMMUNITY_STORAGE_KEY_PREFIX = 'radar_rider_immunity_';

export function getStoredRiderImmunity(riderId: string): RiderImmunityRecord {
  if (typeof window === 'undefined') return AntiCheatKernel.createDefaultRecord(riderId);
  try {
    const raw = localStorage.getItem(`${RIDER_IMMUNITY_STORAGE_KEY_PREFIX}${riderId}`);
    if (!raw) return AntiCheatKernel.createDefaultRecord(riderId);
    const parsed = JSON.parse(raw) as RiderImmunityRecord;
    return { ...parsed, isSuspended: false };
  } catch {
    return AntiCheatKernel.createDefaultRecord(riderId);
  }
}

export function saveStoredRiderImmunity(record: RiderImmunityRecord): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${RIDER_IMMUNITY_STORAGE_KEY_PREFIX}${record.riderId}`, JSON.stringify(record));
  } catch (err) {
    console.error('Failed to persist rider immunity record:', err);
  }
}
