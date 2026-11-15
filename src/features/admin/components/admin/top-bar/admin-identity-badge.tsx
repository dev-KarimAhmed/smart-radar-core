import React from 'react';
import { useTranslations } from 'next-intl';
import { ShieldCheck, Crown, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AdminIdentityBadgeProps {
  adminDisplayName: string;
  adminRank: 'GENERAL_ADMIN' | 'ASSISTANT_ADMIN';
  isArabic: boolean;
  userPhone?: string;
  userSerialId?: string;
  userUid?: string;
}

export function AdminIdentityBadge({
  adminDisplayName,
  adminRank,
  isArabic,
  userPhone,
  userSerialId,
  userUid,
}: AdminIdentityBadgeProps) {
  const t = useTranslations('adminTopBar');

  return (
    <div className="flex items-center gap-3.5 w-full md:w-auto">
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-teal-500/30 bg-teal-500/10 text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.15)]">
        <ShieldCheck className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
        </span>
      </div>

      <div className={cn("space-y-1", isArabic ? "text-right" : "text-left")}>
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
            {adminDisplayName}
          </h2>
          {adminRank === 'GENERAL_ADMIN' ? (
            <Badge className="bg-amber-500/15 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-black py-0.5 px-2 flex items-center gap-1 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              <Crown className="w-3 h-3 text-amber-400" />
              <span>{t('generalAdmin')}</span>
            </Badge>
          ) : (
            <Badge className="bg-cyan-500/15 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold py-0.5 px-2 flex items-center gap-1 shadow-[0_0_12px_rgba(6,182,212,0.15)]">
              <Shield className="w-3 h-3 text-cyan-400" />
              <span>{t('assistantAdmin')}</span>
            </Badge>
          )}
        </div>
        <p className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
          <span>{userPhone || userSerialId || 'UID: ' + (userUid ? userUid.slice(0, 8) + '...' : t('officer'))}</span>
        </p>
      </div>
    </div>
  );
}
