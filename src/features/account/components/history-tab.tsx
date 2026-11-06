'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  History,
  ReceiptText,
  FileCheck2,
  Car,
  Users,
  Award,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { styles } from './history-tab/history-shared';
import { useHistoryState } from './history-tab/use-history-state';
import { HistoryRiderTrips } from './history-tab/history-rider-trips';
import { HistoryCaptainTrips } from './history-tab/history-captain-trips';
import { HistoryFavoriteCaptains } from './history-tab/history-favorite-captains';
import { HistorySovereignLogs } from './history-tab/history-sovereign-logs';
import { HistoryTripNotifications } from './history-tab/history-trip-notifications';
import { HistoryLegalDeclarations } from './history-tab/history-legal-declarations';
import { HistoryFinancialReceipts } from './history-tab/history-financial-receipts';
import { HistoryRanksPoints } from './history-tab/history-ranks-points';
import { HistoryErrorExplorer } from './history-tab/history-error-explorer';
import { BlockedCaptainsSection } from './profile-tab/blocked-captains-section';
import { BlockedRidersSection } from '@/features/captain/components/profile/blocked-riders-section';
import { HistoryFavoriteRiders } from '@/features/referral/components/history-favorite-riders';

export type HistoryCategoryKey = 'all' | 'financial' | 'legal' | 'activity' | 'customers' | 'ranks';

interface CategoryTabItem {
  key: HistoryCategoryKey;
  labelAr: string;
  labelEn: string;
  icon: any;
  color: string;
  activeClass: string;
}

const CATEGORIES: CategoryTabItem[] = [
  {
    key: 'all',
    labelAr: 'الكل',
    labelEn: 'All',
    icon: Layers,
    color: 'text-slate-300',
    activeClass: 'bg-white/15 border-white/30 text-white shadow-md shadow-white/5',
  },
  {
    key: 'financial',
    labelAr: 'سجل المالية',
    labelEn: 'Financial',
    icon: ReceiptText,
    color: 'text-emerald-400',
    activeClass: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-md shadow-emerald-500/10',
  },
  {
    key: 'legal',
    labelAr: 'السجل القانوني',
    labelEn: 'Legal',
    icon: FileCheck2,
    color: 'text-amber-400',
    activeClass: 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-md shadow-amber-500/10',
  },
  {
    key: 'activity',
    labelAr: 'سجل النشاط',
    labelEn: 'Activity',
    icon: Car,
    color: 'text-cyan-400',
    activeClass: 'bg-cyan-500/20 border-cyan-500/40 text-[#14F5D5] shadow-md shadow-cyan-500/10',
  },
  {
    key: 'customers',
    labelAr: 'سجل العملاء',
    labelEn: 'Customers',
    icon: Users,
    color: 'text-blue-400',
    activeClass: 'bg-blue-500/20 border-blue-500/40 text-blue-300 shadow-md shadow-blue-500/10',
  },
  {
    key: 'ranks',
    labelAr: 'سجل الرتب والنقاط',
    labelEn: 'Ranks & Points',
    icon: Award,
    color: 'text-purple-400',
    activeClass: 'bg-purple-500/20 border-purple-500/40 text-purple-300 shadow-md shadow-purple-500/10',
  },
];

export interface HistoryTabProps {
  hideCaptainDiagnostics?: boolean;
}

export function HistoryTab({ hideCaptainDiagnostics = false }: HistoryTabProps = {}) {
  const state = useHistoryState();
  const [activeCategory, setActiveCategory] = useState<HistoryCategoryKey>('all');

  const {
    favoriteCaptainIds,
    sovereignLogs,
    loading,
    errorSearch,
    setErrorSearch,
    errorCategory,
    setErrorCategory,
    expandedErrorCode,
    setExpandedErrorCode,
    filteredErrors,
    riderHistoricalTrips,
    favoriteCaptains,
    captainHistoricalTrips,
    toggleFavorite,
    clearSovereignLogs,
    isCaptain,
    isPassenger,
    isArabic,
    currencyLabel,
    t,
    tripReviews,
    refreshReviews,
    user,
  } = state;

  const now = Date.now();
  const effectiveCategory = isPassenger && (activeCategory === 'financial' || activeCategory === 'ranks')
    ? 'all'
    : activeCategory;

  const renderCaptainsWithDivider = () => (
    <div className="space-y-4">
      <HistoryFavoriteCaptains
        favoriteCaptains={favoriteCaptains}
        toggleFavorite={toggleFavorite}
        isArabic={isArabic}
        t={t}
      />
      <BlockedCaptainsSection isArabic={isArabic} />
    </div>
  );

  // Filter Bar component (Page 4 requirement: Full-width tabs with zero truncation and zero scroll)
  const renderFilterBar = () => {
    const categories = isPassenger
      ? CATEGORIES.filter((cat) => cat.key !== 'financial' && cat.key !== 'ranks')
      : CATEGORIES;

    return (
      <div className="w-full">
        <div
          className={cn(
            'grid gap-2 w-full select-none',
            isPassenger
              ? 'grid-cols-2 sm:grid-cols-4'
              : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6'
          )}
        >
          {categories.map((cat) => {
            const isActive = effectiveCategory === cat.key;
            const Icon = cat.icon;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategory(cat.key)}
                className={cn(
                  'w-full flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2.5 sm:py-3 rounded-2xl border text-xs sm:text-sm font-black transition-all cursor-pointer active:scale-[0.98] text-center',
                  isActive
                    ? cat.activeClass
                    : 'border-white/10 bg-black/40 text-slate-400 hover:text-white hover:bg-white/5 hover:border-white/20'
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', isActive ? cat.color : 'text-slate-500')} />
                <span className="whitespace-nowrap">{isArabic ? cat.labelAr : cat.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Passenger View
  if (isPassenger) {
    const hasTrips = Boolean(riderHistoricalTrips && riderHistoricalTrips.length > 0);

    return (
      <div className={cn(styles.style857_16, !isArabic && 'font-sans')} dir={isArabic ? 'rtl' : 'ltr'}>
        {/* Header Card */}
        <Card className="relative overflow-hidden rounded-3xl border border-[#14B8A6]/20 bg-[#0B0F19]/90 shadow-2xl backdrop-blur-xl text-white">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#14F5D5]/60 to-transparent" />
          <CardContent className="p-4 sm:p-5">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-white flex items-center gap-2.5">
                <History className="h-5 w-5 text-[#14F5D5]" />
                {isArabic ? 'سجلاتي' : t('title')}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                {isArabic ? 'يتم حذف السجل في تتابع الأقدم كل 72 ساعة.' : t('subtitle')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Filter Navigation Bar (Hides Financial & Ranks tabs for Passengers) */}
        {renderFilterBar()}

        {/* Step 2: "بينكم تشكرك" Card */}
        {hasTrips && (effectiveCategory === 'all' || effectiveCategory === 'activity') && (
          <div className="rounded-2xl border border-[#14B8A6]/30 bg-gradient-to-r from-[#14B8A6]/10 via-[#0B0F19] to-[#14B8A6]/10 p-4 text-center shadow-lg shadow-black/20 animate-in fade-in duration-200">
            <p className="text-sm font-black text-white">
              <span className="text-[#14F5D5] font-black drop-shadow-[0_0_8px_rgba(20,245,213,0.4)]">بينكم</span>{' '}
              {isArabic
                ? 'تشكرك على تكملة نشاطك مع المعلنين'
                : 'thanks you for completing your activity with advertisers'}
            </p>
          </div>
        )}

        {/* 1. Legal Log */}
        {(effectiveCategory === 'all' || effectiveCategory === 'legal') && (
          <HistoryLegalDeclarations isArabic={isArabic} />
        )}

        {/* 2. Activity Log */}
        {(effectiveCategory === 'all' || effectiveCategory === 'activity') && (
          <div className="space-y-4">
            <HistoryRiderTrips
              riderHistoricalTrips={riderHistoricalTrips}
              loading={loading}
              favoriteCaptainIds={favoriteCaptainIds}
              toggleFavorite={toggleFavorite}
              currencyLabel={currencyLabel}
              isArabic={isArabic}
              now={now}
              tripReviews={tripReviews}
              currentUserId={user?.uid}
              onRatingSuccess={refreshReviews}
              t={t}
            />
            <HistoryTripNotifications isArabic={isArabic} t={t} />
          </div>
        )}

        {/* 3. Customers / Favorite Captains Log */}
        {(effectiveCategory === 'all' || effectiveCategory === 'customers') && renderCaptainsWithDivider()}
      </div>
    );
  }

  // Captain / Admin View
  return (
    <div className={cn(styles.style985_56, !isArabic && 'font-sans')} dir={isArabic ? 'rtl' : 'ltr'}>
      {/* 1. Header Card */}
      <Card className="relative overflow-hidden rounded-3xl border border-[#14B8A6]/20 bg-[#0B0F19]/90 shadow-2xl backdrop-blur-xl text-white">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#14F5D5]/60 to-transparent" />
        <CardContent className="p-4 sm:p-5">
          <div className="space-y-1">
            <h2 className="text-lg font-black text-white flex items-center gap-2.5">
              <History className="h-5 w-5 text-[#14F5D5]" />
              {t('title')}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">{t('subtitle')}</p>
          </div>
        </CardContent>
      </Card>

      {/* 2. Filter Navigation Bar */}
      {renderFilterBar()}

      {/* 3. Categorized Content Sections (Per Page 4 Architecture) */}
      {isCaptain && (
        <div className={styles.style1158_112}>
          {/* Section 1: Financial Log */}
          {(activeCategory === 'all' || activeCategory === 'financial') && (
            <HistoryFinancialReceipts isArabic={isArabic} />
          )}

          {/* Section 2: Legal Log */}
          {(activeCategory === 'all' || activeCategory === 'legal') && (
            <HistoryLegalDeclarations isArabic={isArabic} />
          )}

          {/* Section 3: Activity Log */}
          {(activeCategory === 'all' || activeCategory === 'activity') && (
            <div className="space-y-4">
              <HistoryCaptainTrips
                captainHistoricalTrips={captainHistoricalTrips}
                loading={loading}
                currencyLabel={currencyLabel}
                isArabic={isArabic}
                now={now}
                tripReviews={tripReviews}
                currentUserId={user?.uid}
                onRatingSuccess={refreshReviews}
                t={t}
              />
              <HistoryTripNotifications isArabic={isArabic} t={t} />
            </div>
          )}

          {/* Section 4: Customers Log */}
          {(activeCategory === 'all' || activeCategory === 'customers') && (
            <div className="space-y-4">
              <HistoryFavoriteRiders user={user} isArabic={isArabic} />
              <BlockedRidersSection isArabic={isArabic} />
            </div>
          )}

          {/* Section 5: Ranks and Points Log */}
          {(activeCategory === 'all' || activeCategory === 'ranks') && (
            <div className="space-y-4">
              <HistoryRanksPoints isArabic={isArabic} />

              <HistorySovereignLogs
                sovereignLogs={sovereignLogs}
                loading={loading}
                clearSovereignLogs={clearSovereignLogs}
                hideCaptainDiagnostics={hideCaptainDiagnostics}
                t={t}
              />

              {state.user?.role === 'admin' && !hideCaptainDiagnostics && (
                <HistoryErrorExplorer
                  errorSearch={errorSearch}
                  setErrorSearch={setErrorSearch}
                  errorCategory={errorCategory}
                  setErrorCategory={setErrorCategory}
                  expandedErrorCode={expandedErrorCode}
                  setExpandedErrorCode={setExpandedErrorCode}
                  filteredErrors={filteredErrors}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
