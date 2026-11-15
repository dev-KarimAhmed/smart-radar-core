'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Award,
  TrendingUp,
  Star,
  Heart,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import type { CaptainRankName } from '@/features/captain/services/captain-rank';
import { rankIncreaseFactorForTier } from '@/features/captain/services/offer-band';
import {
  historyRanksStyles as styles,
  RANK_DETAILS,
  RANK_HIERARCHY,
  type HistoryRanksPointsProps,
} from './ranks/history-ranks-types';
import { HistoryRanksLadder } from './ranks/history-ranks-ladder';

export * from './ranks/history-ranks-types';
export * from './ranks/history-ranks-ladder';

export function HistoryRanksPoints({ isArabic = true }: HistoryRanksPointsProps) {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Derive current rank
  const rawRank = (user?.rank || (user as any)?.tier || 'BRONZE').toUpperCase() as CaptainRankName;
  const currentRank: CaptainRankName = RANK_HIERARCHY.includes(rawRank) ? rawRank : 'BRONZE';
  const rankMeta = RANK_DETAILS[currentRank] || RANK_DETAILS.BRONZE;

  const rating = Number(user?.rating || (user as any)?.average_rating || 5.0).toFixed(1);
  const hearts = Number((user as any)?.heart_count || (user as any)?.hearts || 12);
  const completedRides = Number((user as any)?.completed_trips_count || (user as any)?.total_rides || 8);

  const currentRankIndex = RANK_HIERARCHY.indexOf(currentRank);

  return (
    <Card className={styles.card} dir={isArabic ? 'rtl' : 'ltr'}>
      <div className={styles.accentBar} />
      <CardHeader className={styles.header}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsExpanded(!isExpanded)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsExpanded(!isExpanded);
            }
          }}
          className={styles.headerButton}
        >
          <div className={styles.headerRow}>
            {/* Top on Mobile: Icon + Full Title */}
            <div className={styles.headerInfo}>
              <div className={styles.iconBox}>
                <Award className={styles.icon} />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className={styles.title}>
                  {isArabic ? 'سجل الرتب والنقاط' : 'Ranks & Points Log'}
                </CardTitle>
                <CardDescription className={styles.descDesktop}>
                  {isArabic
                    ? 'تطور رتبة الكابتن ومؤشر نقاط الجودة وسقف التسعير'
                    : 'Captain rank progression, quality score index & fare band'}
                </CardDescription>
              </div>
            </div>

            {/* Bottom on Mobile: Subtitle + Badge + Chevron */}
            <div className={styles.actionsRow}>
              <CardDescription className={styles.descMobile}>
                {isArabic
                  ? 'تطور رتبة الكابتن ومؤشر نقاط الجودة'
                  : 'Captain rank progression & quality index'}
              </CardDescription>

              <div className={styles.actionsGroup}>
                <span className={cn(styles.countBadge, rankMeta.border, rankMeta.color)}>
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                  <span>{rating}</span>
                  <span className="opacity-40">·</span>
                  <span>{isArabic ? `رتبة ${rankMeta.nameAr}` : rankMeta.nameEn}</span>
                </span>
                <div className={styles.chevronBox}>
                  <ChevronDown className={cn(styles.chevronIcon, isExpanded && styles.chevronRotated)} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className={styles.content}>
          {/* 1. Hero Rank Badge & Stats */}
          <div className={cn('rounded-2xl border p-4 sm:p-5 relative overflow-hidden', rankMeta.border, rankMeta.bg)}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={cn('flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border bg-black/40 shadow-inner', rankMeta.border, rankMeta.color)}>
                  <rankMeta.icon className="h-7 w-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-bold">
                      {isArabic ? 'الرتبة الحالية:' : 'Current Rank:'}
                    </span>
                    <span className={cn('text-lg font-black', rankMeta.color)}>
                      {isArabic ? rankMeta.nameAr : rankMeta.nameEn}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {isArabic
                      ? `تتيح لك هامش تسعير مرن يصل إلى +${rankMeta.ceilingPercent}% عن متوسط السوق`
                      : `Allows you up to +${rankMeta.ceilingPercent}% tariff ceiling over market average`}
                  </p>
                </div>
              </div>

              {/* Quality Indicators Pills */}
              <div className="flex items-center gap-2">
                <div className="rounded-xl border border-amber-500/20 bg-black/40 px-3 py-1.5 text-center">
                  <div className="flex items-center justify-center gap-1 text-amber-400">
                    <Star className="h-3.5 w-3.5 fill-amber-400" />
                    <span className="font-mono text-sm font-bold">{rating}</span>
                  </div>
                  <span className="text-[9px] text-slate-400 block mt-0.5 font-sans">
                    {isArabic ? 'التقييم' : 'Rating'}
                  </span>
                </div>

                <div className="rounded-xl border border-rose-500/20 bg-black/40 px-3 py-1.5 text-center">
                  <div className="flex items-center justify-center gap-1 text-rose-400">
                    <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
                    <span className="font-mono text-sm font-bold">{hearts}</span>
                  </div>
                  <span className="text-[9px] text-slate-400 block mt-0.5 font-sans">
                    {isArabic ? 'إعجابات' : 'Hearts'}
                  </span>
                </div>

                <div className="rounded-xl border border-emerald-500/20 bg-black/40 px-3 py-1.5 text-center">
                  <div className="flex items-center justify-center gap-1 text-emerald-400">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span className="font-mono text-sm font-bold">{completedRides}</span>
                  </div>
                  <span className="text-[9px] text-slate-400 block mt-0.5 font-sans">
                    {isArabic ? 'رحلات' : 'Trips'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <HistoryRanksLadder
            isArabic={isArabic}
            currentRank={currentRank}
            currentRankIndex={currentRankIndex}
          />
        </CardContent>
      )}
    </Card>
  );
}
