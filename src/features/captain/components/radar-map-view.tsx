'use client';

import React from 'react';
import maplibregl from 'maplibre-gl';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ClipboardPaste,
  Clock,
  Edit3,
  ExternalLink,
  Heart,
  Loader2,
  MapPin,
  Minus,
  Phone,
  Plus,
  RadioTower,
  Route,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Trip } from '@/core/types';
import { DEFAULT_MAP_CENTER } from '@/shared/services/maplibre-runtime';
import { useMaplibreInstance } from '@/shared/hooks/use-maplibre-instance';
import { RecenterMapButton } from '@/shared/components/map/recenter-map-button';
import { estimateHaversineDistanceKm } from '../services/ride-location';
import { estimatePickupMinutes } from '@/shared/services/trip-duration';
import { RadarAntiCheatKernel } from '@/core/RadarAntiCheatKernel';

import { cn } from '@/lib/utils';
const styles = {
  style144_1: "grid min-h-[calc(100vh-11rem)] gap-4 lg:grid-cols-[minmax(0,1fr)_420px]",
  style145_2: "order-2 relative min-h-[520px] overflow-hidden rounded-3xl border border-emerald-500/20 bg-[#05080f] text-white shadow-2xl shadow-black/30 lg:order-none lg:min-h-[calc(100vh-11rem)]",
  style146_3: "absolute inset-0 z-0 bg-[#0B0F19]",
  style147_4: "absolute inset-0 z-[1] overflow-hidden bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.18),transparent_38%),linear-gradient(135deg,rgba(20,184,166,0.08)_0_25%,transparent_25%_50%,rgba(20,184,166,0.06)_50%_75%,transparent_75%)] bg-[length:auto,38px_38px]",
  style148_5: "absolute left-1/2 top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl border-2 border-[#06111f] bg-[#14B8A6] text-[#06111f] shadow-[0_0_0_18px_rgba(20,184,166,0.12),0_0_60px_rgba(20,184,166,0.35)]",
  style156_6: "absolute h-9 w-9 rounded-full border-2 border-[#06111f] bg-[#f59e0b] text-[10px] font-black text-[#06111f] shadow-[0_0_0_10px_rgba(245,158,11,0.18),0_12px_30px_rgba(0,0,0,0.35)]",
  style163_7: "absolute inset-0 z-[2]",
  style164_8: "h-full w-full bg-transparent",
  style166_9: "pointer-events-none absolute inset-0 z-[3] bg-[radial-gradient(circle_at_center,transparent_44%,rgba(11,15,25,0.32)_100%)]",
  style168_10: "absolute left-4 right-4 top-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/20 bg-[#0B0F19]/92 px-4 py-3 shadow-xl backdrop-blur",
  style170_11: "text-xs font-black text-[#14B8A6]",
  style171_12: "text-sm font-bold text-slate-200",
  style173_13: "flex flex-wrap items-center gap-2 text-xs font-bold",
  style174_14: "inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-emerald-200",
  style175_15: "h-3.5 w-3.5",
  style182_16: "absolute left-4 right-4 top-24 z-20 rounded-2xl border border-emerald-500/20 bg-[#0B0F19]/92 p-4 text-sm font-bold text-slate-200 shadow-2xl backdrop-blur md:left-auto md:max-w-md",
  style183_17: "text-[#14B8A6]",
  style184_18: "mt-1 text-xs leading-5 text-slate-400",
  style185_19: "mt-2 text-[11px] font-black text-emerald-200",
  style192_20: "absolute bottom-5 left-5 z-20 rounded-2xl border border-emerald-500/25 bg-[#0B0F19]/95 p-4 text-emerald-300 shadow-2xl transition hover:border-emerald-300",
  style201_22: "order-1 flex max-h-[560px] flex-col rounded-3xl border border-emerald-500/20 bg-[#05080f] p-4 text-white shadow-2xl shadow-black/30 lg:order-none lg:max-h-[calc(100vh-11rem)]",
  style202_23: "flex items-center justify-between gap-3 border-b border-white/10 pb-4",
  style204_24: "text-xs font-black text-[#14B8A6]",
  style205_25: "mt-1 text-2xl font-black",
  style206_26: "mt-1 text-xs leading-5 text-slate-400",
  style208_27: "rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-black text-emerald-300",
  style211_28: "mt-4 flex-1 overflow-y-auto pr-1",
  style213_29: "h-8 w-8",
  style215_30: "h-8 w-8",
  style217_31: "space-y-3",
  style219_32: "relative rounded-2xl border border-emerald-500/20 bg-[#0B0F19]/90 p-4 shadow-xl shadow-black/40 backdrop-blur transition-all duration-200 hover:border-emerald-500/40",
  style220_33: "flex items-start gap-3",
  style221_34: "mt-0.5 h-5 w-5 shrink-0 text-[#14F5D5] drop-shadow-[0_0_8px_rgba(20,245,213,0.5)]",
  style222_35: "min-w-0 flex-1",
  style223_36: "line-clamp-2 text-base font-black text-white tracking-wide leading-snug",
  style227_38: "mt-3.5 grid grid-cols-2 gap-2 text-xs",
  style231_39: "mt-3 flex items-stretch gap-2",
  style232_40: "inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#14F5D5] via-[#14B8A6] to-[#0d9488] px-3 h-11 text-xs sm:text-sm font-black text-[#031518] shadow-[0_4px_18px_rgba(20,245,213,0.35)] hover:brightness-110 active:scale-[0.98] transition-all whitespace-nowrap",
  style233_41: "h-4 w-4 stroke-[2.5] shrink-0",
  style236_42: "inline-flex shrink-0 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900/70 px-3.5 h-11 text-xs font-bold text-slate-300 shadow-sm hover:border-rose-500/40 hover:bg-rose-500/15 hover:text-rose-200 active:scale-[0.98] transition-all whitespace-nowrap",
  style252_43: "rounded-xl border border-slate-700/60 bg-slate-900/70 p-2.5 shadow-inner transition hover:border-slate-600/80",
  style253_44: "text-[11px] font-semibold text-slate-400",
  style254_45: "mt-1 text-sm font-black text-white tracking-tight",
  style275_46: "flex min-h-[280px] flex-col items-center justify-center rounded-2xl p-6 text-center",
  style276_47: "text-amber-300",
  style276_48: "text-emerald-400/70",
  style277_49: "mt-4 text-lg font-black text-white",
  style278_50: "mt-2 max-w-sm text-sm leading-6 opacity-85",
  stateAmber: "border-amber-500/30 bg-amber-500/10 text-amber-100",
  stateEmpty: "border-dashed border-slate-700 bg-slate-950/80 text-slate-300",
  pendingOfferHint: "mt-2 text-[11px] font-bold text-amber-300",
  pendingOfferDisabled: "cursor-not-allowed opacity-40 grayscale-[35%] hover:brightness-100 shadow-none",
  cardPendingOffer: "border-amber-400/35 shadow-[0_0_20px_rgba(251,191,36,0.12)] hover:border-amber-400/60",
  ownPendingRow: "mt-3 space-y-2",
  ownPendingBadge: "w-full flex items-center justify-center gap-1.5 rounded-xl border border-amber-400/40 bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-amber-500/15 h-10 px-2.5 text-xs font-black text-amber-200 shadow-[0_0_16px_rgba(251,191,36,0.12)] backdrop-blur-sm transition-all duration-200 overflow-hidden",
  ownPendingIcon: "h-3.5 w-3.5 shrink-0 text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.7)] animate-pulse",
  ownPendingPulseWrap: "relative flex h-2 w-2 shrink-0",
  ownPendingPing: "absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75",
  ownPendingDot: "relative inline-flex h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.9)]",
  ownPendingText: "truncate font-black text-amber-100 text-xs tracking-tight whitespace-nowrap",
  infoFullWidth: "col-span-2",
  seizeMarketBanner: "mb-3 flex items-center justify-between gap-2 rounded-xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 px-3.5 py-2 text-xs font-black text-[#5eead4] shadow-sm",
  seizeMarketBadge: "flex h-5 items-center justify-center rounded-md border border-[#14B8A6]/40 bg-black/40 px-2 text-[10px] font-mono font-black text-[#14F5D5]",
  appPriceCard: "mt-3 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/[0.08] via-black/50 to-black/70 p-3 shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-sm space-y-2.5",
  appPriceCardHeader: "flex items-center gap-2",
  appPriceCardBadge: "inline-flex items-center gap-1 rounded-lg border border-amber-400/30 bg-amber-500/15 px-2 py-0.5 text-[11px] font-black text-amber-300 shadow-sm shrink-0",
  appPriceCardNotice: "text-xs font-medium text-slate-300 min-w-0 flex-1",
  appPriceInputRow: "flex items-center gap-2 pt-0.5",
  appPriceInputGroup: "relative flex flex-1 items-center h-11 rounded-xl border border-amber-400/40 bg-black/70 shadow-inner focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20 transition-all overflow-hidden",
  appPriceInputField: "flex-1 min-w-0 h-full bg-transparent px-3 text-start font-mono text-base sm:text-lg font-black text-amber-100 placeholder:text-amber-500/30 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
  appPriceCurrencyBadge: "px-3 h-full flex items-center justify-center text-xs font-mono font-black text-amber-400/80 bg-amber-500/5 select-none border-s border-white/10 shrink-0",
  appPriceInputDisabled: "opacity-50 cursor-not-allowed",
  appPricePasteBtn: "h-11 px-3.5 inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-amber-400/50 bg-amber-500/15 text-xs font-black text-amber-300 shadow-sm transition-all hover:bg-amber-400/25 hover:border-amber-400/70 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap",
  appPricePasteIcon: "h-4 w-4 shrink-0 text-amber-300",
  appPriceInputError: "text-center text-xs font-bold text-rose-400 pt-0.5",
  blockedPendingBanner: "mt-3 flex items-center justify-center gap-2 rounded-xl border border-amber-500/35 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/15 px-3.5 py-2.5 text-center text-xs font-black text-amber-200 shadow-sm backdrop-blur-sm",
  blockedPendingIcon: "h-4 w-4 shrink-0 text-amber-300 animate-pulse",
  taxiNoticeBanner: "mt-3 flex items-center justify-between gap-2 rounded-xl border border-amber-400/35 bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-amber-500/15 px-3.5 py-2.5 text-xs font-black text-amber-200 shadow-[0_0_16px_rgba(245,158,11,0.08)] backdrop-blur-sm",
  taxiNoticeIcon: "h-4 w-4 shrink-0 text-amber-300",
  submitSpinner: "h-4 w-4 animate-spin shrink-0",
} as const;

interface RadarMapViewProps {
  language: 'ar' | 'en';
  isActive: boolean;
  driverLocation: { lat: number; lng: number } | null;
  currentH3Cell?: string;
  paidMinutes: number;
  bonusMinutes: number;
  currency?: string;
  radarLockMessage?: string;
  requests: Trip[];
  pendingOfferRequestId?: string | null;
  captainPricingMode?: 'FREE' | 'APP' | 'TAXI' | null;
  isOfficeTaxi?: boolean;
  subRole?: string | null;
  onSelectRequest: (request: Trip, initialPrice?: string, pricingMode?: 'FREE' | 'APP' | 'TAXI') => void;
  onIgnoreRequest: (requestId: string) => void;
  onSubmitDirectBid?: (request: Trip, price: number, waitSeconds?: number, pricingMode?: 'FREE' | 'APP' | 'TAXI') => Promise<void> | void;
  onEditTariff?: () => void;
}

export function RadarMapView({
  language,
  isActive,
  driverLocation,
  currentH3Cell,
  paidMinutes,
  bonusMinutes,
  currency = 'JOD',
  radarLockMessage,
  requests,
  pendingOfferRequestId = null,
  captainPricingMode = null,
  isOfficeTaxi = false,
  subRole = null,
  onSelectRequest,
  onIgnoreRequest,
  onSubmitDirectBid,
  onEditTariff,
}: RadarMapViewProps) {
  const tAuto = useTranslations('auto');
  const copy = radarCopy[language];
  const t = useTranslations('captainPickup');
  const mapContainerRef = React.useRef<HTMLDivElement | null>(null);
  const markerRef = React.useRef<maplibregl.Marker | null>(null);
  const requestMarkersRef = React.useRef<maplibregl.Marker[]>([]);
  const [mapIssue, setMapIssue] = React.useState(false);
  const [directPrices, setDirectPrices] = React.useState<Record<string, string>>({});
  const [priceErrors, setPriceErrors] = React.useState<Record<string, boolean>>({});
  const [submittingRequestId, setSubmittingRequestId] = React.useState<string | null>(null);

  // State for the Wait Seconds Confirmation Modal popup
  const [confirmModalTrip, setConfirmModalTrip] = React.useState<{
    trip: Trip;
    price: number;
    pricingMode: 'FREE' | 'APP' | 'TAXI';
  } | null>(null);
  const [waitSeconds, setWaitSeconds] = React.useState<string>('120');

  const handlePastePrice = React.useCallback(async (requestId: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        const cleaned = text.replace(/,/g, '.');
        const match = cleaned.match(/\d+(?:\.\d+)?/);
        if (match) {
          setDirectPrices((prev) => ({ ...prev, [requestId]: match[0] }));
          setPriceErrors((prev) => ({ ...prev, [requestId]: false }));
        }
      }
    } catch {
      // Clipboard access denied or unsupported
    }
  }, []);

  const handleInitiateOffer = React.useCallback((request: Trip) => {
    const isTaxi = isOfficeTaxi || captainPricingMode === 'TAXI' || request.pricingPreference === 'TAXI';
    const isApp = !isTaxi && (captainPricingMode === 'APP' || request.pricingPreference === 'APP');
    const isIndependent = !isTaxi && !isApp && (captainPricingMode === 'FREE' || subRole === 'independent' || subRole === 'المستقل');
    const cardPricingMode: 'FREE' | 'APP' | 'TAXI' = isTaxi ? 'TAXI' : isApp ? 'APP' : 'FREE';

    let priceNum: number | null = null;
    const priceStr = directPrices[request.id]?.trim();
    const parsed = priceStr ? parseFloat(priceStr) : NaN;

    if (isTaxi) {
      priceNum = request.offerPrice != null && request.offerPrice > 0 ? request.offerPrice : null;
    } else if (isApp || isIndependent) {
      if (priceStr && !isNaN(parsed) && parsed > 0) {
        priceNum = parsed;
      }
    } else {
      // Radar / Free Mode: check typed/stepped price override or default calculated offerPrice
      if (priceStr && !isNaN(parsed) && parsed > 0) {
        priceNum = parsed;
      } else if (request.offerPrice != null && request.offerPrice > 0) {
        priceNum = request.offerPrice;
      }
    }


    if (priceNum == null || priceNum <= 0) {
      setPriceErrors((prev) => ({ ...prev, [request.id]: true }));
      return;
    }

    setPriceErrors((prev) => ({ ...prev, [request.id]: false }));
    setConfirmModalTrip({
      trip: request,
      price: priceNum,
      pricingMode: cardPricingMode,
    });
    setWaitSeconds('120');
  }, [captainPricingMode, directPrices, isOfficeTaxi, subRole]);

  const handleConfirmSubmitBid = React.useCallback(async () => {
    if (!confirmModalTrip || !onSubmitDirectBid) return;
    const { trip, price, pricingMode } = confirmModalTrip;
    setSubmittingRequestId(trip.id);
    try {
      const finalWaitSeconds = Math.max(30, Math.min(900, parseInt(waitSeconds, 10) || 120));
      await onSubmitDirectBid(trip, price, finalWaitSeconds, pricingMode);
      setConfirmModalTrip(null);
    } finally {
      setSubmittingRequestId(null);
    }
  }, [confirmModalTrip, onSubmitDirectBid, waitSeconds]);

  const visibleLocation = driverLocation || DEFAULT_MAP_CENTER;
  const totalMinutes = paidMinutes + bonusMinutes;

  const { mapRef, isMapReady } = useMaplibreInstance({
    containerRef: mapContainerRef,
    center: visibleLocation,
    zoom: 13.4,
  });

  const resize = React.useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    map.resize();
    window.requestAnimationFrame(() => map.resize());
  }, [mapRef]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.on('error', () => setMapIssue(true));
    const resizeTimer = window.setTimeout(resize, 300);

    return () => {
      window.clearTimeout(resizeTimer);
      markerRef.current?.remove();
      requestMarkersRef.current.forEach((marker) => marker.remove());
      requestMarkersRef.current = [];
      markerRef.current = null;
    };
  }, [mapRef, resize]);

  React.useEffect(() => {
    if (!isMapReady) return;
    resize();
  }, [isMapReady, resize]);

  React.useEffect(() => {
    if (!mapRef.current) return;
    const lngLat: [number, number] = [visibleLocation.lng, visibleLocation.lat];

    if (!markerRef.current) {
      const markerElement = createCarMarkerElement();
      markerRef.current = new maplibregl.Marker({ element: markerElement }).setLngLat(lngLat).addTo(mapRef.current);
    } else {
      markerRef.current.setLngLat(lngLat);
    }
  }, [visibleLocation.lat, visibleLocation.lng]);

  React.useEffect(() => {
    if (!mapRef.current) return;

    requestMarkersRef.current.forEach((marker) => marker.remove());
    requestMarkersRef.current = [];

    requests.forEach((request) => {
      const coords = request.exactPickupCoords || request.obfuscatedPickupCoords || request.pickupCoords;
      if (!coords?.lat || !coords?.lng) return;

      const markerElement = document.createElement('button');
      markerElement.type = 'button';
      markerElement.className = 'h-10 w-10 rounded-full border-2 border-[#06111f] bg-[#f59e0b] text-[11px] font-black text-[#06111f] shadow-[0_0_0_10px_rgba(245,158,11,0.18),0_12px_30px_rgba(0,0,0,0.35)]';
      markerElement.textContent = request.exactPickupCoords ? 'R' : '~';
      markerElement.onclick = () => onSelectRequest(request);

      const marker = new maplibregl.Marker({ element: markerElement })
        .setLngLat([coords.lng, coords.lat])
        .addTo(mapRef.current!);

      requestMarkersRef.current.push(marker);
    });
  }, [onSelectRequest, requests]);

  const recenter = React.useCallback(() => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({ center: [visibleLocation.lng, visibleLocation.lat], zoom: 15, duration: 700 });
  }, [visibleLocation.lat, visibleLocation.lng]);

  return (
    <section className={styles.style144_1}>
      <div className={styles.style145_2}>
        <div className={styles.style146_3} />
        <div className={styles.style147_4}>
          <div className={styles.style148_5}>
            <CarMarkerIcon />
          </div>
          {requests.slice(0, 9).map((request, index) => (
            <button
              key={request.id}
              type="button"
              onClick={() => onSelectRequest(request)}
              className={styles.style156_6}
              style={fallbackRequestPosition(index)}
            >
              R
            </button>
          ))}
        </div>
        <div className={styles.style163_7}>
          <div ref={mapContainerRef} className={styles.style164_8} />
        </div>
        <div className={styles.style166_9} />

        <div className={styles.style168_10}>
          <div>
            <p className={styles.style170_11}>{copy.title}</p>
            <p className={styles.style171_12}>{isActive && !radarLockMessage ? copy.online : copy.offline}</p>
          </div>
          <div className={styles.style173_13}>
            <span className={styles.style174_14}>
              <Clock className={styles.style175_15} />
              {radarLockMessage ? copy.locked : `${copy.remaining}: ${formatMinutes(totalMinutes, language)}`}
            </span>
          </div>
        </div>

        {(!isMapReady || mapIssue) && (
          <div className={styles.style182_16}>
            <p className={styles.style183_17}>{mapIssue ? copy.mapIssue : copy.mapLoading}</p>
            <p className={styles.style184_18}>{copy.mapHint}</p>
            <p className={styles.style185_19}>{copy.radarFallback}</p>
          </div>
        )}

        <RecenterMapButton
          onClick={recenter}
          className={styles.style192_20}
          ariaLabel={copy.recenter}
        />
      </div>

      <aside className={styles.style201_22}>
        <div className={styles.style202_23}>
          <div>
            <p className={styles.style204_24}>{copy.queueBadge}</p>
            <h2 className={styles.style205_25}>{copy.sheetTitle}</h2>
          </div>
          <span className={styles.style208_27}>{requests.length}</span>
        </div>

        <div className={styles.style211_28}>
          {radarLockMessage ? (
            <StateCard tone="amber" icon={<RadioTower className={styles.style213_29} />} title={copy.radarLocked} body={radarLockMessage} />
          ) : requests.length === 0 ? (
            <StateCard tone="empty" icon={<RadioTower className={styles.style215_30} />} title={copy.noRequestsTitle} body={copy.empty} />
          ) : (
            <div className={styles.style217_31}>
              <div className={styles.seizeMarketBanner}>
                <span>{copy.seizeMarket}</span>
                <span className={styles.seizeMarketBadge}>{requests.length}/9</span>
              </div>
              {requests.map((request) => {
                const isOwnPendingOffer = pendingOfferRequestId === request.id;
                const isBlockedByOtherPendingOffer = Boolean(pendingOfferRequestId) && !isOwnPendingOffer;
                const isTaxiMode = isOfficeTaxi || request.pricingPreference === 'TAXI';
                const isAppMode = !isTaxiMode && (captainPricingMode === 'APP' || request.pricingPreference === 'APP');
                const isIndependentMode = !isTaxiMode && !isAppMode && (subRole === 'independent' || subRole === 'المستقل');
                const isRadarFreeMode = !isTaxiMode && !isAppMode && !isIndependentMode;

                const isSubmittingThisRequest = submittingRequestId === request.id;

                const pickupCoords = request.exactPickupCoords || request.obfuscatedPickupCoords || request.pickupCoords;
                const googleMapsUrl = request.pickupGoogleMapsUrl || (pickupCoords?.lat && pickupCoords?.lng ? `https://www.google.com/maps/search/?api=1&query=${pickupCoords.lat},${pickupCoords.lng}` : null);
                const riderPhoneNum = request.riderPhone || (request as any).riderPhoneNumber || (request as any).rider?.phone;

                // Anti-dumping and price limit calculations for card
                const baseMarketPrice = request.offerPrice != null && request.offerPrice > 0 ? request.offerPrice : null;
                const rawPriceStr = directPrices[request.id];
                const rawPriceNum = rawPriceStr != null && rawPriceStr.trim() !== '' ? parseFloat(rawPriceStr) : null;
                const currentPrice = rawPriceNum != null && !isNaN(rawPriceNum) && rawPriceNum > 0
                  ? rawPriceNum
                  : (baseMarketPrice ?? 0);

                const marketBrake = (baseMarketPrice && baseMarketPrice > 0 && currentPrice > 0)
                  ? RadarAntiCheatKernel.enforceMarketBrakes(currentPrice, baseMarketPrice)
                  : { status: 'NORMAL' as const };

                const isDumpingCrimson = !isTaxiMode && (marketBrake.status === 'CRIMSON_BLOCK' || (Boolean(baseMarketPrice) && currentPrice > 0 && currentPrice < (baseMarketPrice! * 0.85)));
                const isDumpingAmber = !isTaxiMode && !isDumpingCrimson && marketBrake.status === 'AMBER_WARNING';
                const isUpperWarn = !isTaxiMode && !isDumpingCrimson && !isDumpingAmber && Boolean(baseMarketPrice) && currentPrice > 0 && currentPrice > (baseMarketPrice! * 1.15);
                const floorPrice = baseMarketPrice ? Math.round(baseMarketPrice * 0.85 * 100) / 100 : 0;

                return (
                  <article
                    key={request.id}
                    className={cn(
                      styles.style219_32,
                      isOwnPendingOffer ? styles.cardPendingOffer : '',
                    )}
                  >
                    {/* Destination Title & Header */}
                    <div className={styles.style220_33}>
                      <MapPin className={styles.style221_34} />
                      <div className={styles.style222_35}>
                        <h3 className={styles.style223_36}>{request.dropoff || copy.destination}</h3>
                      </div>
                    </div>

                    {/* Rider Info (Rating, Trips, Favorite) */}
                    <div className="mt-3 space-y-2 select-none" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                      <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                        <span className="text-slate-300">{copy.riderRatingLabel}</span>
                        <span
                          dir="ltr"
                          className={cn(
                            'font-black font-mono',
                            request.riderRating != null && request.riderRating > 0 ? 'text-amber-400 text-sm sm:text-base' : 'text-slate-400 text-xs font-bold',
                          )}
                        >
                          {request.riderRating != null && request.riderRating > 0
                            ? `${request.riderRating % 1 === 0 ? request.riderRating.toFixed(0) : request.riderRating.toFixed(1)}/5`
                            : copy.riderUnrated}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                        <span className="text-slate-300">{copy.riderTripsLabel}</span>
                        <span dir="ltr" className="font-black text-sm sm:text-base font-mono text-white">
                          {request.riderCompletedTrips != null ? request.riderCompletedTrips : 0}
                        </span>
                      </div>

                      {request.riderFavoritedMe && (
                        <div className="flex items-center gap-1.5 text-xs font-black text-emerald-400 pt-1">
                          <Heart className="h-3.5 w-3.5 shrink-0 fill-emerald-400 text-emerald-400 animate-pulse" />
                          <span>{copy.riderFavoritedYou}</span>
                        </div>
                      )}
                    </div>

                    {/* Trip Info Grid (directly on the card) */}
                    <div className={styles.style227_38} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                      <Info
                        label={copy.pickupTime}
                        value={t('minutesValue', { count: estimatePickupMinutes(pickupDistanceKm(driverLocation, request)) })}
                      />
                      <Info
                        label={copy.tripDistance}
                        value={request.estimatedDistance != null ? `${request.estimatedDistance.toFixed(1)} ${language === 'ar' ? tAuto('key_4171dde6') : 'km'}` : t('distanceUnavailable')}
                      />
                      <Info
                        label={copy.marketFare}
                        value={request.offerPrice != null ? `${request.offerPrice.toFixed(2)} ${currency}` : '—'}
                      />
                      <Info
                        label={copy.requestTime}
                        value={formatRequestTime(request.createdAt, language)}
                      />
                    </div>

                    {/* PRICING INPUT / DISPLAY ON THE CARD */}
                    {!isOwnPendingOffer && (
                      <div className="mt-3.5 pt-3 border-t border-slate-800/80">
                        {/* CASE 1: Smart App Mode (Uber etc.) - Input readOnly + Paste button only */}
                        {isAppMode && (
                          <div className={styles.appPriceCard} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.appPriceCardHeader} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                              <span className={styles.appPriceCardBadge}>
                                📱 {copy.appModeBadge}
                              </span>
                              <span className={styles.appPriceCardNotice}>
                                {copy.appModeInputNotice}
                              </span>
                            </div>

                            <div className={styles.appPriceInputRow} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                              <div className={styles.appPriceInputGroup} dir="ltr">
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  placeholder="0.00"
                                  disabled={isBlockedByOtherPendingOffer}
                                  value={directPrices[request.id] ?? ''}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9.]/g, '');
                                    const parts = val.split('.');
                                    const cleanVal = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : val;
                                    setDirectPrices((prev) => ({ ...prev, [request.id]: cleanVal }));
                                    if (priceErrors[request.id]) setPriceErrors((prev) => ({ ...prev, [request.id]: false }));
                                  }}
                                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                  className={cn(
                                    styles.appPriceInputField,
                                    'text-amber-300 font-mono font-black',
                                    isBlockedByOtherPendingOffer ? styles.appPriceInputDisabled : '',
                                  )}
                                  dir="ltr"
                                />
                                <span className={styles.appPriceCurrencyBadge}>{currency}</span>
                              </div>

                              <button
                                type="button"
                                onClick={() => void handlePastePrice(request.id)}
                                disabled={isBlockedByOtherPendingOffer}
                                className={styles.appPricePasteBtn}
                                title={copy.pastePrice}
                                dir={language === 'ar' ? 'rtl' : 'ltr'}
                              >
                                <ClipboardPaste className={styles.appPricePasteIcon} />
                                <span>{copy.paste}</span>
                              </button>
                            </div>

                            {priceErrors[request.id] ? (
                              <p className={styles.appPriceInputError}>{copy.appModePriceRequired}</p>
                            ) : null}
                          </div>
                        )}

                        {/* CASE 2: Independent Mode (مستقل) - Stepper + Input directly on card */}
                        {isIndependentMode && (
                          <div className={styles.appPriceCard} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.appPriceCardHeader} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                              <span className={styles.appPriceCardBadge}>
                                💼 {copy.independentBadge}
                              </span>
                              <span className={styles.appPriceCardNotice}>
                                {copy.independentNotice}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 pt-1 w-full" dir="ltr">
                              <button
                                type="button"
                                disabled={isBlockedByOtherPendingOffer}
                                onClick={() => {
                                  const stepVal = 0.5;
                                  const nextVal = Math.max(0.1, Math.round((currentPrice - stepVal) * 100) / 100);
                                  setDirectPrices((prev) => ({ ...prev, [request.id]: nextVal.toFixed(2) }));
                                  if (priceErrors[request.id]) setPriceErrors((prev) => ({ ...prev, [request.id]: false }));
                                }}
                                className="flex h-11 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900 text-slate-200 hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-40 cursor-pointer shadow-sm"
                              >
                                <Minus className="h-4 w-4" />
                              </button>

                              <div
                                className={cn(
                                  styles.appPriceInputGroup,
                                  'min-w-0 flex-1',
                                  isDumpingCrimson ? '!border-rose-500/80 !bg-rose-950/40' : isDumpingAmber ? '!border-amber-500/80 !bg-amber-950/30' : '',
                                )}
                                dir="ltr"
                              >
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0.1"
                                  placeholder="0.00"
                                  disabled={isBlockedByOtherPendingOffer}
                                  value={directPrices[request.id] ?? ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setDirectPrices((prev) => ({ ...prev, [request.id]: val }));
                                    if (priceErrors[request.id]) {
                                      setPriceErrors((prev) => ({ ...prev, [request.id]: false }));
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleInitiateOffer(request);
                                    }
                                  }}
                                  className={cn(
                                    styles.appPriceInputField,
                                    'font-mono font-black text-center text-base',
                                    isBlockedByOtherPendingOffer ? styles.appPriceInputDisabled : '',
                                    isDumpingCrimson ? '!text-rose-300' : isDumpingAmber ? '!text-amber-300' : '',
                                  )}
                                  dir="ltr"
                                />
                                <span className={styles.appPriceCurrencyBadge}>{currency}</span>
                              </div>

                              <button
                                type="button"
                                disabled={isBlockedByOtherPendingOffer}
                                onClick={() => {
                                  const stepVal = 0.5;
                                  const nextVal = Math.round((currentPrice + stepVal) * 100) / 100;
                                  setDirectPrices((prev) => ({ ...prev, [request.id]: nextVal.toFixed(2) }));
                                  if (priceErrors[request.id]) setPriceErrors((prev) => ({ ...prev, [request.id]: false }));
                                }}
                                className="flex h-11 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900 text-slate-200 hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-40 cursor-pointer shadow-sm"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>

                            {priceErrors[request.id] ? (
                              <p className={styles.appPriceInputError}>{copy.independentPriceRequired}</p>
                            ) : null}
                          </div>
                        )}

                        {/* CASE 3: Radar / Free Mode (رادار) - Stepper + Input + Edit Setup Button */}
                        {isRadarFreeMode && (
                          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-3 shadow-inner space-y-2" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                            <div className="flex items-center justify-between gap-2.5">
                              <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-300 min-w-0 flex-1 leading-snug">
                                📡 {copy.radarModeNotice}
                              </span>
                              {onEditTariff && (
                                <button
                                  type="button"
                                  onClick={onEditTariff}
                                  className="inline-flex shrink-0 items-center gap-1 rounded-md border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/25 active:scale-95 transition-all cursor-pointer"
                                >
                                  <Edit3 className="h-3 w-3" />
                                  <span>{copy.editTariffBtn}</span>
                                </button>
                              )}
                            </div>

                            <div className="flex items-center gap-2 pt-1 w-full" dir="ltr">
                              <button
                                type="button"
                                disabled={isBlockedByOtherPendingOffer}
                                onClick={() => {
                                  const stepVal = 0.5;
                                  const nextVal = Math.max(0.1, Math.round((currentPrice - stepVal) * 100) / 100);
                                  setDirectPrices((prev) => ({ ...prev, [request.id]: nextVal.toFixed(2) }));
                                  if (priceErrors[request.id]) setPriceErrors((prev) => ({ ...prev, [request.id]: false }));
                                }}
                                className="flex h-11 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900 text-slate-200 hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-40 cursor-pointer shadow-sm"
                              >
                                <Minus className="h-4 w-4" />
                              </button>

                              <div
                                className={cn(
                                  styles.appPriceInputGroup,
                                  'min-w-0 flex-1',
                                  isDumpingCrimson ? '!border-rose-500/80 !bg-rose-950/40' : isDumpingAmber ? '!border-amber-500/80 !bg-amber-950/30' : '',
                                )}
                                dir="ltr"
                              >
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0.1"
                                  placeholder={baseMarketPrice ? baseMarketPrice.toFixed(2) : '0.00'}
                                  disabled={isBlockedByOtherPendingOffer}
                                  value={directPrices[request.id] ?? (baseMarketPrice ? baseMarketPrice.toFixed(2) : '')}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setDirectPrices((prev) => ({ ...prev, [request.id]: val }));
                                    if (priceErrors[request.id]) {
                                      setPriceErrors((prev) => ({ ...prev, [request.id]: false }));
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleInitiateOffer(request);
                                    }
                                  }}
                                  className={cn(
                                    styles.appPriceInputField,
                                    'font-mono font-black text-center text-base',
                                    isBlockedByOtherPendingOffer ? styles.appPriceInputDisabled : '',
                                    isDumpingCrimson ? '!text-rose-300' : isDumpingAmber ? '!text-amber-300' : '',
                                  )}
                                  dir="ltr"
                                />
                                <span className={styles.appPriceCurrencyBadge}>{currency}</span>
                              </div>

                              <button
                                type="button"
                                disabled={isBlockedByOtherPendingOffer}
                                onClick={() => {
                                  const stepVal = 0.5;
                                  const nextVal = Math.round((currentPrice + stepVal) * 100) / 100;
                                  setDirectPrices((prev) => ({ ...prev, [request.id]: nextVal.toFixed(2) }));
                                  if (priceErrors[request.id]) setPriceErrors((prev) => ({ ...prev, [request.id]: false }));
                                }}
                                className="flex h-11 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900 text-slate-200 hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-40 cursor-pointer shadow-sm"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* CASE 4: Taxi Mode (تاكسي) - Fixed Meter Fare Display (Read-Only) */}
                        {isTaxiMode && (
                          <div className={styles.taxiNoticeBanner} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                            <div className="flex items-center gap-1.5">
                              <span className={styles.taxiNoticeIcon}>🚕</span>
                              <span>{copy.taxiModeNotice}</span>
                            </div>
                            <span className="font-mono font-black text-sm text-amber-300" dir="ltr">
                              {request.offerPrice != null ? `${request.offerPrice.toFixed(2)} ${currency}` : '—'}
                            </span>
                          </div>
                        )}

                        {/* DYNAMIC ANTI-DUMPING / LIMIT ALERTS (Shown ONLY when breached) */}
                        {isDumpingCrimson ? (
                          <div className="mt-2.5 rounded-xl border border-rose-500/40 bg-rose-950/50 p-2.5 text-xs text-rose-200 space-y-2 animate-in fade-in duration-150" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                            <div className="flex items-start gap-2 font-bold">
                              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                              <span>{copy.dumpingCrimsonMsg}</span>
                            </div>
                            {floorPrice > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setDirectPrices((prev) => ({ ...prev, [request.id]: floorPrice.toFixed(2) }));
                                  if (priceErrors[request.id]) setPriceErrors((prev) => ({ ...prev, [request.id]: false }));
                                }}
                                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-rose-400/40 bg-rose-500/20 py-1.5 px-3 text-xs font-black text-rose-200 hover:bg-rose-500/30 active:scale-95 transition-all cursor-pointer"
                              >
                                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                                <span>{copy.applyFloorBtn} ({floorPrice.toFixed(2)} {currency})</span>
                              </button>
                            )}
                          </div>
                        ) : isDumpingAmber ? (
                          <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-950/40 p-2.5 text-xs font-bold text-amber-200 animate-in fade-in duration-150" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                            <span>{copy.dumpingAmberMsg}</span>
                          </div>
                        ) : isUpperWarn ? (
                          <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-950/40 p-2.5 text-xs font-bold text-amber-200 animate-in fade-in duration-150" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                            <span>{copy.upperWarnMsg}</span>
                          </div>
                        ) : null}
                      </div>
                    )}

                    {isBlockedByOtherPendingOffer ? (
                      <div className={styles.blockedPendingBanner} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                        <Clock className={styles.blockedPendingIcon} />
                        <span>{copy.blockedPendingOfferHint}</span>
                      </div>
                    ) : null}

                    {/* Submit Offer Button */}
                    {!isOwnPendingOffer ? (
                      <div className={styles.style231_39} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                        <button
                          type="button"
                          onClick={() => handleInitiateOffer(request)}
                          disabled={isBlockedByOtherPendingOffer || isSubmittingThisRequest}
                          title={isBlockedByOtherPendingOffer ? copy.blockedPendingOfferHint : undefined}
                          className={cn(
                            styles.style232_40,
                            (isBlockedByOtherPendingOffer || isSubmittingThisRequest) ? styles.pendingOfferDisabled : '',
                            isDumpingCrimson ? '!border-rose-500/80' : isDumpingAmber ? '!border-amber-500/80' : '',
                          )}
                          dir={language === 'ar' ? 'rtl' : 'ltr'}
                        >
                          {isSubmittingThisRequest ? (
                            <Loader2 className={styles.submitSpinner} />
                          ) : (
                            <Route className={styles.style233_41} />
                          )}
                          <span>{copy.submitDirect}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onIgnoreRequest(request.id)}
                          className={styles.style236_42}
                          dir={language === 'ar' ? 'rtl' : 'ltr'}
                        >
                          {copy.ignore}
                        </button>
                      </div>
                    ) : null}

                    {/* IF OFFER PENDING: Show Status Banner only */}
                    {isOwnPendingOffer ? (
                      <div className={styles.ownPendingRow} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                        <div className={styles.ownPendingBadge} title={copy.ownPendingOfferDesc}>
                          <span className={styles.ownPendingPulseWrap}>
                            <span className={styles.ownPendingPing} />
                            <span className={styles.ownPendingDot} />
                          </span>
                          <Clock className={styles.ownPendingIcon} />
                          <span className={styles.ownPendingText}>{copy.ownPendingOffer}</span>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {/* POPUP MODAL: Wait Seconds Confirmation Modal for Submitting Offer */}
      {confirmModalTrip && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-150"
          dir={language === 'ar' ? 'rtl' : 'ltr'}
        >
          <div className="w-full max-w-md rounded-3xl border border-emerald-500/30 bg-[#0B0F19] p-5 shadow-2xl text-white space-y-4">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-black text-[#14B8A6]">{copy.confirmOfferTitle}</span>
                <h3 className="text-lg font-black text-white mt-0.5">{confirmModalTrip.trip.dropoff || copy.destination}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{copy.confirmOfferSubtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmModalTrip(null)}
                className="rounded-xl border border-white/10 p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>



            {/* Wait Seconds Box */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-200">
                {copy.waitSecondsLabel}
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={waitSeconds}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, '');
                    setWaitSeconds(cleaned);
                  }}
                  onBlur={() => {
                    const num = parseInt(waitSeconds, 10);
                    if (isNaN(num) || num < 30) {
                      setWaitSeconds('30');
                    } else if (num > 900) {
                      setWaitSeconds('900');
                    } else {
                      setWaitSeconds(String(num));
                    }
                  }}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                      e.preventDefault();
                    }
                  }}
                  className="w-full rounded-xl border border-emerald-500/40 bg-black/70 px-3 py-2.5 text-start font-mono text-base font-black text-emerald-300 outline-none focus:border-emerald-400"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-emerald-400/80 pointer-events-none select-none">
                  {language === 'ar' ? 'ثانية' : 's'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight pt-0.5">{copy.waitSecondsHint}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => void handleConfirmSubmitBid()}
                disabled={submittingRequestId === confirmModalTrip.trip.id}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#14F5D5] via-[#14B8A6] to-[#0d9488] px-4 py-3 text-xs sm:text-sm font-black text-[#031518] shadow-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
              >
                {submittingRequestId === confirmModalTrip.trip.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                <span>{copy.confirmBid}</span>
              </button>
              <button
                type="button"
                onClick={() => setConfirmModalTrip(null)}
                className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-xs font-bold text-slate-300 hover:bg-slate-800 transition-all cursor-pointer"
              >
                {copy.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Info({ label, value, fullWidth }: { label: string; value: string; fullWidth?: boolean }) {
  return (
    <div className={cn(styles.style252_43, fullWidth ? styles.infoFullWidth : '')}>
      <p className={styles.style253_44}>{label}</p>
      <p className={styles.style254_45}>{value}</p>
    </div>
  );
}

function StateCard({
  body,
  icon,
  title,
  tone,
}: {
  body: string;
  icon: React.ReactNode;
  title: string;
  tone: 'amber' | 'empty';
}) {
  const classes = tone === 'amber' ? styles.stateAmber : styles.stateEmpty;

  return (
    <div className={cn(styles.style275_46, classes)}>
      <div className={tone === 'amber' ? styles.style276_47 : styles.style276_48}>{icon}</div>
      <h3 className={styles.style277_49}>{title}</h3>
      <p className={styles.style278_50}>{body}</p>
    </div>
  );
}

function createCarMarkerElement() {
  const element = document.createElement('div');
  element.className = 'grid h-11 w-11 place-items-center rounded-2xl border-2 border-[#06111f] bg-[#14B8A6] text-[#06111f] shadow-[0_0_0_14px_rgba(20,184,166,0.16),0_14px_34px_rgba(0,0,0,0.4)]';
  element.innerHTML = `
    <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
      <path d="M7 17h10" />
      <path d="M5 13l1.4-4.2A3 3 0 0 1 9.2 7h5.6a3 3 0 0 1 2.8 1.8L19 13" />
      <path d="M5 13h14v4H5z" />
      <circle cx="8" cy="17" r="1.5" />
      <circle cx="16" cy="17" r="1.5" />
    </svg>
  `;
  return element;
}

function CarMarkerIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17h10" />
      <path d="M5 13l1.4-4.2A3 3 0 0 1 9.2 7h5.6a3 3 0 0 1 2.8 1.8L19 13" />
      <path d="M5 13h14v4H5z" />
      <circle cx="8" cy="17" r="1.5" />
      <circle cx="16" cy="17" r="1.5" />
    </svg>
  );
}

function formatMinutes(totalMinutes: number, language: 'ar' | 'en') {
  const safeMinutes = Math.max(0, Math.floor(Number(totalMinutes) || 0));
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  return language === 'ar' ? `${hours} ساعة ${minutes} دقيقة` : `${hours}h ${minutes}m`;
}

function pickupDistanceKm(driverLocation: { lat: number; lng: number } | null, request: Trip) {
  if (!driverLocation || !request.pickupCoords) return null;
  return estimateHaversineDistanceKm(
    driverLocation.lat,
    driverLocation.lng,
    request.pickupCoords.lat,
    request.pickupCoords.lng,
  );
}

function formatRequestTime(isoString: string | undefined | null, language: 'ar' | 'en') {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '-';
    const locale = language === 'ar' ? 'ar-EG' : 'en-US';
    return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(d);
  } catch {
    return '-';
  }
}

function fallbackRequestPosition(index: number): React.CSSProperties {
  const positions: Array<React.CSSProperties> = [
    { left: '58%', top: '42%' },
    { left: '43%', top: '55%' },
    { left: '66%', top: '58%' },
    { left: '35%', top: '38%' },
    { left: '52%', top: '68%' },
    { left: '72%', top: '35%' },
    { left: '28%', top: '56%' },
    { left: '64%', top: '26%' },
    { left: '42%', top: '24%' },
  ];

  return positions[index] || positions[0];
}

const radarCopy = {
  ar: {
    title: 'رادار الكابتن',
    online: 'متاح لاستقبال الطلبات',
    offline: 'غير متاح حالياً',
    remaining: 'المتبقي',
    locked: 'الرادار متوقف',
    recenter: 'العودة إلى موقعي',
    mapLoading: 'جاري تحميل الخريطة',
    mapReady: 'الخريطة جاهزة',
    mapIssue: 'تعذر تحميل الخريطة بالكامل',
    mapHint: 'إذا لم تظهر الخريطة، تحقق من الاتصال بالإنترنت أو أعد تحميل الصفحة.',
    radarFallback: 'الرادار المحلي يعمل، وستظهر الطلبات في القائمة يمين الشاشة.',
    queueBadge: 'قائمة الطلبات',
    sheetTitle: 'طلبات قريبة',
    radarLocked: 'الرادار غير مفعل',
    noRequestsTitle: 'لا توجد طلبات الآن',
    empty: 'ابق متاحاً. ستظهر طلبات الركاب هنا فور وصولها إلى منطقتك.',
    destination: 'وجهة الراكب',
    fare: 'السعر الأساسي',
    pickupTime: 'الوقت حتى تصل للراكب',
    tripDistance: 'مسافة الرحلة',
    requestTime: 'وقت الطلب',
    ratingPrefix: 'تقييم',
    riderRatingLabel: 'تقييم الراكب',
    riderTripsLabel: 'رحلات الراكب',
    riderUnrated: 'راكب جديد بدون تقييم',
    riderFavoritedYou: 'أنت في قائمة السائقين المفضّلين',
    riderNotFavoritedYou: 'لست في المفضلة',
    pricingPreference: 'طريقة التسعير',
    openBid: 'تقديم عرض',
    submitDirect: 'تقديم عرض',
    pendingOfferHint: 'لديك عرض قيد الانتظار، انتظر رد الراكب أولاً.',
    blockedPendingOfferHint: 'لديك عرض قيد الانتظار لطلب آخر — انتظر رد الراكب للمتابعة',
    ownPendingOffer: 'عرضك قيد الانتظار',
    ownPendingOfferDesc: 'عرضك قيد الانتظار — بانتظار رد الراكب',
    ignore: 'تجاهل',
    seizeMarket: 'اقـتـنص فرصتك من السوق',
    marketFare: 'متوسط سعر السوق',
    appModeBadge: 'تطبيق ذكي',
    appModeInputNotice: 'أدخل أو الصق تسعيرة المشوار المعتمدة من تطبيقك',
    appModePriceRequired: 'يرجى إدخال السعر أولاً',
    pastePrice: 'لصق السعر من الحافظة',
    paste: 'لصق السعر',
    taxiModeNotice: 'تكسي عام - التزم بسعر العداد المعتمد',
    independentBadge: 'مستقل (سعر حر)',
    independentNotice: 'أدخل السعر الذي تجده مناسباً للمشوار',
    independentPriceRequired: 'يرجى كتابة السعر المطلوب أولاً',
    radarModeNotice: 'سعر الرادار المحسوب بناءً على تسعيرتك العامة',
    editTariffBtn: 'تعديل',
    confirmOfferTitle: 'تأكيد تقديم العرض',
    confirmOfferSubtitle: 'حدد ثواني الانتظار للراكب قبل تأكيد تقديم عرضك',
    offerPriceLabel: 'قيمة العرض المالي',
    waitSecondsLabel: 'عدد ثواني الانتظار (ثانية)',
    waitSecondsHint: 'مدة صلاحية العرض قبل انتهاء مهلة الانتظار للراكب',
    confirmBid: 'تأكيد وتقديم العرض',
    cancel: 'إلغاء',
    callRider: 'اتصال بالراكب',
    openPickupMap: 'فتح الموقع في خرائط جوجل',
    dumpingAmberMsg: '⚠️ تنبيه: السعر منخفض (أقل من سعر السوق بنسبة 10% إلى 14.9%)، وقد يؤثر على تقييمك ورتبتك.',
    dumpingCrimsonMsg: '🛑 تنبيه: السعر أقل من سعر السوق بأكثر من 15% (سعر محروق قد يؤثر على تقييمك ورتبتك).',
    upperWarnMsg: '⚠️ تنبيه: السعر أعلى من النطاق المعتمد (+15% فما فوق).',
    applyFloorBtn: 'تطبيق الحد الأدنى المسموح به',
  },
  en: {
    title: 'Captain radar',
    online: 'Online and receiving requests',
    offline: 'Offline',
    remaining: 'Remaining',
    locked: 'Radar paused',
    recenter: 'Back to my location',
    mapLoading: 'Loading map',
    mapReady: 'Map is ready',
    mapIssue: 'Map could not fully load',
    mapHint: 'If the map does not appear, check the internet connection or reload the page.',
    radarFallback: 'Local radar stays active; requests appear in the queue on the right.',
    queueBadge: 'Request queue',
    sheetTitle: 'Nearby requests',
    radarLocked: 'Radar is inactive',
    noRequestsTitle: 'No requests right now',
    empty: 'Stay online. Rider requests will appear here as soon as they reach your area.',
    destination: 'Rider destination',
    fare: 'Base fare',
    pickupTime: 'Time to reach the rider',
    tripDistance: 'Trip distance',
    requestTime: 'Request time',
    ratingPrefix: 'Rating',
    riderRatingLabel: 'Rider rating',
    riderTripsLabel: 'Rider trips',
    riderUnrated: 'New rider — no ratings yet',
    riderFavoritedYou: 'You are in favorite captains list',
    riderNotFavoritedYou: 'Not a favourite yet',
    pricingPreference: 'Pricing Mode',
    openBid: 'Submit bid',
    submitDirect: 'Submit offer',
    pendingOfferHint: 'You have a pending offer — wait for the rider to respond first.',
    blockedPendingOfferHint: 'You have a pending offer on another trip — wait for rider response',
    ownPendingOffer: 'Offer pending',
    ownPendingOfferDesc: 'Your offer is pending — waiting for the rider to respond',
    ignore: 'Ignore',
    seizeMarket: 'Seize your market opportunity',
    marketFare: 'Market Average Fare',
    appModeBadge: 'Smart App',
    appModeInputNotice: 'Enter or paste trip fare from your app',
    appModePriceRequired: 'Please enter a valid price first',
    pastePrice: 'Paste from clipboard',
    paste: 'Paste Fare',
    taxiModeNotice: 'Standard Taxi - Meter fare enforced',
    independentBadge: 'Independent',
    independentNotice: 'Type your custom fare for this trip',
    independentPriceRequired: 'Please enter a valid price first',
    radarModeNotice: 'Calculated Radar Fare from your general setup',
    editTariffBtn: 'Edit',
    confirmOfferTitle: 'Confirm Offer Submission',
    confirmOfferSubtitle: 'Set wait seconds for rider response then confirm',
    offerPriceLabel: 'Offer Price',
    waitSecondsLabel: 'Wait duration (seconds)',
    waitSecondsHint: 'Seconds rider has to respond before offer expires',
    confirmBid: 'Confirm & Send Offer',
    cancel: 'Cancel',
    callRider: 'Call Rider',
    openPickupMap: 'Open in Google Maps',
    dumpingAmberMsg: '⚠️ Warning: Price is below market average (10% - 14.9% below), which may affect your rating.',
    dumpingCrimsonMsg: '🛑 Warning: Price is more than 15% below market average (may affect your evaluation and rating).',
    upperWarnMsg: '⚠️ Warning: Price exceeds allowed band (+15% or above).',
    applyFloorBtn: 'Apply minimum allowed price',
  },
} as const;
