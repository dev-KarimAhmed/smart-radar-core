'use client';

import React from 'react';
import { Eye, Zap, ShieldAlert, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CaptainUser } from '@/features/admin/types/driver-management';

interface DriversTableRowActionsProps {
  captain: CaptainUser;
  onInspect: (cap: CaptainUser) => void;
  onTopup: (cap: CaptainUser) => void;
  onSecurity: (cap: CaptainUser) => void;
  onMessage: (cap: CaptainUser) => void;
  t: (key: string, values?: Record<string, any>) => string;
}

export function DriversTableRowActions({
  captain,
  onInspect,
  onTopup,
  onSecurity,
  onMessage,
  t,
}: DriversTableRowActionsProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => onInspect(captain)}
        className="h-8 px-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
        title={t('btnInspectTooltip')}
      >
        <Eye className="h-3.5 w-3.5 text-cyan-400" />
        <span>{t('btnInspect')}</span>
      </Button>

      <Button
        type="button"
        size="sm"
        onClick={() => onTopup(captain)}
        className="h-8 px-3 rounded-xl border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-black flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
        title={t('btnTopupTooltip')}
      >
        <Zap className="h-3.5 w-3.5 text-emerald-400" />
        <span>{t('btnTopup')}</span>
      </Button>

      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => onSecurity(captain)}
        className="h-8 px-3 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
        title={t('btnSecurityTooltip')}
      >
        <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
        <span>{t('btnSecurity')}</span>
      </Button>

      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => onMessage(captain)}
        className="h-8 px-3 rounded-xl border border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
        title={t('btnMessageTooltip')}
      >
        <MessageSquare className="h-3.5 w-3.5 text-teal-400" />
        <span>{t('btnMessage')}</span>
      </Button>
    </div>
  );
}

