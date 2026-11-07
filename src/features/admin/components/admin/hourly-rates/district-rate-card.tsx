'use client';

import React from 'react';
import { Sparkles, Check, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { DistrictItem } from './hourly-rates-types';

interface DistrictRateCardProps {
  dist: DistrictItem;
  isArabic: boolean;
  currency: string;
  effectiveGovPrice: number;
  customDistPrice?: number;
  draftDistValue: string;
  isSaving: boolean;
  isResetting: boolean;
  onDraftChange: (val: string) => void;
  onSave: () => void;
  onReset: () => void;
  t: (key: string, params?: Record<string, any>) => string;
}

export function DistrictRateCard({
  dist,
  isArabic,
  currency,
  effectiveGovPrice,
  customDistPrice,
  draftDistValue,
  isSaving,
  isResetting,
  onDraftChange,
  onSave,
  onReset,
  t,
}: DistrictRateCardProps) {
  const hasCustomDistPrice = customDistPrice !== undefined && customDistPrice !== null;

  return (
    <div
      className={cn(
        "rounded-xl border p-2.5 transition-all flex items-center justify-between gap-2",
        hasCustomDistPrice
          ? "bg-amber-500/[0.04] border-amber-500/30 ring-1 ring-amber-500/20"
          : "bg-[#161F30]/40 border-white/5 hover:border-white/15"
      )}
    >
      {/* District Name & Badge */}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-white truncate">
          {isArabic ? dist.name_ar : (dist.name_en || dist.name_ar)}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          {hasCustomDistPrice ? (
            <span className="text-[10px] font-bold text-amber-300 font-mono flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5" />
              {customDistPrice} {currency}
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 font-sans">
              {t('inheritedBadge', { price: effectiveGovPrice, currency })}
            </span>
          )}
        </div>
      </div>

      {/* District Inline Input & Buttons */}
      <div className="flex items-center gap-1 shrink-0">
        <Input
          type="number"
          step="0.05"
          min="0.1"
          dir="ltr"
          placeholder={String(effectiveGovPrice)}
          value={draftDistValue}
          onChange={(e) => onDraftChange(e.target.value)}
          className="w-16 h-7 text-xs font-mono font-bold bg-black/60 border-white/10 text-white text-center p-1 rounded-lg focus:border-teal-400"
        />

        <Button
          type="button"
          size="sm"
          onClick={onSave}
          disabled={isSaving || isResetting}
          className="h-7 w-7 p-0 rounded-lg bg-teal-500 hover:bg-teal-400 text-[#0B0F19]"
          title={t('saveDistTitle')}
        >
          {isSaving ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Check className="h-3 w-3" />
          )}
        </Button>

        {hasCustomDistPrice && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onReset}
            disabled={isSaving || isResetting}
            className="h-7 w-7 p-0 rounded-lg text-rose-400 hover:bg-rose-500/10"
            title={t('resetDistTitle')}
          >
            {isResetting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RotateCcw className="h-3 w-3" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
