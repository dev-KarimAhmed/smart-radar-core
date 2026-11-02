'use client';

const STORAGE_KEY_UNTIL = 'radar_captain_cancel_cooldown_until';
const STORAGE_KEY_MINUTES = 'radar_captain_cancel_cooldown_minutes';

export interface CaptainCancelCooldownState {
  isActive: boolean;
  remainingSeconds: number;
  totalMinutes: number;
}

export interface CalculateRemainingCooldownOptions {
  /** Total estimated/scheduled duration of the trip in minutes (default 20). */
  totalTripMinutes: number;
  /** When the trip actively started (started_at epoch ms, ISO string, or Date). */
  startedAtMs?: number | string | Date | null;
  /** When the captain accepted the trip offer (accepted_at epoch ms, ISO string, or Date). */
  acceptedAtMs?: number | string | Date | null;
  /** When the captain arrived at the pickup location (arrived_at epoch ms, ISO string, or Date). */
  arrivedAtMs?: number | string | Date | null;
  /** Estimated minutes for the captain to reach the pickup location. */
  pickupEtaMinutes?: number | null;
  /** Explicitly known scheduled trip end time (epoch ms, ISO string, or Date). */
  scheduledEndTime?: number | string | Date | null;
  /** Actual cancellation timestamp (epoch ms, ISO string, or Date). Defaults to current time. */
  cancellationTime?: number | string | Date | null;
}

export interface RemainingCooldownResult {
  remainingMinutes: number;
  remainingSeconds: number;
  elapsedSeconds: number;
  scheduledEndTimeMs: number;
  cancellationTimeMs: number;
  freezeDurationMs: number;
}

/**
 * Safely parses any date/timestamp into UTC epoch milliseconds.
 * Supports numbers (epoch ms), Date instances, and ISO-8601 strings with timezone offsets.
 */
export function toEpochMs(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : null;
  }
  if (value instanceof Date) {
    const t = value.getTime();
    return Number.isFinite(t) && t > 0 ? t : null;
  }
  const parsed = new Date(String(value)).getTime();
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/**
 * Calculates the captain's freeze duration upon trip cancellation.
 *
 * Core Equation:
 *   remainingDuration = tripEndTime.difference(cancellationTime);
 *   freezeDuration = remainingDuration.isNegative ? Duration.zero : remainingDuration;
 *
 * Important Requirements:
 * 1. Calculate the remaining duration based on the actual cancellation timestamp.
 * 2. Do not use the original trip duration as the freeze duration.
 * 3. If the trip is cancelled before it starts, calculate the remaining time until the scheduled trip end time.
 * 4. If the trip is cancelled after its scheduled end time, the freeze duration should be zero.
 * 5. Ensure the captain's freeze/unavailability period is updated correctly using the calculated remaining duration.
 * 6. Handle timezone and date-time consistency properly using UTC epoch milliseconds.
 *
 * Example:
 * - Trip duration: 60 minutes.
 * - Trip starts at 10:00 AM.
 * - Trip gets cancelled at 10:30 AM.
 * - Elapsed time: 30 minutes.
 * - Remaining time: 30 minutes.
 * - Freeze duration must be 30 minutes only, not 60 minutes.
 */
export function calculateRemainingCooldown(
  optionsOrTotalMinutes: number | CalculateRemainingCooldownOptions,
  startedAtMs?: number | string | Date | null,
  cancellationTime?: number | string | Date | null,
  acceptedAtMs?: number | string | Date | null,
  pickupEtaMinutes?: number | null,
  arrivedAtMs?: number | string | Date | null,
  scheduledEndTime?: number | string | Date | null,
): RemainingCooldownResult {
  let totalTripMinutes: number;
  let startMs: number | null = null;
  let cancelMs: number | null = null;
  let acceptedMs: number | null = null;
  let arrivedMs: number | null = null;
  let pickupEtaMins: number | null = null;
  let scheduledEndMs: number | null = null;

  if (typeof optionsOrTotalMinutes === 'object' && optionsOrTotalMinutes !== null) {
    const opts = optionsOrTotalMinutes;
    totalTripMinutes = Number(opts.totalTripMinutes);
    startMs = toEpochMs(opts.startedAtMs);
    cancelMs = toEpochMs(opts.cancellationTime);
    acceptedMs = toEpochMs(opts.acceptedAtMs);
    arrivedMs = toEpochMs(opts.arrivedAtMs);
    pickupEtaMins = typeof opts.pickupEtaMinutes === 'number' && Number.isFinite(opts.pickupEtaMinutes)
      ? Math.max(0, opts.pickupEtaMinutes)
      : null;
    scheduledEndMs = toEpochMs(opts.scheduledEndTime);
  } else {
    totalTripMinutes = Number(optionsOrTotalMinutes);
    startMs = toEpochMs(startedAtMs);
    cancelMs = toEpochMs(cancellationTime);
    acceptedMs = toEpochMs(acceptedAtMs);
    arrivedMs = toEpochMs(arrivedAtMs);
    pickupEtaMins = typeof pickupEtaMinutes === 'number' && Number.isFinite(pickupEtaMinutes)
      ? Math.max(0, pickupEtaMinutes)
      : null;
    scheduledEndMs = toEpochMs(scheduledEndTime);
  }

  // 1. Calculate actual cancellation timestamp (UTC epoch ms)
  const cancellationTimeMs = cancelMs ?? Date.now();

  // 2. Normalize trip driving duration
  const totalMinutes = Math.max(1, Math.round(Number(totalTripMinutes) || 20));
  const tripDurationMs = totalMinutes * 60 * 1000;

  // 3. Determine scheduled trip end time
  let tripEndTimeMs: number;
  let anchorMs: number;

  if (scheduledEndMs && scheduledEndMs > 0) {
    tripEndTimeMs = scheduledEndMs;
    anchorMs = tripEndTimeMs - tripDurationMs;
  } else if (startMs && startMs > 0) {
    // Trip has actively started: scheduled trip end is started_at + trip duration
    anchorMs = startMs;
    tripEndTimeMs = startMs + tripDurationMs;
  } else if (arrivedMs && arrivedMs > 0) {
    // Trip has not started yet, but captain arrived at pickup: scheduled end is arrived_at + trip duration
    anchorMs = arrivedMs;
    tripEndTimeMs = arrivedMs + tripDurationMs;
  } else if (acceptedMs && acceptedMs > 0) {
    // Trip cancelled before starting: scheduled end is accepted_at + pickup ETA + trip duration
    anchorMs = acceptedMs;
    const pickupMs = (pickupEtaMins ?? 0) * 60 * 1000;
    tripEndTimeMs = acceptedMs + pickupMs + tripDurationMs;
  } else {
    // No prior anchor timestamp: scheduled from cancellation time
    anchorMs = cancellationTimeMs;
    tripEndTimeMs = cancellationTimeMs + tripDurationMs;
  }

  // 4. Calculate remaining duration: tripEndTime.difference(cancellationTime)
  const remainingDurationMs = tripEndTimeMs - cancellationTimeMs;

  // 5. freezeDuration = remainingDuration.isNegative ? Duration.zero : remainingDuration
  const freezeDurationMs = remainingDurationMs <= 0 ? 0 : remainingDurationMs;
  const remainingSeconds = Math.floor(freezeDurationMs / 1000);
  const remainingMinutes = remainingSeconds > 0 ? Math.ceil(remainingSeconds / 60) : 0;
  const elapsedSeconds = Math.max(0, Math.floor((cancellationTimeMs - anchorMs) / 1000));

  return {
    remainingMinutes,
    remainingSeconds,
    elapsedSeconds,
    scheduledEndTimeMs: tripEndTimeMs,
    cancellationTimeMs,
    freezeDurationMs,
  };
}

/**
 * Sets a lockout period for the captain on the radar equal to the remaining cancelled trip duration.
 * During this cooldown, the captain receives NO trip offers on their radar.
 * If duration is 0 or less, automatically clears any existing cooldown.
 */
export function setCaptainCancelCooldown(
  durationMinutes: number,
  durationSeconds?: number,
  untilTimestampMs?: number
) {
  if (typeof window === 'undefined') return;

  let until: number;
  let effectiveMinutes: number;

  if (typeof untilTimestampMs === 'number' && Number.isFinite(untilTimestampMs)) {
    if (untilTimestampMs <= Date.now()) {
      clearCaptainCancelCooldown();
      return;
    }
    until = Math.round(untilTimestampMs);
    const diffSec = Math.floor((until - Date.now()) / 1000);
    effectiveMinutes = Math.max(1, Math.ceil(diffSec / 60));
  } else if (typeof durationSeconds === 'number') {
    if (durationSeconds <= 0) {
      clearCaptainCancelCooldown();
      return;
    }
    const ms = Math.round(durationSeconds * 1000);
    until = Date.now() + ms;
    effectiveMinutes = Math.max(1, Math.ceil(durationSeconds / 60));
  } else {
    const numMinutes = Number(durationMinutes);
    if (!Number.isFinite(numMinutes) || numMinutes <= 0) {
      clearCaptainCancelCooldown();
      return;
    }
    const ms = numMinutes > 0 && numMinutes < 1
      ? Math.max(5000, Math.round(numMinutes * 60 * 1000))
      : Math.max(1, Math.round(numMinutes)) * 60 * 1000;
    until = Date.now() + ms;
    effectiveMinutes = numMinutes > 0 && numMinutes < 1
      ? 1
      : Math.max(1, Math.round(numMinutes));
  }

  try {
    localStorage.setItem(STORAGE_KEY_UNTIL, String(until));
    localStorage.setItem(STORAGE_KEY_MINUTES, String(effectiveMinutes));
    window.dispatchEvent(
      new CustomEvent('captain-cancel-cooldown-changed', {
        detail: { until, minutes: effectiveMinutes },
      }),
    );
  } catch {
    // Non-fatal if storage quota exceeded
  }
}

/**
 * Reads the live cooldown state. If expired, automatically purges the keys.
 */
export function getCaptainCancelCooldown(): CaptainCancelCooldownState {
  if (typeof window === 'undefined') {
    return { isActive: false, remainingSeconds: 0, totalMinutes: 0 };
  }
  try {
    const rawUntil = localStorage.getItem(STORAGE_KEY_UNTIL);
    const rawMinutes = localStorage.getItem(STORAGE_KEY_MINUTES);
    if (!rawUntil) {
      return { isActive: false, remainingSeconds: 0, totalMinutes: 0 };
    }
    const until = Number(rawUntil);
    const totalMinutes = Number(rawMinutes) || 15;
    const now = Date.now();
    if (!Number.isFinite(until) || now >= until) {
      localStorage.removeItem(STORAGE_KEY_UNTIL);
      localStorage.removeItem(STORAGE_KEY_MINUTES);
      return { isActive: false, remainingSeconds: 0, totalMinutes: 0 };
    }
    const remainingSeconds = Math.ceil((until - now) / 1000);
    return { isActive: true, remainingSeconds, totalMinutes };
  } catch {
    return { isActive: false, remainingSeconds: 0, totalMinutes: 0 };
  }
}

/**
 * Manually clears the lockout (e.g. for testing or administrative override).
 */
export function clearCaptainCancelCooldown() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY_UNTIL);
    localStorage.removeItem(STORAGE_KEY_MINUTES);
    window.dispatchEvent(
      new CustomEvent('captain-cancel-cooldown-changed', {
        detail: { until: 0, minutes: 0 },
      }),
    );
  } catch {
    // Ignore storage errors
  }
}

/**
 * Formats seconds into human-readable MM:SS or HH:MM:SS for countdown display.
 */
export function formatSecondsToMMSS(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return '0:00';
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const remM = m % 60;
    return `${h}:${remM.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}
