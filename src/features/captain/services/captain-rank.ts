/**
 * Client surface for the sovereign captain-rank engine.
 *
 * The rank itself is never computed here — `profiles.tier` is owned by the Postgres
 * engine installed in `supabase/migrations/20260822090000_captain_rank_sovereign_engine.sql`,
 * which is the Supabase port of the Firebase `calculateSovereignRank` /
 * `generateWeeklyReport` / `enforceEmergencyDescent` trio. These helpers only call it.
 */

export type CaptainRankName = 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE';

/** Mirrors SOVEREIGN_CONSTANTS.RANKING_RULES — kept here only for display/preview. */
export const CAPTAIN_RANK_RULES: Record<CaptainRankName, { minRating: number; minHearts: number }> = {
  PLATINUM: { minRating: 4.8, minHearts: 50 },
  GOLD: { minRating: 4.5, minHearts: 20 },
  SILVER: { minRating: 4.0, minHearts: 0 },
  BRONZE: { minRating: 0, minHearts: 0 },
};

export type WeeklyReportResult =
  | {
      success: true;
      stats: { averageRating: number; heartCount: number; newRank: CaptainRankName };
    }
  | {
      success: false;
      message: string;
      rank: CaptainRankName;
      rankPenaltyExpiresAt?: string;
    };

export type PenaltyResult = {
  success: true;
  rank: CaptainRankName;
  penaltyCount: number;
  rankPenaltyExpiresAt: string | null;
};

/**
 * Recomputes and persists the caller's rank — the port of the Firebase
 * `generateWeeklyReport` callable. Pass `captainId` only as an ADMIN; the server
 * rejects it otherwise. Refuses with COURT_001 when there is no new rating pulse,
 * and with COURT_002 while a 72h disciplinary lock is still running.
 */
export async function generateWeeklyReport(captainId?: string): Promise<WeeklyReportResult> {
  const { supabase } = await import('@/lib/supabase-client');
  const { data, error } = await supabase.rpc('generate_weekly_report', {
    p_captain_id: captainId ?? null,
  });

  if (error) throw error;
  return data as WeeklyReportResult;
}

/**
 * Records one violation against a captain (ADMIN only). The third violation trips the
 * emergency descent: rank stripped to BRONZE, counter reset, promotion locked 72h.
 */
export async function recordCaptainPenalty(captainId: string, reason?: string): Promise<PenaltyResult> {
  const { supabase } = await import('@/lib/supabase-client');
  const { data, error } = await supabase.rpc('record_captain_penalty', {
    p_captain_id: captainId,
    p_reason: reason ?? null,
  });

  if (error) throw error;
  return data as PenaltyResult;
}

/**
 * Re-derives every captain's rank from their current rating and hearts (ADMIN only).
 * Ranks that were seeded by hand and do not satisfy the rules get corrected downward,
 * so treat this as a deliberate operation rather than a routine refresh.
 */
export async function resyncAllCaptainRanks(): Promise<{ success: true; changed: number }> {
  const { supabase } = await import('@/lib/supabase-client');
  const { data, error } = await supabase.rpc('resync_all_captain_ranks', {});

  if (error) throw error;
  return data as { success: true; changed: number };
}
