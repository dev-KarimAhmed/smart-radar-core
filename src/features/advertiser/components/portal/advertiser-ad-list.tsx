'use client';

import React from 'react';
import { Eye, MousePointerClick, Trash2, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdvertiserAdListProps {
  ads: any[];
  onToggleStatus: (id: string, currentStatus: string) => void;
  onDeleteAd: (id: string) => void;
  onExtendAd: (id: string) => void;
}

export function AdvertiserAdList({
  ads,
  onToggleStatus,
  onDeleteAd,
  onExtendAd,
}: AdvertiserAdListProps) {
  if (ads.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#070b14] p-8 text-center text-slate-400 space-y-2">
        <p className="text-sm font-bold text-white">لا توجد حملات إعلانية مسجلة حالياً</p>
        <p className="text-xs">ابدأ بإنشاء حملتك الإعلانية الأولى واكسب وصولاً جغرافياً مباشراً.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-black text-white px-1">سجل حملاتك الإعلانية</h3>
      <div className="grid grid-cols-1 gap-3">
        {ads.map((ad) => {
          const isActive = ad.status === 'active';
          const isPending = (ad.status || '').toLowerCase() === 'pending';

          return (
            <div
              key={ad.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-white/10 bg-[#070b14] hover:border-white/20 transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-white">{ad.title}</span>
                  <span
                    className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : isPending
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {isActive ? 'نشط ميدانياً' : isPending ? 'قيد المراجعة' : 'متوقف'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-1">{ad.description}</p>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono pt-1">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3 text-emerald-400" />
                    {ad.currentImpressions || 0} / {ad.targetImpressions || 0} ظهور
                  </span>
                  <span className="flex items-center gap-1">
                    <MousePointerClick className="h-3 w-3 text-[#14F5D5]" />
                    {ad.clicksCount || 0} نقرة
                  </span>
                  <span>{ad.targetDistrict || 'كافة الألوية'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onToggleStatus(ad.id, ad.status)}
                  className="h-9 rounded-xl border-white/10 text-xs font-bold text-slate-300 hover:text-white"
                >
                  {isActive ? 'إيقاف مؤقت' : 'تفعيل'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onExtendAd(ad.id)}
                  className="h-9 rounded-xl border-emerald-500/30 bg-emerald-950/20 text-xs font-bold text-emerald-300 hover:bg-emerald-900/30"
                >
                  <Clock className="h-3 w-3 ml-1" />
                  تمديد 72 ساعة
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteAd(ad.id)}
                  className="h-9 w-9 p-0 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/20"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
