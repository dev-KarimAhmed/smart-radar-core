'use client';

import React, { Suspense, useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Car, ExternalLink, Lock, MapPin, Phone, RefreshCw, ShieldAlert, ShieldCheck, User } from 'lucide-react';
import { useMaplibreInstance } from '@/shared/hooks/use-maplibre-instance';
import maplibregl from 'maplibre-gl';
import { getSafeLandingPageUrl } from '@/shared/services/supabase-auth-headers';

const DEFAULT_AMMAN_CENTER = { lat: 31.9539, lng: 35.9106 };

const styles = {
  root: 'min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans select-none',
  header: 'sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-[#0F172A]/90 px-4 py-3 backdrop-blur-xl sm:px-6',
  headerBrand: 'flex items-center gap-3',
  headerLink: 'inline-flex items-center cursor-pointer hover:opacity-90 transition-opacity',
  headerLogo: 'h-8 sm:h-9 w-auto object-contain drop-shadow-[0_0_12px_rgba(20,184,166,0.35)]',
  livePill: 'flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-black text-[#14F5D5] shadow-[0_0_15px_rgba(20,184,166,0.25)]',
  liveDot: 'h-2 w-2 rounded-full bg-[#14F5D5] animate-ping',
  endedPill: 'flex items-center gap-2 rounded-full border border-slate-500/40 bg-slate-500/10 px-3 py-1 text-xs font-black text-slate-300',
  bannerAlert: 'flex items-center justify-between gap-3 border-b border-amber-500/30 bg-amber-950/30 px-4 py-2.5 text-xs font-bold text-amber-200 sm:px-6',
  bannerIconText: 'flex items-center gap-2',
  bannerId: 'text-[11px] text-amber-300 font-mono',
  mainGrid: 'flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 relative',
  mapContainer: 'lg:col-span-7 xl:col-span-8 h-[45vh] lg:h-[calc(100vh-105px)] w-full relative bg-[#070b14]',
  sidebar: 'lg:col-span-5 xl:col-span-4 p-4 sm:p-6 flex flex-col justify-between gap-4 overflow-y-auto bg-[#0E1526]/80 backdrop-blur-md border-t lg:border-t-0 lg:border-r border-white/5',
  sidebarTop: 'space-y-4',
  card: 'rounded-2xl border border-white/10 bg-[#161F30]/80 p-4 shadow-xl backdrop-blur-md space-y-3.5',
  cardHeader: 'flex items-center justify-between border-b border-white/5 pb-2.5',
  cardTitle: 'text-sm font-black text-slate-200 flex items-center gap-2',
  cardBadge: 'text-[11px] font-bold rounded-lg px-2 py-0.5 bg-[#14B8A6]/10 text-[#14F5D5] border border-[#14B8A6]/20',
  infoRow: 'flex items-center justify-between text-xs gap-2',
  infoLabel: 'text-slate-400 font-medium flex items-center gap-1.5 shrink-0',
  infoValue: 'text-slate-100 font-bold text-end',
  plateValue: 'font-mono font-black text-[#14F5D5] bg-[#14B8A6]/10 px-2 py-0.5 rounded border border-[#14B8A6]/20',
  lastUpdateValue: 'text-[11px] text-slate-400 font-mono',
  actionGrid: 'grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2',
  mapsBtn: 'flex h-12 items-center justify-center gap-2 rounded-xl border border-[#14B8A6]/40 bg-[#14B8A6]/10 font-black text-sm text-[#14F5D5] hover:bg-[#14B8A6]/20 active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-[#14B8A6]/10',
  callCaptainBtn: 'flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 font-black text-sm text-slate-100 hover:bg-white/10 active:scale-[0.98] transition-all cursor-pointer',
  footerNote: 'text-center text-[11px] text-slate-500 font-medium pt-2',
  loadingRoot: 'h-screen w-screen flex flex-col items-center justify-center bg-[#0B0F19] text-slate-300 gap-3',
  loadingSpinner: 'h-8 w-8 animate-spin rounded-full border-2 border-[#14B8A6]/20 border-t-[#14B8A6]',
  loadingText: 'text-xs font-bold animate-pulse',
  endedRoot: 'flex-1 flex items-center justify-center p-4 sm:p-6',
  endedCard: 'max-w-md w-full rounded-3xl border border-white/10 bg-[#161F30]/90 p-6 sm:p-8 text-center space-y-4 shadow-2xl',
  endedIconBox: 'mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 text-[#14F5D5]',
  endedIcon: 'h-7 w-7',
  endedTitle: 'text-lg font-black text-white',
  endedDesc: 'text-xs sm:text-sm text-slate-300 leading-relaxed',
  endedHomeBtn: 'inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#14B8A6] px-5 text-sm font-black text-[#04140F] hover:bg-[#2DD4BF] transition-all',
  iconSm: 'h-3.5 w-3.5',
  iconMd: 'h-4 w-4',
  iconAmber: 'h-4 w-4 text-amber-400 shrink-0',
  iconPinAmber: 'h-3.5 w-3.5 text-amber-400',
  iconTeal: 'h-4 w-4 text-[#14B8A6]',
  iconEmerald: 'h-3.5 w-3.5 text-emerald-400',
  iconCallEmerald: 'h-4 w-4 text-emerald-400',
} as const;

type TrackErrorState = 'ended' | 'invalid' | 'missing' | null;

function TrackContent() {
  const searchParams = useSearchParams();
  const langParam = searchParams.get('lang') || 'ar';
  const isArabic = langParam !== 'en';
  const requestId = (searchParams.get('id') || searchParams.get('trip') || '').trim();
  const token = (searchParams.get('t') || searchParams.get('token') || '').trim();

  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [errorState, setErrorState] = useState<TrackErrorState>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [shortId, setShortId] = useState<string>(requestId ? requestId.slice(0, 8).toUpperCase() : 'LIVE');
  const [captainName, setCaptainName] = useState<string>(isArabic ? 'السائق' : 'Captain');
  const [plate, setPlate] = useState<string>('');
  const [vehicle, setVehicle] = useState<string>('');
  const [destination, setDestination] = useState<string>(isArabic ? 'وجهة الرحلة' : 'Trip Destination');
  const [captainPhone, setCaptainPhone] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<string>(isArabic ? 'الآن' : 'Just now');
  const [tripStatus, setTripStatus] = useState<string>(isArabic ? 'قيد المتابعة الحية' : 'Live Tracking Active');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const { mapRef, isMapReady } = useMaplibreInstance({
    containerRef: mapContainerRef,
    center: DEFAULT_AMMAN_CENTER,
    zoom: 15,
  });
  const markerRef = useRef<maplibregl.Marker | null>(null);

  const wipeSensitiveState = (nextState: Exclude<TrackErrorState, null>, statusLabel?: string) => {
    setErrorState(nextState);
    setCoords(null);
    setCaptainPhone('');
    setPlate('');
    setVehicle('');
    setCaptainName('');
    setDestination('');
    if (statusLabel) {
      setTripStatus(statusLabel);
    }
    markerRef.current?.remove();
    markerRef.current = null;
  };

  // Sync animated vehicle marker only when server-verified location is active
  useEffect(() => {
    if (!isMapReady || !mapRef.current || !coords || errorState) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    const map = mapRef.current;

    if (!markerRef.current) {
      const el = document.createElement('div');
      el.className = 'relative flex items-center justify-center';
      el.style.transition = 'transform 1s ease-out';
      el.innerHTML = `
        <div style="position: absolute; width: 52px; height: 52px; border-radius: 50%; background: rgba(20,184,166,0.25); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: absolute; width: 38px; height: 38px; border-radius: 50%; background: rgba(20,184,166,0.35);"></div>
        <div style="position: relative; width: 34px; height: 34px; border-radius: 50%; background: #0A0F1D; border: 2.5px solid #14F5D5; box-shadow: 0 0 16px rgba(20,245,213,0.6); display: flex; align-items: center; justify-content: center; font-size: 16px;">🚗</div>
      `;

      markerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([coords.lng, coords.lat])
        .addTo(map);
      map.easeTo({ center: [coords.lng, coords.lat], duration: 800 });
    } else {
      markerRef.current.setLngLat([coords.lng, coords.lat]);
      map.easeTo({ center: [coords.lng, coords.lat], duration: 1200 });
    }
  }, [isMapReady, mapRef, coords, errorState]);

  useEffect(() => {
    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
    };
  }, []);

  // Poll HMAC-verified live tracking API and halt immediately on trip completion/expiry
  useEffect(() => {
    if (!requestId || !token) {
      wipeSensitiveState('missing');
      setIsInitialLoading(false);
      return;
    }

    let active = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    const pollTracking = async () => {
      try {
        const res = await fetch(
          `/api/trip/track?id=${encodeURIComponent(requestId)}&t=${encodeURIComponent(token)}`,
          { method: 'GET', cache: 'no-store' },
        );

        if (!active) return;

        if (res.status === 400 || res.status === 401 || res.status === 403 || res.status === 404) {
          wipeSensitiveState('invalid');
          if (timer) {
            clearInterval(timer);
            timer = null;
          }
          setIsInitialLoading(false);
          return;
        }

        const data = await res.json().catch(() => null);
        if (!active || !data?.success) {
          setIsInitialLoading(false);
          return;
        }

        if (data.shortId) {
          setShortId(String(data.shortId));
        }

        // Service 11 Compliance: Halt tracking & clear location/PII immediately when closed
        if (data.tripEnded === true || data.active === false) {
          wipeSensitiveState('ended', String(data.status || 'COMPLETED'));
          if (timer) {
            clearInterval(timer);
            timer = null;
          }
          setIsInitialLoading(false);
          return;
        }

        setErrorState(null);
        if (data.status) {
          setTripStatus(String(data.status).toUpperCase());
        }
        if (data.destination) {
          setDestination(String(data.destination));
        }
        if (data.captain) {
          setCaptainName(String(data.captain.name || (isArabic ? 'السائق' : 'Captain')));
          setCaptainPhone(data.captain.phone ? String(data.captain.phone) : '');
          setPlate(data.captain.plate ? String(data.captain.plate) : '');
          setVehicle(data.captain.vehicle ? String(data.captain.vehicle) : '');
        }
        if (data.location && Number.isFinite(Number(data.location.lat)) && Number.isFinite(Number(data.location.lng))) {
          setCoords({ lat: Number(data.location.lat), lng: Number(data.location.lng) });
        }

        const parsedDate = data.updatedAt ? new Date(String(data.updatedAt)) : new Date();
        setLastUpdated(
          (Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate).toLocaleTimeString(
            isArabic ? 'ar-JO' : 'en-US',
            { hour: '2-digit', minute: '2-digit', second: '2-digit' },
          ),
        );
        setIsInitialLoading(false);
      } catch {
        if (active) {
          setIsInitialLoading(false);
        }
      }
    };

    void pollTracking();
    timer = setInterval(() => {
      void pollTracking();
    }, 3500);

    return () => {
      active = false;
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [requestId, token, isArabic]);

  if (isInitialLoading) {
    return (
      <div className={styles.loadingRoot}>
        <div className={styles.loadingSpinner} />
        <p className={styles.loadingText}>
          {isArabic ? 'جاري التحقق من رابط التتبع المباشر...' : 'Verifying secure live tracking link...'}
        </p>
      </div>
    );
  }

  if (errorState) {
    const isEnded = errorState === 'ended';
    return (
      <div className={styles.root} dir={isArabic ? 'rtl' : 'ltr'}>
        <header className={styles.header}>
          <div className={styles.headerBrand}>
            <a href={getSafeLandingPageUrl()} className={styles.headerLink}>
              <Image src="/icons/logo-header.png" alt="Radar" width={585} height={152} priority className={styles.headerLogo} />
            </a>
          </div>
          <div className={styles.endedPill}>
            <Lock className={styles.iconSm} />
            <span>{isEnded ? (isArabic ? 'تتبع منتهٍ' : 'Tracking Ended') : (isArabic ? 'رابط غير صالح' : 'Invalid Link')}</span>
          </div>
        </header>

        <main className={styles.endedRoot}>
          <div className={styles.endedCard}>
            <div className={styles.endedIconBox}>
              {isEnded ? <ShieldCheck className={styles.endedIcon} /> : <ShieldAlert className={styles.endedIcon} />}
            </div>
            <h1 className={styles.endedTitle}>
              {isEnded
                ? (isArabic ? 'انتهت الرحلة وأُغلق التتبع المباشر' : 'Trip Ended — Live Tracking Closed')
                : (isArabic ? 'رابط التتبع غير صالح أو منتهي الصلاحية' : 'Invalid or Expired Tracking Link')}
            </h1>
            <p className={styles.endedDesc}>
              {isEnded
                ? (isArabic
                    ? 'تم إيقاف مشاركة الموقع الجغرافي وإزالة بيانات السائق فوراً مع إغلاق الرحلة التزاماً بمعيار الخصوصية (الخدمة 11).'
                    : 'Live GPS sharing and captain details were permanently stopped upon trip completion in compliance with Service 11 privacy rules.')
                : (isArabic
                    ? 'يتطلب هذا المسار رابط تتبع موثقاً ومفعّلاً من الراكب أثناء رحلة نشطة.'
                    : 'A valid HMAC-signed tracking link generated during an active trip is required to view live location.')}
            </p>
            <a href={getSafeLandingPageUrl()} className={styles.endedHomeBtn}>
              <span>{isArabic ? 'العودة إلى منصة بينكم' : 'Return to Bynkcom'}</span>
            </a>
          </div>
        </main>
      </div>
    );
  }

  const mapsUrl = coords ? `https://maps.google.com/?q=${coords.lat},${coords.lng}` : null;
  const safeDialPhone = captainPhone ? captainPhone.replace(/[^+\d]/g, '') : '';

  return (
    <div className={styles.root} dir={isArabic ? 'rtl' : 'ltr'}>
      <header className={styles.header}>
        <div className={styles.headerBrand}>
          <a href={getSafeLandingPageUrl()} className={styles.headerLink}>
            <Image src="/icons/logo-header.png" alt="Radar" width={585} height={152} priority className={styles.headerLogo} />
          </a>
        </div>
        <div className={styles.livePill}>
          <span className={styles.liveDot} />
          <span>{isArabic ? 'تتبع مباشر للرحلة' : 'Live Trip Tracking'}</span>
        </div>
      </header>

      <div className={styles.bannerAlert}>
        <div className={styles.bannerIconText}>
          <ShieldAlert className={styles.iconAmber} />
          <span>{isArabic ? 'مشاركة مسار الرحلة الحية - يتحدث موقع المركبة على الخريطة بشكل فوري' : 'Live trip tracking share - Vehicle location updates in real-time'}</span>
        </div>
        <span className={styles.bannerId}>#{shortId}</span>
      </div>

      <main className={styles.mainGrid}>
        <div ref={mapContainerRef} className={styles.mapContainer} />

        <aside className={styles.sidebar}>
          <div className={styles.sidebarTop}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>
                  <Car className={styles.iconTeal} />
                  <span>{isArabic ? 'بيانات الرحلة والمركبة' : 'Trip & Vehicle Details'}</span>
                </h2>
                <span className={styles.cardBadge}>{tripStatus}</span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}><User className={styles.iconSm} /> {isArabic ? 'الكابتن' : 'Captain'}</span>
                <span className={styles.infoValue}>{captainName}</span>
              </div>

              {vehicle && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}><Car className={styles.iconSm} /> {isArabic ? 'نوع المركبة' : 'Vehicle'}</span>
                  <span className={styles.infoValue}>{vehicle}</span>
                </div>
              )}

              {plate && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>{isArabic ? '🏷️ رقم اللوحة' : '🏷️ Plate Number'}</span>
                  <span className={styles.plateValue}>{plate}</span>
                </div>
              )}

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}><MapPin className={styles.iconPinAmber} /> {isArabic ? 'الوجهة' : 'Destination'}</span>
                <span className={styles.infoValue}>{destination}</span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}><RefreshCw className={styles.iconEmerald} /> {isArabic ? 'آخر تحديث' : 'Last Update'}</span>
                <span className={styles.lastUpdateValue}>{lastUpdated}</span>
              </div>
            </div>

            <div className={styles.actionGrid}>
              {mapsUrl && (
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={styles.mapsBtn}>
                  <ExternalLink className={styles.iconMd} />
                  <span>{isArabic ? 'فتح في خرائط Google' : 'Open in Google Maps'}</span>
                </a>
              )}

              {safeDialPhone ? (
                <a href={`tel:${safeDialPhone}`} className={styles.callCaptainBtn}>
                  <Phone className={styles.iconCallEmerald} />
                  <span>{isArabic ? 'اتصال بالسائق' : 'Call Captain'}</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.clipboard) void navigator.clipboard.writeText(window.location.href);
                  }}
                  className={styles.callCaptainBtn}
                >
                  <span>{isArabic ? 'نسخ رابط التتبع' : 'Copy Tracking Link'}</span>
                </button>
              )}
            </div>
          </div>

          <p className={styles.footerNote}>
            {isArabic ? 'نظام رادار بينكم (bynkcom) الملاحي السيادي · جميع الحقوق محفوظة' : 'Bynkcom Sovereign Navigation Radar System · All Rights Reserved'}
          </p>
        </aside>
      </main>
    </div>
  );
}

function TrackFallback() {
  const isArabic = typeof document !== 'undefined' ? document.documentElement.lang !== 'en' : true;
  return (
    <div className={styles.loadingRoot}>
      <div className={styles.loadingSpinner} />
      <p className={styles.loadingText}>
        {isArabic ? 'جاري تحميل خريطة التتبع المباشر...' : 'Loading live tracking map...'}
      </p>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<TrackFallback />}>
      <TrackContent />
    </Suspense>
  );
}
