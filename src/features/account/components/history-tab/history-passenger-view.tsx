'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { styles } from './history-shared';
import type { useHistoryState } from './use-history-state';
import { HistoryFilterBar, type HistoryCategoryKey } from './history-filter-bar';
import { HistoryRiderTrips } from './history-rider-trips';
import { HistoryTripNotifications } from './history-trip-notifications';
import { HistoryLegalDeclarations } from './history-legal-declarations';
import { HistoryFavoriteCaptains } from './history-favorite-captains';
import { HistoryGroupMinutesRow } from '@/features/whatsapp-groups/contract';
import { BlockedCaptainsSection } from '../profile-tab/blocked-captains-section';

export interface HistoryPassengerViewProps {
  state: ReturnType<typeof useHistoryState>;
  effectiveCategory: HistoryCategoryKey;
  onSelectCategory: (cat: HistoryCategoryKey) => void;
}

export function HistoryPassengerView({
  state,
  effectiveCategory,
  onSelectCategory,
}: HistoryPassengerViewProps) {
  const {
    favoriteCaptainIds,
    loading,
    riderHistoricalTrips,
    favoriteCaptains,
    toggleFavorite,
    isArabic,
    currencyLabel,
    t,
    tripReviews,
    refreshReviews,
    user,
  } = state;

  const now = Date.now();
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

      <HistoryFilterBar
        activeCategory={effectiveCategory}
        onSelectCategory={onSelectCategory}
        isPassenger={true}
        isArabic={isArabic}
      />

      {/* "بينكم تشكرك" Card */}
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
      {(effectiveCategory === 'all' || effectiveCategory === 'customers') && (
        <div className="space-y-4">
          <HistoryGroupMinutesRow isCaptain={false} userId={user?.uid} />
          <HistoryFavoriteCaptains
            favoriteCaptains={favoriteCaptains}
            toggleFavorite={toggleFavorite}
            isArabic={isArabic}
            t={t}
          />
          <BlockedCaptainsSection isArabic={isArabic} />
        </div>
      )}
    </div>
  );
}
