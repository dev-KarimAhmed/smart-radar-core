'use client';

import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const badgeBaseStyle = "inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border shadow-sm";

interface DriverStatusBadgeProps {
  status: string;
  t: (key: string, values?: Record<string, any>) => string;
}

export function DriverStatusBadge({ status, t }: DriverStatusBadgeProps) {
  switch (status) {
    case 'ACTIVE':
      return (
        <span className={cn(badgeBaseStyle, "bg-emerald-500/15 text-emerald-300 border-emerald-500/30")}>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          {t('statusBadgeActive')}
        </span>
      );
    case 'BUSY':
      return (
        <span className={cn(badgeBaseStyle, "bg-amber-500/15 text-amber-300 border-amber-500/30")}>
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          {t('statusBadgeBusy')}
        </span>
      );
    case 'SUSPENDED':
      return (
        <span className={cn(badgeBaseStyle, "bg-rose-500/15 text-rose-300 border-rose-500/30")}>
          <XCircle className="w-3.5 h-3.5 text-rose-400" />
          {t('statusBadgeSuspended')}
        </span>
      );
    case 'BANNED':
      return (
        <span className={cn(badgeBaseStyle, "bg-red-950/80 text-red-300 border-red-500/40")}>
          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
          {t('statusBadgeBanned')}
        </span>
      );
    case 'IDLE':
    default:
      return (
        <span className={cn(badgeBaseStyle, "bg-slate-800/80 text-slate-200 border-slate-700")}>
          <span className="w-2 h-2 rounded-full bg-slate-400" />
          {t('statusBadgeIdle')}
        </span>
      );
  }
}

interface DriverVerificationBadgeProps {
  status: string;
  isArabic: boolean;
  t: (key: string, values?: Record<string, any>) => string;
}

export function DriverVerificationBadge({ status, isArabic, t }: DriverVerificationBadgeProps) {
  switch (status) {
    case 'APPROVED':
      return (
        <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 text-xs font-bold px-2.5 py-1 shadow-sm">
          <CheckCircle2 className={cn("w-3.5 h-3.5 text-emerald-400", isArabic ? "ml-1" : "mr-1")} />
          {t('verBadgeApproved')}
        </Badge>
      );
    case 'REJECTED':
      return (
        <Badge className="bg-rose-500/15 text-rose-300 border border-rose-500/40 text-xs font-bold px-2.5 py-1 shadow-sm">
          <XCircle className={cn("w-3.5 h-3.5 text-rose-400", isArabic ? "ml-1" : "mr-1")} />
          {t('verBadgeRejected')}
        </Badge>
      );
    case 'PENDING':
    default:
      return (
        <Badge className="bg-amber-500/15 text-amber-300 border border-amber-500/40 text-xs font-bold px-2.5 py-1 shadow-sm">
          <AlertTriangle className={cn("w-3.5 h-3.5 text-amber-400", isArabic ? "ml-1" : "mr-1")} />
          {t('verBadgeAuto')}
        </Badge>
      );
  }
}

