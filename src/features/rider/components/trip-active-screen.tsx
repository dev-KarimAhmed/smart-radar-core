'use client';

import React from 'react';
import {
  AlertTriangle,
  Car,
  Clock,
  Facebook,
  Instagram,
  MapPin,
  MessageCircle,
  Palette,
  Phone,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { formatMoney, isTripStartedStatus } from '../services/rider-view-format';
import { resolveColorDisplayName } from '@/shared/services/color-name';
import type { RiderActiveTrip } from '../state/rider-state-machine';
import type { TripCountdown } from '@/shared/services/trip-countdown';

export interface TripActiveScreenProps {
  isArabic: boolean;
  activeTrip: RiderActiveTrip;
  countdown?: TripCountdown;
  etaSeconds?: number;
  currencyLabel: string;
  isCancellingRideRequest: boolean;
  onEmergencyWhatsapp: () => void;
  onCancelRideRequest: () => void;
}

export function TripActiveScreen({
  isArabic,
  activeTrip,
  countdown,
  etaSeconds = 0,
  currencyLabel,
  isCancellingRideRequest,
  onEmergencyWhatsapp,
  onCancelRideRequest,
}: TripActiveScreenProps) {
  const t = useTranslations('riderView');
  const remainingSeconds = countdown ? countdown.remainingSeconds : etaSeconds;
  const displayTimer = countdown?.hasCountdown
    ? countdown.display
    : `${Math.floor(remainingSeconds / 60)}:${(remainingSeconds % 60).toString().padStart(2, '0')}`;
  const activeTripStatus = String(activeTrip.status || '').toUpperCase();
  const tripHasStarted = isTripStartedStatus(activeTripStatus);

  const serialNumber = activeTrip.captain?.serial_number
    || (activeTrip.captain as any)?.serial
    || activeTrip.captainId?.slice(0, 8).toUpperCase();

  const captainName = activeTrip.captain?.nickname
    || activeTrip.captain?.full_name
    || activeTrip.captain?.name
    || activeTrip.captainName
    || t('trip.captainFallbackName');

  const captainPhone = activeTrip.captainPhone || activeTrip.captain?.phone;

  const plateNumber = activeTrip.captain?.plate_number
    || activeTrip.captain?.license_plate
    || activeTrip.vehiclePlate
    || t('trip.plateFallback');

  const vehicleModel = activeTrip.captain?.vehicle_model
    || activeTrip.vehicleType
    || t('trip.vehicleFallback');

  const vehicleColor = resolveColorDisplayName(activeTrip.captain?.vehicle_color, isArabic ? 'ar' : 'en');

  const timerLabel = activeTripStatus === 'ARRIVED'
    ? (isArabic ? 'الكابتن بانتظارك' : t('trip.driverArrivedTitle'))
    : tripHasStarted
    ? (isArabic ? 'الوقت المتبقي للوصول' : t('trip.timeRemaining'))
    : (isArabic ? 'وقت الوصول المتوقع' : t('trip.driverArrival'));

  return (
    <div className={cn("space-y-3.5", isArabic ? "text-right" : "text-left")} dir={isArabic ? 'rtl' : 'ltr'}>
      {/* 1. الترويسة الرئيسية: بيانات الكابتن والتايمر الواضح */}
      <div className="relative overflow-hidden rounded-2xl border border-[#14B8A6]/30 bg-gradient-to-b from-[#0C1527] via-[#080E1C] to-[#040812] p-4 shadow-xl shadow-black/40">
        <div className="pointer-events-none absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#14F5D5]/60 to-transparent" />

        <div className="flex items-center justify-between gap-3">
          {/* بيانات الكابتن وحالة المسار */}
          <div className="min-w-0 flex-1 space-y-1.5">
            {/* مؤشر الحالة الفعلي (بدون عبارة الرحلة بدأت) */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#14B8A6]/35 bg-[#14B8A6]/10 px-2.5 py-0.5 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#14F5D5] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#14F5D5]" />
              </span>
              <span className="text-[10px] font-black text-[#14F5D5]">
                {activeTripStatus === 'ARRIVED'
                  ? (isArabic ? 'وصل الكابتن إلى موقعك' : t('trip.driverArrivedTitle'))
                  : tripHasStarted
                  ? (isArabic ? 'الرحلة جارية الآن' : t('trip.started'))
                  : (isArabic ? 'الكابتن في الطريق إليك' : 'Captain on the way')}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-white truncate leading-tight">
                {captainName}
              </h2>
              {serialNumber ? (
                <span className="font-mono text-xs font-black text-[#14F5D5] bg-[#14B8A6]/15 border border-[#14B8A6]/35 rounded-md px-2 py-0.5 shadow-sm">
                  #{serialNumber}
                </span>
              ) : null}
            </div>
          </div>

          {/* التايمر الرقمي الواضح جداً */}
          <div className="shrink-0 flex flex-col items-center justify-center rounded-2xl border-2 border-[#14B8A6]/40 bg-[#040814] px-4 py-2.5 text-center min-w-[115px] shadow-lg shadow-[#14B8A6]/10">
            <div className="flex items-center gap-1 text-[#14F5D5] mb-0.5">
              <Clock className="h-4 w-4 animate-pulse text-[#14F5D5]" />
              <span className="text-[10px] font-black text-slate-300 whitespace-nowrap">
                {timerLabel}
              </span>
            </div>
            <strong className="font-mono text-2xl sm:text-3xl font-black text-[#14F5D5] tracking-wider block drop-shadow-[0_0_10px_rgba(20,245,213,0.4)]">
              {displayTimer}
            </strong>
          </div>
        </div>
      </div>

      {/* 2. بطاقة الوجهة المتجه إليها - تظهر كاملة بدون أي اقتطاع تحت أي ظرف */}
      <div className="relative overflow-hidden rounded-2xl border border-[#14B8A6]/30 bg-gradient-to-r from-[#14B8A6]/15 via-[#081324] to-[#040812] p-4 shadow-lg shadow-black/20">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#14B8A6]/20 text-[#14F5D5] shadow-sm mt-0.5">
            <MapPin className="h-5 w-5 text-[#14F5D5]" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-[11px] font-black uppercase tracking-wider text-[#14F5D5]/90 mb-1">
              {isArabic ? 'الوجهة المتجه إليها' : 'Destination'}
            </span>
            {/* العنوان يظهر كاملاً بدون اقتطاع تحت أي ظرف */}
            <h3
              className="text-base sm:text-lg font-black text-white leading-relaxed break-words whitespace-normal"
              dir="auto"
            >
              {activeTrip.destinationLabel || (isArabic ? 'الوجهة المحددة' : 'Selected Destination')}
            </h3>
          </div>
        </div>
      </div>

      {/* 3. صندوق أمان وسلامة الراكب والتحقق من لوحة السيارة */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-amber-500/40 bg-gradient-to-b from-amber-500/15 via-[#0B1220] to-[#050912] p-4 sm:p-5 shadow-xl shadow-amber-500/10">
        {/* شريط التنبيه البارز وبخط كبير جداً */}
        <div className="flex items-center gap-2.5 pb-3 border-b border-amber-500/25">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
            <ShieldAlert className="h-5 w-5 text-amber-400 animate-pulse" />
          </div>
          <div>
            <h4 className="text-base sm:text-lg font-black text-amber-300 leading-tight">
              {isArabic ? 'عليك التحقق من لوحة السيارة' : 'Verify vehicle plate before boarding'}
            </h4>
            <p className="text-[10px] sm:text-xs font-bold text-amber-200/80 mt-0.5">
              {isArabic ? 'لأمانك، تأكد من مطابقة رقم اللوحة ونوع السيارة ولونها قبل الركوب' : 'For your safety, match the plate, model, and color before boarding'}
            </p>
          </div>
        </div>

        {/* 1. بوكس رقم اللوحة بعرض الكارد بالكامل وبخط ضخم */}
        <div className="mt-3.5 flex flex-col items-center justify-center rounded-xl border-2 border-[#14B8A6]/40 bg-[#02050B] p-3.5 text-center shadow-inner">
          <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-300 mb-1">
            {isArabic ? 'رقم اللوحة' : 'License Plate'}
          </span>
          <strong className="font-mono text-3xl sm:text-4xl font-black tracking-widest text-[#14F5D5] drop-shadow-[0_0_14px_rgba(20,245,213,0.55)] py-1">
            {plateNumber}
          </strong>
        </div>

        {/* 2. تحته بوكسين: واحد لنوع السيارة والتاني للون السيارة */}
        <div className="mt-2.5 grid grid-cols-2 gap-2.5">
          {/* بوكس نوع السيارة */}
          <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-black/30 p-3 text-center min-w-0">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-400 mb-1">
              {isArabic ? 'نوع السيارة' : 'Vehicle Model'}
            </span>
            <div className="flex items-center justify-center gap-1.5 max-w-full">
              <Car className="h-4 w-4 text-[#14F5D5] shrink-0" />
              <strong className="text-sm sm:text-base font-black text-white truncate">
                {vehicleModel}
              </strong>
            </div>
          </div>

          {/* بوكس لون السيارة */}
          <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-black/30 p-3 text-center min-w-0">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-400 mb-1">
              {isArabic ? 'لون السيارة' : 'Vehicle Color'}
            </span>
            <div className="flex items-center justify-center gap-1.5 max-w-full">
              <Palette className="h-4 w-4 text-[#14F5D5] shrink-0" />
              <strong className="text-sm sm:text-base font-black text-white truncate">
                {vehicleColor || (isArabic ? 'غير محدد' : 'Not specified')}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* 4. كارد السعر النهائي المحدد */}
      <div className="flex items-center justify-between rounded-2xl border border-[#14B8A6]/25 bg-gradient-to-r from-[#14B8A6]/10 via-[#0B1424] to-[#040812] px-5 py-4 shadow-lg">
        <div>
          <span className="block text-[11px] font-black uppercase tracking-wider text-slate-400">
            {isArabic ? 'تكلفة الرحلة النهائية' : t('trip.finalCost')}
          </span>
          <span className="block text-[10px] font-bold text-[#14F5D5]/80 mt-0.5">
            {isArabic ? 'سعر ثابت ومؤكد شامل الرحلة' : 'Fixed guaranteed fare'}
          </span>
        </div>
        <div className="text-end" dir="ltr">
          <span className="text-2xl sm:text-3xl font-black font-mono text-[#14F5D5] drop-shadow-[0_0_10px_rgba(20,245,213,0.3)]">
            {formatMoney(activeTrip.finalPrice, currencyLabel)}
          </span>
        </div>
      </div>

      {/* 5. أزرار الإجراءات والتواصل فوق زر الإلغاء */}
      <div className="space-y-2.5 pt-1">
        {/* صف زري الاتصال بالكابتن وواتساب الطوارئ مع كتابة الوظيفة عليهما بوضوح */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* زر الاتصال بالكابتن */}
          <a
            href={captainPhone ? `tel:${captainPhone}` : '#'}
            onClick={(e) => {
              if (!captainPhone) {
                e.preventDefault();
              }
            }}
            className={cn(
              "flex items-center justify-center gap-2 h-12 rounded-xl border border-[#14B8A6]/40 bg-[#14B8A6]/15 hover:bg-[#14B8A6]/25 text-[#14F5D5] font-black text-xs sm:text-sm py-2.5 transition-all active:scale-[0.98] cursor-pointer shadow-md shadow-[#14B8A6]/10",
              !captainPhone && "opacity-50 cursor-not-allowed pointer-events-none"
            )}
            title={isArabic ? 'اتصال بالكابتن' : t('trip.callCaptain')}
          >
            <Phone className="h-4 w-4 shrink-0" />
            <span className="truncate">{isArabic ? 'اتصال بالكابتن' : 'Call Captain'}</span>
          </a>

          {/* زر واتساب طوارئ */}
          <button
            type="button"
            onClick={onEmergencyWhatsapp}
            className="flex items-center justify-center gap-2 h-12 rounded-xl border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-black text-xs sm:text-sm py-2.5 transition-all active:scale-[0.98] cursor-pointer shadow-md shadow-emerald-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
            title={isArabic ? 'واتساب طوارئ' : 'Emergency WhatsApp'}
          >
            <MessageCircle className="h-4 w-4 shrink-0 text-emerald-400" />
            <span className="truncate">{isArabic ? 'واتساب طوارئ' : 'Emergency WhatsApp'}</span>
          </button>
        </div>

        {/* زر إلغاء الطلب بكامل العرض في الأسفل (أو زر SOS إذا بدأت الرحلة) */}
        {!tripHasStarted ? (
          <button
            type="button"
            onClick={onCancelRideRequest}
            disabled={isCancellingRideRequest}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-xl border border-rose-500/40 bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 font-black text-sm py-2.5 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 shadow-md shadow-rose-500/10"
          >
            <X className="h-4 w-4 text-rose-400" />
            <span>{isCancellingRideRequest ? t('trip.cancelling') : (isArabic ? 'إلغاء الطلب' : t('trip.cancel'))}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onEmergencyWhatsapp}
            className="w-full flex items-center justify-center gap-2 h-12 bg-red-600/90 hover:bg-red-500 text-white font-black text-sm py-2.5 rounded-xl transition-all active:scale-[0.98] cursor-pointer shadow-lg shadow-red-600/25"
          >
            <ShieldCheck className="h-5 w-5 animate-pulse" />
            <span>{t('emergency.sosButton')}</span>
          </button>
        )}

        {/* روابط السوشيال إن وجدت في الأسفل */}
        {(activeTrip.captain?.facebook_url || activeTrip.captain?.instagram_url) && (
          <div className="flex items-center justify-center gap-2 pt-1">
            {activeTrip.captain?.facebook_url && (
              <a
                href={activeTrip.captain.facebook_url}
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                title="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
            )}
            {activeTrip.captain?.instagram_url && (
              <a
                href={activeTrip.captain.instagram_url}
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                title="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
