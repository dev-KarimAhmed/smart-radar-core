'use client';

import React from 'react';
import { Clock, Radio, Users, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Offer } from '@/core/types';
import type { RadarStage } from './receiving-offers-constants';
import { STAGE_DURATION_SECONDS } from './receiving-offers-constants';

interface RadarScanningViewProps {
  isArabic: boolean;
  formattedCountdown: string;
  currentStage: RadarStage;
  stages: RadarStage[];
  elapsedSeconds: number;
  activeOffers: Offer[];
  isCancellingRideRequest: boolean;
  onCancelRideRequest: () => void;
  onPreviewOffers: () => void;
  cancelText: string;
  cancellingText: string;
}

export function RadarScanningView({
  isArabic,
  formattedCountdown,
  currentStage,
  stages,
  elapsedSeconds,
  activeOffers,
  isCancellingRideRequest,
  onCancelRideRequest,
  onPreviewOffers,
  cancelText,
  cancellingText,
}: RadarScanningViewProps) {
  return (
    <>
      <div className="relative overflow-hidden rounded-3xl border border-[#14B8A6]/30 bg-gradient-to-b from-[#0C1527] via-[#080E1C] to-[#040812] p-4 sm:p-5 shadow-2xl shadow-black/50">
        <div className="pointer-events-none absolute -top-14 left-1/2 -translate-x-1/2 h-36 w-64 rounded-full bg-[#14F5D5]/10 blur-3xl" />

        {/* Center Graphic - Compact & Sleek */}
        <div className="relative z-10 my-3 flex flex-col items-center justify-center">
          {/* Compact Radar Graphic */}
          <div className="relative flex h-14 w-14 items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-[#14F5D5]/25 animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite]" />
            <div className="absolute -inset-1 rounded-full border border-[#14B8A6]/30 bg-[#14B8A6]/10 animate-pulse" />
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#14B8A6]/40 bg-gradient-to-br from-[#14B8A6]/25 to-[#060D17] text-[#14F5D5] shadow-[0_0_16px_rgba(20,245,213,0.2)]">
              <Radio className="h-4 w-4 text-[#14F5D5] animate-pulse" />
            </div>
          </div>

          {/* Compact Live Countdown & Stage Pill */}
          <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-[#14F5D5]/30 bg-[#060D19]/80 px-3 py-0.5 shadow-sm">
            <Clock className="h-3 w-3 text-[#14F5D5] animate-pulse shrink-0" />
            <span className="font-mono text-xs font-black text-white tracking-wider">
              {formattedCountdown}
            </span>
            <span className="h-2.5 w-[1px] bg-white/20" />
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#14F5D5]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#14F5D5] opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#14F5D5]" />
              </span>
              <span>
                {isArabic
                  ? `المرحلة ${currentStage.index + 1} من 5`
                  : `Stage ${currentStage.index + 1} of 5`}
              </span>
            </div>
          </div>

          {/* Stage Title */}
          <h3 className="mt-1.5 text-xs sm:text-sm font-black text-white text-center tracking-tight">
            {currentStage.title}
          </h3>
          {/* Stage Description */}
          <p className="mt-0.5 text-[10px] sm:text-[11px] text-slate-400 text-center leading-normal max-w-xs">
            {currentStage.description}
          </p>
        </div>

        {/* 5-Stage Progress Bar */}
        <div className="relative z-10 mt-2 space-y-1">
          <div className="grid grid-cols-5 gap-1.5">
            {stages.map((stg) => {
              const start = stg.index * STAGE_DURATION_SECONDS;
              const end = (stg.index + 1) * STAGE_DURATION_SECONDS;
              const isCompleted = elapsedSeconds >= end;
              const isCurrent = elapsedSeconds >= start && elapsedSeconds < end;
              const fillPct = isCompleted
                ? 100
                : isCurrent
                ? Math.min(100, Math.max(0, ((elapsedSeconds - start) / STAGE_DURATION_SECONDS) * 100))
                : 0;

              return (
                <div key={stg.index} className="space-y-1">
                  <div className="h-1.5 w-full rounded-full bg-[#060D19] overflow-hidden relative border border-[#14B8A6]/20">
                    <div
                      className={cn(
                        "h-full rounded-full bg-gradient-to-r from-[#14B8A6] to-[#14F5D5] transition-all duration-300 ease-out",
                        isCurrent && "shadow-[0_0_8px_rgba(20,245,213,0.7)]"
                      )}
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "text-[9px] sm:text-[10px] font-bold truncate max-w-full transition-colors",
                        isCurrent
                          ? "text-[#14F5D5] font-black drop-shadow-[0_0_6px_rgba(20,245,213,0.6)]"
                          : isCompleted
                          ? "text-[#14B8A6]"
                          : "text-slate-500"
                      )}
                    >
                      {stg.badge}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Timeline status footer */}
          <div className="flex items-center justify-between pt-0.5 px-0.5 text-[9px] sm:text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1 text-[#14F5D5]">
              <Clock className="h-2.5 w-2.5" />
              <span>{formattedCountdown}</span>
            </span>
            <span>
              {isArabic ? 'الحد الأقصى: 4:00 د' : 'Max Search: 4:00m'}
            </span>
          </div>
        </div>

        {/* Bottom Offer Count & [معاينة العروض] Radar-Themed Action Card */}
        <div className="relative z-10 mt-5 rounded-2xl border border-[#14B8A6]/30 bg-gradient-to-b from-[#091527] via-[#060D19] to-[#040814] p-3.5 sm:p-4 shadow-xl shadow-black/60 space-y-3">
          <div className="flex items-center justify-between gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <div className="flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-lg bg-[#14B8A6]/15 text-[#14F5D5]">
                <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#14F5D5]" />
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-slate-200 truncate">
                {isArabic ? 'عدد العروض القادمة من المعلنين' : 'Offers from advertisers'}
              </span>
            </div>

            <div
              className={cn(
                "inline-flex items-center gap-1.5 sm:gap-2 rounded-full px-2.5 sm:px-3 py-0.5 sm:py-1 font-mono text-[11px] sm:text-xs font-black shrink-0 transition-all duration-300 select-none",
                activeOffers.length > 0
                  ? "border border-[#14F5D5]/50 bg-[#14F5D5]/15 text-[#14F5D5] shadow-[0_0_12px_rgba(20,245,213,0.3)]"
                  : "border-white/10 bg-white/5 text-slate-400"
              )}
            >
              <span className="relative flex h-2 w-2 shrink-0">
                {activeOffers.length > 0 ? (
                  <>
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#14F5D5] opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#14F5D5]" />
                  </>
                ) : (
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-slate-500" />
                )}
              </span>
              <span className="whitespace-nowrap">
                {activeOffers.length}{' '}
                {isArabic
                  ? activeOffers.length === 1
                    ? 'كابتن'
                    : 'كباتن'
                  : activeOffers.length === 1
                  ? 'Captain'
                  : 'Captains'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onPreviewOffers}
            disabled={activeOffers.length === 0}
            className={cn(
              "relative group overflow-hidden w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-black text-xs sm:text-sm transition-all duration-300 select-none",
              activeOffers.length > 0
                ? "border border-[#14F5D5] bg-gradient-to-r from-[#0E2238] via-[#0A1A2E] to-[#05101E] text-white shadow-[0_0_24px_rgba(20,245,213,0.4)] hover:shadow-[0_0_32px_rgba(20,245,213,0.65)] hover:border-[#14F5D5] hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
                : "border border-white/10 bg-[#060D19]/80 text-slate-400 opacity-60 cursor-not-allowed shadow-none"
            )}
          >
            {activeOffers.length > 0 && (
              <>
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#14F5D5]/15 via-[#14B8A6]/10 to-transparent" />
                <span className="pointer-events-none absolute -inset-1 rounded-xl border border-[#14F5D5]/40 animate-pulse" />
              </>
            )}

            <div className="relative flex h-7 w-7 items-center justify-center shrink-0">
              {activeOffers.length > 0 ? (
                <>
                  <span className="absolute inset-0 rounded-full border border-[#14F5D5]/40 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
                  <span className="absolute -inset-1 rounded-full border border-[#14F5D5]/20 animate-pulse" />
                </>
              ) : null}
              <div
                className={cn(
                  "relative flex h-6 w-6 items-center justify-center rounded-lg border transition-colors",
                  activeOffers.length > 0
                    ? "border-[#14F5D5]/60 bg-[#14B8A6]/20 text-[#14F5D5] shadow-[0_0_10px_rgba(20,245,213,0.4)]"
                    : "border-white/10 bg-white/5 text-slate-500"
                )}
              >
                <Radio
                  className={cn(
                    "h-3.5 w-3.5",
                    activeOffers.length > 0 && "animate-pulse text-[#14F5D5]"
                  )}
                />
              </div>
            </div>

            <span
              className={cn(
                "relative z-10 font-black tracking-wide whitespace-nowrap",
                activeOffers.length > 0
                  ? "text-white drop-shadow-[0_0_8px_rgba(20,245,213,0.4)]"
                  : "text-slate-400"
              )}
            >
              {isArabic ? 'معاينة العروض' : 'Preview Offers'}
            </span>

            {activeOffers.length > 0 && (
              <span className="relative z-10 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#14F5D5] px-1.5 text-[11px] font-black text-[#040C17] font-mono shadow-[0_0_10px_rgba(20,245,213,0.5)]">
                {activeOffers.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onCancelRideRequest}
        disabled={isCancellingRideRequest}
        className="group flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/15 text-sm font-black text-rose-200 shadow-lg shadow-rose-950/40 transition-all duration-200 hover:border-rose-500/70 hover:bg-rose-500/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
      >
        <X className="h-4 w-4 text-rose-400 transition-transform group-hover:rotate-90" />
        <span>
          {isCancellingRideRequest
            ? cancellingText
            : cancelText}
        </span>
      </button>
    </>
  );
}
