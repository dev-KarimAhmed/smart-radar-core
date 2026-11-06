'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Award,
  Crown,
  Sparkles,
  TrendingUp,
  Star,
  Heart,
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { CAPTAIN_RANK_RULES, type CaptainRankName } from '@/features/captain/services/captain-rank';
import { rankIncreaseFactorForTier } from '@/features/captain/services/offer-band';

const styles = {
  card: 'relative overflow-hidden rounded-3xl border border-amber-500/25 bg-[#0B0F19]/90 shadow-2xl backdrop-blur-xl w-full text-white',
  accentBar: 'absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent shadow-[0_0_12px_rgba(251,191,36,0.5)]',
  header: 'p-5 pb-3',
  headerButton: 'w-full text-right cursor-pointer select-none transition-colors hover:bg-white/[0.02]',
  headerRow: 'flex items-center justify-between gap-3',
  headerInfo: 'flex items-center gap-3 min-w-0',
  iconBox: 'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
  icon: 'h-5 w-5',
  title: 'text-base font-black text-white flex items-center gap-2 font-sans',
  desc: 'text-xs text-slate-400 mt-0.5 leading-relaxed font-sans',
  countBadge: 'shrink-0 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300 shadow-sm font-mono',
  chevronBox: 'flex h-8 w-8 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-300 transition-all hover:bg-amber-500/20 shrink-0',
  chevronIcon: 'h-4 w-4 transition-transform duration-200',
  chevronRotated: 'rotate-180',
  content: 'p-5 pt-2 space-y-4',
} as const;

interface HistoryRanksPointsProps {
  isArabic?: boolean;
}

const RANK_DETAILS: Record<CaptainRankName, {
  nameAr: string;
  nameEn: string;
  color: string;
  border: string;
  bg: string;
  icon: any;
  ceilingPercent: number;
}> = {
  DIAMOND: {
    nameAr: 'ماسي',
    nameEn: 'Diamond',
    color: 'text-cyan-300',
    border: 'border-cyan-400/40',
    bg: 'bg-gradient-to-br from-cyan-500/20 via-cyan-900/10 to-blue-950/30',
    icon: Crown,
    ceilingPercent: 25,
  },
  PLATINUM: {
    nameAr: 'بلاتيني',
    nameEn: 'Platinum',
    color: 'text-purple-300',
    border: 'border-purple-400/40',
    bg: 'bg-gradient-to-br from-purple-500/20 via-purple-900/10 to-indigo-950/30',
    icon: Sparkles,
    ceilingPercent: 20,
  },
  GOLD: {
    nameAr: 'ذهبي',
    nameEn: 'Gold',
    color: 'text-amber-300',
    border: 'border-amber-400/40',
    bg: 'bg-gradient-to-br from-amber-500/20 via-amber-900/10 to-yellow-950/30',
    icon: Award,
    ceilingPercent: 15,
  },
  SILVER: {
    nameAr: 'فضي',
    nameEn: 'Silver',
    color: 'text-slate-300',
    border: 'border-slate-400/30',
    bg: 'bg-gradient-to-br from-slate-500/20 via-slate-800/10 to-slate-900/30',
    icon: Award,
    ceilingPercent: 10,
  },
  BRONZE: {
    nameAr: 'برونزي',
    nameEn: 'Bronze',
    color: 'text-amber-600',
    border: 'border-amber-700/30',
    bg: 'bg-gradient-to-br from-amber-800/20 via-amber-950/10 to-orange-950/30',
    icon: Award,
    ceilingPercent: 5,
  },
};

const RANK_HIERARCHY: CaptainRankName[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'];

export function HistoryRanksPoints({ isArabic = true }: HistoryRanksPointsProps) {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Derive current rank
  const rawRank = (user?.rank || (user as any)?.tier || 'BRONZE').toUpperCase() as CaptainRankName;
  const currentRank: CaptainRankName = RANK_HIERARCHY.includes(rawRank) ? rawRank : 'BRONZE';
  const rankMeta = RANK_DETAILS[currentRank] || RANK_DETAILS.BRONZE;
  const rankRules = CAPTAIN_RANK_RULES[currentRank] || { minRating: 4.0, minHearts: 0 };

  const rating = Number(user?.rating || (user as any)?.average_rating || 5.0).toFixed(1);
  const hearts = Number((user as any)?.heart_count || (user as any)?.hearts || 12);
  const completedRides = Number((user as any)?.completed_trips_count || (user as any)?.total_rides || 8);

  const currentRankIndex = RANK_HIERARCHY.indexOf(currentRank);
  const nextRank = currentRankIndex < RANK_HIERARCHY.length - 1 ? RANK_HIERARCHY[currentRankIndex + 1] : null;
  const nextRankRules = nextRank ? CAPTAIN_RANK_RULES[nextRank] : null;

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
            <div className={styles.headerInfo}>
              <div className={styles.iconBox}>
                <Award className={styles.icon} />
              </div>
              <div>
                <CardTitle className={styles.title}>
                  <span>{isArabic ? 'سجل الرتب والنقاط' : 'Ranks & Points Log'}</span>
                  <Badge variant="outline" className={cn('text-[10px] px-2 py-0.5', rankMeta.border, rankMeta.color)}>
                    {isArabic ? `رتبة ${rankMeta.nameAr}` : `${rankMeta.nameEn} Rank`}
                  </Badge>
                </CardTitle>
                <CardDescription className={styles.desc}>
                  {isArabic
                    ? 'تطور رتبة الكابتن، مؤشر نقاط الجودة، وسقف التسعير المعتمد'
                    : 'Captain rank ladder progression, quality score index, and fare flexibility band'}
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className={styles.countBadge}>
                {rating} ★
              </span>
              <div className={styles.chevronBox}>
                <ChevronDown className={cn(styles.chevronIcon, isExpanded && styles.chevronRotated)} />
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

              {/* Quality & Performance Pill */}
              <div className="flex items-center gap-3 bg-black/40 rounded-2xl border border-white/10 p-2.5">
                <div className="text-center px-2">
                  <div className="flex items-center justify-center gap-1 text-amber-400 font-mono font-black text-sm">
                    <Star className="h-3.5 w-3.5 fill-amber-400" />
                    <span>{rating}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-sans">{isArabic ? 'التقييم' : 'Rating'}</span>
                </div>
                <div className="h-6 w-[1px] bg-white/10" />
                <div className="text-center px-2">
                  <div className="flex items-center justify-center gap-1 text-rose-400 font-mono font-black text-sm">
                    <Heart className="h-3.5 w-3.5 fill-rose-400" />
                    <span>{hearts}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-sans">{isArabic ? 'إعجابات' : 'Hearts'}</span>
                </div>
                <div className="h-6 w-[1px] bg-white/10" />
                <div className="text-center px-2">
                  <div className="flex items-center justify-center gap-1 text-emerald-400 font-mono font-black text-sm">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>{completedRides}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-sans">{isArabic ? 'رحلات' : 'Rides'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Rank Progression Ladder */}
          <div className="space-y-2.5 pt-2">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span>{isArabic ? 'سلم ترقيات الكابتن ومتطلباتها:' : 'Rank Progression Ladder:'}</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {RANK_HIERARCHY.map((rankKey, idx) => {
                const meta = RANK_DETAILS[rankKey];
                const rules = CAPTAIN_RANK_RULES[rankKey];
                const isPassed = idx <= currentRankIndex;
                const isCurrent = rankKey === currentRank;

                return (
                  <div
                    key={rankKey}
                    className={cn(
                      'rounded-2xl border p-2.5 text-center transition-all',
                      isCurrent
                        ? cn(meta.border, meta.bg, 'shadow-lg ring-1 ring-amber-400/30')
                        : isPassed
                        ? 'border-emerald-500/30 bg-emerald-950/20 text-slate-300'
                        : 'border-white/5 bg-black/30 text-slate-500 opacity-60'
                    )}
                  >
                    <div className="flex items-center justify-center gap-1 mb-1">
                      {isCurrent ? (
                        <meta.icon className={cn('h-4 w-4', meta.color)} />
                      ) : isPassed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Lock className="h-3 w-3 text-slate-500" />
                      )}
                      <span className={cn('text-xs font-bold', isCurrent && meta.color)}>
                        {isArabic ? meta.nameAr : meta.nameEn}
                      </span>
                    </div>

                    <div className="text-[10px] font-mono text-slate-400">
                      <span>★ {rules.minRating.toFixed(1)}</span>
                      {rules.minHearts > 0 && <span> + {rules.minHearts}♥</span>}
                    </div>

                    <span className="text-[9px] text-slate-400 block mt-0.5">
                      +{meta.ceilingPercent}% {isArabic ? 'سقف' : 'ceiling'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Next Rank Progress Hint */}
          {nextRank && nextRankRules && (
            <div className="rounded-2xl border border-white/5 bg-black/40 p-3 text-xs text-slate-300 leading-relaxed flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#14F5D5] shrink-0" />
              <span>
                {isArabic
                  ? `للوصول إلى رتبة (${RANK_DETAILS[nextRank].nameAr}): يلزمك تقييم أسبوعي لا يقل عن ${nextRankRules.minRating.toFixed(1)} نجوم مع ${nextRankRules.minHearts} إعجاب.`
                  : `To unlock (${RANK_DETAILS[nextRank].nameEn}) rank: You need at least ${nextRankRules.minRating.toFixed(1)} rating and ${nextRankRules.minHearts} hearts.`}
              </span>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

