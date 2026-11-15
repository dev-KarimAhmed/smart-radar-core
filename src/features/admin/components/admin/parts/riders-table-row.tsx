'use client';

import React from 'react';
import {
  Phone,
  MapPin,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Star,
  AlertTriangle,
  AlertOctagon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { RiderUser } from '@/features/admin/types/rider-management';
import { RidersTableActions } from './riders-table-actions';

interface RidersTableRowProps {
  rider: RiderUser;
  isSelected: boolean;
  onToggleSelect: () => void;
  onOpenSimulation: () => void;
  onInspect: () => void;
  onSecurity: () => void;
  onMessage: () => void;
  isArabic: boolean;
  t: (key: string, values?: any) => string;
}

export function RidersTableRow({
  rider,
  isSelected,
  onToggleSelect,
  onOpenSimulation,
  onInspect,
  onSecurity,
  onMessage,
  isArabic,
  t,
}: RidersTableRowProps) {
  const isAtRisk = rider.trust_score < 4.2 || rider.consecutive_cancellations >= 3;

  const renderStatusBadge = () => {
    const config: Record<string, { bg: string; dot?: string; icon?: React.ReactNode; label: string }> = {
      ACTIVE: { bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-400 animate-pulse', label: t('statusActiveBadge') },
      BUSY: { bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30', dot: 'bg-amber-400 animate-pulse', label: isArabic ? 'في رحلة' : 'On Trip' },
      SUSPENDED: { bg: 'bg-rose-500/15 text-rose-300 border-rose-500/30', icon: <XCircle className="w-3.5 h-3.5 text-rose-400" />, label: t('statusSuspendedBadge') },
      BANNED: { bg: 'bg-red-950/80 text-red-300 border-red-500/40', icon: <ShieldAlert className="w-3.5 h-3.5 text-red-400" />, label: t('statusBannedBadge') },
      IDLE: { bg: 'bg-slate-800/80 text-slate-200 border-slate-700', dot: 'bg-slate-400', label: t('statusIdleBadge') },
    };
    const c = config[rider.status] || config.IDLE;
    return (
      <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border shadow-sm", c.bg)}>
        {c.dot && <span className={cn("w-2 h-2 rounded-full", c.dot)} />}
        {c.icon}
        {c.label}
      </span>
    );
  };

  const renderImmunityBadge = () => {
    if (rider.trust_score >= 4.5) {
      return (
        <span className="inline-flex items-center gap-1.5 font-mono font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-xs shadow-sm">
          <Star className="h-3.5 w-3.5 fill-emerald-400 text-emerald-400" />
          <span>{rider.trust_score.toFixed(1)}</span>
          <span className="text-[10px] text-emerald-400/90 font-bold">{t('excellentTag')}</span>
        </span>
      );
    }
    if (rider.trust_score >= 4.2) {
      return (
        <span className="inline-flex items-center gap-1.5 font-mono font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-lg text-xs shadow-sm">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
          <span>{rider.trust_score.toFixed(1)}</span>
          <span className="text-[10px] text-amber-400/90 font-bold">{t('warningTag')}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 font-mono font-bold text-rose-300 bg-rose-500/20 border border-rose-500/40 px-2.5 py-1 rounded-lg text-xs shadow-sm animate-pulse">
        <AlertOctagon className="h-3.5 w-3.5 text-rose-400" />
        <span>{rider.trust_score.toFixed(1)}</span>
        <span className="text-[10px] text-rose-300 font-bold">{t('criticalTag')}</span>
      </span>
    );
  };

  return (
    <tr className="border-b border-white/[0.06] transition-colors hover:bg-white/[0.03]">
      {/* Checkbox */}
      <td className="py-4 px-3 text-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="rounded border-white/20 bg-black/60 text-cyan-500 focus:ring-cyan-500 h-4 w-4 cursor-pointer"
          title={t('selectRider')}
        />
      </td>

      {/* 1. Identity */}
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-cyan-500/40 rounded-xl shadow-sm">
            <AvatarFallback className="bg-cyan-500/15 text-cyan-400 font-black text-xs">
              {rider.full_name ? rider.full_name.substring(0, 2) : 'R'}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-black text-white text-sm tracking-wide">{rider.full_name}</span>
              <Badge variant="outline" className="font-mono text-[10px] font-bold bg-cyan-950/60 border-cyan-500/40 text-cyan-300 px-1.5 py-0.5 rounded-md">
                {rider.serial_id}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300 text-xs font-mono font-semibold" dir="ltr">
              <Phone className="h-3 w-3 text-cyan-400" />
              <span>{rider.phone}</span>
            </div>
          </div>
        </div>
      </td>

      {/* 2. Location */}
      <td className="py-4 px-4">
        <span className="inline-flex items-center gap-1.5 text-slate-200 font-bold bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg text-xs" title={`${rider.country_name ? `${rider.country_name} • ` : ''}${rider.governorate} - ${rider.district}`}>
          <MapPin className="h-3.5 w-3.5 text-[#14B8A6] shrink-0" />
          {rider.country_name ? `${rider.country_name} • ` : ''}{rider.governorate} - {rider.district}
        </span>
      </td>

      {/* 3. Behavioral Immunity Trust Score */}
      <td className="py-4 px-4">{renderImmunityBadge()}</td>

      {/* 4. Completed Trips */}
      <td className="py-4 px-4">
        <span className={cn(
          "inline-flex items-center gap-1.5 font-mono font-bold px-2.5 py-1 rounded-lg text-xs border shadow-sm",
          (rider.completed_trips_count ?? 0) > 0
            ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
            : "bg-black/40 border-white/10 text-slate-400"
        )}>
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          <span>{t('tripsCount', { count: rider.completed_trips_count ?? 0 })}</span>
        </span>
      </td>

      {/* 5. Consecutive cancellations */}
      <td className="py-4 px-4">
        {rider.consecutive_cancellations > 0 ? (
          <Badge className={cn(
            "font-mono font-bold text-xs px-2.5 py-1 border shadow-sm",
            rider.consecutive_cancellations >= 3
              ? "bg-red-950/80 text-red-300 border-red-500/40"
              : "bg-amber-950/80 text-amber-300 border-amber-500/40"
          )}>
            {t('cancellationsCount', { count: rider.consecutive_cancellations })} ⚠️
          </Badge>
        ) : (
          <span className="text-slate-400 font-mono text-xs font-semibold">{t('cancellationsCount', { count: 0 })}</span>
        )}
      </td>

      {/* 6. Status */}
      <td className="py-4 px-4">{renderStatusBadge()}</td>

      {/* 6.5. Referral Activity & Engagement */}
      <td className="py-4 px-4">
        {rider.referral_activity ? (
          <div className="space-y-1">
            <Badge
              className={cn(
                "text-[10px] font-black border shadow-sm",
                !rider.referral_activity.is_active
                  ? "bg-amber-950/80 border-amber-500/40 text-amber-300"
                  : "bg-emerald-950/80 border-emerald-500/40 text-emerald-300"
              )}
            >
              {!rider.referral_activity.is_active
                ? `${t('simulationInactiveBadge', { days: rider.referral_activity.days_inactive ?? 0 })} ⚠️`
                : `${t('simulationActiveBadge')} 🟢`}
            </Badge>
            {rider.referral_activity.captain_name ? (
              <p className="text-[10px] text-slate-400 truncate max-w-[130px]" title={rider.referral_activity.captain_name}>
                {isArabic ? 'كابتن:' : 'Captain:'} {rider.referral_activity.captain_name}
              </p>
            ) : null}
          </div>
        ) : (
          <Badge variant="outline" className="text-[10px] border-white/10 text-slate-500 font-bold">
            {isArabic ? 'حر / غير محال' : 'Unlinked'}
          </Badge>
        )}
      </td>

      {/* 7. Action buttons */}
      <td className="py-4 px-4 text-center">
        <RidersTableActions
          rider={rider}
          isAtRisk={isAtRisk}
          onOpenSimulation={onOpenSimulation}
          onInspect={onInspect}
          onSecurity={onSecurity}
          onMessage={onMessage}
          isArabic={isArabic}
          t={t}
        />
      </td>
    </tr>
  );
}
