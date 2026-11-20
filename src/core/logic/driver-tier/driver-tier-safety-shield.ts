import {
  CaptainRankTier,
  DriverTierSafetyShieldRecord,
  TierGovernanceDecision,
} from './driver-tier-types';

export const SAFETY_SHIELD_DURATION_DAYS = 7;
export const SAFETY_SHIELD_DURATION_MS = SAFETY_SHIELD_DURATION_DAYS * 24 * 60 * 60 * 1000;
export const MIN_EVALUATION_RATINGS_THRESHOLD = 5;

/**
 * Checks if a captain is protected under the 7-day safety shield against instant demotion.
 */
export function isShieldGracePeriodActive(
  shield: DriverTierSafetyShieldRecord | null | undefined,
  nowMs: number,
): boolean {
  if (!shield || !shield.shieldActive) return false;
  return nowMs < shield.shieldExpiresAtMs;
}

/**
 * Activates or refreshes a 7-day safety shield when downward metrics signal a rank drop.
 */
export function activateSafetyShield(params: {
  currentRank: CaptainRankTier;
  demotionTargetRank: CaptainRankTier;
  reasonCode: string;
  nowMs: number;
  existingShield?: DriverTierSafetyShieldRecord | null;
}): DriverTierSafetyShieldRecord {
  const { currentRank, demotionTargetRank, reasonCode, nowMs, existingShield } = params;

  // If an active shield already exists for the same rank drop, keep original activation window
  if (existingShield && isShieldGracePeriodActive(existingShield, nowMs)) {
    return {
      ...existingShield,
      humanReviewRequired: true,
      objectionPeriodActive: true,
    };
  }

  return {
    shieldActive: true,
    shieldActivatedAtMs: nowMs,
    shieldExpiresAtMs: nowMs + SAFETY_SHIELD_DURATION_MS,
    threatenedRank: currentRank,
    targetDemotionRank: demotionTargetRank,
    reasonCode,
    humanReviewRequired: true,
    objectionPeriodActive: true,
  };
}

/**
 * Resolves the final governance decision when a downward transition is triggered.
 */
export function resolveDownwardTransition(params: {
  currentRank: CaptainRankTier;
  targetRank: CaptainRankTier;
  activeShield?: DriverTierSafetyShieldRecord | null;
  nowMs: number;
  humanReviewApprovedDemotion?: boolean;
}): {
  effectiveRank: CaptainRankTier;
  decision: TierGovernanceDecision;
  safetyShield: DriverTierSafetyShieldRecord | null;
} {
  const { currentRank, targetRank, activeShield, nowMs, humanReviewApprovedDemotion } = params;

  // Case 1: Manual human review formally approved demotion after the objection window
  if (humanReviewApprovedDemotion) {
    return {
      effectiveRank: targetRank,
      decision: 'DEMOTE',
      safetyShield: null,
    };
  }

  // Case 2: Shield is currently active (within 7-day grace window)
  if (isShieldGracePeriodActive(activeShield, nowMs)) {
    return {
      effectiveRank: currentRank,
      decision: 'SHIELD_PROTECTED',
      safetyShield: activeShield || null,
    };
  }

  // Case 3: Initial trigger of downward transition -> activate 7-day safety shield immediately
  const newShield = activateSafetyShield({
    currentRank,
    demotionTargetRank: targetRank,
    reasonCode: 'DOWNWARD_METRICS_BREACH',
    nowMs,
    existingShield: activeShield,
  });

  return {
    effectiveRank: currentRank,
    decision: 'SHIELD_PROTECTED',
    safetyShield: newShield,
  };
}
