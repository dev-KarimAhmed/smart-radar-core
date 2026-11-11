'use client';

import React from 'react';
import {
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  MessageSquare,
  Navigation,
  Phone,
  Play,
  ShieldAlert,
  X,
} from 'lucide-react';
import type { Trip } from '@/core/types';
import type { CaptainTripStep } from '../../state/captain-state-machine';

interface ActiveTripStepFlowProps {
  step: CaptainTripStep;
  language: 'ar' | 'en';
  request: Trip;
  currency: string;
  tripDurationMinutes: number;
  isCompleting: boolean;
  isCancelling: boolean;
  whatsappArrivalUrl?: string;
  phoneCallUrl?: string;
  destinationGoogleMapsUrl?: string;
  isTripNinetyPercentComplete: boolean;
  remainingMinutesUntilNinety: number;
  completionFraction: number;
  onArrived: () => void;
  onStartTrip: () => void;
  onCompleteTrip: () => void;
  onOpenCancelConfirm: () => void;
  t: (key: any, values?: any) => string;
}

export function ActiveTripStepFlow({
  step,
  language,
  request,
  currency,
  tripDurationMinutes,
  isCompleting,
  isCancelling,
  whatsappArrivalUrl,
  phoneCallUrl,
  destinationGoogleMapsUrl,
  isTripNinetyPercentComplete,
  remainingMinutesUntilNinety,
  completionFraction,
  onArrived,
  onStartTrip,
  onCompleteTrip,
  onOpenCancelConfirm,
  t,
}: ActiveTripStepFlowProps) {
  return (
    <div className="mt-5">
      {/* STEP 1: ACCEPTED -> Only show 'وصلت لنقطة الركوب' */}
      {step === 'ACCEPTED' && (
        <button
          type="button"
          onClick={onArrived}
          disabled={isCompleting}
          className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 hover:brightness-110 active:scale-[0.98] py-4 text-base font-black text-slate-950 shadow-[0_4px_24px_rgba(20,245,213,0.35)] transition-all cursor-pointer disabled:opacity-50"
        >
          {isCompleting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Navigation className="h-5 w-5 stroke-[2.5]" />}
          <span>{t('arrived')}</span>
        </button>
      )}

      {/* STEP 2: ARRIVED (Page 11) - 4 Atomic Communication & Control Actions */}
      {step === 'ARRIVED' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Rendezvous Point & Trip Summary Banner per Page 11 */}
          <div className="rounded-2xl border border-emerald-500/30 bg-[#071324] p-4 space-y-2.5 shadow-xl">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-[#14F5D5]" />
                <span>{t('rendezvousPoint') || 'نقطة الالتقاء'}:</span>
              </span>
              <span className="font-black text-white text-end max-w-[65%] truncate">
                {request.pickupLabel || request.dropoff || (t('rendezvousPoint') || (language === 'ar' ? 'نقطة الالتقاء' : 'Pickup Point'))}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-300 border-t border-slate-800 pt-2">
              <span className="text-slate-400">{t('serviceDuration') || 'مدة الخدمة'}:</span>
              <span className="font-bold font-mono text-cyan-300">
                {tripDurationMinutes} {language === 'ar' ? 'دقيقة' : 'min'} {request.estimatedDistance ? `(${request.estimatedDistance} ${language === 'ar' ? 'كم' : 'km'})` : ''}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-300 border-t border-slate-800 pt-2">
              <span className="text-slate-400">{t('agreedPrice') || 'السعر المتفق عليه'}:</span>
              <span className="font-black font-mono text-emerald-300 text-sm">
                {Number(request.offerPrice || 0).toFixed(2)} {currency}
              </span>
            </div>
          </div>

          {/* 4 Action Buttons Grid per Page 11 */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {/* 1. رسالة الوصول (Page 11) */}
            {whatsappArrivalUrl ? (
              <a
                href={whatsappArrivalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 p-3.5 text-xs sm:text-sm font-black text-emerald-300 shadow-md transition-all active:scale-95 cursor-pointer text-center"
              >
                <MessageSquare className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{t('arrivalMessage') || 'رسالة الوصول'}</span>
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/40 p-3.5 text-xs sm:text-sm font-bold text-slate-500 opacity-60 text-center"
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                <span>{t('arrivalMessage') || 'رسالة الوصول'}</span>
              </button>
            )}

            {/* 2. الاتصال بالعميل (Page 11) */}
            {phoneCallUrl ? (
              <a
                href={phoneCallUrl}
                className="flex items-center justify-center gap-2 rounded-2xl border border-cyan-500/40 bg-cyan-500/15 hover:bg-cyan-500/25 p-3.5 text-xs sm:text-sm font-black text-cyan-300 shadow-md transition-all active:scale-95 cursor-pointer text-center"
              >
                <Phone className="h-4 w-4 shrink-0 text-cyan-400" />
                <span>{t('callClient') || 'الاتصال بالعميل'}</span>
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/40 p-3.5 text-xs sm:text-sm font-bold text-slate-500 opacity-60 text-center"
              >
                <Phone className="h-4 w-4 shrink-0" />
                <span>{t('callClient') || 'الاتصال بالعميل'}</span>
              </button>
            )}

            {/* 3. ابدأ (Page 11) */}
            <button
              type="button"
              onClick={onStartTrip}
              disabled={isCompleting}
              className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-[#10B981] to-teal-500 hover:brightness-110 active:scale-[0.98] p-3.5 text-xs sm:text-sm font-black text-slate-950 shadow-[0_4px_20px_rgba(16,185,129,0.35)] transition-all cursor-pointer disabled:opacity-50 text-center"
            >
              {isCompleting ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <Play className="h-4 w-4 fill-slate-950 shrink-0" />}
              <span>{t('startTrip') || 'ابدأ'}</span>
            </button>

            {/* 4. إلغاء العرض (Page 11) */}
            <button
              type="button"
              onClick={onOpenCancelConfirm}
              disabled={isCompleting || isCancelling}
              className="flex items-center justify-center gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/15 hover:bg-rose-500/25 p-3.5 text-xs sm:text-sm font-black text-rose-300 shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 text-center"
            >
              <X className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{t('cancelOfferAction') || 'إلغاء العرض'}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: STARTED (Page 11) */}
      {step === 'STARTED' && (
        <div>
          {!isTripNinetyPercentComplete ? (
            /* Case 3A: Under 90% -> Explanatory card with progress bar */
            <div className="rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-cyan-950/30 via-slate-900/60 to-black/50 p-4 sm:p-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                    <Clock className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">{t('tripInProgressTitle')}</h3>
                    <p className="mt-0.5 text-xs text-slate-300 leading-relaxed">
                      {t('tripNinetyNotice')}
                    </p>
                  </div>
                </div>

                {destinationGoogleMapsUrl && (
                  <a
                    href={destinationGoogleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 px-3.5 py-2 text-xs font-black text-cyan-200 transition"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>{t('googleMapsRoute') || 'خرائط جوجل مسار الرحلة'}</span>
                  </a>
                )}
              </div>

              {/* Progress bar to 90% */}
              <div className="mt-3.5 space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold text-slate-400">
                  <span>{t('tripMinutesRemaining', { minutes: remainingMinutesUntilNinety })}</span>
                  <span className="font-mono text-cyan-300">{Math.min(90, Math.round(completionFraction * 100))}% / 90%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${Math.min(100, (completionFraction / 0.9) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Case 3B: Reached 90% -> Complete Service button */
            <div className="space-y-2.5 animate-in fade-in zoom-in-95 duration-200">
              <button
                type="button"
                onClick={onCompleteTrip}
                disabled={isCompleting}
                className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:brightness-110 active:scale-[0.98] py-4 text-base font-black text-slate-950 shadow-[0_4px_24px_rgba(16,185,129,0.45)] transition-all cursor-pointer disabled:opacity-50"
              >
                {isCompleting ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldAlert className="h-5 w-5 stroke-[2.5]" />}
                <span>{t('completeTrip')}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
