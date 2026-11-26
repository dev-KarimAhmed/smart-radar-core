'use client';

import React from 'react';
import { Check, Filter, Loader2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterActionFooterProps {
  onApplyFilters: () => void;
  onResetAllFilters: () => void;
  hasDraftFilter: boolean;
  hasActiveFilter: boolean;
  hasPendingChanges: boolean;
  loading: boolean;
  isArabic: boolean;
  emptyPromptEn?: string;
}

export function FilterActionFooter({
  onApplyFilters,
  onResetAllFilters,
  hasDraftFilter,
  hasActiveFilter,
  hasPendingChanges,
  loading,
  isArabic,
  emptyPromptEn = 'Select criteria and click "Apply Filter" to load results',
}: FilterActionFooterProps) {
  return (
    <div className="pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-xs">
        {hasPendingChanges ? (
          <>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-amber-300 font-semibold">
              {isArabic
                ? 'تم تعديل الفلتر — اضغط «تطبيق الفلتر» لجلب النتائج'
                : 'Filters changed — click "Apply Filter" to fetch results'}
            </span>
          </>
        ) : hasActiveFilter ? (
          <>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-emerald-300/90 font-medium">
              {isArabic ? 'النتائج معروضة حسب الفلتر المطبق' : 'Showing results for applied filter'}
            </span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span className="text-slate-400">
              {isArabic ? 'اختر معايير التصفية ثم اضغط «تطبيق الفلتر»' : emptyPromptEn}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2.5 ms-auto">
        {(hasDraftFilter || hasActiveFilter) && (
          <button
            type="button"
            onClick={onResetAllFilters}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isArabic ? 'إعادة ضبط' : 'Reset'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onApplyFilters}
          disabled={!hasDraftFilter || loading}
          className={cn(
            'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-lg',
            !hasDraftFilter || loading
              ? 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed shadow-none'
              : 'bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 shadow-cyan-500/20 cursor-pointer',
            hasPendingChanges && hasDraftFilter && !loading && 'ring-2 ring-cyan-400/50 ring-offset-2 ring-offset-[#060f1a]'
          )}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : hasActiveFilter && !hasPendingChanges ? (
            <Check className="w-4 h-4" />
          ) : (
            <Filter className="w-4 h-4" />
          )}
          <span>{isArabic ? 'تطبيق الفلتر' : 'Apply Filter'}</span>
        </button>
      </div>
    </div>
  );
}
