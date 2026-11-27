import { supabase } from '@/lib/supabase-client';
import type {
  QualifiedTripEvaluationResult,
  WhatsAppGroupLeaderMinutes,
} from '../types';
import type { RpcLikeClient } from './whatsapp-group-membership';

export const MAX_QUALIFIED_TRIP_SECONDS = 14400;

export interface TripTimeInterval {
  startedAtMs: number;
  completedAtMs: number;
}

export interface QualifiedTripInput {
  tripId: string;
  status: string;
  captainId: string | null;
  riderId: string | null;
  startedAt: string | null;
  arrivedAt?: string | null;
  acceptedAt?: string | null;
  completedAt: string | null;
}

export interface QualifiedTripLedgerState {
  activeGroupIds: ReadonlySet<string>;
  inactiveLeaderGroupIds?: ReadonlySet<string>;
  memberships: ReadonlyMap<string, string>;
  recordedTripIds: Set<string>;
  captainIntervals: Map<string, TripTimeInterval[]>;
  cumulativeSeconds: Map<string, number>;
  monthlySeconds: Map<string, number>;
}

function toSafeNonNegativeInt(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return 0;
  return Math.floor(num);
}

export function formatUtcPeriodMonth(isoTimestamp: string): string {
  const dt = new Date(isoTimestamp);
  if (Number.isNaN(dt.getTime())) return '';
  const year = dt.getUTCFullYear();
  const month = String(dt.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function computeNonOverlappingSeconds(
  startedAtMs: number,
  completedAtMs: number,
  existingIntervals: ReadonlyArray<TripTimeInterval>,
): number {
  if (!Number.isFinite(startedAtMs) || !Number.isFinite(completedAtMs)) return 0;
  if (completedAtMs <= startedAtMs) return 0;

  const cappedEndMs = Math.min(completedAtMs, startedAtMs + MAX_QUALIFIED_TRIP_SECONDS * 1000);
  const totalSeconds = Math.floor((cappedEndMs - startedAtMs) / 1000);
  if (totalSeconds <= 0) return 0;

  const clamped = existingIntervals
    .filter((iv) => iv.completedAtMs > startedAtMs && iv.startedAtMs < cappedEndMs)
    .map((iv) => ({
      start: Math.max(startedAtMs, iv.startedAtMs),
      end: Math.min(cappedEndMs, iv.completedAtMs),
    }))
    .filter((iv) => iv.end > iv.start)
    .sort((a, b) => a.start - b.start || a.end - b.end);

  let overlapSeconds = 0;
  let mergedStart: number | null = null;
  let mergedEnd: number | null = null;

  for (const iv of clamped) {
    if (mergedStart === null || mergedEnd === null) {
      mergedStart = iv.start;
      mergedEnd = iv.end;
    } else if (iv.start <= mergedEnd) {
      mergedEnd = Math.max(mergedEnd, iv.end);
    } else {
      overlapSeconds += Math.floor((mergedEnd - mergedStart) / 1000);
      mergedStart = iv.start;
      mergedEnd = iv.end;
    }
  }

  if (mergedStart !== null && mergedEnd !== null) {
    overlapSeconds += Math.floor((mergedEnd - mergedStart) / 1000);
  }

  return Math.max(0, totalSeconds - overlapSeconds);
}

export function evaluateAndRecordQualifiedTrip(
  trip: QualifiedTripInput,
  state: QualifiedTripLedgerState,
): QualifiedTripEvaluationResult {
  const tripId = String(trip.tripId || '').trim();
  if (!tripId) {
    return { credited: false, reason: 'MISSING_TRIP_ID', qualifiedSeconds: 0 };
  }

  if (String(trip.status || '').trim().toUpperCase() !== 'COMPLETED') {
    return { credited: false, reason: 'TRIP_NOT_COMPLETED', qualifiedSeconds: 0 };
  }

  const effectiveStartedAt = trip.startedAt || trip.arrivedAt || trip.acceptedAt || null;
  const startedAtMs = effectiveStartedAt ? Date.parse(effectiveStartedAt) : Number.NaN;
  const completedAtMs = trip.completedAt ? Date.parse(trip.completedAt) : Number.NaN;
  if (
    !trip.captainId ||
    !trip.riderId ||
    trip.captainId === trip.riderId ||
    !Number.isFinite(startedAtMs) ||
    !Number.isFinite(completedAtMs) ||
    completedAtMs <= startedAtMs
  ) {
    return { credited: false, reason: 'INVALID_TRIP_WINDOW', qualifiedSeconds: 0 };
  }

  if (state.recordedTripIds.has(tripId)) {
    return { credited: false, reason: 'ALREADY_RECORDED', qualifiedSeconds: 0 };
  }

  const captainGroupId = state.memberships.get(trip.captainId) ?? null;
  const riderGroupId = state.memberships.get(trip.riderId) ?? null;
  if (!captainGroupId || !riderGroupId) {
    return { credited: false, reason: 'MEMBERSHIP_MISSING', qualifiedSeconds: 0 };
  }

  if (captainGroupId !== riderGroupId) {
    return { credited: false, reason: 'GROUP_MISMATCH', qualifiedSeconds: 0 };
  }

  if (!state.activeGroupIds.has(captainGroupId) || state.inactiveLeaderGroupIds?.has(captainGroupId)) {
    return { credited: false, reason: 'GROUP_INACTIVE', qualifiedSeconds: 0 };
  }

  const priorIntervals = state.captainIntervals.get(trip.captainId) ?? [];
  const qualifiedSeconds = computeNonOverlappingSeconds(startedAtMs, completedAtMs, priorIntervals);

  state.recordedTripIds.add(tripId);

  if (qualifiedSeconds <= 0) {
    return {
      credited: false,
      reason: 'OVERLAPPING_TIME_ALREADY_CREDITED',
      groupId: captainGroupId,
      qualifiedSeconds: 0,
    };
  }

  const cappedEndMs = Math.min(completedAtMs, startedAtMs + MAX_QUALIFIED_TRIP_SECONDS * 1000);
  state.captainIntervals.set(trip.captainId, [
    ...priorIntervals,
    { startedAtMs, completedAtMs: cappedEndMs },
  ]);

  const periodMonth = formatUtcPeriodMonth(trip.completedAt as string);
  state.cumulativeSeconds.set(
    captainGroupId,
    (state.cumulativeSeconds.get(captainGroupId) ?? 0) + qualifiedSeconds,
  );

  const monthKey = `${captainGroupId}:${periodMonth}`;
  state.monthlySeconds.set(monthKey, (state.monthlySeconds.get(monthKey) ?? 0) + qualifiedSeconds);

  return {
    credited: true,
    reason: 'CREDITED',
    groupId: captainGroupId,
    periodMonth,
    qualifiedSeconds,
  };
}

export function mapLeaderMinutesPayload(data: unknown): WhatsAppGroupLeaderMinutes {
  const row = data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
  const fallbackMonth = formatUtcPeriodMonth(new Date().toISOString());
  const periodMonth = typeof row?.period_month === 'string' && row.period_month ? row.period_month : fallbackMonth;

  if (!row || !row.is_group_leader) {
    return {
      isGroupLeader: false, periodMonth,
      currentMonthSeconds: 0, currentMonthMinutes: 0,
      totalQualifiedSeconds: 0, totalQualifiedMinutes: 0, links: [],
    };
  }

  const rawLinks = Array.isArray(row.links) ? row.links : [];
  const links = rawLinks
    .filter((entry): entry is Record<string, unknown> => Boolean(entry && typeof entry === 'object'))
    .map((entry) => {
      const mSec = toSafeNonNegativeInt(entry.current_month_seconds);
      const tSec = toSafeNonNegativeInt(entry.total_qualified_seconds);
      return {
        groupId: String(entry.group_id || '').trim(),
        groupCode: String(entry.group_code || '').trim(),
        groupName: String(entry.group_name || '').trim(),
        status: String(entry.status || '').trim().toUpperCase() === 'ACTIVE' ? ('ACTIVE' as const) : ('INACTIVE' as const),
        currentMonthSeconds: mSec,
        currentMonthMinutes: toSafeNonNegativeInt(entry.current_month_minutes ?? Math.floor(mSec / 60)),
        totalQualifiedSeconds: tSec,
        totalQualifiedMinutes: toSafeNonNegativeInt(entry.total_qualified_minutes ?? Math.floor(tSec / 60)),
      };
    })
    .filter((entry) => Boolean(entry.groupId || entry.groupCode));

  const currentMonthSeconds = toSafeNonNegativeInt(row.current_month_seconds);
  const totalQualifiedSeconds = toSafeNonNegativeInt(row.total_qualified_seconds);

  return {
    isGroupLeader: true, periodMonth, currentMonthSeconds,
    currentMonthMinutes: toSafeNonNegativeInt(row.current_month_minutes ?? Math.floor(currentMonthSeconds / 60)),
    totalQualifiedSeconds,
    totalQualifiedMinutes: toSafeNonNegativeInt(row.total_qualified_minutes ?? Math.floor(totalQualifiedSeconds / 60)),
    links,
  };
}

export async function getMyWhatsAppGroupLeaderMinutes(
  client: RpcLikeClient = supabase,
): Promise<WhatsAppGroupLeaderMinutes> {
  const { data, error } = await client.rpc('get_my_whatsapp_group_leader_minutes');
  if (error) {
    throw new Error(error.message || 'GET_WHATSAPP_GROUP_LEADER_MINUTES_FAILED');
  }
  return mapLeaderMinutesPayload(data);
}
