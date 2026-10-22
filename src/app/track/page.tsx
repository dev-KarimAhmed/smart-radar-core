'use client';

import React, { Suspense, useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Car, ExternalLink, MapPin, Phone, RefreshCw, ShieldAlert, User } from 'lucide-react';
import { useMaplibreInstance } from '@/shared/hooks/use-maplibre-instance';
import maplibregl from 'maplibre-gl';
import { supabase } from '@/lib/supabase-client';

const styles = {
  root: 'min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans select-none',
  header: 'sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-[#0F172A]/90 px-4 py-3 backdrop-blur-xl sm:px-6',
  headerBrand: 'flex items-center gap-3',
  headerLogo: 'h-8 sm:h-9 w-auto object-contain drop-shadow-[0_0_12px_rgba(20,184,166,0.35)]',
  livePill: 'flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-black text-[#14F5D5] shadow-[0_0_15px_rgba(20,184,166,0.25)]',
  liveDot: 'h-2 w-2 rounded-full bg-[#14F5D5] animate-ping',
  bannerAlert: 'flex items-center justify-between gap-3 border-b border-amber-500/30 bg-amber-950/30 px-4 py-2.5 text-xs font-bold text-amber-200 sm:px-6',
  bannerIconText: 'flex items-center gap-2',
  mainGrid: 'flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 relative',
  mapContainer: 'lg:col-span-7 xl:col-span-8 h-[45vh] lg:h-[calc(100vh-105px)] w-full relative bg-[#070b14]',
  sidebar: 'lg:col-span-5 xl:col-span-4 p-4 sm:p-6 flex flex-col justify-between gap-4 overflow-y-auto bg-[#0E1526]/80 backdrop-blur-md border-t lg:border-t-0 lg:border-r border-white/5',
  card: 'rounded-2xl border border-white/10 bg-[#161F30]/80 p-4 shadow-xl backdrop-blur-md space-y-3.5',
  cardHeader: 'flex items-center justify-between border-b border-white/5 pb-2.5',
  cardTitle: 'text-sm font-black text-slate-200 flex items-center gap-2',
  cardBadge: 'text-[11px] font-bold rounded-lg px-2 py-0.5 bg-[#14B8A6]/10 text-[#14F5D5] border border-[#14B8A6]/20',
  infoRow: 'flex items-center justify-between text-xs',
  infoLabel: 'text-slate-400 font-medium flex items-center gap-1.5',
  infoValue: 'text-slate-100 font-bold',
  actionGrid: 'grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2',
  mapsBtn: 'flex h-12 items-center justify-center gap-2 rounded-xl border border-[#14B8A6]/40 bg-[#14B8A6]/10 font-black text-sm text-[#14F5D5] hover:bg-[#14B8A6]/20 active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-[#14B8A6]/10',
  callCaptainBtn: 'flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 font-black text-sm text-slate-100 hover:bg-white/10 active:scale-[0.98] transition-all cursor-pointer',
  footerNote: 'text-center text-[11px] text-slate-500 font-medium pt-2',
  loadingRoot: 'h-screen w-screen flex flex-col items-center justify-center bg-[#0B0F19] text-slate-300 gap-3',
  loadingSpinner: 'h-8 w-8 animate-spin rounded-full border-2 border-[#14B8A6]/20 border-t-[#14B8A6]',
} as const;

function TrackContent() {
  const searchParams = useSearchParams();
  const tripId = searchParams.get('trip') || 'LIVE';
  const captainName = searchParams.get('c') || 'السائق';
  const plate = searchParams.get('p') || '';
  const vehicle = searchParams.get('v') || '';
  const destination = searchParams.get('d') || 'وجهة الرحلة';
  const captainPhone = searchParams.get('ph') || '';
  const initialLat = parseFloat(searchParams.get('lat') || '31.9539');
  const initialLng = parseFloat(searchParams.get('lng') || '35.9106');

  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: initialLat, lng: initialLng });
  const [lastUpdated, setLastUpdated] = useState<string>('الآن');
  const [tripStatus, setTripStatus] = useState<string>('قيد المتابعة الحية');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const { mapRef, isMapReady } = useMaplibreInstance({
    containerRef: mapContainerRef,
    center: coords,
    zoom: 15,
  });
  const markerRef = useRef<maplibregl.Marker | null>(null);

  // Initialize animated vehicle marker
  useEffect(() => {
    if (!isMapReady || !mapRef.current) return;
    const map = mapRef.current;

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

    return () => {
      markerRef.current?.remove();
    };
  }, [isMapReady, mapRef, coords.lat, coords.lng]);

  // Listen to live trip GPS position updates and move the car smoothly
  useEffect(() => {
    if (!tripId || tripId === 'LIVE') return;

    let active = true;
    const checkLiveTrip = async () => {
      try {
        const { data } = await supabase
          .from('ride_requests')
          .select('status, driver_lat, driver_lng')
          .eq('id', tripId)
          .maybeSingle();

        if (active && data) {
          if (data.status) setTripStatus(String(data.status).toUpperCase());
          const rawLat = (data as any).driver_lat ?? (data as any).captain_lat;
          const rawLng = (data as any).driver_lng ?? (data as any).captain_lng;
          if (rawLat && rawLng) {
            const nextLat = Number(rawLat);
            const nextLng = Number(rawLng);
            if (!Number.isNaN(nextLat) && !Number.isNaN(nextLng)) {
              setCoords({ lat: nextLat, lng: nextLng });
              markerRef.current?.setLngLat([nextLng, nextLat]);
              mapRef.current?.easeTo({ center: [nextLng, nextLat], duration: 1200 });
            }
          }
          setLastUpdated(new Date().toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
      } catch {}
    };

    void checkLiveTrip();
    const interval = setInterval(checkLiveTrip, 3500);

    const channel = supabase
      .channel(`public:ride_requests:${tripId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'ride_requests', filter: `id=eq.${tripId}` },
        (payload) => {
          if (!active || !payload.new) return;
          const updated = payload.new as Record<string, unknown>;
          if (updated.status) setTripStatus(String(updated.status).toUpperCase());
          const rawLat = updated.driver_lat ?? updated.captain_lat;
          const rawLng = updated.driver_lng ?? updated.captain_lng;
          if (rawLat && rawLng) {
            const nextLat = Number(rawLat);
            const nextLng = Number(rawLng);
            if (!Number.isNaN(nextLat) && !Number.isNaN(nextLng)) {
              setCoords({ lat: nextLat, lng: nextLng });
              markerRef.current?.setLngLat([nextLng, nextLat]);
              mapRef.current?.easeTo({ center: [nextLng, nextLat], duration: 1200 });
            }
          }
          setLastUpdated(new Date().toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
      )
      .subscribe();

    return () => {
      active = false;
      clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, [tripId, mapRef]);

  const mapsUrl = `https://maps.google.com/?q=${coords.lat},${coords.lng}`;

  return (
    <div className={styles.root} dir="rtl">
      <header className={styles.header}>
        <div className={styles.headerBrand}>
          <Image src="/icons/logo-header.png" alt="Radar" width={585} height={152} priority className={styles.headerLogo} />
        </div>
        <div className={styles.livePill}>
          <span className={styles.liveDot} />
          <span>تتبع مباشر للرحلة</span>
        </div>
      </header>

      <div className={styles.bannerAlert}>
        <div className={styles.bannerIconText}>
          <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
          <span>مشاركة مسار الرحلة الحية - يتحدث موقع المركبة على الخريطة بشكل فوري</span>
        </div>
        <span className="text-[11px] text-amber-300 font-mono">#{tripId.slice(0, 8)}</span>
      </div>

      <main className={styles.mainGrid}>
        <div ref={mapContainerRef} className={styles.mapContainer} />

        <aside className={styles.sidebar}>
          <div className="space-y-4">
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>
                  <Car className="h-4 w-4 text-[#14B8A6]" />
                  <span>بيانات الرحلة والمركبة</span>
                </h2>
                <span className={styles.cardBadge}>{tripStatus}</span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}><User className="h-3.5 w-3.5" /> الكابتن</span>
                <span className={styles.infoValue}>{captainName}</span>
              </div>

              {vehicle && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}><Car className="h-3.5 w-3.5" /> نوع المركبة</span>
                  <span className={styles.infoValue}>{vehicle}</span>
                </div>
              )}

              {plate && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>🏷️ رقم اللوحة</span>
                  <span className="font-mono font-black text-[#14F5D5] bg-[#14B8A6]/10 px-2 py-0.5 rounded border border-[#14B8A6]/20">{plate}</span>
                </div>
              )}

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}><MapPin className="h-3.5 w-3.5 text-amber-400" /> الوجهة</span>
                <span className={styles.infoValue}>{destination}</span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}><RefreshCw className="h-3.5 w-3.5 text-emerald-400" /> آخر تحديث</span>
                <span className="text-[11px] text-slate-400 font-mono">{lastUpdated}</span>
              </div>
            </div>

            <div className={styles.actionGrid}>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={styles.mapsBtn}>
                <ExternalLink className="h-4 w-4" />
                <span>فتح في خرائط Google</span>
              </a>

              {captainPhone ? (
                <a href={`tel:${captainPhone}`} className={styles.callCaptainBtn}>
                  <Phone className="h-4 w-4 text-emerald-400" />
                  <span>اتصال بالسائق</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.clipboard) void navigator.clipboard.writeText(window.location.href);
                  }}
                  className={styles.callCaptainBtn}
                >
                  <span>نسخ رابط التتبع</span>
                </button>
              )}
            </div>
          </div>

          <p className={styles.footerNote}>
            نظام رادار بينكم (bynkcom) الملاحي السيادي · جميع الحقوق محفوظة
          </p>
        </aside>
      </main>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.loadingRoot}>
          <div className={styles.loadingSpinner} />
          <p className="text-xs font-bold animate-pulse">جاري تحميل خريطة التتبع المباشر...</p>
        </div>
      }
    >
      <TrackContent />
    </Suspense>
  );
}
