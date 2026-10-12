import { latLngToCell } from 'h3-js';
import type { GeoJSONSource } from 'maplibre-gl';

export const styles = {
  style423_1: "rider-map-surface relative overflow-hidden rounded-[24px] border border-[#14B8A6]/20 bg-[#0B0F19] shadow-2xl shadow-black/40",
  style430_2: "h-full min-h-0 w-full",
  style431_3: "pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B0F19]/78 via-transparent to-[#0B0F19]/20 lg:hidden",
  style435_4: "pointer-events-none absolute left-1/2 top-1/2 z-30 flex -translate-x-1/2 -translate-y-full flex-col items-center",
  style438_5: "flex h-8 w-8 items-center justify-center rounded-full border border-[#14F5D5]/60 bg-[#0B0F19]/88 shadow-[0_0_18px_rgba(20,245,213,0.24)] backdrop-blur",
  style439_6: "h-2.5 w-2.5 rounded-full bg-[#14F5D5] shadow-[0_0_12px_rgba(20,245,213,0.8)]",
  style441_7: "-mt-1 h-2.5 w-2.5 rotate-45 border-b border-r border-[#14F5D5]/60 bg-[#0B0F19]/88",
  style442_8: "mt-1.5 hidden rounded-full border border-[#14B8A6]/20 bg-[#0B0F19]/78 px-2.5 py-0.5 text-[9px] font-black text-[#14F5D5] backdrop-blur sm:block",
  style449_9: "pointer-events-none absolute right-3 top-3 z-30 flex items-center gap-1.5 rounded-xl border border-[#14B8A6]/25 bg-[#0B0F19]/88 px-2 py-1.5 text-[#14F5D5] shadow-lg shadow-black/25 backdrop-blur sm:right-4 sm:top-4",
  style450_10: "flex h-6 w-6 items-center justify-center rounded-lg bg-[#14B8A6]/15",
  style451_11: "h-3.5 w-3.5",
  style453_12: "flex flex-col leading-none",
  style454_13: "text-[8px] font-black uppercase tracking-wide text-slate-300",
  style455_14: "mt-0.5 text-xs font-black text-white",
  style461_15: "pointer-events-none absolute right-3 top-20 hidden max-w-[260px] rounded-2xl border border-amber-400/25 bg-[#0B0F19]/88 px-3 py-2 text-right text-[11px] font-bold leading-relaxed text-amber-100 shadow-xl shadow-black/30 backdrop-blur sm:block sm:right-4 sm:top-24 lg:right-[456px]",
  style469_16: "absolute bottom-14 left-3 z-30 flex h-11 w-11 items-center justify-center rounded-2xl border border-[#14B8A6]/30 bg-[#0B0F19]/90 text-[#14F5D5] shadow-xl shadow-black/30 backdrop-blur transition hover:border-[#14F5D5]/60 hover:bg-[#14B8A6]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/60 disabled:cursor-wait disabled:opacity-60 sm:bottom-20 sm:left-4 lg:left-[312px]",
  style479_18: "absolute left-4 top-4 rounded-2xl border border-[#14B8A6]/30 bg-[#0B0F19]/90 px-4 py-2 text-xs font-black text-[#14F5D5] shadow-lg backdrop-blur transition hover:bg-[#14B8A6]/15 lg:left-[312px]",
} as const;

export type RiderLocation = {
  lat: number;
  lng: number;
};

export type RiderLocationStatus = 'locating' | 'live' | 'fallback' | 'denied';

export interface RiderLocationUpdate {
  location: RiderLocation;
  status: RiderLocationStatus;
  h3Cell: string;
}

export interface RiderMapCaptainPoint {
  id: string;
  serial: string;
  h3Cell: string;
  coordinates: RiderLocation;
  etaMinutes?: number;
  rank?: string;
  isBlocked?: boolean;
}

export interface RiderMapProps {
  activeTripCaptainId?: string | null;
  captainLocations?: RiderMapCaptainPoint[];
  className?: string;
  destinationFlyToTarget?: RiderLocation | null;
  fallbackLocation?: RiderLocation;
  showDestinationPin?: boolean;
  onDestinationChange?: (location: RiderLocation) => void;
  onDestinationMoveStart?: () => void;
  onLocationChange?: (payload: RiderLocationUpdate) => void;
}

export function toRiderFeatureCollection(location: RiderLocation) {
  return {
    type: 'FeatureCollection' as const,
    features: [
      {
        type: 'Feature' as const,
        properties: { label: 'rider' },
        geometry: {
          type: 'Point' as const,
          coordinates: [location.lng, location.lat],
        },
      },
    ],
  };
}

export function toCaptainFeatureCollection(captains: RiderMapCaptainPoint[]) {
  return {
    type: 'FeatureCollection' as const,
    features: captains.map((captain) => ({
      type: 'Feature' as const,
      properties: {
        id: captain.id,
        serial: captain.serial,
        etaMinutes: captain.etaMinutes,
        rank: captain.rank,
        isBlocked: !!captain.isBlocked,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [captain.coordinates.lng, captain.coordinates.lat],
      },
    })),
  };
}

export function interpolate(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}
