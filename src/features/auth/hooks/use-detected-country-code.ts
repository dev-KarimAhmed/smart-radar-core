'use client';

import { useEffect, useState } from 'react';

/**
 * Best-effort IP-based country detection for defaulting the signup country
 * selector. Used by both the rider/advertiser/delegate flow (`use-registration.tsx`)
 * and the captain onboarding flow (via the auth contract) so a visitor never has
 * to hunt for their own country in a long list.
 */
export function useDetectedCountryCode(): string | null {
  const [detectedCountryCode, setDetectedCountryCode] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function detectSignupCountry() {
      try {
        const response = await fetch('https://ipapi.co/json/', { cache: 'no-store' });
        if (!response.ok) return;
        const payload = (await response.json()) as { country_code?: string; country?: string };
        const code = String(payload.country_code || payload.country || '').trim().toUpperCase();
        if (active && code) setDetectedCountryCode(code);
      } catch (error) {
        if ((process.env.NODE_ENV !== 'production')) console.warn('[IP Country Detect]', error);
      }
    }

    void detectSignupCountry();

    return () => {
      active = false;
    };
  }, []);

  return detectedCountryCode;
}
