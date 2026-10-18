'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { adminFetch } from '@/features/admin/lib/admin-api-client';
import { useToast } from '@/hooks/use-toast';
import {
  Clock,
  DollarSign,
  MapPin,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
  RotateCcw,
  Check,
  Zap,
  Info,
  Globe,
  ArrowDownRight,
  ShieldCheck,
  CheckCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';

interface CountryItem {
  id: number;
  country_code: string;
  name_ar: string;
  name_en: string;
  currency_ar: string;
  currency_en: string;
  radar_hour_price: number;
}

interface GovernorateItem {
  id: number;
  name_ar: string;
  name_en: string;
  country_id: number;
}

interface DistrictItem {
  id: number;
  name_ar: string;
  name_en: string;
  governorate_id: number;
}

interface CustomRatesMatrix {
  governorates: Record<string, number>;
  districts: Record<string, number>;
}

export function HourlyRatesManagementPanel() {
  const t = useTranslations('hourlyRates');
  const { toast } = useToast();
  const { direction, isArabic } = useDashboardLanguage();

  const [loading, setLoading] = useState(true);
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [governorates, setGovernorates] = useState<GovernorateItem[]>([]);
  const [districts, setDistricts] = useState<DistrictItem[]>([]);
  const [customRates, setCustomRates] = useState<CustomRatesMatrix>({ governorates: {}, districts: {} });

  // Filtering & active states
  const [selectedCountryId, setSelectedCountryId] = useState<number>(1); // Default Jordan
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'custom_only' | 'default_only'>('all');
  const [expandedGovs, setExpandedGovs] = useState<Record<number, boolean>>({});

  // Local input drafts to make typing smooth and snappy
  const [localGovInputs, setLocalGovInputs] = useState<Record<number, string>>({});
  const [localDistInputs, setLocalDistInputs] = useState<Record<number, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // Fetch all rate data
  const loadRatesData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminFetch('/api/admin/hourly-rates');
      const data = await res.json();

      if (data?.success) {
        setCountries(data.countries || []);
        setGovernorates(data.governorates || []);
        setDistricts(data.districts || []);
        setCustomRates(data.customRates || { governorates: {}, districts: {} });

        // Initialize local drafts
        const initialGovInputs: Record<number, string> = {};
        for (const g of data.governorates || []) {
          const customVal = data.customRates?.governorates?.[String(g.id)];
          if (customVal !== undefined && customVal !== null) {
            initialGovInputs[g.id] = String(customVal);
          }
        }
        setLocalGovInputs(initialGovInputs);

        const initialDistInputs: Record<number, string> = {};
        for (const d of data.districts || []) {
          const customVal = data.customRates?.districts?.[String(d.id)];
          if (customVal !== undefined && customVal !== null) {
            initialDistInputs[d.id] = String(customVal);
          }
        }
        setLocalDistInputs(initialDistInputs);
      }
    } catch (err) {
      console.error('[HourlyRatesPanel] load error:', err);
      toast({
        title: t('toastLoadErrorTitle'),
        description: t('toastLoadErrorDesc'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    void loadRatesData();
  }, [loadRatesData]);

  // Active country details
  const activeCountry = useMemo(() => {
    return countries.find((c) => c.id === selectedCountryId) || countries[0] || {
      id: 1,
      country_code: 'JO',
      name_ar: 'الأردن',
      name_en: 'Jordan',
      currency_ar: 'د.أ',
      currency_en: 'JOD',
      radar_hour_price: 1,
    };
  }, [countries, selectedCountryId]);

  const currency = isArabic ? activeCountry.currency_ar : (activeCountry.currency_en || 'JOD');
  const countryDefaultPrice = activeCountry.radar_hour_price || 1;

  // Toggle single governorate accordion
  const toggleGovExpanded = (govId: number) => {
    setExpandedGovs((prev) => ({
      ...prev,
      [govId]: !prev[govId],
    }));
  };

  // Expand / collapse all governorates
  const expandAllGovs = (expand: boolean) => {
    const next: Record<number, boolean> = {};
    for (const g of governorates) {
      next[g.id] = expand;
    }
    setExpandedGovs(next);
  };

  // Save single governorate rate
  const handleSaveGovRate = async (govId: number) => {
    const rawVal = localGovInputs[govId]?.trim();
    const numVal = rawVal ? Number(rawVal) : null;

    if (numVal !== null && (isNaN(numVal) || numVal <= 0)) {
      toast({
        title: t('toastInvalidPriceTitle'),
        description: t('toastInvalidPriceDesc'),
        variant: 'destructive',
      });
      return;
    }

    try {
      setSavingKey(`gov-${govId}`);
      const res = await adminFetch('/api/admin/hourly-rates', {
        method: 'POST',
        body: JSON.stringify({
          action: 'update_single_rate',
          targetType: 'governorate',
          targetId: govId,
          hourPrice: numVal,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || t('toastGenericError'));
      }

      setCustomRates((prev) => {
        const nextGovs = { ...prev.governorates };
        if (numVal === null) {
          delete nextGovs[String(govId)];
        } else {
          nextGovs[String(govId)] = numVal;
        }
        return { ...prev, governorates: nextGovs };
      });

      toast({
        title: t('toastGovSavedTitle'),
        description: t('toastGovSavedDesc', { price: numVal !== null ? `${numVal} ${currency}` : `${countryDefaultPrice} ${currency}` }),
      });
    } catch (err: any) {
      toast({
        title: t('toastGenericError'),
        description: err.message || t('toastGenericError'),
        variant: 'destructive',
      });
    } finally {
      setSavingKey(null);
    }
  };

  // Reset governorate rate to country default
  const handleResetGovRate = async (govId: number) => {
    try {
      setSavingKey(`reset-gov-${govId}`);
      const res = await adminFetch('/api/admin/hourly-rates', {
        method: 'POST',
        body: JSON.stringify({
          action: 'reset_governorate',
          governorateId: govId,
          resetDistricts: false,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || t('toastGenericError'));
      }

      setLocalGovInputs((prev) => {
        const next = { ...prev };
        delete next[govId];
        return next;
      });

      setCustomRates((prev) => {
        const nextGovs = { ...prev.governorates };
        delete nextGovs[String(govId)];
        return { ...prev, governorates: nextGovs };
      });

      toast({
        title: t('toastGovResetTitle'),
        description: t('toastGovResetDesc'),
      });
    } catch (err: any) {
      toast({
        title: t('toastGenericError'),
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setSavingKey(null);
    }
  };

  // Apply governorate price to ALL its districts with one click
  const handleApplyToAllDistricts = async (govId: number) => {
    const rawVal = localGovInputs[govId]?.trim();
    const numVal = rawVal ? Number(rawVal) : countryDefaultPrice;

    if (isNaN(numVal) || numVal <= 0) {
      toast({
        title: t('toastInvalidPriceTitle'),
        description: t('toastInvalidPriceDesc'),
        variant: 'destructive',
      });
      return;
    }

    try {
      setSavingKey(`apply-all-${govId}`);
      const res = await adminFetch('/api/admin/hourly-rates', {
        method: 'POST',
        body: JSON.stringify({
          action: 'apply_to_governorate_districts',
          governorateId: govId,
          hourPrice: numVal,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || t('toastGenericError'));
      }

      // Update local state for all districts of this gov
      const relatedDists = districts.filter((d) => d.governorate_id === govId);
      setLocalDistInputs((prev) => {
        const next = { ...prev };
        for (const d of relatedDists) {
          next[d.id] = String(numVal);
        }
        return next;
      });

      setCustomRates((prev) => {
        const nextGovs = { ...prev.governorates, [String(govId)]: numVal };
        const nextDists = { ...prev.districts };
        for (const d of relatedDists) {
          nextDists[String(d.id)] = numVal;
        }
        return { governorates: nextGovs, districts: nextDists };
      });

      // Expand to show the result to admin
      setExpandedGovs((prev) => ({ ...prev, [govId]: true }));

      toast({
        title: t('toastApplyAllTitle'),
        description: t('toastApplyAllDesc', { price: numVal, currency, count: relatedDists.length }),
      });
    } catch (err: any) {
      toast({
        title: t('toastGenericError'),
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setSavingKey(null);
    }
  };

  // Save single district rate
  const handleSaveDistrictRate = async (distId: number) => {
    const rawVal = localDistInputs[distId]?.trim();
    const numVal = rawVal ? Number(rawVal) : null;

    if (numVal !== null && (isNaN(numVal) || numVal <= 0)) {
      toast({
        title: t('toastInvalidPriceTitle'),
        description: t('toastInvalidPriceDesc'),
        variant: 'destructive',
      });
      return;
    }

    try {
      setSavingKey(`dist-${distId}`);
      const res = await adminFetch('/api/admin/hourly-rates', {
        method: 'POST',
        body: JSON.stringify({
          action: 'update_single_rate',
          targetType: 'district',
          targetId: distId,
          hourPrice: numVal,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || t('toastGenericError'));
      }

      setCustomRates((prev) => {
        const nextDists = { ...prev.districts };
        if (numVal === null) {
          delete nextDists[String(distId)];
        } else {
          nextDists[String(distId)] = numVal;
        }
        return { ...prev, districts: nextDists };
      });

      toast({
        title: t('toastDistSavedTitle'),
        description: t('toastDistSavedDesc', { price: numVal !== null ? `${numVal} ${currency}` : currency }),
      });
    } catch (err: any) {
      toast({
        title: t('toastGenericError'),
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setSavingKey(null);
    }
  };

  // Reset district rate to inherit from governorate / country
  const handleResetDistrictRate = async (distId: number) => {
    try {
      setSavingKey(`reset-dist-${distId}`);
      const res = await adminFetch('/api/admin/hourly-rates', {
        method: 'POST',
        body: JSON.stringify({
          action: 'update_single_rate',
          targetType: 'district',
          targetId: distId,
          hourPrice: null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || t('toastGenericError'));
      }

      setLocalDistInputs((prev) => {
        const next = { ...prev };
        delete next[distId];
        return next;
      });

      setCustomRates((prev) => {
        const nextDists = { ...prev.districts };
        delete nextDists[String(distId)];
        return { ...prev, districts: nextDists };
      });

      toast({
        title: t('toastDistResetTitle'),
        description: t('toastDistResetDesc'),
      });
    } catch (err: any) {
      toast({
        title: t('toastGenericError'),
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setSavingKey(null);
    }
  };

  // Filtered Governorates for the selected country
  const filteredGovernorates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const countryGovs = governorates.filter((g) => g.country_id === selectedCountryId);

    return countryGovs.filter((gov) => {
      const govDists = districts.filter((d) => d.governorate_id === gov.id);
      const hasGovCustom = customRates.governorates[String(gov.id)] !== undefined;
      const hasAnyDistCustom = govDists.some((d) => customRates.districts[String(d.id)] !== undefined);

      // Filter Mode filter
      if (filterMode === 'custom_only' && !hasGovCustom && !hasAnyDistCustom) {
        return false;
      }
      if (filterMode === 'default_only' && (hasGovCustom || hasAnyDistCustom)) {
        return false;
      }

      // Search Query filter
      if (!q) return true;

      const govMatch = gov.name_ar.toLowerCase().includes(q) || gov.name_en.toLowerCase().includes(q);
      if (govMatch) return true;

      const distMatch = govDists.some(
        (d) => d.name_ar.toLowerCase().includes(q) || d.name_en.toLowerCase().includes(q)
      );
      return distMatch;
    });
  }, [governorates, districts, selectedCountryId, searchQuery, filterMode, customRates]);

  // Total stats
  const totalGovsInCountry = governorates.filter((g) => g.country_id === selectedCountryId).length;
  const totalDistsInCountry = districts.filter((d) => {
    const g = governorates.find((gov) => gov.id === d.governorate_id);
    return g?.country_id === selectedCountryId;
  }).length;

  const totalCustomZones = useMemo(() => {
    const govIds = new Set(governorates.filter((g) => g.country_id === selectedCountryId).map((g) => String(g.id)));
    const customGovCount = Object.keys(customRates.governorates).filter((id) => govIds.has(id)).length;

    const distIds = new Set(
      districts
        .filter((d) => {
          const g = governorates.find((gov) => gov.id === d.governorate_id);
          return g?.country_id === selectedCountryId;
        })
        .map((d) => String(d.id))
    );
    const customDistCount = Object.keys(customRates.districts).filter((id) => distIds.has(id)).length;

    return customGovCount + customDistCount;
  }, [governorates, districts, selectedCountryId, customRates]);

  return (
    <div className={cn("space-y-6", isArabic ? "text-right" : "text-left")} dir={direction}>
      {/* 1. Header & Summary Stats */}
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
            <span className="text-xs font-bold text-slate-400">{t('govBelongingTo', { country: isArabic ? activeCountry.name_ar : (activeCountry.name_en || activeCountry.name_ar) })}</span>
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

      {/* 2. Country Switcher & Explanatory Banner */}
      <div className="rounded-2xl border border-white/10 bg-[#0B0F19]/90 p-4 sm:p-5 shadow-xl backdrop-blur-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-teal-400" />
              <span>{t('title')}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {t('subtitle')}
            </p>
          </div>

          {/* Country selector buttons */}
          <div className="flex items-center gap-2 bg-black/60 p-1 rounded-xl border border-white/10 self-start sm:self-auto">
            {countries.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCountryId(c.id)}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                  selectedCountryId === c.id
                    ? "bg-teal-500 text-[#0B0F19] shadow-md"
                    : "text-slate-400 hover:text-white"
                )}
              >
                <span>{c.country_code === 'JO' ? '🇯🇴' : '🇪🇬'}</span>
                <span>{isArabic ? c.name_ar : (c.name_en || c.name_ar)}</span>
                <span className="text-[10px] opacity-75 font-mono">({isArabic ? c.currency_ar : (c.currency_en || c.currency_ar)})</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Search and Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="bg-black/50 border-white/10 text-white text-xs h-10 pr-9 pl-3 rounded-xl focus:border-teal-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                {t('clearSearch')}
              </button>
            )}
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setFilterMode('all')}
              className={cn(
                "h-9 px-3 rounded-xl text-xs font-bold border transition-all",
                filterMode === 'all'
                  ? "bg-teal-500/20 text-teal-300 border-teal-500/40"
                  : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
              )}
            >
              {t('filterAll')} ({filteredGovernorates.length})
            </Button>

            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setFilterMode('custom_only')}
              className={cn(
                "h-9 px-3 rounded-xl text-xs font-bold border transition-all flex items-center gap-1",
                filterMode === 'custom_only'
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
              )}
            >
              <Sparkles className="h-3 w-3 text-amber-400" />
              <span>{t('filterCustomOnly')}</span>
            </Button>

            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setFilterMode('default_only')}
              className={cn(
                "h-9 px-3 rounded-xl text-xs font-bold border transition-all",
                filterMode === 'default_only'
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                  : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
              )}
            >
              {t('filterDefaultOnly')}
            </Button>

            <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => expandAllGovs(true)}
              className="border-white/10 text-slate-300 hover:bg-white/5 h-9 px-2.5 rounded-xl text-[11px]"
              title={t('expandAll')}
            >
              {t('expandAll')}
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => expandAllGovs(false)}
              className="border-white/10 text-slate-300 hover:bg-white/5 h-9 px-2.5 rounded-xl text-[11px]"
              title={t('collapseAll')}
            >
              {t('collapseAll')}
            </Button>
          </div>
        </div>
      </div>

      {/* 4. Governorates & Districts List */}
      {loading ? (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-400 rounded-2xl border border-white/10 bg-[#0B0F19]/90 p-12">
          <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
          <p className="text-xs">{t('loadingRates')}</p>
        </div>
      ) : filteredGovernorates.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-400 rounded-2xl border border-white/10 bg-[#0B0F19]/90 p-12">
          <MapPin className="h-8 w-8 text-slate-600" />
          <p className="text-xs">{t('emptySearchResult')}</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredGovernorates.map((gov) => {
            const govDists = districts.filter((d) => d.governorate_id === gov.id);
            const isExpanded = !!expandedGovs[gov.id] || !!searchQuery.trim();

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
                    onClick={() => toggleGovExpanded(gov.id)}
                    className="flex items-center gap-3 cursor-pointer select-none flex-1"
                  >
                    <div className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-black transition-all",
                      hasCustomGovPrice
                        ? "bg-amber-500/15 border-amber-500/30 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                        : "bg-teal-500/10 border-teal-500/20 text-teal-400"
                    )}>
                      <MapPin className="h-5 w-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-black text-white">{isArabic ? gov.name_ar : (gov.name_en || gov.name_ar)}</h3>
                        <span className="text-[11px] text-slate-500 font-sans">({isArabic ? gov.name_en : gov.name_ar})</span>
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
                        onChange={(e) => {
                          const val = e.target.value;
                          setLocalGovInputs((prev) => ({ ...prev, [gov.id]: val }));
                        }}
                        className="w-20 sm:w-24 h-7 text-xs font-mono font-bold bg-transparent border-none text-white text-left p-0 focus-visible:ring-0"
                      />
                      <span className="text-[11px] font-bold text-teal-400 mr-1.5 font-sans">{currency}</span>
                    </div>

                    {/* Save Button */}
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleSaveGovRate(gov.id)}
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
                      onClick={() => handleApplyToAllDistricts(gov.id)}
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
                        onClick={() => handleResetGovRate(gov.id)}
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
                      onClick={() => toggleGovExpanded(gov.id)}
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
                        <span>{t('districtsUnderGov', { gov: isArabic ? gov.name_ar : (gov.name_en || gov.name_ar), count: govDists.length })}</span>
                      </p>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {t('effectiveGovPrice')} <strong className="text-white font-mono">{effectiveGovPrice} {currency}</strong>
                      </span>
                    </div>

                    {govDists.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4">
                        {t('noDistricts')}
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {govDists.map((dist) => {
                          const customDistPrice = customRates.districts[String(dist.id)];
                          const hasCustomDistPrice = customDistPrice !== undefined && customDistPrice !== null;
                          const effectiveDistPrice = hasCustomDistPrice ? customDistPrice : effectiveGovPrice;

                          const draftDistValue = localDistInputs[dist.id] !== undefined
                            ? localDistInputs[dist.id]
                            : hasCustomDistPrice
                            ? String(customDistPrice)
                            : '';

                          const isDistSaving = savingKey === `dist-${dist.id}`;
                          const isDistResetting = savingKey === `reset-dist-${dist.id}`;

                          return (
                            <div
                              key={dist.id}
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
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setLocalDistInputs((prev) => ({ ...prev, [dist.id]: val }));
                                  }}
                                  className="w-16 h-7 text-xs font-mono font-bold bg-black/60 border-white/10 text-white text-center p-1 rounded-lg focus:border-teal-400"
                                />

                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => handleSaveDistrictRate(dist.id)}
                                  disabled={isDistSaving || isDistResetting}
                                  className="h-7 w-7 p-0 rounded-lg bg-teal-500 hover:bg-teal-400 text-[#0B0F19]"
                                  title={t('saveDistTitle')}
                                >
                                  {isDistSaving ? (
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
                                    onClick={() => handleResetDistrictRate(dist.id)}
                                    disabled={isDistSaving || isDistResetting}
                                    className="h-7 w-7 p-0 rounded-lg text-rose-400 hover:bg-rose-500/10"
                                    title={t('resetDistTitle')}
                                  >
                                    {isDistResetting ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <RotateCcw className="h-3 w-3" />
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

