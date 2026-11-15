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
    </div>
  );
}
