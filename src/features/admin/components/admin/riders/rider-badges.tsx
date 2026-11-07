'use client';

import React from 'react';
import {
  Star,
  ShieldAlert,
  AlertTriangle,
  XCircle,
  AlertOctagon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { styles } from './riders-types';

export function getRiderStatusBadge(
  status: string,
  t: (key: any, values?: any) => string,
  isArabic: boolean
) {
  switch (status) {
    case 'ACTIVE':
      return (
        <span className={cn(styles.statusBadge, "bg-emerald-500/15 text-emerald-300 border-emerald-500/30")}>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          {t('statusActiveBadge')}
        </span>
      );
    case 'BUSY':
      return (
        <span className={cn(styles.statusBadge, "bg-amber-500/15 text-amber-300 border-amber-500/30")}>
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          {isArabic ? 'في رحلة' : 'On Trip'}
        </span>
      );
    case 'SUSPENDED':
      return (
        <span className={cn(styles.statusBadge, "bg-rose-500/15 text-rose-300 border-rose-500/30")}>
          <XCircle className="w-3.5 h-3.5 text-rose-400" />
          {t('statusSuspendedBadge')}
        </span>
      );
    case 'BANNED':
      return (
        <span className={cn(styles.statusBadge, "bg-red-950/80 text-red-300 border-red-500/40")}>
          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
          {t('statusBannedBadge')}
        </span>
      );
    case 'IDLE':
    default:
      return (
        <span className={cn(styles.statusBadge, "bg-slate-800/80 text-slate-200 border-slate-700")}>
          <span className="w-2 h-2 rounded-full bg-slate-400" />
          {t('statusIdleBadge')}
        </span>
      );
  }
}

export function getRiderImmunityBadge(
  score: number,
  t: (key: any, values?: any) => string
) {
  if (score >= 4.5) {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-xs shadow-sm">
        <Star className="h-3.5 w-3.5 fill-emerald-400 text-emerald-400" />
        <span>{score.toFixed(1)}</span>
        <span className="text-[10px] text-emerald-400/90 font-bold">{t('excellentTag')}</span>
      </span>
    );
  }
  if (score >= 4.2) {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-lg text-xs shadow-sm">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
        <span>{score.toFixed(1)}</span>
        <span className="text-[10px] text-amber-400/90 font-bold">{t('warningTag')}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 font-mono font-bold text-rose-300 bg-rose-500/20 border border-rose-500/40 px-2.5 py-1 rounded-lg text-xs shadow-sm animate-pulse">
      <AlertOctagon className="h-3.5 w-3.5 text-rose-400" />
      <span>{score.toFixed(1)}</span>
      <span className="text-[10px] text-rose-300 font-bold">{t('criticalTag')}</span>
    </span>
  );
}
