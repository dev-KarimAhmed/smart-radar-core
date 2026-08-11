'use client';

import React from 'react';
import { CheckCircle2, Clock, Loader2, Route, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { formatDurationLabel } from '../services/rider-view-format';
import type { RiderLocation } from './rider-map';

const styles = {
  card: "overflow-hidden rounded-2xl border bg-[#111827]/90 shadow-xl shadow-black/20 transition-colors",
  cardReady: "border-[#14B8A6]/40",
  cardNotReady: "border-white/10",
  header: "flex items-center justify-between gap-3 border-b border-white/8 px-3 py-2.5",
  headerLeft: "flex items-center gap-2",
  icon: "flex h-8 w-8 items-center justify-center rounded-xl",
  iconReady: "bg-[#14B8A6]/15 text-[#14F5D5]",
  iconNotReady: "bg-white/5 text-slate-500",
  iconGlyph: "h-4 w-4",
  title: "text-xs font-black text-white",
  subtitle: "mt-0.5 text-[9px] text-slate-400",
  loadingIcon: "h-4 w-4 animate-spin text-[#14F5D5]",
  body: "space-y-3 p-3",
  row: "flex items-start justify-between gap-3",
  destination: "min-w-0",
  fieldLabel: "block text-[9px] font-black uppercase text-slate-500",
  destinationValue: "mt-1 block truncate text-sm font-black text-white",
  coords: "mt-1 block font-mono text-[9px] text-slate-600",
  fare: "shrink-0 text-end",
  fareValue: "mt-1 block font-mono text-xl font-black text-[#14F5D5]",
  metricsGrid: "grid grid-cols-3 gap-2",
  metricCardDuration: "rounded-xl border border-[#14B8A6]/18 bg-[#14B8A6]/8 p-2.5",
  metricIconDuration: "mb-1.5 h-3.5 w-3.5 text-[#14F5D5]",
  metricLabelDuration: "block text-[9px] font-black text-slate-500",
  metricValue: "mt-1 block text-xs font-black text-white",
  metricHelper: "mt-0.5 block text-[8px] leading-tight text-slate-500",
  metricCard: "rounded-xl border border-white/8 bg-black/20 p-2.5",
  metricIcon: "mb-1.5 h-3.5 w-3.5 text-slate-400",
  metricLabel: "block text-[9px] font-black text-slate-500",
  metricLabelTight: "block text-[9px] font-black leading-tight text-slate-500",
} as const;

export interface DestinationSummaryCardProps {
  destinationReady: boolean;
  isServerFareLoading: boolean;
  isDestinationPinMoving: boolean;
  destinationLabel: string;
  selectedDestinationCoords: RiderLocation | null;
  hasDestinationCoordsAnchor: boolean;
  serverFareLabel: string;
  isRouteEstimateLoading: boolean;
  estimatedDurationMinutes: number | null;
  estimatedDistanceKm: number | null;
  nearbyCaptainCount: number;
}

export function DestinationSummaryCard({
  destinationReady,
  isServerFareLoading,
  isDestinationPinMoving,
  destinationLabel,
  selectedDestinationCoords,
  hasDestinationCoordsAnchor,
  serverFareLabel,
  isRouteEstimateLoading,
  estimatedDurationMinutes,
  estimatedDistanceKm,
  nearbyCaptainCount,
}: DestinationSummaryCardProps) {
  const locationCopy = useTranslations('location');
  const t = useTranslations('riderView');

  const durationLabels = React.useMemo(() => ({
    minutes: (count: number) => t('duration.minutes', { count }),
    hoursMinutes: (hours: number, minutes: number) => t('duration.hoursMinutes', { hours, minutes }),
    hoursOnly: (hours: number) => t('duration.hoursOnly', { hours }),
  }), [t]);

  return (
    <section className={cn(styles.card, destinationReady ? styles.cardReady : styles.cardNotReady)}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={cn(styles.icon, destinationReady ? styles.iconReady : styles.iconNotReady)}>
            {destinationReady ? <CheckCircle2 className={styles.iconGlyph} /> : <Route className={styles.iconGlyph} />}
          </span>
          <div>
            <h3 className={styles.title}>{locationCopy('trip_summary_title')}</h3>
            <p className={styles.subtitle}>
              {destinationReady ? locationCopy('ready_to_request') : locationCopy('map_adjust_helper')}
            </p>
          </div>
        </div>
        {isServerFareLoading || isDestinationPinMoving ? <Loader2 className={styles.loadingIcon} /> : null}
      </div>

      <div className={styles.body}>
        <div className={styles.row}>
          <div className={styles.destination}>
            <span className={styles.fieldLabel}>{t('destination.label')}</span>
            <strong className={styles.destinationValue}>{destinationLabel}</strong>
            {hasDestinationCoordsAnchor && selectedDestinationCoords ? (
              <span className={styles.coords}>
                {selectedDestinationCoords.lat.toFixed(4)}, {selectedDestinationCoords.lng.toFixed(4)}
              </span>
            ) : null}
          </div>
          <div className={styles.fare}>
            <span className={styles.fieldLabel}>
              {locationCopy('lbl_estimated_fare')}
            </span>
            <strong className={styles.fareValue}>{serverFareLabel}</strong>
          </div>
        </div>

        <div className={styles.metricsGrid}>
          <div className={styles.metricCardDuration}>
            <Clock className={styles.metricIconDuration} />
            <span className={styles.metricLabelDuration}>
              {locationCopy('lbl_estimated_duration')}
            </span>
            <strong className={styles.metricValue}>
              {isRouteEstimateLoading
                ? locationCopy('status_calculating_route')
                : estimatedDurationMinutes !== null
                  ? formatDurationLabel(estimatedDurationMinutes, durationLabels)
                  : t('destination.notAvailable')}
            </strong>
            <span className={styles.metricHelper}>
              {locationCopy('helper_without_traffic')}
            </span>
          </div>
          <div className={styles.metricCard}>
            <Route className={styles.metricIcon} />
            <span className={styles.metricLabel}>
              {locationCopy('lbl_calculated_distance')}
            </span>
            <strong className={styles.metricValue}>
              {isRouteEstimateLoading
                ? locationCopy('status_calculating_route')
                : estimatedDistanceKm !== null
                  ? `${estimatedDistanceKm.toFixed(1)} ${t('trip.km')}`
                  : t('destination.notAvailable')}
            </strong>
          </div>
          <div className={styles.metricCard}>
            <Users className={styles.metricIcon} />
            <span className={styles.metricLabelTight}>
              {locationCopy('nearby_captains_label')}
            </span>
            <strong className={styles.metricValue}>{nearbyCaptainCount}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
