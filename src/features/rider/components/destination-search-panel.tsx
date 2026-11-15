'use client';

import React from 'react';
import { AlertTriangle, ExternalLink, Loader2, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import type { RoadRouteEstimate } from '@/lib/road-route';
import type { useDestinationTextSearch } from '../hooks/use-destination-text-search';
import type { useDestinationMapPicker } from '../hooks/use-destination-map-picker';
import type { useClipboardLocationImport } from '../hooks/use-clipboard-location-import';
import { DestinationConfirmedLocationCard } from './destination-confirmed-location-card';
import { DestinationSearchResults } from './destination-search-results';
import { styles } from './destination-search/destination-search-styles';
import { DestinationAccuracyAccordion } from './destination-search/destination-accuracy-accordion';

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
  const { isArabic } = useDashboardLanguage();

  return (
    <section className={styles.section}>
      {!isCaptainScanPreviewActive ? (
        <>
          {/* Step 1: Destination point guidance */}
          <div>
            <div className={styles.step1Header}>
              <span className={styles.stepBadge}>1</span>
              <div>
                <p className={styles.stepTitle}>{isArabic ? '1. حدد نقطة وصولك' : locationCopy('step_search_title')}</p>
                <p className={styles.stepHelper}>{locationCopy('step_search_helper')}</p>
              </div>
            </div>
            <a
              href={mapPicker.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => mapPicker.handleOpenGoogleMapsSearch(e)}
              aria-label={locationCopy('btn_open_google_maps')}
              title={locationCopy('btn_open_google_maps')}
              className={styles.searchButton}
            >
              <ExternalLink className={styles.searchButtonIcon} />
              <span>
                {locationCopy('btn_open_google_maps')}
              </span>
            </a>
          </div>

          {/* Step 2: Lock coordinates & share with captain */}
          <div className={styles.step2Wrapper}>
            <div className={styles.step2Header}>
              <span className={styles.stepBadge}>2</span>
              <div>
                <p className={styles.stepTitle}>{isArabic ? '2. شارك الإحداثيات' : locationCopy('step_confirm_title')}</p>
                <p className={styles.stepHelper}>{locationCopy('step_confirm_helper')}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => clipboard.handleConfirmClipboardLocation()}
              disabled={clipboard.isReadingClipboardLocation}
              className={styles.confirmButton}
            >
              {clipboard.isReadingClipboardLocation ? (
                <Loader2 className={styles.confirmButtonLoadingIcon} />
              ) : (
                <MapPin className={styles.confirmButtonIcon} />
              )}
              <span className="text-[11px] font-bold leading-tight">
                {clipboard.isReadingClipboardLocation
                  ? locationCopy('status_reading_clipboard')
                  : (isArabic ? 'اضغط وقفل الإحداثيات وشاركه مع مقدم الخدمة (الكابتن)' : locationCopy('btn_confirm_and_calculate'))}
              </span>
            </button>

            <button
              type="button"
              onClick={() => clipboard.setShowManualPasteInput((prev) => !prev)}
              className="mt-2 block w-full text-center text-[11px] font-bold text-[#14F5D5] transition hover:underline cursor-pointer"
            >
              {clipboard.showManualPasteInput
                ? locationCopy('btn_hide_manual_paste')
                : locationCopy('btn_paste_manually')}
            </button>

            {clipboard.showManualPasteInput && (
              <div className="mt-2.5 space-y-2 rounded-xl border border-[#14B8A6]/25 bg-[#0B0F19]/90 p-2.5 shadow-inner">
                {clipboard.clipboardPermissionDenied && (
                  <div className="flex items-start gap-1.5 text-[11px] font-medium leading-tight text-amber-300">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{locationCopy('err_clipboard_permission_denied_hint')}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={clipboard.manualPasteText}
                    onChange={(e) => clipboard.setManualPasteText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && clipboard.manualPasteText.trim()) {
                        e.preventDefault();
                        clipboard.handleConfirmClipboardLocation(clipboard.manualPasteText.trim());
                      }
                    }}
                    placeholder={locationCopy('placeholder_paste_link')}
                    className="h-10 flex-1 rounded-lg border border-white/10 bg-black/40 px-3 text-xs text-white placeholder-slate-500 transition focus:border-[#14B8A6] focus:outline-none"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (clipboard.manualPasteText.trim()) {
                        clipboard.handleConfirmClipboardLocation(clipboard.manualPasteText.trim());
                      }
                    }}
                    disabled={!clipboard.manualPasteText.trim() || clipboard.isReadingClipboardLocation}
                    className="h-10 shrink-0 rounded-lg bg-[#14B8A6] px-3.5 text-xs font-black text-[#031315] transition hover:bg-[#2DD4BF] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                  >
                    {clipboard.isReadingClipboardLocation ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      locationCopy('btn_confirm_pasted_link')
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sovereign Dropdown Warning Accordion */}
          <DestinationAccuracyAccordion isArabic={isArabic} />
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
          <span>{locationCopy('btn_reorder')}</span>
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
