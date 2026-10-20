'use client';

const STORAGE_KEY_UNTIL = 'radar_captain_cancel_cooldown_until';
const STORAGE_KEY_MINUTES = 'radar_captain_cancel_cooldown_minutes';

export interface CaptainCancelCooldownState {
  isActive: boolean;
  remainingSeconds: number;
  totalMinutes: number;
}

/**
 * Sets a lockout period for the captain on the radar equal to the cancelled trip duration.
 * During this cooldown, the captain receives NO trip offers on their radar.
 */
export function setCaptainCancelCooldown(durationMinutes: number) {
  if (typeof window === 'undefined') return;
  const numMinutes = Number(durationMinutes);
  const ms = numMinutes > 0 && numMinutes < 1
    ? Math.max(5000, Math.round(numMinutes * 60 * 1000))
    : Math.max(1, Math.round(numMinutes || 15)) * 60 * 1000;
  const until = Date.now() + ms;
  try {
    localStorage.setItem(STORAGE_KEY_UNTIL, String(until));
    localStorage.setItem(STORAGE_KEY_MINUTES, String(Math.max(1, Math.round(numMinutes || 1))));
    window.dispatchEvent(
      new CustomEvent('captain-cancel-cooldown-changed', {
        detail: { until, minutes: Math.max(1, Math.round(numMinutes || 1)) },
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

