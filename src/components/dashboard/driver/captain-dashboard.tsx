'use client';

import React from 'react';
import maplibregl, { type Map as MapLibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Activity, Clock, LocateFixed, MapPin, RadioTower, ShieldCheck, Wallet, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useDriverOperations } from '@/hooks/use-driver-operations';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';

interface CaptainDashboardProps {
  captainProfile?: {
    id: string;
    rank: 'PLATINUM' | 'GOLD' | 'BRONZE' | 'SILVER';
    walletHours: number;
    bonusHours: number;
    rating: number;
    weeklyComments: string[];
  };
}

const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

export const RadarCaptainDashboard: React.FC<CaptainDashboardProps> = ({ captainProfile }) => {
  const { user } = useAuth();
  const { language } = useDashboardLanguage();
  const copy = captainCopy[language];
  const driverOps = useDriverOperations();
  const driverLocation = driverOps?.driverLocation || null;
  const isActive = driverOps?.driverStatus === 'active';
  const currentH3Cell = driverOps?.currentH3Cell || '-';
  const requests = driverOps?.requests || [];
  const rating = captainProfile?.rating ?? user?.rating ?? 5;
  const paidMinutes = captainProfile?.walletHours ?? user?.paidHoursRemaining ?? 0;
  const bonusMinutes = captainProfile?.bonusHours ?? user?.bonusHoursRemaining ?? 0;

  return (
    <section className="w-full rounded-2xl border border-emerald-500/20 bg-[#05080f] p-4 text-white shadow-[0_20px_80px_rgba(0,0,0,0.35)]" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-black text-[#14B8A6]">
            <ShieldCheck className="h-4 w-4" />
            {copy.badge}
          </div>
          <h2 className="text-2xl font-black tracking-tight">{copy.title}</h2>
          <p className="max-w-2xl text-sm leading-6 text-slate-400">{copy.subtitle}</p>
        </div>

        <button
          type="button"
          onClick={() => driverOps?.toggleDriverStatus(isActive ? 'idle' : 'active')}
          className={`rounded-xl border px-5 py-3 text-sm font-black transition ${
            isActive
              ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
              : 'border-slate-600 bg-slate-900 text-slate-200 hover:border-emerald-400/40'
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <Activity className={`h-4 w-4 ${isActive ? 'animate-pulse' : ''}`} />
            {isActive ? copy.active : copy.idle}
          </span>
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <MetricCard icon={<RadioTower className="h-5 w-5" />} label={copy.h3Cell} value={shortH3(currentH3Cell)} />
        <MetricCard icon={<MapPin className="h-5 w-5" />} label={copy.location} value={formatLocation(driverLocation, copy.noLocation)} />
        <MetricCard icon={<Clock className="h-5 w-5" />} label={copy.timeBundle} value={`${Math.floor(paidMinutes / 60)}h ${paidMinutes % 60}m`} />
        <MetricCard icon={<Zap className="h-5 w-5" />} label={copy.rating} value={`${Number(rating).toFixed(1)} / 5`} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <CaptainMap location={driverLocation} h3Cell={currentH3Cell} language={language} />

        <div className="rounded-2xl border border-emerald-500/15 bg-black/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black">{copy.radarTitle}</h3>
              <p className="text-xs text-slate-400">{copy.radarSubtitle}</p>
            </div>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-300">
              {requests.length}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {requests.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-5 text-center text-sm text-slate-400">
                {copy.emptyRequests}
              </div>
            ) : (
              requests.slice(0, 4).map((request) => (
                <div key={request.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-white">{request.dropoff || copy.destination}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {request.h3Index ? `${copy.requestCell}: ${shortH3(request.h3Index)}` : copy.nearbyRequest}
                      </p>
                    </div>
                    {request.offerPrice ? (
                      <span className="rounded-lg bg-emerald-500/10 px-2 py-1 text-xs font-black text-emerald-300">
                        {Number(request.offerPrice).toFixed(2)}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-emerald-500/15 bg-emerald-950/10 p-4">
          <div className="flex items-center gap-2 text-sm font-black text-emerald-300">
            <Wallet className="h-4 w-4" />
            {copy.walletTitle}
          </div>
          <p className="mt-2 text-sm text-slate-400">{copy.walletBody}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/15 bg-emerald-950/10 p-4">
          <div className="flex items-center gap-2 text-sm font-black text-emerald-300">
            <ShieldCheck className="h-4 w-4" />
            {copy.safetyTitle}
          </div>
          <p className="mt-2 text-sm text-slate-400">{copy.safetyBody}</p>
        </div>
      </div>
    </section>
  );
};

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-emerald-500/15 bg-black/35 p-4">
      <div className="flex items-center gap-2 text-[#14B8A6]">{icon}<span className="text-xs font-bold">{label}</span></div>
      <p className="mt-3 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function CaptainMap({ location, h3Cell, language }: { location: { lat: number; lng: number } | null; h3Cell: string; language: 'ar' | 'en' }) {
  const mapContainerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<MapLibreMap | null>(null);
  const markerRef = React.useRef<maplibregl.Marker | null>(null);
  const copy = captainCopy[language];

  React.useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: mapContainerRef.current,
      style: OPENFREEMAP_STYLE,
      center: [location?.lng ?? 35.91, location?.lat ?? 31.95],
      zoom: 13,
      attributionControl: false,
    });

    mapRef.current.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    return () => {
      markerRef.current?.remove();
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    if (!mapRef.current || !location) return;

    const lngLat: [number, number] = [location.lng, location.lat];
    mapRef.current.easeTo({ center: lngLat, zoom: 15, duration: 700 });

    if (!markerRef.current) {
      const markerElement = document.createElement('div');
      markerElement.className = 'h-5 w-5 rounded-full border-4 border-[#06111f] bg-[#14B8A6] shadow-[0_0_0_10px_rgba(20,184,166,0.18),0_0_30px_rgba(20,184,166,0.45)]';
      markerRef.current = new maplibregl.Marker({ element: markerElement }).setLngLat(lngLat).addTo(mapRef.current);
    } else {
      markerRef.current.setLngLat(lngLat);
    }
  }, [location]);

  const recenter = React.useCallback(() => {
    if (!mapRef.current || !location) return;
    mapRef.current.easeTo({ center: [location.lng, location.lat], zoom: 15, duration: 700 });
  }, [location]);

  return (
    <div className="relative min-h-[320px] overflow-hidden rounded-2xl border border-emerald-500/20 bg-slate-950">
      <div ref={mapContainerRef} className="absolute inset-0" />
      <div className="absolute left-4 top-4 rounded-xl bg-[#0B0F19]/90 px-3 py-2 text-xs font-black text-emerald-300 shadow-xl">
        {copy.mapLabel}
        <div className="mt-1 font-mono text-[10px] text-slate-300">H3 R9: {shortH3(h3Cell)}</div>
      </div>
      <button
        type="button"
        onClick={recenter}
        className="absolute bottom-4 left-4 rounded-xl border border-emerald-500/25 bg-[#0B0F19]/95 p-3 text-emerald-300 shadow-xl transition hover:border-emerald-300"
        aria-label={copy.recenter}
      >
        <LocateFixed className="h-5 w-5" />
      </button>
    </div>
  );
}

function shortH3(value: string) {
  return value && value !== '-' ? value.slice(-8).toUpperCase() : '-';
}

function formatLocation(location: { lat: number; lng: number } | null, fallback: string) {
  if (!location) return fallback;
  return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
}

const captainCopy = {
  ar: {
    badge: 'لوحة الكابتن',
    title: 'إدارة الطلبات والموقع',
    subtitle: 'فعّل استقبال الطلبات ليتم إرسال موقعك كل 15 ثانية عبر H3، وتظهر لك طلبات الركاب القريبة من خلية موقعك فقط.',
    active: 'متاح الآن',
    idle: 'غير متاح',
    h3Cell: 'خلية H3 الحالية',
    location: 'موقعك الحالي',
    noLocation: 'جار تحديد الموقع',
    timeBundle: 'رصيد الوقت',
    rating: 'تقييم الحساب',
    radarTitle: 'طلبات قريبة',
    radarSubtitle: 'طلبات محفوظة في قاعدة البيانات وتطابق نطاقك الحالي.',
    emptyRequests: 'لا توجد طلبات قريبة حالياً. ابق متاحاً وسيتم عرض الطلبات فور وصولها.',
    destination: 'وجهة الراكب',
    requestCell: 'خلية الطلب',
    nearbyRequest: 'طلب قريب',
    walletTitle: 'رصيد الوقت والمدفوعات',
    walletBody: 'تظهر الأرصدة والعمليات من جداول المحفظة فقط. لا يتم تعديل الرصيد من الواجهة.',
    safetyTitle: 'حماية الحالة',
    safetyBody: 'قبول العروض وإنهاء الرحلات يتم عبر إجراءات الخادم لضمان عدم حدوث تعارض بين أكثر من كابتن.',
    mapLabel: 'موقع الكابتن',
    recenter: 'العودة إلى موقعي',
  },
  en: {
    badge: 'Captain dashboard',
    title: 'Requests and location control',
    subtitle: 'Go online to pulse your location every 15 seconds through H3 and receive only nearby rider requests around your current cell.',
    active: 'Online',
    idle: 'Offline',
    h3Cell: 'Current H3 cell',
    location: 'Current location',
    noLocation: 'Locating',
    timeBundle: 'Time balance',
    rating: 'Account rating',
    radarTitle: 'Nearby requests',
    radarSubtitle: 'Database-backed requests matching your current area.',
    emptyRequests: 'No nearby requests right now. Stay online and new requests will appear here.',
    destination: 'Rider destination',
    requestCell: 'Request cell',
    nearbyRequest: 'Nearby request',
    walletTitle: 'Time balance and payments',
    walletBody: 'Balances and transactions are read from wallet tables only. The UI does not mutate balance counters.',
    safetyTitle: 'State protection',
    safetyBody: 'Offer acceptance and trip completion run through server procedures to prevent double assignment.',
    mapLabel: 'Captain location',
    recenter: 'Recenter on my location',
  },
} as const;
