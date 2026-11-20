export interface WeeklyCaptainStats {
  captainId: string;
  governorateId?: string;
  districtId?: string;
  favoritesDelta: number; // e.g. +2
  positiveRatingsCount: number; // e.g. +3
  vehicleNegativeCount: number; // e.g. -1
  captainNegativeCount: number; // e.g. -3
}

export interface FormattedWeeklyDigest {
  captainId: string;
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
}

export interface GeographicBatchGroup {
  batchKey: string;
  delayOffsetMs: number;
  captains: WeeklyCaptainStats[];
}

/**
 * Formats weekly digest notification preserving passenger privacy.
 * Omits rider names and trip specifics, displaying aggregate counts only.
 */
export function formatWeeklyDigestNotification(stats: WeeklyCaptainStats): FormattedWeeklyDigest {
  const favSign = stats.favoritesDelta >= 0 ? `+${stats.favoritesDelta}` : `${stats.favoritesDelta}`;
  const posSign = stats.positiveRatingsCount >= 0 ? `+${stats.positiveRatingsCount}` : `${stats.positiveRatingsCount}`;
  const vehSign = stats.vehicleNegativeCount > 0 ? `-${Math.abs(stats.vehicleNegativeCount)}` : '0';
  const capSign = stats.captainNegativeCount > 0 ? `-${Math.abs(stats.captainNegativeCount)}` : '0';

  const messageAr = `إحصائيات الأسبوع: المفضلة ${favSign} | تقييم إيجابي ${posSign} | سلبي مركبة ${vehSign} | سلبي كابتن ${capSign}`;
  const messageEn = `Weekly Stats: Favorites ${favSign} | Positive ${posSign} | Vehicle Issues ${vehSign} | Captain Issues ${capSign}`;

  return {
    captainId: stats.captainId,
    titleAr: 'التقرير الإحصائي الأسبوعي',
    titleEn: 'Weekly Statistical Digest',
    messageAr,
    messageEn,
  };
}

/**
 * Groups captains geographically by governorate and district to stagger notification batches
 * preventing server spikes (Load Balancing).
 */
export function partitionCaptainsForLoadBalancing(
  captains: WeeklyCaptainStats[],
  batchIntervalMs = 60_000, // 1 minute stagger per governorate
): GeographicBatchGroup[] {
  const groups = new Map<string, WeeklyCaptainStats[]>();

  for (const captain of captains) {
    const key = [captain.governorateId || 'central', captain.districtId || 'general'].join('_');
    const existing = groups.get(key) || [];
    existing.push(captain);
    groups.set(key, existing);
  }

  let index = 0;
  const result: GeographicBatchGroup[] = [];

  for (const [batchKey, batchCaptains] of groups.entries()) {
    result.push({
      batchKey,
      delayOffsetMs: index * batchIntervalMs,
      captains: batchCaptains,
    });
    index += 1;
  }

  return result;
}
