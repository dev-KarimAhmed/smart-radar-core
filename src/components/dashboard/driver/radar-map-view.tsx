'use client';

import React from 'react';
import maplibregl, { type Map as MapLibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Clock, LocateFixed, MapPin, RadioTower, Route } from 'lucide-react';
import type { Trip } from '@/core/types';

const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
const RTL_TEXT_PLUGIN_URL = 'https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.3.0/dist/mapbox-gl-rtl-text.js';
const DEFAULT_CENTER = { lat: 30.0444, lng: 31.2357 };
let rtlPluginRequested = false;

function ensureRtlTextPlugin() {
  if (rtlPluginRequested || typeof window === 'undefined') return;
  rtlPluginRequested = true;

  try {
    const status = maplibregl.getRTLTextPluginStatus?.();
    if (status === 'loaded' || status === 'loading') return;
    maplibregl.setRTLTextPlugin(RTL_TEXT_PLUGIN_URL, true);
  } catch (error) {
    if (import.meta.env.DEV) console.warn('MapLibre RTL text plugin was not loaded:', error);
  }
}

interface RadarMapViewProps {
  language: 'ar' | 'en';
  isActive: boolean;
  driverLocation: { lat: number; lng: number } | null;
  currentH3Cell?: string;
  paidMinutes: number;
  bonusMinutes: number;
  radarLockMessage?: string;
  requests: Trip[];
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
  onSelectRequest,
  onIgnoreRequest,
}: RadarMapViewProps) {
  const copy = radarCopy[language];
  const mapContainerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<MapLibreMap | null>(null);
  const markerRef = React.useRef<maplibregl.Marker | null>(null);
  const requestMarkersRef = React.useRef<maplibregl.Marker[]>([]);
  const [isMapReady, setIsMapReady] = React.useState(false);
  const [mapIssue, setMapIssue] = React.useState(false);

  const visibleLocation = driverLocation || DEFAULT_CENTER;
  const totalMinutes = paidMinutes + bonusMinutes;

  React.useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    ensureRtlTextPlugin();

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: OPENFREEMAP_STYLE,
      center: [visibleLocation.lng, visibleLocation.lat],
      zoom: 13.4,
      attributionControl: false,
    });

    mapRef.current = map;
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    const resize = () => {
      map.resize();
      window.requestAnimationFrame(() => map.resize());
    };

    map.on('load', () => {
      setIsMapReady(true);
      resize();
    });
    map.on('error', () => setMapIssue(true));

    const resizeTimer = window.setTimeout(resize, 300);

    return () => {
      window.clearTimeout(resizeTimer);
      markerRef.current?.remove();
      requestMarkersRef.current.forEach((marker) => marker.remove());
      requestMarkersRef.current = [];
      map.remove();
      markerRef.current = null;
      mapRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    if (!mapRef.current) return;
    const lngLat: [number, number] = [visibleLocation.lng, visibleLocation.lat];

    if (!markerRef.current) {
      const markerElement = document.createElement('div');
      markerElement.className = 'h-5 w-5 rounded-full border-4 border-[#06111f] bg-[#14B8A6] shadow-[0_0_0_12px_rgba(20,184,166,0.2),0_0_34px_rgba(20,184,166,0.45)]';
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
    <section className="grid min-h-[calc(100vh-11rem)] gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
      <div className="relative min-h-[520px] overflow-hidden rounded-3xl border border-emerald-500/20 bg-[#05080f] text-white shadow-2xl shadow-black/30 lg:min-h-[calc(100vh-11rem)]">
        <div className="absolute inset-0 z-0 bg-[#0B0F19]" />
        <div className="absolute inset-0 z-[1] overflow-hidden bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.18),transparent_38%),linear-gradient(135deg,rgba(20,184,166,0.08)_0_25%,transparent_25%_50%,rgba(20,184,166,0.06)_50%_75%,transparent_75%)] bg-[length:auto,38px_38px]">
          <div className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-[#06111f] bg-[#14B8A6] shadow-[0_0_0_22px_rgba(20,184,166,0.12),0_0_60px_rgba(20,184,166,0.35)]" />
          {requests.slice(0, 6).map((request, index) => (
            <button
              key={request.id}
              type="button"
              onClick={() => onSelectRequest(request)}
              className="absolute h-9 w-9 rounded-full border-2 border-[#06111f] bg-[#f59e0b] text-[10px] font-black text-[#06111f] shadow-[0_0_0_10px_rgba(245,158,11,0.18),0_12px_30px_rgba(0,0,0,0.35)]"
              style={fallbackRequestPosition(index)}
            >
              R
            </button>
          ))}
        </div>
        <div className="absolute inset-0 z-[2]">
          <div ref={mapContainerRef} className="h-full w-full bg-transparent" />
        </div>
        <div className="pointer-events-none absolute inset-0 z-[3] bg-[radial-gradient(circle_at_center,transparent_44%,rgba(11,15,25,0.32)_100%)]" />

        <div className="absolute left-4 right-4 top-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/20 bg-[#0B0F19]/92 px-4 py-3 shadow-xl backdrop-blur">
          <div>
            <p className="text-xs font-black text-[#14B8A6]">{copy.title}</p>
            <p className="text-sm font-bold text-slate-200">{isActive ? copy.online : copy.offline}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-emerald-200">
              <Clock className="h-3.5 w-3.5" />
              {copy.remaining}: {formatMinutes(totalMinutes, language)}
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-950/80 px-3 py-1 text-slate-300">
              H3 R9: {shortH3(currentH3Cell)}
            </span>
          </div>
        </div>

        {(!isMapReady || mapIssue) && (
          <div className="absolute left-4 right-4 top-24 z-20 rounded-2xl border border-emerald-500/20 bg-[#0B0F19]/92 p-4 text-sm font-bold text-slate-200 shadow-2xl backdrop-blur md:left-auto md:max-w-md">
            <p className="text-[#14B8A6]">{mapIssue ? copy.mapIssue : copy.mapLoading}</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">{copy.mapHint}</p>
            <p className="mt-2 text-[11px] font-black text-emerald-200">{copy.radarFallback}</p>
          </div>
        )}

        <button
          type="button"
          onClick={recenter}
          className="absolute bottom-5 left-5 z-20 rounded-2xl border border-emerald-500/25 bg-[#0B0F19]/95 p-4 text-emerald-300 shadow-2xl transition hover:border-emerald-300"
          aria-label={copy.recenter}
        >
          <LocateFixed className="h-5 w-5" />
        </button>

        <div className="absolute bottom-5 right-5 z-20 rounded-2xl border border-white/10 bg-[#0B0F19]/90 px-4 py-3 text-xs font-bold text-slate-200 shadow-xl backdrop-blur">
          <span className="text-[#14F5D5]">{isMapReady && !mapIssue ? copy.mapReady : copy.mapLoading}</span>
          <span className="mx-2 text-slate-600">/</span>
          <span>MapLibre + OpenFreeMap</span>
        </div>
      </div>

      <aside className="flex min-h-[520px] flex-col rounded-3xl border border-emerald-500/20 bg-[#05080f] p-4 text-white shadow-2xl shadow-black/30 lg:min-h-[calc(100vh-11rem)]">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <p className="text-xs font-black text-[#14B8A6]">{copy.queueBadge}</p>
            <h2 className="mt-1 text-2xl font-black">{copy.sheetTitle}</h2>
            <p className="mt-1 text-xs leading-5 text-slate-400">{copy.sheetSubtitle}</p>
          </div>
          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-black text-emerald-300">{requests.length}</span>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto pr-1">
          {radarLockMessage ? (
            <StateCard tone="amber" icon={<RadioTower className="h-8 w-8" />} title={copy.radarLocked} body={radarLockMessage} />
          ) : requests.length === 0 ? (
            <StateCard tone="empty" icon={<RadioTower className="h-8 w-8" />} title={copy.noRequestsTitle} body={copy.empty} />
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <article key={request.id} className="rounded-2xl border border-slate-800 bg-black/60 p-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-1 h-5 w-5 shrink-0 text-emerald-300" />
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 font-black">{request.dropoff || copy.destination}</h3>
                      <p className="mt-1 font-mono text-xs text-slate-400">{shortH3(request.h3Index)}</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <Info label={copy.fare} value={request.offerPrice ? Number(request.offerPrice).toFixed(2) : '-'} />
                    <Info label={copy.distance} value={`${request.estimatedDistance || 0} km`} />
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button type="button" onClick={() => onSelectRequest(request)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#14B8A6] px-3 py-2 text-sm font-black text-[#06111f]">
                      <Route className="h-4 w-4" />
                      {copy.openBid}
                    </button>
                    <button type="button" onClick={() => onIgnoreRequest(request.id)} className="rounded-xl border border-white/10 px-3 py-2 text-sm font-bold text-slate-300">
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
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2">
      <p className="text-slate-500">{label}</p>
      <p className="mt-1 font-black text-white">{value}</p>
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
  const classes = tone === 'amber'
    ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
    : 'border-dashed border-slate-700 bg-slate-950/80 text-slate-300';

  return (
    <div className={`flex min-h-[280px] flex-col items-center justify-center rounded-2xl p-6 text-center ${classes}`}>
      <div className={tone === 'amber' ? 'text-amber-300' : 'text-emerald-400/70'}>{icon}</div>
      <h3 className="mt-4 text-lg font-black text-white">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 opacity-85">{body}</p>
    </div>
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
    ignore: 'تجاهل',
  },
  en: {
    title: 'Captain radar',
    online: 'Online and receiving requests',
    offline: 'Offline',
    remaining: 'Remaining',
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
    ignore: 'Ignore',
  },
} as const;
