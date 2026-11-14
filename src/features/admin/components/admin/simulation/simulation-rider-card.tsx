import React from 'react';
import { useTranslations } from 'next-intl';
import { Phone, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { RiderUser } from '../riders-management-panel';

interface SimulationRiderCardProps {
  selectedRider: RiderUser;
  isUpdatingStatus: boolean;
  onUpdateStatus: (status: 'ACTIVE' | 'IDLE') => void;
}

export function SimulationRiderCard({
  selectedRider,
  isUpdatingStatus,
  onUpdateStatus,
}: SimulationRiderCardProps) {
  const t = useTranslations('adminRiders');
  const referralInfo = selectedRider.referral_activity;
  const isCurrentlyActive = referralInfo?.is_active ?? true;
  const daysInactive = referralInfo?.days_inactive ?? 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/50 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-white">{selectedRider.full_name}</span>
          <Badge variant="outline" className="font-mono text-[10px] bg-cyan-950/60 border-cyan-500/40 text-cyan-300">
            {selectedRider.serial_id}
          </Badge>
          <Badge
            className={cn(
              "text-[10px] font-black border",
              !isCurrentlyActive
                ? "bg-amber-950/80 border-amber-500/40 text-amber-300"
                : "bg-emerald-950/80 border-emerald-500/40 text-emerald-300"
            )}
          >
            {!isCurrentlyActive ? `${t('simulationInactiveBadge', { days: daysInactive })} ⚠️` : `${t('simulationActiveBadge')} 🟢`}
          </Badge>
          <Badge variant="outline" className="text-[10px] font-bold border-white/20 text-slate-300">
            {selectedRider.status}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1 font-mono text-slate-300" dir="ltr">
            <Phone className="h-3 w-3 text-amber-400" />
            <span>{selectedRider.phone}</span>
          </span>
          <span>•</span>
          <span className="text-slate-300">
            {referralInfo?.captain_name ? (
              <span className="text-amber-200">
                {t('simulationLinkedCaptain')} {referralInfo.captain_name} ({referralInfo.captain_serial || referralInfo.captain_phone})
              </span>
            ) : (
              <span className="text-slate-400 italic">
                {t('simulationNoLinkedCaptain')}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Quick Direct Status Toggle (ACTIVE / IDLE) */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isUpdatingStatus || selectedRider.status === 'ACTIVE'}
          onClick={() => onUpdateStatus('ACTIVE')}
          className="h-8 text-xs font-bold border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <CheckCircle2 className="h-3.5 w-3.5 ml-1 text-emerald-400" />
          <span>{t('simulationMakeActive')}</span>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isUpdatingStatus || selectedRider.status === 'IDLE'}
          onClick={() => onUpdateStatus('IDLE')}
          className="h-8 text-xs font-bold border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
        >
          <span>{t('simulationMakeIdle')}</span>
        </Button>
      </div>
    </div>
  );
}
