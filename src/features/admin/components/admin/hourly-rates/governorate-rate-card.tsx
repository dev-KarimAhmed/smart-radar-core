'use client';

import React from 'react';
import {
  MapPin,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Check,
  Zap,
  Loader2,
  ArrowDownRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { GovernorateItem, DistrictItem, CustomRatesMatrix } from './hourly-rates-types';
import { DistrictRateCard } from './district-rate-card';

interface GovernorateRateCardProps {
  gov: GovernorateItem;
  govDists: DistrictItem[];
  isArabic: boolean;
  currency: string;
  countryDefaultPrice: number;
  customRates: CustomRatesMatrix;
  localGovInputs: Record<number, string>;
  localDistInputs: Record<number, string>;
  isExpanded: boolean;
  savingKey: string | null;
  onToggleExpand: () => void;
  onGovDraftChange: (val: string) => void;
  onDistDraftChange: (distId: number, val: string) => void;
  onSaveGov: () => void;
  onResetGov: () => void;
  onApplyAllDistricts: () => void;
  onSaveDistrict: (distId: number) => void;
  onResetDistrict: (distId: number) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

export function GovernorateRateCard({
  gov,
  govDists,
  isArabic,
  currency,
  countryDefaultPrice,
  customRates,
  localGovInputs,
  localDistInputs,
  isExpanded,
  savingKey,
  onToggleExpand,
  onGovDraftChange,
  onDistDraftChange,
  onSaveGov,
  onResetGov,
  onApplyAllDistricts,
  onSaveDistrict,
  onResetDistrict,
  t,
}: GovernorateRateCardProps) {
  const customGovPrice = customRates.governorates[String(gov.id)];
  const hasCustomGovPrice = customGovPrice !== undefined && customGovPrice !== null;
  const effectiveGovPrice = hasCustomGovPrice ? customGovPrice : countryDefaultPrice;

  const isGovSaving = savingKey === `gov-${gov.id}`;
  const isGovResetting = savingKey === `reset-gov-${gov.id}`;
  const isApplyingAll = savingKey === `apply-all-${gov.id}`;

  const draftGovValue =
    localGovInputs[gov.id] !== undefined
      ? localGovInputs[gov.id]
      : hasCustomGovPrice
      ? String(customGovPrice)
      : '';

  return (
    <Card
      key={gov.id}
      className={cn(
        "rounded-2xl border transition-all overflow-hidden bg-[#0B0F19]/95 shadow-xl",
        hasCustomGovPrice
          ? "border-amber-500/40 shadow-[0_4px_25px_rgba(245,158,11,0.06)]"
          : "border-white/10 hover:border-white/20"
      )}
    >
      {/* Governorate Header Bar */}
      <div className="p-3.5 sm:p-4 bg-[#111827]/60 border-b border-white/5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left: Name and indicator */}
        <div
          onClick={onToggleExpand}
          className="flex items-center gap-3 cursor-pointer select-none flex-1"
        >
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-black transition-all",
              hasCustomGovPrice
                ? "bg-amber-500/15 border-amber-500/30 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                : "bg-teal-500/10 border-teal-500/20 text-teal-400"
            )}
          >
            <MapPin className="h-5 w-5" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black text-white">
                {isArabic ? gov.name_ar : (gov.name_en || gov.name_ar)}
              </h3>
              <span className="text-[11px] text-slate-500 font-sans">
                ({isArabic ? gov.name_en : gov.name_ar})
              </span>
              {hasCustomGovPrice ? (
                <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold py-0.5 px-2">
                  <Sparkles className="w-2.5 h-2.5 ml-1" />
                  {t('customGovBadge')}
                </Badge>
              ) : (
                <Badge className="bg-slate-800 text-slate-300 border border-white/10 text-[10px] py-0.5 px-2">
                  {t('defaultGovBadge', { price: countryDefaultPrice, currency })}
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {t('containsCount', { count: govDists.length })}
            </p>
          </div>
        </div>

        {/* Right: Quick Price Setter Controls */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Price Input with Unit */}
          <div className="flex items-center bg-black/60 rounded-xl border border-white/15 px-2.5 py-1 focus-within:border-teal-400 transition-all">
            <span className="text-xs text-slate-400 font-bold ml-1.5">{t('hourPriceLabel')}</span>
            <Input
              type="number"
              step="0.05"
              min="0.1"
              dir="ltr"
              placeholder={String(countryDefaultPrice)}
              value={draftGovValue}
              onChange={(e) => onGovDraftChange(e.target.value)}
              className="w-20 sm:w-24 h-7 text-xs font-mono font-bold bg-transparent border-none text-white text-left p-0 focus-visible:ring-0"
            />
            <span className="text-[11px] font-bold text-teal-400 mr-1.5 font-sans">{currency}</span>
          </div>

          {/* Save Button */}
          <Button
            type="button"
            size="sm"
            onClick={onSaveGov}
            disabled={isGovSaving || isGovResetting || isApplyingAll}
            className="h-8 px-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#0B0F19] text-xs font-black transition-all shadow-sm active:scale-95 flex items-center gap-1"
          >
            {isGovSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            <span>{t('saveBtn')}</span>
          </Button>

          {/* Quick Apply to ALL districts button */}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onApplyAllDistricts}
            disabled={isGovSaving || isGovResetting || isApplyingAll}
            className="h-8 px-2.5 rounded-xl border-amber-500/30 text-amber-300 hover:bg-amber-500/10 hover:text-amber-200 text-xs font-bold transition-all flex items-center gap-1"
            title={t('applyAllTitle')}
          >
            {isApplyingAll ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Zap className="h-3.5 w-3.5 text-amber-400" />
            )}
            <span>{t('applyAllBtn')}</span>
          </Button>

          {/* Reset Button (only if custom) */}
          {hasCustomGovPrice && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onResetGov}
              disabled={isGovSaving || isGovResetting || isApplyingAll}
              className="h-8 w-8 p-0 rounded-xl text-rose-400 hover:text-rose-200 hover:bg-rose-500/10"
              title={t('resetGovTitle')}
            >
              {isGovResetting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5" />
              )}
            </Button>
          )}

          {/* Accordion Toggle Chevron */}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onToggleExpand}
            className="h-8 w-8 p-0 rounded-xl text-slate-400 hover:text-white hover:bg-white/5"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Districts Sub-Grid (Expanded) */}
      {isExpanded && (
        <CardContent className="p-3.5 sm:p-5 bg-black/40">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
            <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <ArrowDownRight className="h-3.5 w-3.5 text-teal-400" />
              <span>
                {t('districtsUnderGov', {
                  gov: isArabic ? gov.name_ar : (gov.name_en || gov.name_ar),
                  count: govDists.length,
                })}
              </span>
            </p>
            <span className="text-[11px] text-slate-500 font-medium">
              {t('effectiveGovPrice')}{' '}
              <strong className="text-white font-mono">{effectiveGovPrice} {currency}</strong>
            </span>
          </div>

          {govDists.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">{t('noDistricts')}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {govDists.map((dist) => (
                <DistrictRateCard
                  key={dist.id}
                  dist={dist}
                  isArabic={isArabic}
                  currency={currency}
                  effectiveGovPrice={effectiveGovPrice}
                  customDistPrice={customRates.districts[String(dist.id)]}
                  draftDistValue={
                    localDistInputs[dist.id] !== undefined
                      ? localDistInputs[dist.id]
                      : customRates.districts[String(dist.id)] !== undefined
                      ? String(customRates.districts[String(dist.id)])
                      : ''
                  }
                  isSaving={savingKey === `dist-${dist.id}`}
                  isResetting={savingKey === `reset-dist-${dist.id}`}
                  onDraftChange={(val) => onDistDraftChange(dist.id, val)}
                  onSave={() => onSaveDistrict(dist.id)}
                  onReset={() => onResetDistrict(dist.id)}
                  t={t}
                />
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
