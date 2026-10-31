import React from 'react';
import { ChevronDown, MapPin, Route } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatLocalizedNumber } from './radar-map.helpers';
import type { RadarCopyType } from './radar-copy';

interface RadarCardHeaderSectionProps {
  dropoff?: string;
  copy: RadarCopyType;
  language: 'ar' | 'en';
  currency: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  captainPriceForCard: string;
  routeGoogleMapsUrl: string | null;
}

export function RadarCardHeaderSection({
  dropoff,
  copy,
  language,
  currency,
  isExpanded,
  onToggleExpand,
  captainPriceForCard,
  routeGoogleMapsUrl,
}: RadarCardHeaderSectionProps) {
  return (
    <div
      onClick={onToggleExpand}
      className="cursor-pointer select-none"
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggleExpand();
        }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#14F5D5]/20 to-[#14B8A6]/5 border border-[#14F5D5]/30 text-[#14F5D5] shadow-[0_0_10px_rgba(20,245,213,0.2)]">
            <MapPin className="h-4 w-4 drop-shadow-[0_0_6px_rgba(20,245,213,0.5)]" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-sm sm:text-base font-black text-white tracking-wide leading-snug pt-0.5">
              {dropoff || copy.destination}
            </h3>
          </div>
        </div>

        <div className="flex items-center shrink-0 pt-0.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all">
            <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isExpanded ? "rotate-180 text-emerald-400" : "")} />
          </div>
        </div>
      </div>

      {isExpanded && routeGoogleMapsUrl && (
        <div className="mt-2.5" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              window.open(routeGoogleMapsUrl, '_blank', 'noopener,noreferrer');
            }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-orange-500/60 bg-gradient-to-r from-orange-500/25 via-amber-500/20 to-orange-600/25 hover:from-orange-500/35 hover:via-amber-500/30 hover:to-orange-600/35 active:scale-95 px-4 py-2.5 text-xs sm:text-sm font-black text-orange-300 hover:text-orange-200 shadow-[0_0_14px_rgba(249,115,22,0.25)] transition-all cursor-pointer"
            title={copy.tripRoute}
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          >
            <Route className="h-4 w-4 shrink-0 stroke-[2.5]" />
            <span className="truncate min-w-0">{copy.tripRoute}</span>
          </button>
        </div>
      )}

      {!isExpanded && (
        <div className="grid grid-cols-2 gap-2 sm:gap-2.5 mt-3 pt-2.5 border-t border-emerald-500/15" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <div className={cn("flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl border border-emerald-400/40 bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-emerald-500/20 px-2 sm:px-3 py-2 shadow-[0_0_12px_rgba(16,185,129,0.18)] min-w-0 overflow-hidden", !routeGoogleMapsUrl ? "col-span-2" : "")}>
            <span className="text-[11px] sm:text-xs font-bold text-emerald-300/90 shrink-0 whitespace-nowrap">{copy.yourFareShort}</span>
            <span className="font-mono font-black text-xs sm:text-sm text-white tracking-tight shrink-0 whitespace-nowrap">{formatLocalizedNumber(captainPriceForCard, language)}</span>
            <span className="text-[10px] sm:text-xs font-black text-emerald-300 shrink-0 whitespace-nowrap">{currency}</span>
          </div>

          {routeGoogleMapsUrl && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                window.open(routeGoogleMapsUrl, '_blank', 'noopener,noreferrer');
              }}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-orange-500/60 bg-gradient-to-r from-orange-500/25 via-amber-500/20 to-orange-600/25 hover:from-orange-500/35 hover:via-amber-500/30 hover:to-orange-600/35 active:scale-95 px-2 sm:px-3 py-2 text-[11px] sm:text-xs font-black text-orange-300 shadow-[0_0_14px_rgba(249,115,22,0.25)] transition-all cursor-pointer min-w-0 overflow-hidden"
              title={copy.tripRoute}
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
              <Route className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 stroke-[2.5]" />
              <span className="whitespace-nowrap shrink-0">{copy.tripRouteShort}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
