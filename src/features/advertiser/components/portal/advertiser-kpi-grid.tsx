'use client';

import React from 'react';
import { Eye, MousePointerClick, TrendingUp, Heart, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { cn } from '@/lib/utils';

interface AdvertiserKpiGridProps {
  ledgerStats: {
    impressions: number;
    clicks: number;
    ctr: string;
    followerPulse: number;
  };
  advertiserBalance: number;
  onOpenDeposit: () => void;
}

const copy = {
  ar: {
    balanceTitle: 'رصيد الإعلانات السيادي المسبق',
    currency: 'د.أ',
    rechargeBtn: 'شحن الرصيد الفوري (Zain Cash / CliQ)',
    impressions: 'المشاهدات المحققة',
    impressionsSub: 'وصول جغرافي مباشر',
    clicks: 'النقرات والاستحواذ',
    clicksSub: 'تفاعل مباشر Zero-Click',
    ctr: 'معدل التحويل (CTR)',
    ctrSub: 'أعلى من متوسط السوق بـ 3.2x',
    saved: 'نبض الحفظ والتفضيل',
    savedSub: 'إعلان محفوظ في الذاكرة',
  },
  en: {
    balanceTitle: 'Prepaid Sovereign Ad Balance',
    currency: 'JOD',
    rechargeBtn: 'Instant Balance Recharge (Zain Cash / CliQ)',
    impressions: 'Delivered Impressions',
    impressionsSub: 'Direct Geospatial Reach',
    clicks: 'Clicks & Conversions',
    clicksSub: 'Zero-Click Direct Action',
    ctr: 'Click-Through Rate (CTR)',
    ctrSub: '3.2x Above Market Average',
    saved: 'Saves & Favorites',
    savedSub: 'Stored in In-Memory Vault',
  },
} as const;

export function AdvertiserKpiGrid({
  ledgerStats,
  advertiserBalance,
  onOpenDeposit,
}: AdvertiserKpiGridProps) {
  const { isArabic, direction } = useDashboardLanguage();
  const t = copy[isArabic ? 'ar' : 'en'];

  return (
    <div className={cn("space-y-4 font-sans", isArabic ? "text-right" : "text-left")} dir={direction}>
      {/* Wallet Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 shrink-0 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400">{t.balanceTitle}</p>
            <p className="text-2xl font-black text-emerald-300 font-mono">
              {advertiserBalance.toFixed(2)}{' '}
              <span className="text-xs font-bold text-slate-300">{t.currency}</span>
            </p>
          </div>
        </div>
        <Button
          type="button"
          onClick={onOpenDeposit}
          className="h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-black text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
        >
          {t.rechargeBtn}
        </Button>
      </div>

      {/* 4 KPIs Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">{t.impressions}</span>
            <Eye className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-xl font-black text-white font-mono">
            {ledgerStats.impressions.toLocaleString()}
          </p>
          <p className="text-[10px] text-emerald-400 font-bold">{t.impressionsSub}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">{t.clicks}</span>
            <MousePointerClick className="h-4 w-4 text-[#14F5D5]" />
          </div>
          <p className="text-xl font-black text-white font-mono">
            {ledgerStats.clicks.toLocaleString()}
          </p>
          <p className="text-[10px] text-[#14F5D5] font-bold">{t.clicksSub}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">{t.ctr}</span>
            <TrendingUp className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-xl font-black text-white font-mono">{ledgerStats.ctr}%</p>
          <p className="text-[10px] text-amber-400 font-bold">{t.ctrSub}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">{t.saved}</span>
            <Heart className="h-4 w-4 text-rose-400" />
          </div>
          <p className="text-xl font-black text-white font-mono">{ledgerStats.followerPulse}</p>
          <p className="text-[10px] text-rose-400 font-bold">{t.savedSub}</p>
        </div>
      </div>
    </div>
  );
}
