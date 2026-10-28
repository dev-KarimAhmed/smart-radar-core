'use client';

import React from 'react';
import { AlertTriangle, ChevronDown, ExternalLink, Loader2, MapPin, ShieldAlert, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { cn } from '@/lib/utils';
import type { RoadRouteEstimate } from '@/lib/road-route';
import type { useDestinationTextSearch } from '../hooks/use-destination-text-search';
import type { useDestinationMapPicker } from '../hooks/use-destination-map-picker';
import type { useClipboardLocationImport } from '../hooks/use-clipboard-location-import';
import { DestinationConfirmedLocationCard } from './destination-confirmed-location-card';
import { DestinationSearchResults } from './destination-search-results';

const styles = {
  section: "space-y-3 rounded-2xl border border-white/10 bg-[#111827]/80 p-3 shadow-lg shadow-black/15",
  step1Header: "mb-2 flex items-start gap-2.5",
  stepBadge: "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#14B8A6]/15 text-xs font-black text-[#14F5D5]",
  stepTitle: "text-xs font-black text-white",
  stepHelper: "mt-1 text-[11px] leading-relaxed text-slate-400",
  searchButton: "flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#14B8A6] px-4 text-sm font-black text-[#031315] transition hover:bg-[#2DD4BF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14F5D5] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-md shadow-[#14B8A6]/15 active:scale-[0.98]",
  searchButtonIcon: "h-4 w-4 shrink-0",
  step2Wrapper: "border-t border-white/8 pt-3",
  step2Header: "mb-2 flex items-start gap-2.5",
  confirmButton: "flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#14B8A6]/35 bg-[#14B8A6]/12 px-3 py-2.5 text-[11px] font-bold text-[#BFFCF2] transition-all duration-300 hover:bg-[#14B8A6]/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14F5D5] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer active:scale-[0.98]",
  confirmButtonLoadingIcon: "h-4 w-4 animate-spin",
  confirmButtonIcon: "h-4 w-4 text-[#14F5D5] shrink-0",
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
  const { isArabic } = useDashboardLanguage();
  const [isAccordionOpen, setIsAccordionOpen] = React.useState(false);

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

          {/* Sovereign Dropdown Warning Accordion - Cyber Premium Glass Aesthetic */}
          <div
            className="relative mt-3.5 overflow-hidden rounded-2xl border border-rose-500/35 bg-gradient-to-r from-[#170914] via-[#0A0F1E] to-[#170914] shadow-[0_4px_20px_rgba(0,0,0,0.5),0_0_15px_rgba(244,63,94,0.12)] transition-all duration-300 hover:border-rose-500/50 hover:shadow-[0_0_22px_rgba(244,63,94,0.22)]"
            dir={isArabic ? 'rtl' : 'ltr'}
          >
            {/* Top ambient glowing hairline */}
            <div className="pointer-events-none absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-rose-500/60 to-transparent" />

            <button
              type="button"
              onClick={() => setIsAccordionOpen((prev) => !prev)}
              className="group flex w-full items-center justify-between gap-2.5 px-3.5 py-2.5 transition-colors hover:bg-white/[0.03] cursor-pointer select-none"
            >
              {/* Right side: Pulsing badge & full readable text */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1 text-start">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
                </span>

                <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 bg-gradient-to-r from-rose-500/25 to-rose-600/35 px-2.5 py-0.5 text-[11px] font-black text-rose-200 shadow-[0_0_10px_rgba(244,63,94,0.35)] shrink-0">
                  <ShieldAlert className="h-3 w-3 text-rose-300" />
                  <span>{isArabic ? 'تنبيه' : 'Alert'}</span>
                </span>

                <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors leading-snug">
                  {isArabic ? 'دقة الإحداثيات 90% تجنباً للخلاف' : '90% GPS Accuracy Guidance'}
                </span>
              </div>

              {/* Left side: Squircle glowing chevron */}
              <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 transition-all duration-300 group-hover:border-rose-500/60 group-hover:bg-rose-500/20 group-hover:scale-105 shrink-0">
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-300",
                    isAccordionOpen && "rotate-180"
                  )}
                />
              </div>
            </button>

            {isAccordionOpen && (
              <div className="border-t border-rose-500/20 bg-gradient-to-b from-[#1C091A]/80 via-[#0A0D1A]/90 to-[#040711] p-4 text-center space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Accuracy Highlight Pill */}
                <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-xs font-black text-amber-300">
                    {isArabic ? 'النظام يحقق نتائج 90% من الدقة' : 'System achieves 90% accuracy results'}
                  </span>
                </div>

                {/* Dispute prevention explanation */}
                <p className="text-xs sm:text-sm font-bold text-slate-200 leading-snug">
                  {isArabic ? 'تجنباً للخلاف مع الكابتن المعلن في نقطة الوصول' : 'To avoid disputes with the advertiser captain on arrival'}
                </p>

                {/* Google Maps verification tip */}
                <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 p-2.5 text-xs font-bold text-rose-200 leading-relaxed shadow-inner">
                  {isArabic
                    ? 'إذا رغبت، تحقق من الإحداثيات عبر خرائط Google قبل تأكيد الطلب'
                    : 'If you wish, please verify the coordinates on Google Maps before confirming'}
                </div>
              </div>
            )}
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
