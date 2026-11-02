'use client';

const STORAGE_KEY_UNTIL = 'radar_captain_cancel_cooldown_until';
const STORAGE_KEY_MINUTES = 'radar_captain_cancel_cooldown_minutes';

export interface CaptainCancelCooldownState {
  isActive: boolean;
  remainingSeconds: number;
  totalMinutes: number;
}

/**
 * Calculates remaining trip duration in minutes and seconds.
 * If trip was started, deducts elapsed time (now - startedAtMs) from total estimated duration.
 * If trip was not started yet, returns the full estimated trip duration.
 *
 * Example: 60-minute trip cancelled halfway (30 min elapsed) -> 30 min remaining cooldown.
 */
export function calculateRemainingCooldown(
  totalTripMinutes: number,
  startedAtMs?: number | null,
  nowMs: number = Date.now()
): { remainingMinutes: number; remainingSeconds: number; elapsedSeconds: number } {
  const totalMinutes = Math.max(1, Math.round(Number(totalTripMinutes) || 20));
  const totalSeconds = totalMinutes * 60;

  if (!startedAtMs || startedAtMs <= 0 || nowMs < startedAtMs) {
    return {
      remainingMinutes: totalMinutes,
      remainingSeconds: totalSeconds,
      elapsedSeconds: 0,
    };
  }

  const elapsedSeconds = Math.max(0, Math.floor((nowMs - startedAtMs) / 1000));
  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
  const remainingMinutes = remainingSeconds > 0 ? Math.ceil(remainingSeconds / 60) : 0;

  return {
    remainingMinutes,
    remainingSeconds,
    elapsedSeconds,
  };
}

/**
 * Sets a lockout period for the captain on the radar equal to the remaining cancelled trip duration.
 * During this cooldown, the captain receives NO trip offers on their radar.
 * If duration is 0 or less, automatically clears any existing cooldown.
 */
export function setCaptainCancelCooldown(durationMinutes: number, durationSeconds?: number) {
  if (typeof window === 'undefined') return;

  let ms: number;
  let effectiveMinutes: number;

  if (typeof durationSeconds === 'number') {
    if (durationSeconds <= 0) {
      clearCaptainCancelCooldown();
      return;
    }
    ms = Math.round(durationSeconds * 1000);
    effectiveMinutes = Math.max(1, Math.ceil(durationSeconds / 60));
  } else {
    const numMinutes = Number(durationMinutes);
    if (!Number.isFinite(numMinutes) || numMinutes <= 0) {
      clearCaptainCancelCooldown();
      return;
    }
    ms = numMinutes > 0 && numMinutes < 1
      ? Math.max(5000, Math.round(numMinutes * 60 * 1000))
      : Math.max(1, Math.round(numMinutes)) * 60 * 1000;
    effectiveMinutes = numMinutes > 0 && numMinutes < 1
      ? 1
      : Math.max(1, Math.round(numMinutes));
  }

  const until = Date.now() + ms;
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
