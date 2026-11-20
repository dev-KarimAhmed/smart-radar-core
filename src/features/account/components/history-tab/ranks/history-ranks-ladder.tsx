import React from 'react';
import { Zap, CheckCircle2, Lock, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CAPTAIN_RANK_RULES, type CaptainRankName } from '@/features/captain/services/captain-rank';
import { RANK_DETAILS, RANK_HIERARCHY } from './history-ranks-types';

interface HistoryRanksLadderProps {
  isArabic: boolean;
  currentRank: CaptainRankName;
  currentRankIndex: number;
}

export function HistoryRanksLadder({
  isArabic,
  currentRank,
  currentRankIndex,
}: HistoryRanksLadderProps) {
  const nextRank = currentRankIndex < RANK_HIERARCHY.length - 1 ? RANK_HIERARCHY[currentRankIndex + 1] : null;
  const nextRankRules = nextRank ? CAPTAIN_RANK_RULES[nextRank] : null;

  return (
    <div className="space-y-3">
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

                <div className="text-[10px] font-bold text-amber-300/90 mt-1">
                  <span>{isArabic ? meta.adCapacityAr : meta.adCapacityEn}</span>
                </div>

                <span className="text-[8.5px] text-slate-400 block mt-0.5 leading-tight line-clamp-2">
                  {isArabic ? meta.featureAr : meta.featureEn}
                </span>
              </div>
            );
          })}
        </div>

        {/* Sovereign Protocol Notice */}
        <div className="flex items-start gap-2 rounded-xl border border-teal-500/20 bg-teal-950/20 p-2.5 mt-2 text-[10.5px] text-teal-300/90 leading-relaxed">
          <ShieldCheck className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
          <span>
            {isArabic
              ? 'الاشتراك مالي موحد وثابت لجميع الرتب؛ لا يشتري الدفع رتبة أعلى، بل تتوسع الميزات تلقائياً وفق معادلة الصعود الهجينة (المفضلة 40%، النشاط 35%، التقييم 25%) مع درع أمان 7 أيام يمنع الهبوط الآلي الفوري.'
              : 'Single unified subscription across all tiers. Payment never buys higher rank; capabilities expand automatically via the Sovereign Dual-Key formula with a 7-day safety shield against instant demotion.'}
          </span>
        </div>
      </div>
    </div>
  );
}
