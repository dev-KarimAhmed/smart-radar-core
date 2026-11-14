'use client';

import React from 'react';
import { Car, Phone, Clock, Star, MapPin, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { getRankTheme } from '@/core/utils';
import { getCaptainCurrency, type CaptainUser } from '@/features/admin/types/driver-management';
import { DriverStatusBadge, DriverVerificationBadge } from './drivers-table-row-badges';
import { DriversTableRowActions } from './drivers-table-row-actions';

interface DriversTableRowProps {
  captain: CaptainUser;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onInspect: (cap: CaptainUser) => void;
  onTopup: (cap: CaptainUser) => void;
  onSecurity: (cap: CaptainUser) => void;
  onMessage: (cap: CaptainUser) => void;
  onToggleLanguage: (captainId: string, currentLang?: string) => void;
  isArabic: boolean;
  t: (key: string, values?: Record<string, any>) => string;
}

const styles = {
  tableRow: "border-b border-white/[0.06] transition-colors hover:bg-white/[0.03]",
} as const;

export function DriversTableRow({
  captain,
  isSelected,
  onToggleSelect,
  onInspect,
  onTopup,
  onSecurity,
  onMessage,
  onToggleLanguage,
  isArabic,
  t,
}: DriversTableRowProps) {
  const rankTheme = getRankTheme(captain.tier?.toLowerCase() || 'silver');
  const hasMinutes = captain.wallet.total_minutes > 0;

  return (
    <tr className={cn(styles.tableRow, isSelected && "bg-[#14B8A6]/[0.08] border-[#14B8A6]/30 hover:bg-[#14B8A6]/[0.12]")}>
      {/* Checkbox */}
      <td className="py-4 px-3 text-center">
        <button
          type="button"
          onClick={() => onToggleSelect(captain.id)}
          className={cn(
            "w-4 h-4 rounded-md border flex items-center justify-center transition-all cursor-pointer mx-auto",
            isSelected ? "bg-[#14B8A6] border-[#14B8A6] text-[#0B0F19]" : "border-white/20 bg-black/40 hover:border-white/40"
          )}
          title={isSelected ? t('unselectCaptainTooltip') : t('selectCaptainTooltip')}
        >
          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
        </button>
      </td>

      {/* Identity */}
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-[#14B8A6]/40 rounded-xl shadow-sm">
            <AvatarFallback className="bg-[#14B8A6]/15 text-[#14B8A6] font-black text-xs">
              {captain.full_name ? captain.full_name.substring(0, 2) : 'C'}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-black text-white text-sm tracking-wide">{captain.full_name}</span>
              <Badge variant="outline" className="font-mono text-[10px] font-bold bg-cyan-950/60 border-cyan-500/40 text-cyan-300 px-1.5 py-0.5 rounded-md">
                {captain.serial_id}
              </Badge>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLanguage(captain.id, captain.preferred_language);
                }}
                className="cursor-pointer transition-transform hover:scale-105 active:scale-95 inline-flex"
                title={isArabic ? 'اضغط لتغيير لغة الكابتن (عربي / English)' : 'Click to toggle captain language (AR / EN)'}
              >
                {(captain.preferred_language || 'ar').toLowerCase() === 'en' ? (
                  <Badge variant="outline" className="font-sans text-[9px] font-bold bg-blue-950/70 border-blue-500/40 text-blue-300 px-1.5 py-0 rounded flex items-center gap-1 hover:border-blue-400 hover:bg-blue-900/60 transition-colors">
                    <span>🇬🇧</span>
                    <span>EN</span>
                  </Badge>
                ) : (
                  <Badge variant="outline" className="font-sans text-[9px] font-bold bg-emerald-950/70 border-emerald-500/40 text-emerald-300 px-1.5 py-0 rounded flex items-center gap-1 hover:border-emerald-400 hover:bg-emerald-900/60 transition-colors">
                    <span>🇸🇦</span>
                    <span>AR</span>
                  </Badge>
                )}
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300 text-xs font-mono font-semibold" dir="ltr">
              <Phone className="h-3 w-3 text-[#14B8A6]" />
              <span>{captain.phone}</span>
            </div>
            {(captain.governorate || captain.country_name) && (
              <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium pt-0.5">
                <MapPin className="h-3 w-3 text-[#14B8A6] shrink-0" />
                <span className="truncate max-w-[180px]" title={`${captain.country_name ? `${captain.country_name} • ` : ''}${captain.governorate}${captain.district ? ` - ${captain.district}` : ''}`}>
                  {captain.country_name ? `${captain.country_name} • ` : ''}{captain.governorate}{captain.district ? ` - ${captain.district}` : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Vehicle */}
      <td className="py-4 px-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-white text-xs">
            <Car className="h-4 w-4 text-[#14B8A6] shrink-0" />
            <bdi className="font-black text-white text-xs tracking-wide">
              {captain.vehicle.brand || t('vehicleDefault')} {captain.vehicle.model}
            </bdi>
            {captain.vehicle.year ? (
              <span className="font-mono text-[10px] text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 px-1.5 py-0.5 rounded font-bold">
                {captain.vehicle.year}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-black text-[11px] bg-slate-900 border border-slate-700/80 px-2.5 py-0.5 rounded-md text-amber-300 tracking-wider inline-flex items-center gap-1 shadow-sm" dir="ltr">
              <span>{captain.vehicle.plate || t('noPlate')}</span>
            </span>
            {captain.vehicle.color && (
              <span className="text-[11px] text-slate-300 font-bold bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
                {captain.vehicle.color}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Flight Minutes & Balance */}
      <td className="py-4 px-4">
        <div className="space-y-1 font-mono">
          {hasMinutes ? (
            <>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-emerald-400" />
                <span className="font-black text-sm text-emerald-400">{captain.wallet.total_minutes}</span>
                <span className="text-xs font-bold text-slate-200">{t('minuteUnit')}</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-400/90 font-mono block">
                {t('flightHoursEst', { hours: (captain.wallet.total_minutes / 60).toFixed(1) })}
              </span>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-rose-400" />
                <span className="font-black text-sm text-rose-400">0</span>
                <span className="text-xs font-bold text-rose-300">{t('minuteUnit')}</span>
              </div>
              <span className="text-[10px] font-bold text-rose-300 bg-rose-500/15 border border-rose-500/30 px-1.5 py-0.5 rounded inline-block">
                {t('minutesExpired')}
              </span>
            </>
          )}
          <div className="flex items-center gap-1 text-[11px] font-mono text-amber-300 font-bold pt-1 border-t border-white/5">
            <span className="text-slate-400 text-[10px] font-normal">{t('cashPrefix')}</span>
            <span>{(captain.wallet.balance || 0).toFixed(2)} {getCaptainCurrency(captain, isArabic)}</span>
          </div>
        </div>
      </td>

      {/* Rank & Rating */}
      <td className="py-4 px-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn("text-xs font-black px-2.5 py-0.5 rounded-lg border", rankTheme.bg, rankTheme.color, rankTheme.border, rankTheme.glow)}>
              {isArabic ? rankTheme.label : (captain.tier || 'Silver')}
            </Badge>
            <div className="flex items-center gap-1 font-black font-mono text-amber-300 text-xs bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span>{captain.rating.toFixed(1)}</span>
            </div>
          </div>
          {captain.penalty_count > 0 && (
            <Badge className="bg-rose-500/15 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
              {t('penaltiesLogged', { count: captain.penalty_count })}
            </Badge>
          )}
        </div>
      </td>

      {/* Verification */}
      <td className="py-4 px-4">
        <DriverVerificationBadge status={captain.verification_status} isArabic={isArabic} t={t} />
      </td>

      {/* Operational */}
      <td className="py-4 px-4">
        <DriverStatusBadge status={captain.status} t={t} />
      </td>

      {/* Actions */}
      <td className="py-4 px-4 text-center">
        <DriversTableRowActions
          captain={captain}
          onInspect={onInspect}
          onTopup={onTopup}
          onSecurity={onSecurity}
          onMessage={onMessage}
          t={t}
        />
      </td>
    </tr>
  );
}
