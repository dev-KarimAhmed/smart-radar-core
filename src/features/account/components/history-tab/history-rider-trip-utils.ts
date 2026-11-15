import type { HistoricalTrip } from './history-shared';

export function getRouteMapUrl(trip: HistoricalTrip): string | null {
  if (trip.destinationLat && trip.destinationLng) {
    if (trip.originLat && trip.originLng) {
      return `https://www.google.com/maps/dir/?api=1&origin=${trip.originLat},${trip.originLng}&destination=${trip.destinationLat},${trip.destinationLng}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${trip.destinationLat},${trip.destinationLng}`;
  }
  if (trip.destinationAddress && trip.destinationAddress !== 'رحلة سابقة' && trip.destinationAddress !== 'غير محدد') {
    if (trip.pickupAddress && trip.pickupAddress !== 'موقعي الحالي') {
      return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(trip.pickupAddress)}&destination=${encodeURIComponent(trip.destinationAddress)}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trip.destinationAddress)}`;
  }
  return null;
}

export function getRankBadge(rank: string = 'GOLD') {
  const normalized = (rank || 'GOLD').toUpperCase();
  if (normalized.includes('DIAMOND') || normalized.includes('ماس')) {
    return {
      label: 'DIAMOND',
      classes: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
    };
  }
  if (normalized.includes('PLATINUM')) {
    return {
      label: 'PLATINUM',
      classes: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    };
  }
  if (normalized.includes('SILVER')) {
    return {
      label: 'SILVER',
      classes: 'bg-slate-400/15 text-slate-300 border-slate-400/30',
    };
  }
  if (normalized.includes('BRONZE')) {
    return {
      label: 'BRONZE',
      classes: 'bg-amber-700/20 text-amber-300 border-amber-600/30',
    };
  }
  return {
    label: 'GOLD',
    classes: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  };
}
