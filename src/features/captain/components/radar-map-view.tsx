'use client';

import React from 'react';
import maplibregl from 'maplibre-gl';
import { ChevronDown, ClipboardPaste, Clock, Heart, Loader2, MapPin, RadioTower, Route, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Trip } from '@/core/types';
import { DEFAULT_MAP_CENTER } from '@/shared/services/maplibre-runtime';
import { useMaplibreInstance } from '@/shared/hooks/use-maplibre-instance';
import { RecenterMapButton } from '@/shared/components/map/recenter-map-button';
import { estimateHaversineDistanceKm } from '../services/ride-location';
import { estimatePickupMinutes } from '@/shared/services/trip-duration';

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
  riderRow: "mt-3 flex flex-wrap items-center gap-2",
  riderChip: "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all duration-200",
  riderDefaultChip: "border border-white/10 bg-white/5 text-slate-300",
  riderRatingChip: "border border-amber-400/60 bg-gradient-to-r from-amber-500/25 to-amber-400/15 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.25)] font-black",
  riderTripsChip: "border border-cyan-400/40 bg-gradient-to-r from-cyan-500/20 to-teal-500/15 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)] font-bold",
  riderFavoriteChipOn: "border border-rose-400 bg-gradient-to-r from-rose-500/35 via-pink-500/30 to-rose-600/25 text-white font-black shadow-[0_0_18px_rgba(244,63,94,0.45)] ring-1 ring-rose-400/60",
  riderFavoriteChipOff: "border border-slate-700/60 bg-slate-900/50 text-slate-400 font-medium",
  starFilled: "fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.9)]",
  starEmpty: "text-slate-500",
  routeIconActive: "text-cyan-400 drop-shadow-[0_0_4px_rgba(6,182,212,0.6)]",
  heartFilled: "fill-rose-400 text-rose-300 drop-shadow-[0_0_8px_rgba(244,63,94,1)] animate-pulse",
  heartEmpty: "text-slate-500",
  riderChipIcon: "h-3.5 w-3.5 shrink-0",
  cardPendingOffer: "border-amber-400/35 shadow-[0_0_20px_rgba(251,191,36,0.12)] hover:border-amber-400/60",
  ownPendingRow: "mt-3 flex items-center gap-2",
  ownPendingBadge: "w-full flex-1 min-w-0 flex items-center justify-center gap-1.5 rounded-xl border border-amber-400/40 bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-amber-500/15 h-11 px-2.5 text-xs font-black text-amber-200 shadow-[0_0_16px_rgba(251,191,36,0.12)] backdrop-blur-sm transition-all duration-200 overflow-hidden",
  ownPendingDetailsBtn: "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3 h-11 text-xs font-bold text-cyan-300 shadow-sm hover:border-cyan-400/60 hover:bg-cyan-500/20 active:scale-[0.98] transition-all whitespace-nowrap",
  ownPendingIcon: "h-3.5 w-3.5 shrink-0 text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.7)] animate-pulse",
  ownPendingPulseWrap: "relative flex h-2 w-2 shrink-0",
  ownPendingPing: "absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75",
  ownPendingDot: "relative inline-flex h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.9)]",
  ownPendingText: "truncate font-black text-amber-100 text-xs tracking-tight whitespace-nowrap",
  infoFullWidth: "col-span-2",
  cardHeaderToggle: "flex w-full flex-col text-start cursor-pointer select-none rounded-xl transition-opacity hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400",
  toggleChevronWrap: "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition-colors hover:border-emerald-500/40 hover:text-emerald-300",
  toggleChevron: "h-4 w-4 transition-transform duration-200",
  toggleChevronExpanded: "rotate-180 text-emerald-400",
  toggleChevronCollapsed: "rotate-0 text-slate-400",
  collapsibleContent: "mt-3 pt-3 border-t border-slate-800/80 transition-all duration-200",
  seizeMarketBanner: "mb-3 flex items-center justify-between gap-2 rounded-xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 px-3.5 py-2 text-xs font-black text-[#5eead4] shadow-sm",
  seizeMarketBadge: "flex h-5 items-center justify-center rounded-md border border-[#14B8A6]/40 bg-black/40 px-2 text-[10px] font-mono font-black text-[#14F5D5]",
  requestIndexBadge: "inline-flex items-center justify-center rounded-lg border border-[#14B8A6]/30 bg-[#14B8A6]/10 px-2 py-0.5 text-[10px] font-mono font-black text-[#14F5D5] shadow-sm",
  cardTopRow: "flex items-center justify-between gap-2 mb-2",
  riderPrefBadgeApp: "inline-flex items-center gap-1 rounded-lg border border-amber-400/40 bg-gradient-to-r from-amber-500/20 to-amber-400/10 px-2 py-0.5 text-[10px] sm:text-[11px] font-black text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.15)] shrink-0",
  riderPrefBadgeTaxi: "inline-flex items-center gap-1 rounded-lg border border-yellow-400/40 bg-gradient-to-r from-yellow-500/20 to-amber-500/15 px-2 py-0.5 text-[10px] sm:text-[11px] font-black text-yellow-200 shadow-[0_0_10px_rgba(234,179,8,0.15)] shrink-0",
  riderPrefBadgeFree: "inline-flex items-center gap-1 rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] sm:text-[11px] font-black text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)] shrink-0",
  riderPrefBadgeAll: "inline-flex items-center gap-1 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] sm:text-[11px] font-black text-cyan-300 shadow-sm shrink-0",
  appPriceCard: "mt-3 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/[0.08] via-black/50 to-black/70 p-3 shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-sm space-y-2.5",
  appPriceCardHeader: "flex items-center gap-2",
  appPriceCardBadge: "inline-flex items-center gap-1 rounded-lg border border-amber-400/30 bg-amber-500/15 px-2 py-0.5 text-[11px] font-black text-amber-300 shadow-sm shrink-0",
  appPriceCardNotice: "text-xs font-medium text-slate-300 min-w-0 flex-1",
  appPriceInputRow: "flex items-center gap-2 pt-0.5",
  appPriceInputGroup: "relative flex flex-1 items-center h-11 rounded-xl border border-amber-400/40 bg-black/70 shadow-inner focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20 transition-all overflow-hidden",
  appPriceInputField: "flex-1 min-w-0 h-full bg-transparent px-3 text-start font-mono text-base sm:text-lg font-black text-amber-100 placeholder:text-amber-500/30 outline-none",
  appPriceCurrencyBadge: "px-3 h-full flex items-center justify-center text-xs font-mono font-black text-amber-400/80 bg-amber-500/5 select-none border-s border-white/10 shrink-0",
  appPriceInputDisabled: "opacity-50 cursor-not-allowed",
  appPricePasteBtn: "h-11 px-3.5 inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-amber-400/50 bg-amber-500/15 text-xs font-black text-amber-300 shadow-sm transition-all hover:bg-amber-400/25 hover:border-amber-400/70 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap",
  appPricePasteIcon: "h-4 w-4 shrink-0 text-amber-300",
  appPriceInputError: "text-center text-xs font-bold text-rose-400 pt-0.5",
  blockedPendingBanner: "mt-3 flex items-center justify-center gap-2 rounded-xl border border-amber-500/35 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/15 px-3.5 py-2.5 text-center text-xs font-black text-amber-200 shadow-sm backdrop-blur-sm",
  blockedPendingIcon: "h-4 w-4 shrink-0 text-amber-300 animate-pulse",
  taxiNoticeBanner: "mt-3 flex items-center justify-center gap-2 rounded-xl border border-amber-400/35 bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-amber-500/15 px-3.5 py-2.5 text-center text-xs sm:text-sm font-black text-amber-200 shadow-[0_0_16px_rgba(245,158,11,0.08)] backdrop-blur-sm",
  taxiNoticeIcon: "h-4 w-4 shrink-0 text-amber-300",
  moreDetailsButton: "inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-2.5 h-11 text-[11px] sm:text-xs font-bold text-cyan-300 shadow-sm hover:border-cyan-400/60 hover:bg-cyan-500/20 active:scale-[0.98] transition-all whitespace-nowrap",
  moreDetailsIcon: "h-3.5 w-3.5 stroke-[2.2] shrink-0 text-cyan-300",
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
  captainPricingMode?: 'FREE' | 'APP' | null;
  isOfficeTaxi?: boolean;
  onSelectRequest: (request: Trip, initialPrice?: string, pricingMode?: 'FREE' | 'APP' | 'TAXI') => void;
  onIgnoreRequest: (requestId: string) => void;
  onSubmitDirectBid?: (request: Trip, price: number, waitSeconds?: number, pricingMode?: 'FREE' | 'APP' | 'TAXI') => Promise<void> | void;
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
  onSelectRequest,
  onIgnoreRequest,
  onSubmitDirectBid,
}: RadarMapViewProps) {
    const tAuto = useTranslations('auto');
  const copy = radarCopy[language];
  const t = useTranslations('captainPickup');
  const mapContainerRef = React.useRef<HTMLDivElement | null>(null);
  const markerRef = React.useRef<maplibregl.Marker | null>(null);
  const requestMarkersRef = React.useRef<maplibregl.Marker[]>([]);
  const [mapIssue, setMapIssue] = React.useState(false);
  const [expandedRequestIds, setExpandedRequestIds] = React.useState<Record<string, boolean>>({});
  const [directPrices, setDirectPrices] = React.useState<Record<string, string>>({});
  const [priceErrors, setPriceErrors] = React.useState<Record<string, boolean>>({});
  const [submittingRequestId, setSubmittingRequestId] = React.useState<string | null>(null);

  const toggleRequestExpanded = React.useCallback((requestId: string) => {
    setExpandedRequestIds((prev) => ({
      ...prev,
      [requestId]: !prev[requestId],
    }));
  }, []);

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
      // Clipboard access denied or unsupported - fail silently
    }
  }, []);

  const handleOpenBid = React.useCallback(async (request: Trip) => {
    const isTaxi = isOfficeTaxi || request.pricingPreference === 'TAXI';
    const isApp = !isTaxi && (captainPricingMode === 'APP' || request.pricingPreference === 'APP');
    const cardPricingMode: 'FREE' | 'APP' | 'TAXI' = isTaxi ? 'TAXI' : isApp ? 'APP' : 'FREE';

    // In Smart App mode: if a valid price is typed directly on the card, submit it
    if (isApp) {
      const priceStr = directPrices[request.id]?.trim();
      const priceNum = priceStr ? parseFloat(priceStr) : NaN;
      if (!priceStr || isNaN(priceNum) || priceNum <= 0) {
        setPriceErrors((prev) => ({ ...prev, [request.id]: true }));
        return;
      }
      setPriceErrors((prev) => ({ ...prev, [request.id]: false }));
      if (onSubmitDirectBid) {
        setSubmittingRequestId(request.id);
        try {
          await onSubmitDirectBid(request, priceNum, 300, 'APP');
        } finally {
          setSubmittingRequestId(null);
        }
        return;
      }
    }

    // In non-App modes (Taxi, Free, etc.) or if no direct price was entered,
    // take the captain to the details page so they can review and set/confirm their price:
    onSelectRequest(request, directPrices[request.id], cardPricingMode);
  }, [captainPricingMode, directPrices, isOfficeTaxi, onSelectRequest, onSubmitDirectBid]);

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

  // Runs once the map instance exists (mirrors the original code, which set
  // these up synchronously right after `new maplibregl.Map(...)`, before
  // `'load'` fires) — error health-check and the fallback resize nudge are
  // captain-specific, not shared with rider.
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
            <p className={styles.style206_26}>{copy.sheetSubtitle}</p>
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
              {requests.map((request, index) => {
                const isOwnPendingOffer = pendingOfferRequestId === request.id;
                const isBlockedByOtherPendingOffer = Boolean(pendingOfferRequestId) && !isOwnPendingOffer;
                const isTaxiMode = isOfficeTaxi || request.pricingPreference === 'TAXI';
                const isAppMode = !isTaxiMode && (captainPricingMode === 'APP' || request.pricingPreference === 'APP');
                const isSubmittingThisRequest = submittingRequestId === request.id;
                const isExpanded = Boolean(expandedRequestIds[request.id]);

                return (
                  <article
                    key={request.id}
                    className={cn(
                      styles.style219_32,
                      isOwnPendingOffer ? styles.cardPendingOffer : '',
                    )}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      onClick={() => toggleRequestExpanded(request.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleRequestExpanded(request.id);
                        }
                      }}
                      className={styles.cardHeaderToggle}
                    >
                      <div className={styles.cardTopRow} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                        <span className={styles.requestIndexBadge}>{index + 1}/9</span>
                        {request.pricingPreference === 'APP' ? (
                          <span className={styles.riderPrefBadgeApp}>📱 {copy.riderPrefApp}</span>
                        ) : request.pricingPreference === 'TAXI' ? (
                          <span className={styles.riderPrefBadgeTaxi}>🚕 {copy.riderPrefTaxi}</span>
                        ) : request.pricingPreference === 'FREE' ? (
                          <span className={styles.riderPrefBadgeFree}>🟢 {copy.riderPrefFree}</span>
                        ) : (
                          <span className={styles.riderPrefBadgeAll}>🌐 {copy.riderPrefAll}</span>
                        )}
                      </div>

                      <div className={styles.style220_33}>
                        <MapPin className={styles.style221_34} />
                        <div className={styles.style222_35}>
                          <h3 className={styles.style223_36}>{request.dropoff || copy.destination}</h3>
                        </div>
                        <span className={styles.toggleChevronWrap}>
                          <ChevronDown
                            className={cn(
                              styles.toggleChevron,
                              isExpanded ? styles.toggleChevronExpanded : styles.toggleChevronCollapsed,
                            )}
                          />
                        </span>
                      </div>

                      {/* Who the rider is. The captain was deciding whether to bid with nothing
                          about the person at all — no score, and no way to know this rider had
                          already picked them out as a favourite. */}
                      <div className={styles.riderRow}>
                        <span
                          className={cn(
                            styles.riderChip,
                            request.riderRating != null ? styles.riderRatingChip : styles.riderDefaultChip,
                          )}
                        >
                          <Star
                            className={cn(
                              styles.riderChipIcon,
                              request.riderRating != null ? styles.starFilled : styles.starEmpty,
                            )}
                          />
                          {request.riderRating != null
                            ? `${request.riderRating.toFixed(1)}${request.riderRatingCount ? ` (${request.riderRatingCount})` : ''}`
                            : copy.riderUnrated}
                        </span>
                        {request.riderCompletedTrips != null ? (
                          <span className={cn(styles.riderChip, styles.riderTripsChip)}>
                            <Route className={cn(styles.riderChipIcon, styles.routeIconActive)} />
                            {t('tripsValue', { count: request.riderCompletedTrips })}
                          </span>
                        ) : null}
                        {/* Always rendered, in both states.
                            The ask was "توضيح ما إذا كان الكابتن ضمن قائمة المفضلين لدى الراكب" —
                            whether or NOT. Showing the chip only when true means the absence of a
                            badge has two meanings the captain cannot tell apart: "this rider has
                            not favourited me" and "this is broken". */}
                        <span
                          className={cn(
                            styles.riderChip,
                            request.riderFavoritedMe ? styles.riderFavoriteChipOn : styles.riderFavoriteChipOff,
                          )}
                        >
                          <Heart
                            className={cn(
                              styles.riderChipIcon,
                              request.riderFavoritedMe ? styles.heartFilled : styles.heartEmpty,
                            )}
                          />
                          {request.riderFavoritedMe ? copy.riderFavoritedYou : copy.riderNotFavoritedYou}
                        </span>
                      </div>
                    </div>

                    {/* Details and actions are collapsed by default.
                        The captain opens to inspect pickup time, distance, and place a bid. */}
                    {isExpanded ? (
                      <div className={styles.collapsibleContent}>
                        {/* Pickup location (address, exact-map link) is deliberately withheld at
                            this stage — before the captain has even opened an offer, it's only
                            visible once they open the bidding sheet. The trip distance and how long
                            the approach to the rider will take are still useful for deciding
                            whether the trip is worth it, so those stay. */}
                        <div className={styles.style227_38}>
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

                        {isAppMode && !isOwnPendingOffer ? (
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
                                      void handleOpenBid(request);
                                    }
                                  }}
                                  className={cn(
                                    styles.appPriceInputField,
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
                        ) : null}

                        {isTaxiMode && !isOwnPendingOffer ? (
                          <div className={styles.taxiNoticeBanner} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                            <span className={styles.taxiNoticeIcon}>🚕</span>
                            <span>{copy.taxiModeNotice}</span>
                          </div>
                        ) : null}

                        {isBlockedByOtherPendingOffer ? (
                          <div className={styles.blockedPendingBanner} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                            <Clock className={styles.blockedPendingIcon} />
                            <span>{copy.blockedPendingOfferHint}</span>
                          </div>
                        ) : null}

                        {!isOwnPendingOffer ? (
                          <div className={styles.style231_39} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                            <button
                              type="button"
                              onClick={() => void handleOpenBid(request)}
                              disabled={isBlockedByOtherPendingOffer || isSubmittingThisRequest}
                              title={isBlockedByOtherPendingOffer ? copy.blockedPendingOfferHint : undefined}
                              className={cn(
                                styles.style232_40,
                                (isBlockedByOtherPendingOffer || isSubmittingThisRequest) ? styles.pendingOfferDisabled : '',
                              )}
                              dir={language === 'ar' ? 'rtl' : 'ltr'}
                            >
                              {isSubmittingThisRequest ? (
                                <Loader2 className={styles.submitSpinner} />
                              ) : (
                                <Route className={styles.style233_41} />
                              )}
                              <span>{isAppMode ? copy.submitDirect : copy.openBid}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onSelectRequest(request, directPrices[request.id], isTaxiMode ? 'TAXI' : isAppMode ? 'APP' : 'FREE')}
                              className={styles.moreDetailsButton}
                              title={copy.moreDetails}
                              dir={language === 'ar' ? 'rtl' : 'ltr'}
                            >
                              <MapPin className={styles.moreDetailsIcon} />
                              <span>{copy.moreDetails}</span>
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
                      </div>
                    ) : null}

                    {/* When the captain has placed an offer, this status banner is ALWAYS
                        visible whether the card is closed or open — so the captain can see
                        at a glance that their offer is awaiting the rider's decision without
                        having to expand the card first. */}
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

/** Straight-line captain-to-pickup distance, in km — null when either point is unknown. */
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
    sheetSubtitle: 'الطلبات القريبة من خلية H3 الحالية أو الخلايا المجاورة تظهر هنا مباشرة.',
    radarLocked: 'الرادار غير مفعل',
    noRequestsTitle: 'لا توجد طلبات الآن',
    empty: 'ابق متاحاً. ستظهر طلبات الركاب هنا فور وصولها إلى منطقتك.',
    destination: 'وجهة الراكب',
    fare: 'السعر الأساسي',
    pickupTime: 'الوقت حتى تصل للراكب',
    tripDistance: 'مسافة الرحلة',
    requestTime: 'وقت الطلب',
    riderUnrated: 'راكب جديد',
    riderFavoritedYou: 'في مفضلته',
    riderNotFavoritedYou: 'مش في مفضلته',
    pricingPreference: 'طريقة التسعير',
    openBid: 'تقديم عرض',
    submitDirect: 'تقديم مباشر',
    pendingOfferHint: 'لديك عرض قيد الانتظار، انتظر رد الراكب أولاً.',
    blockedPendingOfferHint: 'لديك عرض قيد الانتظار لطلب آخر — انتظر رد الراكب للمتابعة',
    ownPendingOffer: 'عرضك قيد الانتظار',
    ownPendingOfferDesc: 'عرضك قيد الانتظار — بانتظار رد الراكب',
    ignore: 'تجاهل',
    seizeMarket: 'اقـتـنص فرصتك من السوق',
    marketFare: 'متوسط سعر السوق',
    moreDetails: 'تفاصيل وموقع الالتقاط',
    appModeBadge: 'تطبيق ذكي',
    appModeInputNotice: 'أدخل نفس تسعيرة المشوار المعتمدة في تطبيقك',
    appModePriceRequired: 'يرجى إدخال السعر أولاً',
    pastePrice: 'لصق السعر من الحافظة',
    paste: 'لصق السعر',
    taxiModeNotice: 'التزم بسعر العداد المعتمد',
    riderPrefApp: 'الراكب يطلب: تطبيق ذكي',
    riderPrefTaxi: 'الراكب يطلب: تكسي عام',
    riderPrefFree: 'الراكب يطلب: سعر حر',
    riderPrefAll: 'متاح لجميع الفئات',
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
    sheetSubtitle: 'Requests in your current H3 cell or neighboring cells appear here.',
    radarLocked: 'Radar is inactive',
    noRequestsTitle: 'No requests right now',
    empty: 'Stay online. Rider requests will appear here as soon as they reach your area.',
    destination: 'Rider destination',
    fare: 'Base fare',
    pickupTime: 'Time to reach the rider',
    tripDistance: 'Trip distance',
    requestTime: 'Request time',
    riderUnrated: 'New rider',
    riderFavoritedYou: 'Has you as a favourite',
    riderNotFavoritedYou: 'Not a favourite yet',
    pricingPreference: 'Pricing Mode',
    openBid: 'Submit bid',
    submitDirect: 'Submit directly',
    pendingOfferHint: 'You have a pending offer — wait for the rider to respond first.',
    blockedPendingOfferHint: 'You have a pending offer on another trip — wait for rider response',
    ownPendingOffer: 'Offer pending',
    ownPendingOfferDesc: 'Your offer is pending — waiting for the rider to respond',
    ignore: 'Ignore',
    seizeMarket: 'Seize your market opportunity',
    marketFare: 'Market Average Fare',
    moreDetails: 'Details & Pickup',
    appModeBadge: 'Smart App',
    appModeInputNotice: 'Enter the fare approved in your app',
    appModePriceRequired: 'Please enter a price first',
    pastePrice: 'Paste from clipboard',
    paste: 'Paste Fare',
    taxiModeNotice: 'Stick to the approved meter fare',
    riderPrefApp: 'Rider wants: Smart App',
    riderPrefTaxi: 'Rider wants: Taxi Meter',
    riderPrefFree: 'Rider wants: Free Price',
    riderPrefAll: 'Open to All Categories',
  },
} as const;
