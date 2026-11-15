'use client';

import React from 'react';
import { ExternalLink, MapPin } from 'lucide-react';

export interface TripDestinationCardProps {
  isArabic: boolean;
  destinationLabel: string;
  destinationMapsUrl?: string | null;
}

export function TripDestinationCard({
  isArabic,
  destinationLabel,
  destinationMapsUrl,
}: TripDestinationCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#14B8A6]/30 bg-gradient-to-r from-[#14B8A6]/15 via-[#081324] to-[#040812] p-4 shadow-lg shadow-black/20">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#14B8A6]/20 text-[#14F5D5] shadow-sm mt-0.5">
            <MapPin className="h-5 w-5 text-[#14F5D5]" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-[11px] font-black uppercase tracking-wider text-[#14F5D5]/90 mb-1">
              {isArabic ? 'الوجهة المتجه إليها' : 'Destination'}
            </span>
            <h3
              className="text-base sm:text-lg font-black text-white leading-relaxed break-words whitespace-normal"
              dir="auto"
            >
              {destinationLabel || (isArabic ? 'الوجهة المحددة' : 'Selected Destination')}
            </h3>
          </div>
        </div>
        {destinationMapsUrl ? (
          <a
            href={destinationMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[#14B8A6]/35 bg-[#14B8A6]/15 hover:bg-[#14B8A6]/25 px-2.5 sm:px-3 py-2 text-xs font-black text-[#14F5D5] transition-all cursor-pointer shadow-sm active:scale-95"
            title={isArabic ? 'افتح في خرائط Google' : 'Open in Google Maps'}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="whitespace-nowrap">{isArabic ? 'خرائط Google' : 'Google Maps'}</span>
          </a>
        ) : null}
      </div>
    </div>
  );
}
