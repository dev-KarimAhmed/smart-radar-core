'use client';

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RegionAnalyticsItem } from '@/features/admin/types/admin-analytics';

interface AnalyticsExtremesPanelProps {
  topGovernorates: RegionAnalyticsItem[];
  bottomGovernorates: RegionAnalyticsItem[];
  topDistricts: RegionAnalyticsItem[];
  bottomDistricts: RegionAnalyticsItem[];
  isArabic: boolean;
}

function RegionRankList({
  items,
  variant,
  isArabic,
}: {
  items: RegionAnalyticsItem[];
  variant: 'top' | 'bottom';
  isArabic: boolean;
}) {
  const maxScore = Math.max(1, ...items.map((i) => i.totalScore));

  if (items.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-slate-400">
        {isArabic ? 'لا توجد مناطق مطابقة للفلتر الحالي' : 'No regions match current filter'}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {items.map((item, idx) => {
        const pct = item.totalScore > 0 ? Math.max(8, Math.round((item.totalScore / maxScore) * 100)) : 4;
        const isZero = item.totalScore === 0;
        return (
          <div
            key={item.id}
            className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-mono text-[11px] font-black',
                    variant === 'top'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : isZero
                        ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
                  )}
                >
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-black text-white truncate">
                      {item.nameAr}
                    </span>
                    {item.parentNameAr && (
                      <span className="text-[10px] font-bold text-slate-400 truncate">
                        ({item.parentNameAr})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <span
                className={cn(
                  'rounded-lg px-2 py-0.5 font-mono text-xs font-black shrink-0',
                  variant === 'top'
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : isZero
                      ? 'bg-rose-500/15 text-rose-300'
                      : 'bg-amber-500/15 text-amber-300',
                )}
              >
                {item.totalScore} {isArabic ? 'نقطة نشاط' : 'pts'}
              </span>
            </div>

            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  variant === 'top'
                    ? 'bg-gradient-to-r from-emerald-400 to-[#14F5D5]'
                    : isZero
                      ? 'bg-rose-500/70'
                      : 'bg-amber-400',
                )}
                style={{ width: `${pct}%` }}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono">
              <span>{isArabic ? `كباتن: ${item.captains}` : `Captains: ${item.captains}`}</span>
              <span>{isArabic ? `نشط: ${item.activeCaptains}` : `Online: ${item.activeCaptains}`}</span>
              <span>{isArabic ? `مستخدمين: ${item.riders}` : `Riders: ${item.riders}`}</span>
              <span>{isArabic ? `رحلات: ${item.trips}` : `Trips: ${item.trips}`}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AnalyticsExtremesPanel({
  topGovernorates,
  bottomGovernorates,
  topDistricts,
  bottomDistricts,
  isArabic,
}: AnalyticsExtremesPanelProps) {
  const [level, setLevel] = useState<'districts' | 'governorates'>('districts');
  const topItems = level === 'districts' ? topDistricts : topGovernorates;
  const bottomItems = level === 'districts' ? bottomDistricts : bottomGovernorates;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0B0F19]/95 p-4 sm:p-5 shadow-xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 text-[#14F5D5]">
            <MapPin className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-white">
              {isArabic ? 'تحليل الكثافة: أكثر وأقل الأماكن نشاطاً' : 'Regional Density: Highest & Lowest Areas'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {isArabic
                ? 'مقارنة أعلى المناطق طلباً وأقلها تغطية لدعم التوسع الجغرافي'
                : 'Comparing top performing areas against low-coverage zones'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#070B14] p-1">
          <button
            type="button"
            onClick={() => setLevel('districts')}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer',
              level === 'districts'
                ? 'bg-[#14B8A6] text-slate-950 font-black'
                : 'text-slate-300 hover:bg-white/5 hover:text-white',
            )}
          >
            {isArabic ? 'الألوية / المناطق' : 'Districts'}
          </button>
          <button
            type="button"
            onClick={() => setLevel('governorates')}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer',
              level === 'governorates'
                ? 'bg-[#14B8A6] text-slate-950 font-black'
                : 'text-slate-300 hover:bg-white/5 hover:text-white',
            )}
          >
            {isArabic ? 'المحافظات' : 'Governorates'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-3.5 space-y-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-emerald-300">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span>{isArabic ? 'أكثر الأماكن نشاطاً (الأعلى)' : 'Most Active Areas (Top 5)'}</span>
          </div>
          <RegionRankList items={topItems} variant="top" isArabic={isArabic} />
        </div>

        <div className="rounded-2xl border border-rose-500/20 bg-rose-950/10 p-3.5 space-y-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-amber-300">
            <TrendingDown className="h-4 w-4 text-rose-400" />
            <span>{isArabic ? 'أقل الأماكن نشاطاً / فجوات التغطية (الأدنى)' : 'Lowest Activity / Coverage Gaps (Bottom 5)'}</span>
          </div>
          <RegionRankList items={bottomItems} variant="bottom" isArabic={isArabic} />
        </div>
      </div>
    </div>
  );
}
