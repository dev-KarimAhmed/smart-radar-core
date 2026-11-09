import React from 'react';
import { Search, Languages, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { GeoFilterBar } from '@/features/admin/components/admin/geo-filter-bar';
import { cn } from '@/lib/utils';
import { styles } from './captains-types';

interface CaptainFilterToolbarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  verificationFilter: string;
  setVerificationFilter: (val: string) => void;
  rankFilter: string;
  setRankFilter: (val: string) => void;
  languageFilter: 'ALL' | 'ar' | 'en';
  setLanguageFilter: (val: 'ALL' | 'ar' | 'en') => void;
  selectedCountry: string | number;
  selectedGovernorate: string | number;
  selectedDistrict: string | number;
  handleCountryChange: (val: string) => void;
  handleGovernorateChange: (val: string) => void;
  handleDistrictChange: (val: string) => void;
  handleResetGeo: () => void;
  handleResetAllFilters: () => void;
  geoLookup: any;
  isArabic: boolean;
  t: (key: string, params?: Record<string, any>) => string;
}

export const CaptainFilterToolbar: React.FC<CaptainFilterToolbarProps> = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  verificationFilter,
  setVerificationFilter,
  rankFilter,
  setRankFilter,
  languageFilter,
  setLanguageFilter,
  selectedCountry,
  selectedGovernorate,
  selectedDistrict,
  handleCountryChange,
  handleGovernorateChange,
  handleDistrictChange,
  handleResetGeo,
  handleResetAllFilters,
  geoLookup,
  isArabic,
  t,
}) => {
  const isAnyFilterActive =
    statusFilter !== 'ALL' ||
    verificationFilter !== 'ALL' ||
    rankFilter !== 'ALL' ||
    languageFilter !== 'ALL' ||
    selectedCountry !== 'ALL' ||
    selectedGovernorate !== 'ALL' ||
    selectedDistrict !== 'ALL' ||
    searchQuery.trim() !== '';

  return (
    <div className="space-y-2.5">
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 bg-[#0B0F19]/90 border border-white/10 p-3.5 rounded-2xl">
        <div className={styles.searchContainer}>
          <Search className={styles.searchIcon} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className={styles.searchInput}
          />
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-xl p-1 text-[11px]">
            <span className="text-slate-400 px-2 font-bold">{t('filterStatus')}</span>
            {[
              { key: 'ALL', label: t('statusAll') },
              { key: 'ACTIVE', label: t('statusActive') },
              { key: 'IDLE', label: t('statusIdle') },
              { key: 'BUSY', label: t('statusBusy') },
              { key: 'SUSPENDED', label: t('statusSuspended') },
              { key: 'BANNED', label: t('statusBanned') },
            ].map((st) => (
              <button
                key={st.key}
                type="button"
                onClick={() => setStatusFilter(st.key)}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-bold transition text-[11px]",
                  statusFilter === st.key
                    ? "bg-[#14B8A6] text-[#0B0F19]"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Verification filter */}
          <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-xl p-1 text-[11px]">
            <span className="text-slate-400 px-2 font-bold">{t('filterVerification')}</span>
            {[
              { key: 'ALL', label: t('statusAll') },
              { key: 'APPROVED', label: t('verApproved') },
              { key: 'PENDING', label: t('verPending') },
            ].map((ver) => (
              <button
                key={ver.key}
                type="button"
                onClick={() => setVerificationFilter(ver.key)}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-bold transition text-[11px]",
                  verificationFilter === ver.key
                    ? "bg-[#14B8A6] text-[#0B0F19]"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {ver.label}
              </button>
            ))}
          </div>

          {/* Rank Tier filter */}
          <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-xl p-1 text-[11px]">
            <span className="text-slate-400 px-2 font-bold">{t('filterRank')}</span>
            {[
              { key: 'ALL', label: t('statusAll') },
              { key: 'PLATINUM', label: t('rankPlatinum') },
              { key: 'GOLD', label: t('rankGold') },
              { key: 'BRONZE', label: t('rankBronze') },
              { key: 'SILVER', label: t('rankSilver') },
            ].map((rk) => (
              <button
                key={rk.key}
                type="button"
                onClick={() => setRankFilter(rk.key)}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-bold transition text-[11px]",
                  rankFilter === rk.key
                    ? "bg-[#14B8A6] text-[#0B0F19]"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {rk.label}
              </button>
            ))}
          </div>

          {/* Language Filter */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
            <Languages className="w-3.5 h-3.5 text-[#14B8A6] mx-1 shrink-0" />
            {[
              { key: 'ALL', label: isArabic ? 'كل اللغات' : 'All' },
              { key: 'ar', label: '🇸🇦 العربية' },
              { key: 'en', label: '🇬🇧 English' },
            ].map((lf) => (
              <button
                key={lf.key}
                type="button"
                onClick={() => setLanguageFilter(lf.key as 'ALL' | 'ar' | 'en')}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-bold transition text-[11px] cursor-pointer",
                  languageFilter === lf.key
                    ? "bg-[#14B8A6] text-[#0B0F19]"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {lf.label}
              </button>
            ))}
          </div>

          {/* Reset Filters button */}
          {isAnyFilterActive && (
            <button
              type="button"
              onClick={handleResetAllFilters}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[11px] font-bold transition cursor-pointer"
              title={t('resetFiltersTooltip')}
            >
              <RotateCcw className="w-3 h-3 text-[#14B8A6]" />
              <span>{t('resetFilters')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Geographic Filtering Bar */}
      <GeoFilterBar
        geoLookup={geoLookup}
        selectedCountry={selectedCountry !== undefined && selectedCountry !== null ? String(selectedCountry) : ''}
        selectedGovernorate={selectedGovernorate !== undefined && selectedGovernorate !== null ? String(selectedGovernorate) : ''}
        selectedDistrict={selectedDistrict !== undefined && selectedDistrict !== null ? String(selectedDistrict) : ''}
        onCountryChange={handleCountryChange}
        onGovernorateChange={handleGovernorateChange}
        onDistrictChange={handleDistrictChange}
        onResetGeo={handleResetGeo}
        isArabic={isArabic}
      />
    </div>
  );
};
