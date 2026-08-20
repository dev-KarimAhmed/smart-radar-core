'use client';

import React from 'react';
import { Clock, Facebook, Instagram, MessageCircle, Phone, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { formatMoney, isTripStartedStatus } from '../services/rider-view-format';
import { resolveColorDisplayName } from '@/shared/services/color-name';
import type { RiderActiveTrip } from '../state/rider-state-machine';
import { Metric } from './rider-view-primitives';

const styles = {
  wrapper: "space-y-4",
  rtl: "text-right",
  ltr: "text-left",
  header: "flex items-start justify-between gap-3",
  headerText: "space-y-1",
  eyebrow: "text-[11px] font-black text-[#14F5D5]",
  captainName: "text-xl font-bold text-white",
  destination: "text-xs text-slate-400",
  etaBox: "rounded-2xl border border-white/5 bg-white/5 px-4 py-2 text-center min-w-[100px]",
  etaIcon: "mx-auto mb-1 h-4 w-4 text-[#14F5D5]",
  etaValue: "font-mono text-lg text-[#14F5D5] block",
  etaLabel: "text-[9px] text-slate-400 block mt-0.5 whitespace-nowrap font-bold",
  metrics: "grid grid-cols-2 gap-3 rounded-2xl border border-white/5 bg-white/5 p-4",
  priceCard: "flex flex-col items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-5 text-center",
  priceValue: "text-2xl font-extrabold text-teal-400 font-mono",
  priceLabel: "mt-1 text-xs font-bold text-slate-400",
  note: "rounded-2xl border border-[#14B8A6]/20 bg-[#14B8A6]/8 p-4 text-xs leading-relaxed text-slate-300",
  actions: "flex gap-2",
  callButton: "flex h-14 w-14 items-center justify-center rounded-xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 text-[#14F5D5] hover:bg-[#14B8A6]/20 transition-colors cursor-pointer",
  callIcon: "h-6 w-6",
  whatsappButton: "flex h-14 w-14 items-center justify-center rounded-xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 text-[#14F5D5] transition-colors hover:bg-[#14B8A6]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14F5D5]/60",
  whatsappIcon: "h-6 w-6",
  sosButton: "h-14 flex-1 bg-red-600/90 hover:bg-red-500 text-white font-bold text-base py-3.5 rounded-xl transition-transform active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-600/20",
  sosIcon: "h-5 w-5 animate-pulse",
  cancelButton: "h-14 flex-1 border border-red-500/30 bg-red-600/10 hover:bg-red-600/20 text-red-200 font-bold text-base py-3.5 rounded-xl transition-transform active:scale-[0.98] flex items-center justify-center cursor-pointer disabled:opacity-50",
} as const;

export interface TripActiveScreenProps {
  isArabic: boolean;
  activeTrip: RiderActiveTrip;
  etaSeconds: number;
  currencyLabel: string;
  isCancellingRideRequest: boolean;
  onEmergencyWhatsapp: () => void;
  onCancelRideRequest: () => void;
}

export function TripActiveScreen({
  isArabic,
  activeTrip,
  etaSeconds,
  currencyLabel,
  isCancellingRideRequest,
  onEmergencyWhatsapp,
  onCancelRideRequest,
}: TripActiveScreenProps) {
  const t = useTranslations('riderView');
  const minutes = Math.floor(etaSeconds / 60);
  const seconds = etaSeconds % 60;
  const activeTripStatus = String(activeTrip.status || '').toUpperCase();
  const tripHasStarted = isTripStartedStatus(activeTripStatus);

  return (
    <div className={cn(styles.wrapper, isArabic ? styles.rtl : styles.ltr)} dir={isArabic ? 'rtl' : 'ltr'}>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <p className={styles.eyebrow}>{t('trip.started')}</p>
          <h2 className={styles.captainName}>
            {activeTrip.captain?.full_name || activeTrip.captain?.name || activeTrip.captainName || t('trip.captainFallbackName')}
          </h2>
          <p className={styles.destination}>{activeTrip.destinationLabel}</p>
        </div>
        <div className={styles.etaBox}>
          <Clock className={styles.etaIcon} />
          <strong className={styles.etaValue}>
            {minutes}:{seconds.toString().padStart(2, '0')}
          </strong>
          <span className={styles.etaLabel}>
            {tripHasStarted ? t('trip.timeRemaining') : t('trip.driverArrival')}
          </span>
        </div>
      </div>

      <div className={styles.metrics}>
        <Metric
          label={t('offers.vehicle')}
          value={`${resolveColorDisplayName(activeTrip.captain?.vehicle_color, isArabic ? 'ar' : 'en')} ${activeTrip.captain?.vehicle_model || activeTrip.vehicleType || t('trip.vehicleFallback')}`.trim()}
        />
        <Metric
          label={t('offers.plate')}
          value={activeTrip.captain?.plate_number || activeTrip.captain?.license_plate || activeTrip.vehiclePlate || t('trip.plateFallback')}
        />
      </div>

      <div className={styles.priceCard}>
        <div className={styles.priceValue}>
          {formatMoney(activeTrip.finalPrice, currencyLabel)}
        </div>
        <p className={styles.priceLabel}>
          {t('trip.finalCost')}
        </p>
      </div>

      <div className={styles.note}>
        {tripHasStarted ? t('trip.inProgressNote') : t('trip.enRouteNote')}
      </div>

      <div className={styles.actions}>
        {activeTrip.captainPhone && (
          <a
            href={`tel:${activeTrip.captainPhone}`}
            className={styles.callButton}
            title={t('trip.callCaptain')}
          >
            <Phone className={styles.callIcon} />
          </a>
        )}
        {activeTrip.captain?.facebook_url && (
          <a
            href={activeTrip.captain.facebook_url}
            target="_blank"
            rel="noreferrer"
            className={styles.callButton}
            title="Facebook"
          >
            <Facebook className={styles.callIcon} />
          </a>
        )}
        {activeTrip.captain?.instagram_url && (
          <a
            href={activeTrip.captain.instagram_url}
            target="_blank"
            rel="noreferrer"
            className={styles.callButton}
            title="Instagram"
          >
            <Instagram className={styles.callIcon} />
          </a>
        )}
        <button
          type="button"
          onClick={onEmergencyWhatsapp}
          className={styles.whatsappButton}
          title={t('emergency.buttonTitle')}
        >
          <MessageCircle className={styles.whatsappIcon} />
        </button>
        {tripHasStarted ? (
          <button
            type="button"
            onClick={onEmergencyWhatsapp}
            className={styles.sosButton}
          >
            <ShieldCheck className={styles.sosIcon} />
            {t('emergency.sosButton')}
          </button>
        ) : (
          <button
            type="button"
            onClick={onCancelRideRequest}
            disabled={isCancellingRideRequest}
            className={styles.cancelButton}
          >
            {isCancellingRideRequest ? t('trip.cancelling') : t('trip.cancel')}
          </button>
        )}
      </div>
    </div>
  );
}
