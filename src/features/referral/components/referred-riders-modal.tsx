'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Users, Sparkles, UserCheck, Phone, Heart } from 'lucide-react';
import { formatTelUri } from '@/lib/utils';
import type { ReferredRiderInfo } from '../services/captain-referral';

interface ReferredRidersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  riders: ReferredRiderInfo[];
  loading: boolean;
  isArabic?: boolean;
}

export function ReferredRidersModal({
  open,
  onOpenChange,
  riders,
  loading,
  isArabic = true,
}: ReferredRidersModalProps) {
  const t = useTranslations('referral.driverCard');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[95vw] rounded-3xl border border-teal-500/30 bg-[#0B0F19]/95 text-white shadow-2xl backdrop-blur-2xl p-6 sm:p-7 max-h-[85vh] flex flex-col">
        {/* Glowing accent bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#14F5D5]/60 to-transparent" />

        <DialogHeader className="text-start space-y-1.5 pb-3 border-b border-white/5">
          <DialogTitle className="text-base font-black text-white flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/15 text-[#14F5D5]">
              <Users className="h-4 w-4" />
            </div>
            <span>{t('modalTitle')}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400 leading-relaxed font-sans">
            {t('modalSubtitle')}
          </DialogDescription>
        </DialogHeader>

        {/* Riders List Body */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1 min-h-[140px] max-h-[55vh]">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">
              <Sparkles className="h-5 w-5 text-[#14F5D5] mx-auto mb-2 animate-pulse" />
              <span>{t('loading')}</span>
            </div>
          ) : riders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 flex items-center gap-3.5 my-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-teal-500/20 bg-teal-500/10 text-teal-400 shadow-sm">
                <Users className="h-5 w-5 stroke-[1.5]" />
              </div>
              <div className="flex-1 min-w-0 text-start">
                <p className="text-xs font-bold text-slate-200">
                  {t('emptyTitle')}
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                  {t('emptyDesc')}
                </p>
              </div>
            </div>
          ) : (
            riders.map((rider) => (
              <div
                key={rider.rider_id}
                className="group relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent hover:border-teal-500/40 p-3 transition-all duration-200 shadow-sm flex items-center justify-between gap-3"
              >
                {/* Rider Details */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-teal-500/25 bg-teal-500/10 text-[#14F5D5]">
                    <UserCheck className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 text-start">
                    <h5 className="font-bold text-white text-xs truncate">
                      {rider.rider_name || t('defaultRiderName')}
                    </h5>
                    {rider.rider_serial && (
                      <span className="text-[10px] font-mono text-teal-400/80 bg-teal-950/40 border border-teal-500/20 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                        🧬 #{rider.rider_serial}
                      </span>
                    )}
                  </div>
                </div>

                {/* Rider Activity Status & Action */}
                <div className="flex items-center gap-2 shrink-0">
                  {rider.is_active === false ? (
                    <span
                      className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300 shadow-sm"
                      title={t('inactivityTooltip')}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                      <span>{t('inactiveRider', { days: rider.days_inactive || 10 })}</span>
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 shadow-sm"
                      title={t('activeTooltip')}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span>{t('activeRider')}</span>
                    </span>
                  )}

                  {rider.rider_phone && (
                    <a
                      href={formatTelUri(rider.rider_phone)}
                      className="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-teal-500/30 bg-teal-500/15 text-teal-300 hover:bg-teal-500/25 active:scale-95 transition-all"
                      title={t('callRiderTooltip')}
                      style={{ textDecoration: 'none' }}
                    >
                      <Phone className="h-3 w-3 stroke-[2.5]" />
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
