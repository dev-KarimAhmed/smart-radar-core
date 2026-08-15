'use client';

import React from 'react';
import maplibregl from 'maplibre-gl';
import { Clock, ExternalLink, MapPin, RadioTower, Route } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Trip } from '@/core/types';
import { DEFAULT_MAP_CENTER } from '@/shared/services/maplibre-runtime';
import { useMaplibreInstance } from '@/shared/hooks/use-maplibre-instance';
import { RecenterMapButton } from '@/shared/components/map/recenter-map-button';

import { cn } from '@/lib/utils';
const styles = {
  style144_1: "grid min-h-[calc(100vh-11rem)] gap-4 lg:grid-cols-[minmax(0,1fr)_420px]",
  style145_2: "relative min-h-[520px] overflow-hidden rounded-3xl border border-emerald-500/20 bg-[#05080f] text-white shadow-2xl shadow-black/30 lg:min-h-[calc(100vh-11rem)]",
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
  style201_22: "flex max-h-[560px] flex-col rounded-3xl border border-emerald-500/20 bg-[#05080f] p-4 text-white shadow-2xl shadow-black/30 lg:max-h-[calc(100vh-11rem)]",
  style202_23: "flex items-center justify-between gap-3 border-b border-white/10 pb-4",
  style204_24: "text-xs font-black text-[#14B8A6]",
  style205_25: "mt-1 text-2xl font-black",
  style206_26: "mt-1 text-xs leading-5 text-slate-400",
  style208_27: "rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-black text-emerald-300",
  style211_28: "mt-4 flex-1 overflow-y-auto pr-1",
  style213_29: "h-8 w-8",
  style215_30: "h-8 w-8",
  style217_31: "space-y-3",
  style219_32: "rounded-2xl border border-slate-800 bg-black/60 p-4",
  style220_33: "flex items-start gap-3",
  style221_34: "mt-1 h-5 w-5 shrink-0 text-emerald-300",
  style222_35: "min-w-0",
  style223_36: "line-clamp-2 font-black",
  style224_37: "mt-1 font-mono text-xs text-slate-400",
  style227_38: "mt-3 grid grid-cols-2 gap-2 text-xs",
  style231_39: "mt-4 flex gap-2",
  style232_40: "inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#14B8A6] px-3 py-2 text-sm font-black text-[#06111f]",
  style233_41: "h-4 w-4",
  style236_42: "rounded-xl border border-white/10 px-3 py-2 text-sm font-bold text-slate-300",
  style252_43: "rounded-xl border border-white/10 bg-white/[0.03] p-2",
  style253_44: "text-slate-500",
  style254_45: "mt-1 font-black text-white",
  style275_46: "flex min-h-[280px] flex-col items-center justify-center rounded-2xl p-6 text-center",
  style276_47: "text-amber-300",
  style276_48: "text-emerald-400/70",
  style277_49: "mt-4 text-lg font-black text-white",
  style278_50: "mt-2 max-w-sm text-sm leading-6 opacity-85",
  stateAmber: "border-amber-500/30 bg-amber-500/10 text-amber-100",
  stateEmpty: "border-dashed border-slate-700 bg-slate-950/80 text-slate-300",
  pendingOfferHint: "mt-2 text-[11px] font-bold text-amber-300",
  pendingOfferDisabled: "cursor-not-allowed opacity-40",
} as const;


interface RadarMapViewProps {
  language: 'ar' | 'en';
  isActive: boolean;
  driverLocation: { lat: number; lng: number } | null;
  currentH3Cell?: string;
  paidMinutes: number;
  bonusMinutes: number;
  radarLockMessage?: string;
  requests: Trip[];
  hasPendingOffer?: boolean;
  onSelectRequest: (request: Trip) => void;
  onIgnoreRequest: (requestId: string) => void;
}

export function RadarMapView({
  language,
  isActive,
  driverLocation,
  currentH3Cell,
  paidMinutes,
  bonusMinutes,
  radarLockMessage,
  requests,
  hasPendingOffer = false,
  onSelectRequest,
  onIgnoreRequest,
}: RadarMapViewProps) {
  const copy = radarCopy[language];
  const t = useTranslations('captainPickup');
  const mapContainerRef = React.useRef<HTMLDivElement | null>(null);
  const markerRef = React.useRef<maplibregl.Marker | null>(null);
  const requestMarkersRef = React.useRef<maplibregl.Marker[]>([]);
  const [mapIssue, setMapIssue] = React.useState(false);

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
          {requests.slice(0, 6).map((request, index) => (
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
              {requests.map((request) => (
                <article key={request.id} className={styles.style219_32}>
                  <div className={styles.style220_33}>
                    <MapPin className={styles.style221_34} />
                    <div className={styles.style222_35}>
                      <h3 className={styles.style223_36}>{request.dropoff || copy.destination}</h3>
                      <p className={styles.style224_37}>{shortH3(request.h3Index)}</p>
                    </div>
                  </div>
                  <div className="mt-3 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.06] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-black uppercase tracking-wide text-cyan-200">
                          {t('pickupLocation')}
                        </p>
                        <p className="mt-1 truncate text-sm font-bold text-white">
                          {request.pickupLabel || t('pickupLocation')}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-400">
                          {request.pickupLocationIsApproximate ? t('pickupApproximate') : t('pickupExact')}
                        </p>
                      </div>
                      {request.pickupGoogleMapsUrl ? (
                        <a
                          href={request.pickupGoogleMapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-cyan-400/25 px-2.5 py-2 text-xs font-black text-cyan-200 transition hover:border-cyan-300 hover:text-white"
                        >
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                          {t('openPickupMap')}
                        </a>
                      ) : null}
                    </div>
                  </div>
                  <div className={styles.style227_38}>
                    <Info label={copy.fare} value={request.offerPrice ? Number(request.offerPrice).toFixed(2) : '-'} />
                    <Info
                      label={copy.distance}
                      value={request.estimatedDistance != null ? `${request.estimatedDistance} km` : t('distanceUnavailable')}
                    />
                  </div>
                  {hasPendingOffer ? <p className={styles.pendingOfferHint}>{copy.pendingOfferHint}</p> : null}
                  <div className={styles.style231_39}>
                    <button
                      type="button"
                      onClick={() => onSelectRequest(request)}
                      disabled={hasPendingOffer}
                      title={hasPendingOffer ? copy.pendingOfferHint : undefined}
                      className={cn(styles.style232_40, hasPendingOffer ? styles.pendingOfferDisabled : '')}
                    >
                      <Route className={styles.style233_41} />
                      {copy.openBid}
                    </button>
                    <button type="button" onClick={() => onIgnoreRequest(request.id)} className={styles.style236_42}>
                      {copy.ignore}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </aside>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.style252_43}>
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

function shortH3(value?: string) {
  return value ? value.slice(-8).toUpperCase() : '-';
}

function fallbackRequestPosition(index: number): React.CSSProperties {
  const positions: Array<React.CSSProperties> = [
    { left: '58%', top: '42%' },
    { left: '43%', top: '55%' },
    { left: '66%', top: '58%' },
    { left: '35%', top: '38%' },
    { left: '52%', top: '68%' },
    { left: '72%', top: '35%' },
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
    distance: 'المسافة',
    openBid: 'تقديم عرض',
    pendingOfferHint: 'لديك عرض قيد الانتظار، انتظر رد الراكب أولاً.',
    ignore: 'تجاهل',
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
    distance: 'Distance',
    openBid: 'Submit bid',
    pendingOfferHint: 'You have a pending offer — wait for the rider to respond first.',
    ignore: 'Ignore',
  },
} as const;
