'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { CaptainMarketIndicator } from '../hooks/use-captain-market-indicator';

const styles = {
  banner:
    'relative overflow-hidden rounded-2xl border-2 border-amber-500/50 bg-gradient-to-r from-amber-600/20 via-orange-500/25 to-amber-600/20 p-3.5 sm:p-4 text-center shadow-lg shadow-amber-950/30 transition-all select-none',
  bannerGlow:
    'absolute inset-0 bg-gradient-to-b from-amber-400/10 via-transparent to-transparent pointer-events-none',
  bannerHeader: 'relative z-10 flex items-center justify-center gap-2 mb-1.5',
  bannerDot:
    'h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.9)]',
  bannerTitle: 'text-sm sm:text-base font-black text-amber-300 tracking-wide',
  bannerBadge:
    'text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 rounded-full border border-amber-400/40 bg-amber-500/20 text-amber-200',
  bannerBadgeLow:
    'border-emerald-400/40 bg-emerald-500/15 text-emerald-200',
  bannerStats:
    'relative z-10 flex items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm font-bold text-slate-100 flex-wrap',
  bannerStatItem: 'inline-flex items-center gap-1.5',
  bannerStatNumber: 'font-mono text-base sm:text-lg font-black text-amber-300 drop-shadow-sm',
  bannerStatLabel: 'font-bold text-slate-200',
  bannerDivider: 'text-amber-500/60 font-black text-base select-none',
  compact: 'inline-flex shrink-0 items-center gap-1.5 sm:gap-2 rounded-full border px-2.5 py-1 sm:px-3.5 sm:py-1.5 shadow-md backdrop-blur-md',
  compactLow: 'border-emerald-500/25 bg-emerald-500/10',
  compactHigh: 'border-rose-500/25 bg-rose-500/10',
  compactGauge: 'h-6 w-11 sm:h-8 sm:w-14 shrink-0',
  compactLabel: 'pe-0.5 sm:pe-1 text-[11px] sm:text-sm font-black tracking-wide',
  compactLabelLow: 'text-emerald-300',
  compactLabelHigh: 'text-rose-300',
} as const;

interface MarketStatusIndicatorProps {
  indicator: CaptainMarketIndicator | null | undefined;
  size?: 'full' | 'compact' | 'banner';
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
  if (!indicator && size === 'compact') return null;

  const resolvedIndicator: CaptainMarketIndicator = indicator ?? {
    activeCaptainCount: 0,
    pendingRequestCount: 0,
    scope: 'governorate',
    status: 'low',
  };

  const isHigh = resolvedIndicator.status === 'high';
  const scopeLabel = resolvedIndicator.scope === 'governorate'
    ? t('marketIndicatorScopeGovernorate')
    : t('marketIndicatorScopeCountry');

  if (size === 'compact') {
    return (
      <div
        className={cn(styles.compact, isHigh ? styles.compactHigh : styles.compactLow)}
        title={isHigh
          ? t('marketIndicatorHighBody', { count: resolvedIndicator.activeCaptainCount, demand: resolvedIndicator.pendingRequestCount, scope: scopeLabel })
          : t('marketIndicatorLowBody', { count: resolvedIndicator.activeCaptainCount, demand: resolvedIndicator.pendingRequestCount, scope: scopeLabel })}
      >
        <Gauge value={resolvedIndicator.activeCaptainCount} threshold={resolvedIndicator.pendingRequestCount} status={resolvedIndicator.status} className={styles.compactGauge} />
        <span className={cn(styles.compactLabel, isHigh ? styles.compactLabelHigh : styles.compactLabelLow)}>
          {isHigh ? t('marketIndicatorHighShort') : t('marketIndicatorLowShort')}
        </span>
      </div>
    );
  }

  return (
    <div
      className={styles.banner}
      title={isHigh
        ? t('marketIndicatorHighBody', { count: resolvedIndicator.activeCaptainCount, demand: resolvedIndicator.pendingRequestCount, scope: scopeLabel })
        : t('marketIndicatorLowBody', { count: resolvedIndicator.activeCaptainCount, demand: resolvedIndicator.pendingRequestCount, scope: scopeLabel })}
    >
      <div className={styles.bannerGlow} />
      <div className={styles.bannerHeader}>
        <span className={styles.bannerDot} />
        <h4 className={styles.bannerTitle}>
          {t('marketIndicatorTitle')}
        </h4>
        <span className={cn(styles.bannerBadge, !isHigh && styles.bannerBadgeLow)}>
          {isHigh ? t('marketIndicatorHighShort') : t('marketIndicatorLowShort')}
        </span>
      </div>

      <div className={styles.bannerStats}>
        <span className={styles.bannerStatItem}>
          <span className={styles.bannerStatNumber}>
            {resolvedIndicator.pendingRequestCount}
          </span>
          <span className={styles.bannerStatLabel}>
            {t('marketPendingRequestsLabel')}
          </span>
        </span>
        <span className={styles.bannerDivider}>|</span>
        <span className={styles.bannerStatItem}>
          <span className={styles.bannerStatNumber}>
            {resolvedIndicator.activeCaptainCount}
          </span>
          <span className={styles.bannerStatLabel}>
            {t('marketActiveCaptainsLabel')}
          </span>
        </span>
      </div>
    </div>
  );
}
