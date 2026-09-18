'use client';

import React from 'react';
import { MapPin, Activity, ShieldAlert, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdvertiserHeatmapProps {
  pulseData: any[] | null;
  selectedDistrict: string;
  onSelectDistrict: (district: string) => void;
  onRedirectToNaour: () => void;
}

export function AdvertiserHeatmap({
  pulseData,
  selectedDistrict,
  onSelectDistrict,
  onRedirectToNaour,
}: AdvertiserHeatmapProps) {
  const governorates = [
    { name: 'عمان', activeAds: 12, capacity: 'عالية', status: 'مزدحم' },
    { name: 'إربد', activeAds: 8, capacity: 'متوسطة', status: 'نشط' },
    { name: 'الزرقاء', activeAds: 7, capacity: 'عالية', status: 'نشط' },
    { name: 'البلقاء', activeAds: 4, capacity: 'متاحة', status: 'فرصة ذهبية' },
    { name: 'العقبة', activeAds: 5, capacity: 'متاحة', status: 'سياحي نشط' },
    { name: 'مادبا', activeAds: 3, capacity: 'متاحة', status: 'فرصة ذهبية' },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-[#070b14] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-emerald-400" />
          <h3 className="text-sm font-black text-white">الخريطة الحرارية ونبض الزخم الإعلاني</h3>
        </div>
        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
          تحديث لحظي
        </span>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        توزيع حركة الركاب وتواجد الكباتن عبر المحافظات الأردنية لاختيار النطاق الجغرافي ذي المردود الأعلى.
      </p>

      {/* Grid of Governorates */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {governorates.map((gov) => {
          const isSelected = selectedDistrict === gov.name;
          return (
            <button
              key={gov.name}
              type="button"
              onClick={() => onSelectDistrict(gov.name)}
              className={`flex flex-col items-start p-3 rounded-xl border transition-all text-right ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-950/30 ring-1 ring-emerald-500/50'
                  : 'border-white/5 bg-black/30 hover:border-white/20 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-black text-white">{gov.name}</span>
                <span className="text-[9px] font-bold text-[#14F5D5] bg-[#14F5D5]/10 px-1.5 py-0.5 rounded-md">
                  {gov.status}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between w-full text-[10px] text-slate-400 font-mono">
                <span>{gov.activeAds} حملات نشطة</span>
                <span className="text-emerald-400 font-bold">{gov.capacity}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Capacity Alert Banner */}
      {selectedDistrict === 'وادي السير' && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
            <p className="text-xs font-bold text-amber-200">
              منطقة وادي السير بلغت الحد الأقصى للسعة الإعلانية لمنع التزاحم.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={onRedirectToNaour}
            className="h-8 rounded-lg bg-amber-400 text-black font-black text-xs hover:bg-amber-300"
          >
            <Sparkles className="h-3 w-3 ml-1" />
            تحويل إلى لواء ناعور (خصم 40%)
          </Button>
        </div>
      )}
    </div>
  );
}
