import {
  CaptainRankTier,
  DriverTierEvaluationInput,
  DriverTierEvaluationResult,
  RankTierCapability,
} from './driver-tier-types';
import {
  MIN_EVALUATION_RATINGS_THRESHOLD,
  resolveDownwardTransition,
} from './driver-tier-safety-shield';

export const RANK_ORDER: CaptainRankTier[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'];

export const TIER_CAPABILITIES: Record<CaptainRankTier, RankTierCapability> = {
  BRONZE: {
    rank: 'BRONZE',
    nameAr: 'البرونزي',
    nameEn: 'Bronze',
    adCapacityMin: 5,
    adCapacityMax: 10,
    dispatchPrioritySeconds: 0,
    radarRangeKm: 1.5,
    geographicScope: 'basic',
  },
  SILVER: {
    rank: 'SILVER',
    nameAr: 'الفضي',
    nameEn: 'Silver',
    adCapacityMin: 10,
    adCapacityMax: 15,
    dispatchPrioritySeconds: 1.0,
    radarRangeKm: 1.5,
    geographicScope: 'district_and_adjacent',
  },
  GOLD: {
    rank: 'GOLD',
    nameAr: 'الذهبي',
    nameEn: 'Gold',
    adCapacityMin: 10,
    adCapacityMax: 15,
    dispatchPrioritySeconds: 1.0,
    radarRangeKm: 2.0,
    geographicScope: 'governorate_and_adjacent',
    cabinScreensEnabled: true,
  },
  PLATINUM: {
    rank: 'PLATINUM',
    nameAr: 'البلاتيني',
    nameEn: 'Platinum',
    adCapacityMin: 10,
    adCapacityMax: 20,
    dispatchPrioritySeconds: 2.5,
    radarRangeKm: 2.5,
    geographicScope: 'governorate_and_adjacent',
    governorateNucleusEnabled: true,
  },
  DIAMOND: {
    rank: 'DIAMOND',
    nameAr: 'الماسي',
    nameEn: 'Diamond',
    adCapacityMin: 20,
    adCapacityMax: 50,
    isFlexibleCapacity: true,
    dispatchPrioritySeconds: 3.5,
    radarRangeKm: 4.0,
    geographicScope: 'nationwide',
    independentNucleusEnabled: true,
  },
};

export const UPWARD_TARGET_FAVORITES: Record<CaptainRankTier, number> = {
  BRONZE: 0,
  SILVER: 5,
  GOLD: 20,
  PLATINUM: 50,
  DIAMOND: 100,
};

export function calculateUpwardScore(input: DriverTierEvaluationInput): number {
  const { uniqueRiderFavoritesCount, fieldActivityAndBroadcastScore, positivePassengerRatingScore } = input.upward;
  const favTarget = UPWARD_TARGET_FAVORITES.DIAMOND;
  const favNorm = Math.min(1.0, Math.max(0, uniqueRiderFavoritesCount / favTarget));
  const activityNorm = Math.min(1.0, Math.max(0, fieldActivityAndBroadcastScore));
  const ratingNorm = Math.min(1.0, Math.max(0, positivePassengerRatingScore));

  const composite = (favNorm * 0.40) + (activityNorm * 0.35) + (ratingNorm * 0.25);
  return Number((composite * 100).toFixed(2));
}

export function calculateDownwardScore(input: DriverTierEvaluationInput): number {
  const { documentedNegativeRatingScore, inactivityScore, favoriteRemovalScore } = input.downward;
  const negNorm = Math.min(1.0, Math.max(0, documentedNegativeRatingScore));
  const inactNorm = Math.min(1.0, Math.max(0, inactivityScore));
  const favRemNorm = Math.min(1.0, Math.max(0, favoriteRemovalScore));

  const composite = (negNorm * 0.60) + (inactNorm * 0.30) + (favRemNorm * 0.10);
  return Number((composite * 100).toFixed(2));
}

export function evaluateDriverTier(input: DriverTierEvaluationInput): DriverTierEvaluationResult {
  const nowMs = input.currentTimeMs ?? Date.now();
  const upwardScore = calculateUpwardScore(input);
  const downwardScore = calculateDownwardScore(input);

  const isDataSufficient =
    input.ratingsCount >= MIN_EVALUATION_RATINGS_THRESHOLD || input.evaluatedTripsCount >= 5;

  if (!isDataSufficient) {
    return {
      captainId: input.captainId,
      currentRank: input.currentRank,
      evaluatedRank: input.currentRank,
      decision: 'INSUFFICIENT_DATA',
      isDataSufficient: false,
      upwardScore,
      downwardScore,
      safetyShield: input.activeShield || null,
      capabilities: TIER_CAPABILITIES[input.currentRank],
      explanation: {
        ar: 'بيانات التقييم غير كافية حالياً لاتخاذ قرار تأهيل، يتم الإبقاء على الرتبة الحالية.',
        en: 'Insufficient evaluation data to alter tier; current rank maintained.',
      },
    };
  }

  // Determine potential rank by upward score & unique favorites
  let candidateRank: CaptainRankTier = 'BRONZE';
  const favs = input.upward.uniqueRiderFavoritesCount;

  if (upwardScore >= 85 && favs >= UPWARD_TARGET_FAVORITES.DIAMOND) candidateRank = 'DIAMOND';
  else if (upwardScore >= 70 && favs >= UPWARD_TARGET_FAVORITES.PLATINUM) candidateRank = 'PLATINUM';
  else if (upwardScore >= 50 && favs >= UPWARD_TARGET_FAVORITES.GOLD) candidateRank = 'GOLD';
  else if (upwardScore >= 30 && favs >= UPWARD_TARGET_FAVORITES.SILVER) candidateRank = 'SILVER';

  const currentIndex = RANK_ORDER.indexOf(input.currentRank);
  const candidateIndex = RANK_ORDER.indexOf(candidateRank);

  // Promotion
  if (candidateIndex > currentIndex && downwardScore < 30) {
    return {
      captainId: input.captainId,
      currentRank: input.currentRank,
      evaluatedRank: candidateRank,
      decision: 'PROMOTE',
      isDataSufficient: true,
      upwardScore,
      downwardScore,
      safetyShield: null,
      capabilities: TIER_CAPABILITIES[candidateRank],
      explanation: {
        ar: `ترقية مستحقة إلى رتبة ${TIER_CAPABILITIES[candidateRank].nameAr}.`,
        en: `Promotion granted to ${TIER_CAPABILITIES[candidateRank].nameEn}.`,
      },
    };
  }

  // Downward breach check (high downward score or lower candidate rank)
  if (downwardScore >= 40 || candidateIndex < currentIndex) {
    const targetRank = candidateIndex < currentIndex ? candidateRank : (currentIndex > 0 ? RANK_ORDER[currentIndex - 1] : 'BRONZE');
    const transition = resolveDownwardTransition({
      currentRank: input.currentRank,
      targetRank,
      activeShield: input.activeShield,
      nowMs,
    });

    return {
      captainId: input.captainId,
      currentRank: input.currentRank,
      evaluatedRank: transition.effectiveRank,
      decision: transition.decision,
      isDataSufficient: true,
      upwardScore,
      downwardScore,
      safetyShield: transition.safetyShield,
      capabilities: TIER_CAPABILITIES[transition.effectiveRank],
      explanation: {
        ar: 'مؤشرات التراجع نشطة؛ تم تفعيل درع الأمان لمدة 7 أيام والمراجعة البشرية لمنع الهبوط الفوري.',
        en: 'Downward metrics active; 7-day safety shield and human review enabled.',
      },
    };
  }

  // Normal maintenance
  return {
    captainId: input.captainId,
    currentRank: input.currentRank,
    evaluatedRank: input.currentRank,
    decision: 'MAINTAIN',
    isDataSufficient: true,
    upwardScore,
    downwardScore,
    safetyShield: null,
    capabilities: TIER_CAPABILITIES[input.currentRank],
    explanation: {
      ar: 'الحفاظ على الرتبة الحالية مع استقرار مؤشرات الأداء.',
      en: 'Current rank maintained with stable performance metrics.',
    },
  };
}
