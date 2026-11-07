'use client';

import React from 'react';
import {
  Phone,
  MapPin,
  CheckCircle2,
  FlaskConical,
  Eye,
  ShieldAlert,
  MessageSquare,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { RiderUser, styles } from './riders-types';

interface RiderTableRowProps {
  rider: RiderUser;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onInspect: (rider: RiderUser) => void;
  onSecurity: (rider: RiderUser) => void;
  onMessage: (rider: RiderUser) => void;
  onSimulate: (rider: RiderUser) => void;
  getStatusBadge: (status: string) => React.ReactNode;
  getImmunityBadge: (score: number) => React.ReactNode;
  isArabic: boolean;
  t: (key: any, values?: any) => string;
}

export function RiderTableRow({
  rider,
  isSelected,
  onToggleSelect,
  onInspect,
  onSecurity,
  onMessage,
  onSimulate,
  getStatusBadge,
  getImmunityBadge,
  isArabic,
  t,
}: RiderTableRowProps) {
  const isAtRisk = rider.trust_score < 4.2 || rider.consecutive_cancellations >= 3;

  return (
    <tr className={styles.tableRow}>
      {/* Checkbox */}
      <td className="py-4 px-3 text-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(rider.id)}
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
              <Badge
                variant="outline"
                className="font-mono text-[10px] font-bold bg-cyan-950/60 border-cyan-500/40 text-cyan-300 px-1.5 py-0.5 rounded-md"
              >
                {rider.serial_id}
              </Badge>
            </div>
            <div
              className="flex items-center gap-1.5 text-slate-300 text-xs font-mono font-semibold"
              dir="ltr"
            >
              <Phone className="h-3 w-3 text-cyan-400" />
              <span>{rider.phone}</span>
            </div>
          </div>
        </div>
      </td>

      {/* 2. Location */}
      <td className="py-4 px-4">
        <span
          className="inline-flex items-center gap-1.5 text-slate-200 font-bold bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg text-xs"
          title={`${rider.country_name ? `${rider.country_name} • ` : ''}${rider.governorate} - ${rider.district}`}
        >
          <MapPin className="h-3.5 w-3.5 text-[#14B8A6] shrink-0" />
          {rider.country_name ? `${rider.country_name} • ` : ''}
          {rider.governorate} - {rider.district}
        </span>
      </td>

      {/* 3. Behavioral Immunity Trust Score */}
      <td className="py-4 px-4">{getImmunityBadge(rider.trust_score)}</td>

      {/* 4. Completed Trips */}
      <td className="py-4 px-4">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 font-mono font-bold px-2.5 py-1 rounded-lg text-xs border shadow-sm",
            (rider.completed_trips_count ?? 0) > 0
              ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
              : "bg-black/40 border-white/10 text-slate-400"
          )}
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          <span>{t('tripsCount', { count: rider.completed_trips_count ?? 0 })}</span>
        </span>
      </td>

      {/* 5. Consecutive cancellations */}
      <td className="py-4 px-4">
        {rider.consecutive_cancellations > 0 ? (
          <Badge
            className={cn(
              "font-mono font-bold text-xs px-2.5 py-1 border shadow-sm",
              rider.consecutive_cancellations >= 3
                ? "bg-red-950/80 text-red-300 border-red-500/40"
                : "bg-amber-950/80 text-amber-300 border-amber-500/40"
            )}
          >
            {t('cancellationsCount', { count: rider.consecutive_cancellations })} ⚠️
          </Badge>
        ) : (
          <span className="text-slate-400 font-mono text-xs font-semibold">
            {t('cancellationsCount', { count: 0 })}
          </span>
        )}
      </td>

      {/* 6. Status */}
      <td className="py-4 px-4">{getStatusBadge(rider.status)}</td>

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
              <p
                className="text-[10px] text-slate-400 truncate max-w-[130px]"
                title={rider.referral_activity.captain_name}
              >
                كابتن: {rider.referral_activity.captain_name}
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
        <div className="flex items-center justify-center gap-2">
          {/* Inactivity Simulation */}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onSimulate(rider)}
            className="h-8 px-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer"
            title={isArabic ? 'فتح لوحة المحاكاة لهذا الراكب' : 'Open simulation for this rider'}
          >
            <FlaskConical className="h-3.5 w-3.5 text-amber-400" />
            <span>{isArabic ? 'محاكاة 🧪' : 'Simulate 🧪'}</span>
          </Button>

          {/* Inspect */}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onInspect(rider)}
            className="h-8 px-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            title={t('btnInspectTooltip')}
          >
            <Eye className="h-3.5 w-3.5 text-cyan-400" />
            <span>{t('btnInspect')}</span>
          </Button>

          {/* Security & Immunity Reset */}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onSecurity(rider)}
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

          {/* Direct Message / Notification */}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onMessage(rider)}
            className="h-8 px-3 rounded-xl border border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            title={t('btnMessageTooltip')}
          >
            <MessageSquare className="h-3.5 w-3.5 text-teal-400" />
            <span>{t('btnMessage')}</span>
          </Button>
        </div>
      </td>
    </tr>
  );
}
