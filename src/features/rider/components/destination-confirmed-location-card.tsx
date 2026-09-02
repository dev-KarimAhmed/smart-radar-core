'use client';

import React from 'react';
import { ChevronDown, ExternalLink, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { RoadRouteEstimate } from '@/lib/road-route';
import { formatDurationLabel } from '../services/rider-view-format';

const styles = {
  card: "space-y-3 rounded-xl border border-[#14B8A6]/35 bg-[#14B8A6]/8 p-3 shadow-lg shadow-[#14B8A6]/5",
  header: "flex items-start gap-2.5 text-[#14F5D5]",
  icon: "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#14B8A6]/15",
  iconGlyph: "h-4 w-4",
  text: "min-w-0",
  title: "block text-xs font-black",
  subtitle: "mt-0.5 text-[10px] leading-relaxed text-slate-400",
  routeStatus: "rounded-xl border border-[#14B8A6]/20 bg-[#14B8A6]/10 px-3 py-3 text-xs font-bold text-[#BFFCF2]",
  routeGrid: "grid grid-cols-2 gap-2",
  routeCard: "rounded-xl border border-white/8 bg-black/20 p-2.5",
  routeCardLabel: "text-[10px] font-black text-slate-400",
  routeCardValue: "mt-1 block font-mono text-base font-black text-white",
  routeCardDuration: "rounded-xl border border-[#14B8A6]/20 bg-black/15 p-2.5",
  routeCardDurationLabel: "text-[10px] font-black text-slate-300",
  routeCardDurationValue: "mt-1 block font-mono text-base font-black text-[#14F5D5]",
  routeCardDurationHelper: "mt-1 block text-[9px] text-slate-400",
  details: "group rounded-lg border border-white/8 bg-black/15",
  summary: "flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-[10px] font-bold text-slate-400 transition hover:text-slate-200",
  summaryLeft: "flex min-w-0 items-center gap-2",
  summaryIcon: "h-3.5 w-3.5 shrink-0",
  summaryText: "truncate",
  summaryChevron: "h-3.5 w-3.5 shrink-0 transition-transform group-open:rotate-180",
  detailsBody: "border-t border-white/8 p-2",
  detailsLink: "flex min-h-9 w-full min-w-0 items-center rounded-lg border border-white/8 bg-[#1E293B] px-2 text-[10px] font-bold text-slate-300 outline-none transition hover:border-[#14B8A6]/60 hover:text-[#BFFCF2] focus-visible:border-[#14F5D5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14F5D5]",
  debugLine: "rounded-lg border border-amber-500/25 bg-amber-500/5 px-2 py-1.5 font-mono text-[9px] leading-relaxed text-amber-200/80",
} as const;

// Literal expression, so the bundler strips this from the production build. Reaching it
// dynamically (globalThis.process?.env) is what caused the login hydration mismatch.
const isDevBuild = process.env.NODE_ENV === 'development';

export interface DestinationConfirmedLocationCardProps {
  externalLocationUrl: string;
  isRouteEstimateLoading: boolean;
  currentRouteEstimate: RoadRouteEstimate | null;
}

export function DestinationConfirmedLocationCard({
  externalLocationUrl,
  isRouteEstimateLoading,
  currentRouteEstimate,
}: DestinationConfirmedLocationCardProps) {
  const locationCopy = useTranslations('location');
  const t = useTranslations('riderView');

  const durationLabels = React.useMemo(() => ({
    minutes: (count: number) => t('duration.minutes', { count }),
    hoursMinutes: (hours: number, minutes: number) => t('duration.hoursMinutes', { hours, minutes }),
    hoursOnly: (hours: number) => t('duration.hoursOnly', { hours }),
  }), [t]);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.icon}>
          <MapPin className={styles.iconGlyph} />
        </span>
        <div className={styles.text}>
          <strong className={styles.title}>{locationCopy('result_title')}</strong>
          <p className={styles.subtitle}>
            {locationCopy('confirmed_location_helper')}
          </p>
        </div>
      </div>

      {isRouteEstimateLoading ? (
        <div className={styles.routeStatus} role="status">
          {locationCopy('status_calculating_route')}
        </div>
      ) : currentRouteEstimate ? (
        <div className={styles.routeGrid}>
          <div className={styles.routeCard}>
            <span className={styles.routeCardLabel}>{locationCopy('lbl_calculated_distance')}</span>
            <strong className={styles.routeCardValue}>
              {currentRouteEstimate.distanceKm.toFixed(1)} {locationCopy('unit_km')}
            </strong>
          </div>
          <div className={styles.routeCardDuration}>
            <span className={styles.routeCardDurationLabel}>{locationCopy('lbl_estimated_duration')}</span>
            <strong className={styles.routeCardDurationValue}>
              {formatDurationLabel(currentRouteEstimate.durationMinutes, durationLabels)}
            </strong>
            <span className={styles.routeCardDurationHelper}>{locationCopy('helper_without_traffic')}</span>
          </div>
        </div>
      ) : null}

      {/* Development only. "The distance is wrong" has now been reported three times from a
          screenshot of the RESULT, which cannot tell a bad router from correct routing
          between the wrong two points — and those have completely different fixes. Putting
          the inputs on screen means the same screenshot answers the question. */}
      {isDevBuild && currentRouteEstimate?.origin && currentRouteEstimate?.destination ? (
        <p className={styles.debugLine} dir="ltr">
          {currentRouteEstimate.source}
          {' · from '}
          {currentRouteEstimate.origin.lat.toFixed(5)},{currentRouteEstimate.origin.lng.toFixed(5)}
          {' → '}
          {currentRouteEstimate.destination.lat.toFixed(5)},{currentRouteEstimate.destination.lng.toFixed(5)}
        </p>
      ) : null}

      <details className={styles.details}>
        <summary className={styles.summary}>
          <span className={styles.summaryLeft}>
            <ExternalLink className={styles.summaryIcon} />
            <span className={styles.summaryText}>{locationCopy('show_copied_link')}</span>
          </span>
          <ChevronDown className={styles.summaryChevron} />
        </summary>
        <div className={styles.detailsBody}>
          <a
            href={externalLocationUrl}
            target="_blank"
            rel="noopener noreferrer"
            dir="ltr"
            aria-label={locationCopy('btn_open_google_maps')}
            title={locationCopy('btn_open_google_maps')}
            className={styles.detailsLink}
          >
            <span className="truncate">{externalLocationUrl}</span>
          </a>
        </div>
      </details>
    </div>
  );
}
