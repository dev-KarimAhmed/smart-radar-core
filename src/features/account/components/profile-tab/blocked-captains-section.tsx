import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldAlert, ShieldCheck, UserX, Star, Phone, Ban } from 'lucide-react';

interface BlockedCaptainsSectionProps {
  isArabic: boolean;
  t: any;
  isLoadingBlocks: boolean;
  blockedCaptains: {
    id: string;
    name: string;
    phone: string;
    rating: number;
    serialId: string;
  }[];
  confirmingUnblockId: string | null;
  setConfirmingUnblockId: (id: string | null) => void;
  handleUnblockCaptain: (id: string) => void;
}

export function BlockedCaptainsSection({
  isArabic,
  t,
  isLoadingBlocks,
  blockedCaptains,
  confirmingUnblockId,
  setConfirmingUnblockId,
  handleUnblockCaptain,
}: BlockedCaptainsSectionProps) {
  return (
    <Card className="relative overflow-hidden rounded-3xl border border-rose-500/20 bg-[#0B0F19]/90 shadow-2xl backdrop-blur-xl w-full">
      {/* Top glowing accent gradient */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" />

      <CardHeader className="p-5 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)]">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base font-black text-white flex items-center gap-2">
                {t('blockedCaptains')}
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 mt-0.5 leading-relaxed truncate">
                {t('blockedCaptainsDesc')}
              </CardDescription>
            </div>
          </div>

          <span className="shrink-0 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-300 flex items-center gap-1.5 shadow-sm">
            <Ban className="h-3 w-3 text-rose-400" />
            <span>{blockedCaptains.length}</span>
            <span>{isArabic ? 'كابتن' : 'captains'}</span>
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-2">
        {isLoadingBlocks ? (
          <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin text-rose-400" />
            <span className="text-xs font-semibold">{t('loadingBlockedList')}</span>
          </div>
        ) : blockedCaptains.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 sm:p-5 flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 text-[#14F5D5] shadow-sm">
              <ShieldCheck className="h-5 w-5 stroke-[1.5]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-200">
                {t('noBlockedCaptains')}
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                {isArabic
                  ? 'سجلك نظيف، لم تقم بحظر أي كابتن حتى الآن.'
                  : 'Your account is clean, you have not blocked any captains yet.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {blockedCaptains.map((captain) => (
              <div
                key={captain.id}
                className="group relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent hover:border-rose-500/40 p-3.5 transition-all duration-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Right side: Driver identity */}
                <div className="flex items-center gap-3 min-w-0 shrink-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-500/25 bg-rose-500/10 text-rose-400">
                    <UserX className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h5 className="font-black text-white text-sm truncate">
                      {captain.name}
                    </h5>
                    {captain.serialId && (
                      <span className="text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                        {t('accountNumber')}: {captain.serialId}
                      </span>
                    )}
                  </div>
                </div>

                {/* Center: Rating & Phone */}
                <div className="flex-1 min-w-0 flex items-center justify-around gap-3 text-xs bg-black/40 border border-white/5 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-slate-400 text-[11px]">{t('rating')}:</span>
                    <span className="font-bold text-amber-400">{captain.rating.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-slate-300 text-[11px]">
                    <Phone className="h-3 w-3 text-slate-500" />
                    <span>{captain.phone || t('phoneUnavailable')}</span>
                  </div>
                </div>

                {/* Left side: Action */}
                <div className="shrink-0">
                  {confirmingUnblockId === captain.id ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          handleUnblockCaptain(captain.id);
                          setConfirmingUnblockId(null);
                        }}
                        className="h-9 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 px-3"
                      >
                        {t('confirm')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmingUnblockId(null)}
                        className="h-9 rounded-xl text-xs font-bold border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 px-3"
                      >
                        {t('cancel')}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmingUnblockId(captain.id)}
                      className="h-9 px-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs font-bold text-rose-300 hover:bg-rose-500 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>{t('unblock')}</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
