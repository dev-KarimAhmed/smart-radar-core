'use client';

import React from 'react';
import { DollarSign, Sparkles, MapPin, Layers } from 'lucide-react';

interface HourlyRatesHeaderMetricsProps {
  countryDefaultPrice: number;
  currency: string;
  totalCustomZones: number;
  totalGovsInCountry: number;
  totalDistsInCountry: number;
  activeCountryName: string;
  t: (key: string, values?: any) => string;
}

export function HourlyRatesHeaderMetrics({
  countryDefaultPrice,
  currency,
  totalCustomZones,
  totalGovsInCountry,
  totalDistsInCountry,
  activeCountryName,
  t,
}: HourlyRatesHeaderMetricsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Metric: Base Rate */}
      <div className="rounded-2xl border border-teal-500/20 bg-[#161F30]/70 p-4 backdrop-blur-xl shadow-lg">
        <p className="text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1.5">
          <DollarSign className="h-3.5 w-3.5 text-teal-400" />
          {t('metricBaseRate')}
        </p>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl font-black text-teal-300 font-mono">
            {countryDefaultPrice.toFixed(2)}
          </span>
          <span className="text-xs font-bold text-slate-400">{currency}{t('hourSuffix')}</span>
        </div>
      </div>

      {/* Metric: Custom Zones */}
      <div className="rounded-2xl border border-amber-500/20 bg-[#161F30]/70 p-4 backdrop-blur-xl shadow-lg">
        <p className="text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          {t('metricCustomZones')}
        </p>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl font-black text-amber-300 font-mono">
            {totalCustomZones}
          </span>
          <span className="text-xs font-bold text-slate-400">{t('govAndZoneUnit')}</span>
        </div>
      </div>

      {/* Metric: Governorates count */}
      <div className="rounded-2xl border border-white/10 bg-[#161F30]/70 p-4 backdrop-blur-xl shadow-lg">
        <p className="text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-cyan-400" />
          {t('metricGovs')}
        </p>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl font-black text-white font-mono">
            {totalGovsInCountry}
          </span>
          <span className="text-xs font-bold text-slate-400">{t('govBelongingTo', { country: activeCountryName })}</span>
        </div>
      </div>

      {/* Metric: Districts count */}
      <div className="rounded-2xl border border-white/10 bg-[#161F30]/70 p-4 backdrop-blur-xl shadow-lg">
        <p className="text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-indigo-400" />
          {t('metricDists')}
        </p>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl font-black text-white font-mono">
            {totalDistsInCountry}
          </span>
          <span className="text-xs font-bold text-slate-400">{t('geoZoneUnit')}</span>
        </div>
      </div>
    </div>
  );
}

