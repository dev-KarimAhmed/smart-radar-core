'use client';

import React from 'react';
import { Loader2, MapPin, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { RoadRouteEstimate } from '@/lib/road-route';
import type { useDestinationTextSearch } from '../hooks/use-destination-text-search';
import type { useDestinationMapPicker } from '../hooks/use-destination-map-picker';
import type { useClipboardLocationImport } from '../hooks/use-clipboard-location-import';
import { DestinationConfirmedLocationCard } from './destination-confirmed-location-card';
import { DestinationSearchResults } from './destination-search-results';

const styles = {
  section: "space-y-3 rounded-2xl border border-white/10 bg-[#111827]/80 p-3 shadow-lg shadow-black/15",
  step1Header: "mb-2.5 flex items-start gap-2.5",
  stepBadge: "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#14B8A6]/15 text-xs font-black text-[#14F5D5]",
  stepTitle: "text-xs font-black text-white",
  stepHelper: "mt-1 text-[11px] leading-relaxed text-slate-400",
  searchForm: "flex gap-2",
  searchInputWrapper: "relative min-w-0 flex-1",
  searchIcon: "pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#14B8A6]",
  searchInput: "h-11 w-full rounded-xl border border-white/10 bg-black/40 pe-3 ps-10 text-sm font-bold text-white outline-none transition placeholder:text-slate-500 focus:border-[#14B8A6]/60",
  searchButton: "flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#14B8A6] px-3 text-sm font-black text-[#031315] transition hover:bg-[#2DD4BF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14F5D5] disabled:cursor-not-allowed disabled:opacity-50",
  searchButtonIcon: "h-4 w-4",
  searchButtonLoadingIcon: "h-5 w-5 animate-spin",
  searchButtonLabel: "hidden sm:inline",
  step2Wrapper: "border-t border-white/8 pt-3",
  step2Header: "mb-2.5 flex items-start gap-2.5",
  confirmButton: "flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#14B8A6]/35 bg-[#14B8A6]/12 px-4 text-xs font-black text-[#BFFCF2] transition-all duration-300 hover:bg-[#14B8A6]/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14F5D5] disabled:cursor-not-allowed disabled:opacity-60",
  confirmButtonLoadingIcon: "h-5 w-5 animate-spin",
  confirmButtonIcon: "h-5 w-5",
  scanCard: "flex items-center gap-3 rounded-xl border border-[#14B8A6]/25 bg-[#0B1220] p-3",
  scanIconWrapper: "relative flex h-10 w-10 shrink-0 items-center justify-center",
  scanPing1: "absolute h-9 w-9 animate-ping rounded-full border border-[#14B8A6]/50",
  scanPing2: "absolute h-6 w-6 animate-ping rounded-full border border-[#14F5D5]/40 [animation-delay:180ms]",
  scanPulse: "absolute h-6 w-6 animate-pulse rounded-full bg-[#14B8A6]/20",
  scanIcon: "relative z-10 h-4 w-4 text-[#14F5D5]",
  scanText: "min-w-0 text-start",
  scanTitle: "text-xs font-black text-white",
  scanSubtitle: "mt-0.5 text-[9px] leading-relaxed text-slate-400",
} as const;

export interface DestinationSearchPanelProps {
  destinationSearchQuery: string;
  onSearchQueryChange: (value: string) => void;
  search: ReturnType<typeof useDestinationTextSearch>;
  mapPicker: ReturnType<typeof useDestinationMapPicker>;
  clipboard: ReturnType<typeof useClipboardLocationImport>;
  isRouteEstimateLoading: boolean;
  currentRouteEstimate: RoadRouteEstimate | null;
  isCaptainScanPreviewActive: boolean;
  nearbyCaptainCount: number;
}

export function DestinationSearchPanel({
  destinationSearchQuery,
  onSearchQueryChange,
  search,
  mapPicker,
  clipboard,
  isRouteEstimateLoading,
  currentRouteEstimate,
  isCaptainScanPreviewActive,
  nearbyCaptainCount,
}: DestinationSearchPanelProps) {
  const locationCopy = useTranslations('location');

  return (
    <section className={styles.section}>
      <div>
        <div className={styles.step1Header}>
          <span className={styles.stepBadge}>1</span>
          <div>
            <p className={styles.stepTitle}>{locationCopy('step_search_title')}</p>
            <p className={styles.stepHelper}>{locationCopy('step_search_helper')}</p>
          </div>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            mapPicker.handleOpenGoogleMapsSearch();
          }}
          className={styles.searchForm}
        >
          <div className={styles.searchInputWrapper}>
            <Search className={styles.searchIcon} />
            <input
              type="search"
              value={destinationSearchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder={locationCopy('placeholder_landmark')}
              className={styles.searchInput}
            />
          </div>
          <button
            type="submit"
            disabled={destinationSearchQuery.trim().length < 2 || mapPicker.isLoadingMapPreview}
            aria-label={locationCopy('btn_open_google_maps')}
            title={locationCopy('btn_open_google_maps')}
            className={styles.searchButton}
          >
            {mapPicker.isLoadingMapPreview ? (
              <Loader2 className={styles.searchButtonLoadingIcon} />
            ) : (
              <Search className={styles.searchButtonIcon} />
            )}
            <span className={styles.searchButtonLabel}>
              {locationCopy('btn_open_google_maps')}
            </span>
          </button>
        </form>
      </div>

      <div className={styles.step2Wrapper}>
        <div className={styles.step2Header}>
          <span className={styles.stepBadge}>2</span>
          <div>
            <p className={styles.stepTitle}>{locationCopy('step_confirm_title')}</p>
            <p className={styles.stepHelper}>{locationCopy('step_confirm_helper')}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={clipboard.handleConfirmClipboardLocation}
          disabled={clipboard.isReadingClipboardLocation}
          className={styles.confirmButton}
        >
          {clipboard.isReadingClipboardLocation ? <Loader2 className={styles.confirmButtonLoadingIcon} /> : <MapPin className={styles.confirmButtonIcon} />}
          <span>
            {clipboard.isReadingClipboardLocation
              ? locationCopy('status_reading_clipboard')
              : locationCopy('btn_confirm_and_calculate')}
          </span>
        </button>
      </div>

      {clipboard.externalLocationUrl ? (
        <DestinationConfirmedLocationCard
          externalLocationUrl={clipboard.externalLocationUrl}
          isRouteEstimateLoading={isRouteEstimateLoading}
          currentRouteEstimate={currentRouteEstimate}
        />
      ) : null}

      {isCaptainScanPreviewActive ? (
        <div className={styles.scanCard} role="status">
          <div className={styles.scanIconWrapper}>
            {nearbyCaptainCount === 0 ? (
              <>
                <span className={styles.scanPing1} />
                <span className={styles.scanPing2} />
              </>
            ) : null}
            <span className={styles.scanPulse} />
            <Search className={styles.scanIcon} />
          </div>
          <div className={styles.scanText}>
            <p className={styles.scanTitle}>
              {nearbyCaptainCount > 0
                ? locationCopy('captains_found', { count: nearbyCaptainCount })
                : locationCopy('status_scanning_captains')}
            </p>
            <p className={styles.scanSubtitle}>
              {locationCopy('captain_search_origin_helper')}
            </p>
          </div>
        </div>
      ) : null}

      <DestinationSearchResults
        results={search.destinationSearchResults}
        status={search.destinationSearchStatus}
        onSelectResult={search.handleDestinationSearchResult}
      />
    </section>
  );
}
