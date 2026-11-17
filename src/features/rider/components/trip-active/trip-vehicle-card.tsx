'use client';

import React from 'react';
import { Car, Palette, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sanitizeVehicleField } from '../../services/rider-offer-fields';

export interface TripVehicleCardProps {
  isArabic: boolean;
  plateNumber: string;
  vehicleModel: string;
  vehicleColor: string;
}

export function TripVehicleCard({
  isArabic,
  plateNumber,
  vehicleModel,
  vehicleColor,
}: TripVehicleCardProps) {
  const cleanPlate = sanitizeVehicleField(plateNumber);
  const cleanModel = sanitizeVehicleField(vehicleModel);
  const cleanColor = sanitizeVehicleField(vehicleColor);

  if (!cleanPlate && !cleanModel && !cleanColor) {
    return null;
  }

  const hasBottomDetails = Boolean(cleanModel || cleanColor);
  const hasBothBottomDetails = Boolean(cleanModel && cleanColor);

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-amber-500/40 bg-gradient-to-b from-amber-500/15 via-[#0B1220] to-[#050912] p-4 sm:p-5 shadow-xl shadow-amber-500/10">
      {/* شريط التنبيه البارز */}
      <div className="flex items-center gap-2.5 pb-3 border-b border-amber-500/25">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
          <ShieldAlert className="h-5 w-5 text-amber-400 animate-pulse" />
        </div>
        <div>
          <p className="text-[10px] sm:text-xs font-bold text-amber-200/80 mt-0.5">
            {isArabic ? 'تحقق من مصداقية البيانات المعروضة في الخدمة' : 'Verify the authenticity of the data displayed in the service'}
          </p>
        </div>
      </div>

      {/* رقم اللوحة بعرض الكارد بالكامل - يظهر فقط عند توفر رقم لوحة حقيقي */}
      {cleanPlate ? (
        <div className="mt-3.5 flex flex-col items-center justify-center rounded-xl border-2 border-[#14B8A6]/40 bg-[#02050B] p-3.5 text-center shadow-inner">
          <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-300 mb-1">
            {isArabic ? 'رقم اللوحة' : 'License Plate'}
          </span>
          <strong className="font-mono text-3xl sm:text-4xl font-black tracking-widest text-[#14F5D5] drop-shadow-[0_0_14px_rgba(20,245,213,0.55)] py-1">
            {cleanPlate}
          </strong>
        </div>
      ) : null}

      {/* نوع السيارة ولون السيارة (يُخفى اللون تماماً إذا لم يكن متوفراً) */}
      {hasBottomDetails ? (
        <div className={cn('mt-2.5 grid gap-2.5', hasBothBottomDetails ? 'grid-cols-2' : 'grid-cols-1')}>
          {cleanModel ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-black/30 p-3 text-center min-w-0">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-400 mb-1">
                {isArabic ? 'نوع السيارة' : 'Vehicle Model'}
              </span>
              <div className="flex items-center justify-center gap-1.5 max-w-full">
                <Car className="h-4 w-4 text-[#14F5D5] shrink-0" />
                <strong className="text-sm sm:text-base font-black text-white truncate">
                  {cleanModel}
                </strong>
              </div>
            </div>
          ) : null}

          {cleanColor ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-black/30 p-3 text-center min-w-0">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-400 mb-1">
                {isArabic ? 'لون السيارة' : 'Vehicle Color'}
              </span>
              <div className="flex items-center justify-center gap-1.5 max-w-full">
                <Palette className="h-4 w-4 text-[#14F5D5] shrink-0" />
                <strong className="text-sm sm:text-base font-black text-white truncate">
                  {cleanColor}
                </strong>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
