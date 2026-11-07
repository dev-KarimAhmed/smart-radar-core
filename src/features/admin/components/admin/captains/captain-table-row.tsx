import React from 'react';
import {
  Car,
  Clock,
  Phone,
  MapPin,
  Star,
  Check,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  AlertTriangle,
  Eye,
  Zap,
  MessageSquare,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getRankTheme } from '@/core/utils';
import { cn } from '@/lib/utils';
import { CaptainUser, getCaptainCurrency, styles } from './captains-types';

interface CaptainTableRowProps {
  captain: CaptainUser;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onToggleLanguage: (id: string, currentLang?: string) => void;
  onInspect: (cap: CaptainUser) => void;
  onTopup: (cap: CaptainUser) => void;
  onSecurity: (cap: CaptainUser) => void;
  onMessage: (cap: CaptainUser) => void;
  isArabic: boolean;
  t: (key: string, params?: Record<string, any>) => string;
}

export const CaptainTableRow: React.FC<CaptainTableRowProps> = ({
  captain,
  isSelected,
  onToggleSelect,
  onToggleLanguage,
  onInspect,
  onTopup,
  onSecurity,
  onMessage,
  isArabic,
  t,
}) => {
  const rankTheme = getRankTheme(captain.tier?.toLowerCase() || 'silver');
  const hasMinutes = captain.wallet.total_minutes > 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className={cn(styles.statusBadge, "bg-emerald-500/15 text-emerald-300 border-emerald-500/30")}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {t('statusBadgeActive')}
          </span>
        );
      case 'BUSY':
        return (
          <span className={cn(styles.statusBadge, "bg-amber-500/15 text-amber-300 border-amber-500/30")}>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            {t('statusBadgeBusy')}
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className={cn(styles.statusBadge, "bg-rose-500/15 text-rose-300 border-rose-500/30")}>
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            {t('statusBadgeSuspended')}
          </span>
        );
      case 'BANNED':
        return (
          <span className={cn(styles.statusBadge, "bg-red-950/80 text-red-300 border-red-500/40")}>
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            {t('statusBadgeBanned')}
          </span>
        );
      case 'IDLE':
      default:
        return (
          <span className={cn(styles.statusBadge, "bg-slate-800/80 text-slate-200 border-slate-700")}>
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            {t('statusBadgeIdle')}
          </span>
        );
    }
  };

  const getVerificationBadge = (ver: string) => {
    switch (ver) {
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
  };

  return (
    <tr
      className={cn(
        styles.tableRow,
        isSelected && "bg-[#14B8A6]/[0.08] border-[#14B8A6]/30 hover:bg-[#14B8A6]/[0.12]"
      )}
    >
      {/* Row Checkbox */}
      <td className="py-4 px-3 text-center">
        <button
          type="button"
          onClick={() => onToggleSelect(captain.id)}
          className={cn(
            "w-4 h-4 rounded-md border flex items-center justify-center transition-all cursor-pointer mx-auto",
            isSelected
              ? "bg-[#14B8A6] border-[#14B8A6] text-[#0B0F19]"
              : "border-white/20 bg-black/40 hover:border-white/40"
          )}
          title={isSelected ? t('unselectCaptainTooltip') : t('selectCaptainTooltip')}
        >
          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
        </button>
      </td>

      {/* 1. Identity */}
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

      {/* 2. Vehicle */}
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

      {/* 3. Flight Minutes */}
      <td className="py-4 px-4">
        <div className="space-y-1 font-mono">
          {hasMinutes ? (
            <>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-emerald-400" />
                <span className="font-black text-sm text-emerald-400">
                  {captain.wallet.total_minutes}
                </span>
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

          {/* Cash Balance */}
          <div className="flex items-center gap-1 text-[11px] font-mono text-amber-300 font-bold pt-1 border-t border-white/5">
            <span className="text-slate-400 text-[10px] font-normal">{t('cashPrefix')}</span>
            <span>{(captain.wallet.balance || 0).toFixed(2)} {getCaptainCurrency(captain, isArabic)}</span>
          </div>
        </div>
      </td>

      {/* 4. Rank & Rating */}
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

      {/* 5. Verification status */}
      <td className="py-4 px-4">
        {getVerificationBadge(captain.verification_status)}
      </td>

      {/* 6. Operational status */}
      <td className="py-4 px-4">
        {getStatusBadge(captain.status)}
      </td>

      {/* 7. Action buttons */}
      <td className="py-4 px-4 text-center">
        <div className="flex items-center justify-center gap-2">
          {/* Inspect */}
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

          {/* Top-up flight minutes */}
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

          {/* Security & Anti-Cheat */}
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

          {/* Direct Message / Notification */}
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
      </td>
    </tr>
  );
};
