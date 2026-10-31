import React from 'react';
import type { Trip } from '@/core/types';
import { cn } from '@/lib/utils';
import { styles } from './radar-map.styles';
import { estimateHaversineDistanceKm } from '../../services/ride-location';

export function Info({ label, value, fullWidth }: { label: string; value: string; fullWidth?: boolean }) {
  return (
    <div className={cn(styles.style252_43, fullWidth ? styles.infoFullWidth : '')}>
      <p className={styles.style253_44}>{label}</p>
      <p className={styles.style254_45}>{value}</p>
    </div>
  );
}

export function StateCard({
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

export function createCarMarkerElement() {
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

export function CarMarkerIcon() {
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

export function formatMinutes(totalMinutes: number, language: 'ar' | 'en') {
  const safeMinutes = Math.max(0, Math.floor(Number(totalMinutes) || 0));
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  return language === 'ar' ? `${hours} ساعة ${minutes} دقيقة` : `${hours}h ${minutes}m`;
}

export function pickupDistanceKm(driverLocation: { lat: number; lng: number } | null, request: Trip) {
  if (!driverLocation || !request.pickupCoords) return null;
  return estimateHaversineDistanceKm(
    driverLocation.lat,
    driverLocation.lng,
    request.pickupCoords.lat,
    request.pickupCoords.lng,
  );
}

export function formatLocalizedNumber(value: number | string | null | undefined, language: 'ar' | 'en'): string {
  if (value == null) return '';
  const str = String(value);
  if (language !== 'ar') {
    return str.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  }
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return str.replace(/[0-9]/g, (d) => arabicDigits[Number(d)]);
}

export function calculateCaptainTripPrice(
  tariff: any,
  trip: Trip
): number | null {
  if (!tariff) return null;
  const baseFare = Number(tariff.baseFare);
  const perKm = Number(tariff.pricePerKm);
  const perMin = Number(tariff.pricePerMin);
  const includedKm = Number(tariff.includedKm ?? 0);

  if (!Number.isFinite(baseFare) || baseFare <= 0) return null;

  const distanceKm = trip.estimatedDistance != null && trip.estimatedDistance > 0
    ? trip.estimatedDistance
    : 0;
  const billableKm = Math.max(0, distanceKm - (Number.isFinite(includedKm) ? includedKm : 0));
  const minutes = trip.estimatedTime != null && trip.estimatedTime > 0
    ? trip.estimatedTime
    : Math.round(distanceKm * 2);

  const kmCost = billableKm * (Number.isFinite(perKm) && perKm > 0 ? perKm : 0);
  const minCost = minutes * (Number.isFinite(perMin) && perMin > 0 ? perMin : 0);

  const total = Math.round((baseFare + kmCost + minCost) * 100) / 100;
  return total > 0 ? total : null;
}

export function formatRequestTime(isoString: string | undefined | null, language: 'ar' | 'en') {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '-';
    if (language === 'ar') {
      const formatted = new Intl.DateTimeFormat('ar-EG', { hour: 'numeric', minute: '2-digit' }).format(d);
      return formatLocalizedNumber(formatted, 'ar');
    }
    const formatted = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(d);
    return formatLocalizedNumber(formatted, 'en');
  } catch {
    return '-';
  }
}

export function fallbackRequestPosition(index: number): React.CSSProperties {
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
