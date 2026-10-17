'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Heart, Sparkles, UserCheck, Phone, Trash2 } from 'lucide-react';
import { getCaptainFavoriteRiders, type ReferredRiderInfo } from '../services/captain-referral';
import { formatTelUri } from '@/lib/utils';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/core/types';

interface HistoryFavoriteRidersProps {
  user: User | null;
  isArabic?: boolean;
}

export function HistoryFavoriteRiders({ user, isArabic = true }: HistoryFavoriteRidersProps) {
  const t = useTranslations('referral.favoriteRiders');
  const [riders, setRiders] = useState<ReferredRiderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    async function loadRiders() {
      try {
        const data = await getCaptainFavoriteRiders();
        if (mounted) {
          setRiders(data);
          setLoading(false);
        }
      } catch {
        if (mounted) setLoading(false);
      }
    }
    if (user?.uid) {
      void loadRiders();
    }

    const handleUpdated = () => {
      if (user?.uid) {
        void loadRiders();
      }
    };
    window.addEventListener('radar_favorites_updated', handleUpdated);

    return () => {
      mounted = false;
      window.removeEventListener('radar_favorites_updated', handleUpdated);
    };
  }, [user?.uid]);

  const handleRemove = async (riderId: string) => {
    try {
      if (user?.uid) {
        await supabase
          .from('captain_favorite_riders')
          .delete()
          .eq('captain_id', user.uid)
          .eq('rider_id', riderId);
      }
      setRiders((prev) => prev.filter((r) => r.rider_id !== riderId));
      toast({
        title: isArabic ? 'تمت الإزالة من المفضلة' : 'Removed from favorites',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: isArabic ? 'تعذر الحذف من المفضلة' : 'Failed to remove from favorites',
      });
    }
  };

  return (
    <Card className="relative overflow-hidden rounded-3xl border border-teal-500/20 bg-[#0B0F19]/90 shadow-2xl backdrop-blur-xl w-full text-white">
      {/* Top glowing accent gradient */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#14F5D5]/50 to-transparent" />

      <CardHeader className="p-5 pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-teal-500/30 bg-teal-500/10 text-[#14F5D5] shadow-[0_0_15px_rgba(20,245,213,0.15)]">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base font-black text-white flex items-center gap-2">
                {t('title')}
                <Sparkles className="h-4 w-4 text-[#14F5D5]" />
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 mt-0.5 leading-relaxed truncate">
                {t('subtitle')}
              </CardDescription>
            </div>
          </div>

          <span className="shrink-0 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-bold text-[#14F5D5] flex items-center gap-1.5 shadow-sm">
            <Heart className="h-3 w-3 fill-[#14F5D5] text-[#14F5D5]" />
            <span>{t('ridersCountBadge', { count: riders.length })}</span>
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-2">
        {loading ? (
          <div className="py-6 text-center text-xs text-slate-400">
            {t('loading')}
          </div>
        ) : riders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 sm:p-5 flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-teal-500/20 bg-teal-500/10 text-teal-400 shadow-sm">
              <Heart className="h-5 w-5 stroke-[1.5]" />
            </div>
            <div className="flex-1 min-w-0 text-start">
              <p className="text-xs font-bold text-slate-300">
                {t('emptyTitle')}
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                {t('emptyDesc')}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {riders.map((rider) => (
              <div
                key={rider.rider_id}
                className="group relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent hover:border-teal-500/40 p-3.5 transition-all duration-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Rider Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-500/25 bg-teal-500/10 text-[#14F5D5]">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 text-start">
                    <h5 className="font-black text-white text-sm truncate">
                      {rider.rider_name || t('defaultRiderName')}
                    </h5>

                    {rider.rider_serial && (
                      <span className="text-[10px] font-mono text-teal-400/80 bg-teal-950/40 border border-teal-500/20 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                        🧬 #{rider.rider_serial}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions: Call and Remove */}
                <div className="flex items-center gap-2 shrink-0">
                  {rider.rider_phone && (
                    <a
                      href={formatTelUri(rider.rider_phone)}
                      className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-xl bg-gradient-to-r from-[#14B8A6] to-[#0ea5e9] text-slate-950 font-black text-xs hover:brightness-110 active:scale-[0.98] transition-all shadow-md shadow-teal-500/15"
                      style={{ textDecoration: 'none' }}
                    >
                      <Phone className="h-3.5 w-3.5 stroke-[2.5]" />
                      <span>{t('call')}</span>
                    </a>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(rider.rider_id)}
                    title={t('removeFromFavorites')}
                    className="h-9 w-9 shrink-0 rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
