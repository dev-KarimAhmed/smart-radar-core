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
  searchButton: "flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#14B8A6] px-4 text-sm font-black text-[#031315] transition hover:bg-[#2DD4BF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14F5D5] disabled:cursor-not-allowed disabled:opacity-50",
  searchButtonIcon: "h-4 w-4",
  step2Wrapper: "border-t border-white/8 pt-3",
  step2Header: "mb-2.5 flex items-start gap-2.5",
  confirmButton: "flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#14B8A6]/35 bg-[#14B8A6]/12 px-4 text-xs font-black text-[#BFFCF2] transition-all duration-300 hover:bg-[#14B8A6]/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14F5D5] disabled:cursor-not-allowed disabled:opacity-60",
  confirmButtonLoadingIcon: "h-5 w-5 animate-spin",
  confirmButtonIcon: "h-5 w-5",
} as const;

export interface DestinationSearchPanelProps {
  search: ReturnType<typeof useDestinationTextSearch>;
  mapPicker: ReturnType<typeof useDestinationMapPicker>;
  clipboard: ReturnType<typeof useClipboardLocationImport>;
  isRouteEstimateLoading: boolean;
  currentRouteEstimate: RoadRouteEstimate | null;
  isCaptainScanPreviewActive: boolean;
  nearbyCaptainCount?: number;
  onResetDraft?: () => void;
  onCancelPreview?: () => void;
}

export function DestinationSearchPanel({
  search,
  mapPicker,
  clipboard,
  isRouteEstimateLoading,
  currentRouteEstimate,
  isCaptainScanPreviewActive,
  onResetDraft,
  onCancelPreview,
}: DestinationSearchPanelProps) {
  const locationCopy = useTranslations('location');

  return (
    <section className={styles.section}>
      {!isCaptainScanPreviewActive ? (
        <>
          <div>
            <div className={styles.step1Header}>
              <span className={styles.stepBadge}>1</span>
              <div>
                <p className={styles.stepTitle}>{locationCopy('step_search_title')}</p>
                <p className={styles.stepHelper}>{locationCopy('step_search_helper')}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => mapPicker.handleOpenGoogleMapsSearch()}
              aria-label={locationCopy('btn_open_google_maps')}
              title={locationCopy('btn_open_google_maps')}
              className={styles.searchButton}
            >
              <Search className={styles.searchButtonIcon} />
              <span>
                {locationCopy('btn_open_google_maps')}
              </span>
            </button>
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
              onClick={() => clipboard.handleConfirmClipboardLocation()}
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
        </>
      ) : (
        <button
          type="button"
          onClick={() => {
            if (onCancelPreview) {
              onCancelPreview();
            } else {
              onResetDraft?.();
              clipboard.reset?.();
              search.setDestinationSearchStatus?.('idle');
              search.reset?.();
              window.dispatchEvent(new CustomEvent('exit-request-flow'));
            }
          }}
          className={styles.confirmButton}
        >
          <span>إعادة الطلب</span>
        </button>
      )}

      {clipboard.externalLocationUrl ? (
        <DestinationConfirmedLocationCard
          externalLocationUrl={clipboard.externalLocationUrl}
          isRouteEstimateLoading={isRouteEstimateLoading}
          currentRouteEstimate={currentRouteEstimate}
          hideMetrics={isCaptainScanPreviewActive}
        />
      ) : null}

      <DestinationSearchResults
        results={search.destinationSearchResults}
        status={search.destinationSearchStatus}
        onSelectResult={search.handleDestinationSearchResult}
      />
    </section>
  );
}
