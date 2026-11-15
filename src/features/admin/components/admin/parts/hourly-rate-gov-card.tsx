'use client';

import React from 'react';
import { ArrowDownRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type {
  GovernorateItem,
  DistrictItem,
  CustomRatesMatrix,
} from '@/features/admin/types/hourly-rates';
import { HourlyRateGovHeader } from './hourly-rate-gov-header';
import { HourlyRateDistrictRow } from './hourly-rate-district-row';

interface HourlyRateGovCardProps {
  gov: GovernorateItem;
  govDists: DistrictItem[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  customRates: CustomRatesMatrix;
  countryDefaultPrice: number;
  currency: string;
  isArabic: boolean;
  localGovInputs: Record<number, string>;
  onGovDraftChange: (val: string) => void;
  localDistInputs: Record<number, string>;
  onDistDraftChange: (distId: number, val: string) => void;
  savingKey: string | null;
  onSaveGov: () => void;
  onResetGov: () => void;
  onApplyAllDistricts: () => void;
  onSaveDistrict: (distId: number) => void;
  onResetDistrict: (distId: number) => void;
  t: (key: string, values?: any) => string;
}

export function HourlyRateGovCard({
  gov,
  govDists,
  isExpanded,
  onToggleExpand,
  customRates,
  countryDefaultPrice,
  currency,
  isArabic,
  localGovInputs,
  onGovDraftChange,
  localDistInputs,
  onDistDraftChange,
  savingKey,
  onSaveGov,
  onResetGov,
  onApplyAllDistricts,
  onSaveDistrict,
  onResetDistrict,
  t,
}: HourlyRateGovCardProps) {
  const customGovPrice = customRates.governorates[String(gov.id)];
  const hasCustomGovPrice = customGovPrice !== undefined && customGovPrice !== null;
  const effectiveGovPrice = hasCustomGovPrice ? customGovPrice : countryDefaultPrice;

  const isGovSaving = savingKey === `gov-${gov.id}`;
  const isGovResetting = savingKey === `reset-gov-${gov.id}`;
  const isApplyingAll = savingKey === `apply-all-${gov.id}`;

  const draftGovValue = localGovInputs[gov.id] !== undefined
    ? localGovInputs[gov.id]
    : hasCustomGovPrice
    ? String(customGovPrice)
    : '';

  return (
    <Card
      className={cn(
        "rounded-2xl border transition-all overflow-hidden bg-[#0B0F19]/95 shadow-xl",
        hasCustomGovPrice
          ? "border-amber-500/40 shadow-[0_4px_25px_rgba(245,158,11,0.06)]"
          : "border-white/10 hover:border-white/20"
      )}
    >
      <HourlyRateGovHeader
        gov={gov}
        hasCustomGovPrice={hasCustomGovPrice}
        countryDefaultPrice={countryDefaultPrice}
        currency={currency}
        isArabic={isArabic}
        districtsCount={govDists.length}
        draftGovValue={draftGovValue}
        onGovDraftChange={onGovDraftChange}
        isGovSaving={isGovSaving}
        isGovResetting={isGovResetting}
        isApplyingAll={isApplyingAll}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        onSaveGov={onSaveGov}
        onResetGov={onResetGov}
        onApplyAllDistricts={onApplyAllDistricts}
        t={t}
      />

      {/* Districts Sub-Grid (Expanded) */}
      {isExpanded && (
        <CardContent className="p-3.5 sm:p-5 bg-black/40">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
            <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <ArrowDownRight className="h-3.5 w-3.5 text-teal-400" />
              <span>{t('districtsUnderGov', { gov: isArabic ? gov.name_ar : (gov.name_en || gov.name_ar), count: govDists.length })}</span>
            </p>
            <span className="text-[11px] text-slate-500 font-medium">
              {t('effectiveGovPrice')} <strong className="text-white font-mono">{effectiveGovPrice} {currency}</strong>
            </span>
          </div>

          {govDists.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">{t('noDistricts')}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {govDists.map((dist) => (
                <HourlyRateDistrictRow
                  key={dist.id}
                  district={dist}
                  customPrice={customRates.districts[String(dist.id)]}
                  effectiveGovPrice={effectiveGovPrice}
                  currency={currency}
                  isArabic={isArabic}
                  draftValue={
                    localDistInputs[dist.id] !== undefined
                      ? localDistInputs[dist.id]
                      : customRates.districts[String(dist.id)] !== undefined
                      ? String(customRates.districts[String(dist.id)])
                      : ''
                  }
                  onDraftChange={(val) => onDistDraftChange(dist.id, val)}
                  onSave={() => onSaveDistrict(dist.id)}
                  onReset={() => onResetDistrict(dist.id)}
                  isSaving={savingKey === `dist-${dist.id}`}
                  isResetting={savingKey === `reset-dist-${dist.id}`}
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
