export type CaptainRankTier = 'DIAMOND' | 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE';

export interface DriverTierUpwardMetrics {
  uniqueRiderFavoritesCount: number; // 40% weight - unique passenger count
  fieldActivityAndBroadcastScore: number; // 35% weight - normalized 0..1 (trips, hours, ad proof)
  positivePassengerRatingScore: number; // 25% weight - normalized 0..1 (1-5 stars & ad compliance)
}

export interface DriverTierDownwardMetrics {
  documentedNegativeRatingScore: number; // 60% weight - normalized 0..1 (ad non-compliance, documented complaint)
  inactivityScore: number; // 30% weight - normalized 0..1 (absence, lack of availability)
  favoriteRemovalScore: number; // 10% weight - normalized 0..1 (slight impact)
}

export interface DriverTierEvaluationInput {
  captainId: string;
  currentRank: CaptainRankTier;
  evaluatedTripsCount: number; // Total completed trips evaluated
  ratingsCount: number; // Total passenger ratings received
  upward: DriverTierUpwardMetrics;
  downward: DriverTierDownwardMetrics;
  activeShield?: DriverTierSafetyShieldRecord | null;
  currentTimeMs?: number;
}

export interface DriverTierSafetyShieldRecord {
  shieldActive: boolean;
  shieldActivatedAtMs: number;
  shieldExpiresAtMs: number;
  threatenedRank: CaptainRankTier;
  targetDemotionRank: CaptainRankTier;
  reasonCode: string;
  humanReviewRequired: boolean;
  objectionPeriodActive: boolean;
}

export interface RankTierCapability {
  rank: CaptainRankTier;
  nameAr: string;
  nameEn: string;
  adCapacityMin: number;
  adCapacityMax: number;
  isFlexibleCapacity?: boolean;
  dispatchPrioritySeconds: number;
  radarRangeKm: number;
  geographicScope: 'basic' | 'district_and_adjacent' | 'governorate_and_adjacent' | 'nationwide';
  cabinScreensEnabled?: boolean;
  governorateNucleusEnabled?: boolean;
  independentNucleusEnabled?: boolean;
}

export type TierGovernanceDecision = 'MAINTAIN' | 'PROMOTE' | 'SHIELD_PROTECTED' | 'DEMOTE' | 'INSUFFICIENT_DATA';

export interface DriverTierEvaluationResult {
  captainId: string;
  currentRank: CaptainRankTier;
  evaluatedRank: CaptainRankTier;
  decision: TierGovernanceDecision;
  isDataSufficient: boolean;
  upwardScore: number; // 0..100 composite
  downwardScore: number; // 0..100 composite
  safetyShield: DriverTierSafetyShieldRecord | null;
  capabilities: RankTierCapability;
  explanation: {
    ar: string;
    en: string;
  };
}
