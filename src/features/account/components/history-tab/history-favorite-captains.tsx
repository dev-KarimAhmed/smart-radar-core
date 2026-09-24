import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Phone, Trash2, Heart, Car, UserCheck } from 'lucide-react';
import { useTranslations } from "next-intl";

interface HistoryFavoriteCaptainsProps {
  favoriteCaptains: any[];
  toggleFavorite: (captain: any) => void;
  isArabic: boolean;
  t: any;
}

function getRankBadge(rank: string = 'GOLD') {
  const normalized = (rank || 'GOLD').toUpperCase();
  if (normalized.includes('PLATINUM')) {
    return {
      label: 'PLATINUM',
      classes: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    };
  }
  if (normalized.includes('SILVER')) {
    return {
      label: 'SILVER',
      classes: 'bg-slate-400/15 text-slate-300 border-slate-400/30',
    };
  }
  if (normalized.includes('BRONZE')) {
    return {
      label: 'BRONZE',
      classes: 'bg-amber-700/20 text-amber-300 border-amber-600/30',
    };
  }
  return {
    label: 'GOLD',
    classes: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  };
}

export function HistoryFavoriteCaptains({
  favoriteCaptains,
  toggleFavorite,
  isArabic,
  t
}: HistoryFavoriteCaptainsProps) {
  const tAuto = useTranslations('auto');

  return (
    <Card className="relative overflow-hidden rounded-3xl border border-teal-500/20 bg-[#0B0F19]/90 shadow-2xl backdrop-blur-xl w-full">
      {/* Top glowing accent gradient */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#14F5D5]/50 to-transparent" />

      <CardHeader className="p-5 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-teal-500/30 bg-teal-500/10 text-[#14F5D5] shadow-[0_0_15px_rgba(20,245,213,0.15)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base font-black text-white flex items-center gap-2">
                {t('savedCaptainsTitle')}
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 mt-0.5 leading-relaxed truncate">
                {t('savedCaptainsDesc')}
              </CardDescription>
            </div>
          </div>

          <span className="shrink-0 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-bold text-[#14F5D5] flex items-center gap-1.5 shadow-sm">
            <Heart className="h-3 w-3 fill-[#14F5D5] text-[#14F5D5]" />
            <span>{favoriteCaptains.length}</span>
            <span>{isArabic ? tAuto('key_603ab93b') : 'drivers'}</span>
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-2">
        {favoriteCaptains.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 sm:p-5 flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-teal-500/20 bg-teal-500/10 text-teal-400 shadow-sm">
              <Heart className="h-5 w-5 stroke-[1.5]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-300">
                {isArabic ? 'لم تقم بحفظ أي كابتن في المفضلة بعد' : 'No favorite drivers saved yet'}
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                {isArabic ? (
                  <>{tAuto('key_258a9b0d')} <strong className="text-[#14F5D5]">{tAuto('key_31002ea0')}</strong> {tAuto('key_e8de888f')}</>
                ) : (
                  <>Click the <strong className="text-[#14F5D5]">heart</strong> icon on any completed trip to add the driver to your favorites.</>
                )}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {favoriteCaptains.map((captain) => {
              const rankBadge = getRankBadge(captain.captainRank);
              return (
                <div
                  key={captain.id}
                  className="group relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent hover:border-teal-500/40 p-3.5 transition-all duration-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  {/* Right side: Driver identity */}
                  <div className="flex items-center gap-3 min-w-0 shrink-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-500/25 bg-teal-500/10 text-[#14F5D5]">
                      <UserCheck className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className="font-black text-white text-sm truncate">
                          {captain.captainName}
                        </h5>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border tracking-wider ${rankBadge.classes}`}>
                          {rankBadge.label}
                        </span>
                      </div>
                      {captain.serialId && (
                        <span className="text-[10px] font-mono text-teal-400/80 bg-teal-950/40 border border-teal-500/20 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                          🧬 {captain.serialId}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Center: Vehicle Details */}
                  {captain.vehicleInfo ? (
                    <div className="flex-1 min-w-0 flex items-center gap-2 text-xs text-slate-300 bg-black/40 border border-white/5 rounded-xl px-3 py-2">
                      <Car className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate font-medium">{captain.vehicleInfo}</span>
                    </div>
                  ) : (
                    <div className="flex-1" />
                  )}

                  {/* Left side: Action buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`tel:${captain.captainPhone}`}
                      className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-xl bg-gradient-to-r from-[#14B8A6] to-[#0ea5e9] text-slate-950 font-black text-xs hover:brightness-110 active:scale-[0.98] transition-all shadow-md shadow-teal-500/15"
                      style={{ textDecoration: 'none' }}
                    >
                      <Phone className="h-3.5 w-3.5 stroke-[2.5]" />
                      <span>{t('call')}</span>
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleFavorite(captain)}
                      title={isArabic ? 'إزالة من المفضلة' : 'Remove from favorites'}
                      className="h-9 w-9 shrink-0 rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
