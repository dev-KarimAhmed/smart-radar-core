'use client';

import { useState, useEffect } from 'react';

export interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

export function calculateRemainingTime(expiresAt?: string, subscribedAt?: string): TimeRemaining {
  let targetMs = expiresAt ? new Date(expiresAt).getTime() : 0;
  if (!targetMs || Number.isNaN(targetMs)) {
    const startMs = subscribedAt ? new Date(subscribedAt).getTime() : Date.now();
    targetMs = startMs + 30 * 24 * 60 * 60 * 1000;
  }

  const diffMs = Math.max(0, targetMs - Date.now());
  if (diffMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, isExpired: false };
}

export function useAdPackageCountdown(isActive: boolean, expiresAt?: string, subscribedAt?: string): TimeRemaining {
  const [timeLeft, setTimeLeft] = useState<TimeRemaining>(() =>
    calculateRemainingTime(expiresAt, subscribedAt)
  );

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setTimeLeft(calculateRemainingTime(expiresAt, subscribedAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, expiresAt, subscribedAt]);

  return timeLeft;
}
