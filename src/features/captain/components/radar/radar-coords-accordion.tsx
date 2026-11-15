import React from 'react';
import { ChevronDown, ExternalLink, MapPin } from 'lucide-react';
import type { Trip } from '@/core/types';
import { cn } from '@/lib/utils';
import type { RadarCopyType } from './radar-copy';
import { RadarCardDetailsSection } from './radar-card-details-section';

interface RadarCoordsAccordionProps {
  request: Trip;
  language: 'ar' | 'en';
  currency: string;
  copy: RadarCopyType;
  isOpen: boolean;
  onToggle: () => void;
  driverLocation: { lat: number; lng: number } | null;
  passengersCount: number;
  routeGoogleMapsUrl: string | null;
}

export function RadarCoordsAccordion({
  request,
  language,
  currency,
  copy,
  isOpen,
  onToggle,
  driverLocation,
  passengersCount,
  routeGoogleMapsUrl,
}: RadarCoordsAccordionProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#070c18]/90 overflow-hidden transition-all">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 text-xs font-black text-slate-200 hover:bg-white/5 transition cursor-pointer"
      >
        <span className="flex items-center gap-2 text-cyan-300">
          <MapPin className="h-4 w-4 text-[#14F5D5]" />
          <span>{copy.coordinatesAccordion || 'إحداثيات الرحلة'}</span>
        </span>
        <div className="flex items-center gap-2">
          {request.estimatedDistance != null && (
            <span className="font-mono text-[11px] font-bold text-slate-400">
              {request.estimatedDistance} {language === 'ar' ? 'كم' : 'km'}
            </span>
          )}
          <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform duration-200', isOpen && 'rotate-180')} />
        </div>
      </button>
      {isOpen && (
        <div className="p-3 pt-0 border-t border-slate-800/60 animate-in fade-in duration-150">
          <RadarCardDetailsSection
            request={request}
            language={language}
            currency={currency}
            copy={copy}
            driverLocation={driverLocation}
            passengersCount={passengersCount}
          />
          {routeGoogleMapsUrl && (
            <a
              href={routeGoogleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 px-3.5 py-2.5 text-xs font-black text-cyan-300 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
            >
              <ExternalLink className="h-4 w-4" />
              <span>{copy.verifyCoordinatesBtn || 'تحقق من الإحداثيات إذا رغبت'}</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}

