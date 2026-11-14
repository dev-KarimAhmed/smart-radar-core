'use client';

import React from 'react';
import { Eye, ShieldAlert, MessageSquare, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { RiderUser } from '@/features/admin/types/rider-management';

interface RidersTableActionsProps {
  rider: RiderUser;
  isAtRisk: boolean;
  onOpenSimulation: () => void;
  onInspect: () => void;
  onSecurity: () => void;
  onMessage: () => void;
  isArabic: boolean;
  t: (key: string, values?: any) => string;
}

export function RidersTableActions({
  isAtRisk,
  onOpenSimulation,
  onInspect,
  onSecurity,
  onMessage,
  isArabic,
  t,
}: RidersTableActionsProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={onOpenSimulation}
        className="h-8 px-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer"
        title={isArabic ? 'فتح لوحة المحاكاة لهذا الراكب' : 'Open simulation for this rider'}
      >
        <FlaskConical className="h-3.5 w-3.5 text-amber-400" />
        <span>{isArabic ? 'محاكاة 🧪' : 'Simulate 🧪'}</span>
      </Button>

      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={onInspect}
        className="h-8 px-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
        title={t('btnInspectTooltip')}
      >
        <Eye className="h-3.5 w-3.5 text-cyan-400" />
        <span>{t('btnInspect')}</span>
      </Button>

      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={onSecurity}
        className={cn(
          "h-8 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer",
          isAtRisk
            ? "border-rose-500/40 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25"
            : "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
        )}
        title={t('btnSecurityTooltip')}
      >
        <ShieldAlert className="h-3.5 w-3.5" />
        <span>{t('btnSecurity')}</span>
      </Button>

      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={onMessage}
        className="h-8 px-3 rounded-xl border border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
        title={t('btnMessageTooltip')}
      >
        <MessageSquare className="h-3.5 w-3.5 text-teal-400" />
        <span>{t('btnMessage')}</span>
      </Button>
    </div>
  );
}

