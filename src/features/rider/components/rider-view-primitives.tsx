'use client';

import React from 'react';
import { cn } from '@/lib/utils';

const styles = {
  metricWrapper: "min-w-0 space-y-1",
  metricLabel: "block text-[10px] font-bold text-slate-500",
  metricValue: "block truncate text-xs font-black text-white",
  navButton: "h-10 rounded-xl border text-xs font-black transition",
  navButtonActive: "border-[#14B8A6]/45 bg-[#14B8A6]/15 text-[#14F5D5]",
  navButtonInactive: "border-white/10 bg-black/20 text-slate-400 hover:border-[#14B8A6]/25 hover:text-white",
} as const;

export function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className={styles.metricWrapper}>
      <span className={styles.metricLabel}>{label}</span>
      <span className={styles.metricValue}>{value}</span>
    </div>
  );
}

export function NavButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(styles.navButton, active ? styles.navButtonActive : styles.navButtonInactive)}
    >
      {children}
    </button>
  );
}
