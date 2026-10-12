'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { CaptainMarketIndicator } from '../hooks/use-captain-market-indicator';

const styles = {
  full: 'flex items-center gap-3 rounded-2xl border px-4 py-3',
  fullLow: 'border-emerald-500/25 bg-emerald-500/10',
  fullHigh: 'border-rose-500/25 bg-rose-500/10',
  fullGauge: 'h-16 w-28 shrink-0',
  fullText: 'flex-1 text-start',
  fullTitle: 'text-sm font-black',
  fullTitleLow: 'text-emerald-300',
  fullTitleHigh: 'text-rose-300',
  fullBody: 'mt-0.5 text-xs leading-5 text-[#94A3B8]',
  compact: 'inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-1',
  compactLow: 'border-emerald-500/25 bg-emerald-500/10',
  compactHigh: 'border-rose-500/25 bg-rose-500/10',
  compactGauge: 'h-6 w-11 shrink-0',
  compactLabel: 'pe-1 text-[11px] font-black',
  compactLabelLow: 'text-emerald-300',
  compactLabelHigh: 'text-rose-300',
} as const;

interface MarketStatusIndicatorProps {
  indicator: CaptainMarketIndicator | null;
  size?: 'full' | 'compact';
}

// A semicircle speedometer: a green zone from 0 to the current demand
// (pending requests) and a red zone beyond it, with a needle pointing at
// the current active-captain count — so the needle sitting inside the green
// zone visually means "there's enough demand for this many captains", and
// crossing into red means "more captains online than there is demand for".
function Gauge({ value, threshold, status, className }: { value: number; threshold: number; status: 'low' | 'high'; className: string }) {
  // The colored split must always agree with `status`, not just the raw
  // demand/supply numbers: the server can force 'low' for a reason the raw
  // numbers alone don't show (e.g. too few priced captains in the
  // governorate yet to call it a real market) — without this, the gauge
  // could draw an all-red arc while the text right next to it says "fine".
  const effectiveThreshold = status === 'low'
    ? Math.max(threshold, value)
    : Math.min(threshold, Math.max(value - 1, 0));
  const maxScale = Math.max(effectiveThreshold * 1.3, value * 1.2, 1);
  const cx = 60;
  const cy = 58;
  const r = 50;
  const trackWidth = 11;

  const angleAt = (v: number) => 180 - 180 * clamp01(v / maxScale);
  const thresholdAngle = angleAt(effectiveThreshold);
  const needleAngle = angleAt(value);
  const needleTip = polarToCartesian(cx, cy, r - trackWidth / 2 - 2, needleAngle);

  return (
    <svg viewBox="0 0 120 66" className={className} role="img" aria-hidden="true">
      <path
        d={describeArc(cx, cy, r, 180, thresholdAngle)}
        fill="none"
        stroke="#34D399"
        strokeWidth={trackWidth}
        strokeLinecap="round"
      />
      <path
        d={describeArc(cx, cy, r, thresholdAngle, 0)}
        fill="none"
        stroke="#FB7185"
        strokeWidth={trackWidth}
        strokeLinecap="round"
      />
      <line x1={cx} y1={cy} x2={needleTip.x} y2={needleTip.y} stroke="#F8FAFC" strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={4} fill="#F8FAFC" />
    </svg>
  );
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = startAngle - endAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

export function MarketStatusIndicator({ indicator, size = 'full' }: MarketStatusIndicatorProps) {
  const t = useTranslations('captainDashboard');
  if (!indicator) return null;

  const isHigh = indicator.status === 'high';
  const scopeLabel = indicator.scope === 'governorate'
    ? t('marketIndicatorScopeGovernorate')
    : t('marketIndicatorScopeCountry');

  if (size === 'compact') {
    return (
      <div
        className={cn(styles.compact, isHigh ? styles.compactHigh : styles.compactLow)}
        title={isHigh
          ? t('marketIndicatorHighBody', { count: indicator.activeCaptainCount, demand: indicator.pendingRequestCount, scope: scopeLabel })
          : t('marketIndicatorLowBody', { count: indicator.activeCaptainCount, demand: indicator.pendingRequestCount, scope: scopeLabel })}
      >
        <Gauge value={indicator.activeCaptainCount} threshold={indicator.pendingRequestCount} status={indicator.status} className={styles.compactGauge} />
        <span className={cn(styles.compactLabel, isHigh ? styles.compactLabelHigh : styles.compactLabelLow)}>
          {isHigh ? t('marketIndicatorHighShort') : t('marketIndicatorLowShort')}
        </span>
      </div>
    );
  }

  return (
    <div className={cn(styles.full, isHigh ? styles.fullHigh : styles.fullLow)}>
      <Gauge value={indicator.activeCaptainCount} threshold={indicator.pendingRequestCount} status={indicator.status} className={styles.fullGauge} />
      <div className={styles.fullText}>
        <p className={cn(styles.fullTitle, isHigh ? styles.fullTitleHigh : styles.fullTitleLow)}>
          {isHigh ? t('marketIndicatorHighTitle', { scope: scopeLabel }) : t('marketIndicatorLowTitle', { scope: scopeLabel })}
        </p>
        <p className={styles.fullBody}>
          {isHigh
            ? t('marketIndicatorHighBody', { count: indicator.activeCaptainCount, demand: indicator.pendingRequestCount, scope: scopeLabel })
            : t('marketIndicatorLowBody', { count: indicator.activeCaptainCount, demand: indicator.pendingRequestCount, scope: scopeLabel })}
        </p>
      </div>
    </div>
  );
}
