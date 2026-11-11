'use client';

import React from 'react';
import { ShieldAlert, Globe } from 'lucide-react';
import { SAUDI_RESTRICTION_MESSAGES } from '@/core/logic/saudi-restriction';

const styles = {
  container: 'relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#0A0F1D] p-6 text-center select-none font-sans',
  ambientGlow: 'pointer-events-none absolute h-[400px] w-[400px] rounded-full bg-rose-500/10 blur-[120px]',
  card: 'relative z-10 mx-auto flex w-full max-w-md flex-col items-center rounded-3xl border border-rose-500/30 bg-[#111827]/85 p-8 shadow-2xl backdrop-blur-xl',
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

export default function BlockedRegionPage() {
  return (
    <main className={styles.container}>
      <div className={styles.ambientGlow} />

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
          <span>Regional Availability Notice &bull; KSA (SA) Restricted</span>
        </div>
      </div>
    </main>
  );
}
