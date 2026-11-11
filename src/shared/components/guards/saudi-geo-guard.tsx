'use client';

import React, { useEffect, useState } from 'react';
import { ShieldAlert, Globe } from 'lucide-react';
import {
  isSaudiCoordinates,
  isSaudiCountryCode,
  SAUDI_RESTRICTION_MESSAGES,
} from '@/core/logic/saudi-restriction';

const STORAGE_BLOCK_KEY = 'radar_region_blocked';

const styles = {
  overlay: 'fixed inset-0 z-[999999] flex min-h-screen w-screen flex-col items-center justify-center bg-[#0A0F1D] p-6 text-center select-none font-sans backdrop-blur-3xl',
  glow: 'pointer-events-none absolute h-[400px] w-[400px] rounded-full bg-rose-500/15 blur-[140px]',
  card: 'relative z-10 mx-auto flex w-full max-w-md flex-col items-center rounded-3xl border border-rose-500/30 bg-[#111827]/95 p-8 shadow-2xl',
  iconWrap: 'mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-rose-500/40 bg-rose-500/10 text-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.25)]',
  iconShield: 'h-10 w-10 animate-pulse text-rose-400',
  titleAr: 'text-2xl font-black tracking-normal text-white',
  descAr: 'mt-3 text-sm leading-relaxed text-slate-300 font-medium',
  divider: 'my-6 h-px w-full bg-slate-800/80',
  titleEn: 'text-base font-bold text-slate-200',
  descEn: 'mt-1.5 text-xs text-slate-400 leading-relaxed',
  badge: 'mt-8 inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/80 px-4 py-1.5 text-[11px] font-bold text-slate-400',
  iconGlobe: 'h-3.5 w-3.5 text-rose-400',
} as const;

export function SaudiGeoGuard({ children }: { children: React.ReactNode }) {
  const [isBlocked, setIsBlocked] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        return window.localStorage.getItem(STORAGE_BLOCK_KEY) === 'SA';
      } catch {
        return false;
      }
    }
    return false;
  });

  useEffect(() => {
    let active = true;

    async function checkLocation() {
      // 1. Query internal API header check
      try {
        const res = await fetch('/api/geo/check', { cache: 'no-store' });
        if (res.ok) {
          const data = (await res.json()) as { isBlocked?: boolean; country?: string };
          if (data?.isBlocked || isSaudiCountryCode(data?.country)) {
            if (active) {
              window.localStorage.setItem(STORAGE_BLOCK_KEY, 'SA');
              setIsBlocked(true);
              return;
            }
          }
        }
      } catch {
        // Fall through to IP lookup
      }

      // 2. Client-side IP country verification
      try {
        const ipRes = await fetch('https://ipapi.co/json/', { cache: 'no-store' });
        if (ipRes.ok) {
          const payload = (await ipRes.json()) as { country_code?: string; country?: string };
          const code = String(payload.country_code || payload.country || '').trim().toUpperCase();
          if (code === 'SA' || code === 'SAU') {
            if (active) {
              window.localStorage.setItem(STORAGE_BLOCK_KEY, 'SA');
              setIsBlocked(true);
              return;
            }
          }
        }
      } catch {
        // Fall through to timezone / GPS
      }

      // 3. Client GPS Geolocation verification (if granted/available)
      if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (!active) return;
            const { latitude, longitude } = pos.coords;
            if (isSaudiCoordinates(latitude, longitude)) {
              window.localStorage.setItem(STORAGE_BLOCK_KEY, 'SA');
              setIsBlocked(true);
            }
          },
          () => {
            // Permission denied or unavailable - ignore
          },
          { timeout: 5000, maximumAge: 60000 },
        );
      }
    }

    void checkLocation();

    return () => {
      active = false;
    };
  }, []);

  if (isBlocked) {
    return (
      <div className={styles.overlay}>
        <div className={styles.glow} />
        <div className={styles.card}>
          <div className={styles.iconWrap}>
            <ShieldAlert className={styles.iconShield} />
          </div>

          <h1 className={styles.titleAr}>{SAUDI_RESTRICTION_MESSAGES.ar.regionBlockedTitle}</h1>
          <p className={styles.descAr}>{SAUDI_RESTRICTION_MESSAGES.ar.regionBlockedDesc}</p>

          <div className={styles.divider} />

          <h2 className={styles.titleEn}>{SAUDI_RESTRICTION_MESSAGES.en.regionBlockedTitle}</h2>
          <p className={styles.descEn}>{SAUDI_RESTRICTION_MESSAGES.en.regionBlockedDesc}</p>

          <div className={styles.badge}>
            <Globe className={styles.iconGlobe} />
            <span>Regional Restriction &bull; KSA Access Prohibited</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
