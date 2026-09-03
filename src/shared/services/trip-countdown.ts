/**
 * The one countdown both the rider and the captain see during a trip.
 *
 * What this replaces, on the rider's screen:
 *
 *   etaSeconds: Math.max(4 * 60, Math.round((distanceKm || 4) * 85))
 *
 * — a flat 85 seconds per kilometre of the TRIP, shown both as "الكابتن يوصلك خلال" while
 * the captain was still driving over AND as "الوقت المتبقي" once the trip had started. So a
 * 30 km trip told the rider the captain was 42 minutes away from a pickup point that might
 * be two streets over, and the number never changed when the trip actually began. It also
 * lived in a `setInterval` seeded from `state.activeTrip`, which `buildActiveTrip` rebuilds
 * on every realtime row — so any column change restarted the countdown from the top.
 *
 * A countdown is only meaningful as `deadline - now`. Two things therefore have to be real:
 *
 *   the ANCHOR    a server timestamp for when this phase began (accepted_at / started_at),
 *                 never Date.now() at render — that is what made it restart, and what made
 *                 the rider and the captain disagree.
 *   the DURATION  the right estimate for THIS phase: the captain's distance to the pickup
 *                 while they are driving over, the routed trip duration once rolling.
 *
 * Everything here is derived from those, so the value survives a reload, agrees across
 * devices, and cannot drift between the two sides.
 */

import { estimatePickupMinutes, estimateTripMinutes } from './trip-duration';

export type TripCountdownPhase =
  /** Captain is driving to the pickup point. Counting down their arrival. */
  | 'TO_PICKUP'
  /** Captain is at the pickup point. Nothing to count. */
  | 'AT_PICKUP'
  /** Rolling. Counting down the remaining trip duration. */
  | 'ON_TRIP'
  /** Trip is over, or the status is not one we count against. */
  | 'NONE';

export interface TripCountdownInput {
  /** The ride request's status, in any casing. */
  status: string | null | undefined;
  /** `ride_requests.accepted_at` — when the rider accepted the offer, in ms. */
  acceptedAtMs?: number | null;
  /** `ride_requests.arrived_at`, in ms. */
  arrivedAtMs?: number | null;
  /** `ride_requests.started_at`, in ms. */
  startedAtMs?: number | null;
  /** Minutes for the captain to reach the pickup, measured at offer time. */
  pickupEtaMinutes?: number | null;
  /** Straight-line km from the captain to the pickup. Fallback for the above. */
  pickupDistanceKm?: number | null;
  /** Routed trip duration in minutes (`estimated_duration_minutes`). */
  tripDurationMinutes?: number | null;
  /** Trip distance in km. Fallback for the above. */
  tripDistanceKm?: number | null;
  /** Injectable for tests. */
  nowMs?: number;
}

export interface TripCountdown {
  phase: TripCountdownPhase;
  /** Seconds this countdown began from. 0 when there is nothing to count. */
  totalSeconds: number;
  /** Seconds left, floored at 0. */
  remainingSeconds: number;
  /** Seconds past the deadline. 0 while still inside it. */
  overdueSeconds: number;
  isOverdue: boolean;
  /**
   * False when there is no anchor timestamp to count from — a countdown cannot be honest
   * without one, and the UI must show a dash rather than invent a starting point.
   */
  hasCountdown: boolean;
  /** `M:SS`, `H:MM:SS` past an hour, `+M:SS` when overdue, `--:--` with no countdown. */
  display: string;
}

const NO_COUNTDOWN: TripCountdown = {
  phase: 'NONE',
  totalSeconds: 0,
  remainingSeconds: 0,
  overdueSeconds: 0,
  isOverdue: false,
  hasCountdown: false,
  display: '--:--',
};

const ON_TRIP_STATUSES = new Set(['STARTED', 'TRIP_ACTIVE', 'ACTIVE', 'IN_PROGRESS']);
const TO_PICKUP_STATUSES = new Set(['ACCEPTED', 'EN_ROUTE']);
const CLOSED_STATUSES = new Set(['COMPLETED', 'CANCELLED']);

export function tripCountdownPhase(status: string | null | undefined): TripCountdownPhase {
  const normalized = String(status || '').toUpperCase();

  if (CLOSED_STATUSES.has(normalized)) return 'NONE';
  if (ON_TRIP_STATUSES.has(normalized)) return 'ON_TRIP';
  if (normalized === 'ARRIVED') return 'AT_PICKUP';
  if (TO_PICKUP_STATUSES.has(normalized)) return 'TO_PICKUP';

  return 'NONE';
}

/** ms → a finite positive epoch, or null. Rejects 0 and any non-date. */
function epochMs(value: number | null | undefined): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function positiveMinutes(value: number | null | undefined): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

export function formatCountdown(seconds: number, isOverdue = false): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const sign = isOverdue ? '+' : '';

  // Trips run long enough to pass an hour; a bare "95:12" reads as garbage.
  if (hours > 0) {
    return `${sign}${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${sign}${minutes}:${String(secs).padStart(2, '0')}`;
}

export function computeTripCountdown(input: TripCountdownInput): TripCountdown {
  const phase = tripCountdownPhase(input.status);
  if (phase === 'NONE') return NO_COUNTDOWN;

  // The captain is standing at the pickup point. A countdown here would be counting down to
  // nothing — the wait is now the rider's to end.
  if (phase === 'AT_PICKUP') {
    return { ...NO_COUNTDOWN, phase: 'AT_PICKUP', display: '0:00' };
  }

  const nowMs = epochMs(input.nowMs) ?? Date.now();

  const anchorMs = phase === 'ON_TRIP'
    ? epochMs(input.startedAtMs)
    : epochMs(input.acceptedAtMs);

  // No server timestamp means no deadline. Anchoring on `now` instead is exactly the bug
  // this module exists to remove: it would restart on every render and never agree between
  // the rider's phone and the captain's.
  if (anchorMs === null) return { ...NO_COUNTDOWN, phase };

  // The estimators are only consulted when there is a distance to estimate FROM. Called with
  // nothing they return their floor — 1 minute for a pickup, 3 for a trip — and a countdown
  // that starts at one minute and is instantly "late" is no better than the number this
  // module replaced. With no duration source at all the honest output is a dash.
  const minutes = phase === 'ON_TRIP'
    ? (positiveMinutes(input.tripDurationMinutes)
      ?? (positiveMinutes(input.tripDistanceKm) === null ? null : estimateTripMinutes(input.tripDistanceKm)))
    : (positiveMinutes(input.pickupEtaMinutes)
      ?? (positiveMinutes(input.pickupDistanceKm) === null ? null : estimatePickupMinutes(input.pickupDistanceKm)));

  if (minutes === null) return { ...NO_COUNTDOWN, phase };

  const totalSeconds = Math.round(minutes * 60);
  const elapsedSeconds = Math.floor((nowMs - anchorMs) / 1000);
  // A clock skewed ahead of the server would otherwise read as time already spent.
  const safeElapsed = Math.max(0, elapsedSeconds);

  const remainingSeconds = Math.max(0, totalSeconds - safeElapsed);
  const overdueSeconds = Math.max(0, safeElapsed - totalSeconds);
  const isOverdue = overdueSeconds > 0;

  return {
    phase,
    totalSeconds,
    remainingSeconds,
    overdueSeconds,
    isOverdue,
    hasCountdown: true,
    // Past the estimate the honest thing is to keep counting, upward: a timer frozen at
    // 0:00 while the captain is still ten minutes out is the same lie in a new shape.
    display: formatCountdown(isOverdue ? overdueSeconds : remainingSeconds, isOverdue),
  };
}

/** Parses a Postgres timestamptz (or anything Date accepts) to epoch ms, or null. */
export function toEpochMs(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return epochMs(value);

  const parsed = new Date(value as string).getTime();
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
