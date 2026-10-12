'use client';

import React from 'react';
import { Eye, MousePointerClick, TrendingUp, Heart, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

export function AdvertiserKpiGrid({
  ledgerStats,
  advertiserBalance,
  onOpenDeposit,
}: AdvertiserKpiGridProps) {
  return (
    <div className="space-y-4">
      {/* Wallet Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 shrink-0 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400">رصيد الإعلانات السيادي المسبق</p>
            <p className="text-2xl font-black text-emerald-300 font-mono">
              {advertiserBalance.toFixed(2)}{' '}
              <span className="text-xs font-bold text-slate-300">د.أ</span>
            </p>
          </div>
        </div>
        <Button
          type="button"
          onClick={onOpenDeposit}
          className="h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-black text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
        >
          شحن الرصيد الفوري (Zain Cash / CliQ)
        </Button>
      </div>

      {/* 4 KPIs Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">المشاهدات المحققة</span>
            <Eye className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-xl font-black text-white font-mono">
            {ledgerStats.impressions.toLocaleString()}
          </p>
          <p className="text-[10px] text-emerald-400 font-bold">وصول جغرافي مباشر</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">النقرات والاستحواذ</span>
            <MousePointerClick className="h-4 w-4 text-[#14F5D5]" />
          </div>
          <p className="text-xl font-black text-white font-mono">
            {ledgerStats.clicks.toLocaleString()}
          </p>
          <p className="text-[10px] text-[#14F5D5] font-bold">تفاعل مباشر Zero-Click</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">معدل التحويل (CTR)</span>
            <TrendingUp className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-xl font-black text-white font-mono">{ledgerStats.ctr}%</p>
          <p className="text-[10px] text-amber-400 font-bold">أعلى من متوسط السوق بـ 3.2x</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">نبض الحفظ والتفضيل</span>
            <Heart className="h-4 w-4 text-rose-400" />
          </div>
          <p className="text-xl font-black text-white font-mono">{ledgerStats.followerPulse}</p>
          <p className="text-[10px] text-rose-400 font-bold">إعلان محفوظ في الذاكرة</p>
        </div>
      </div>
    </div>
  );
}
