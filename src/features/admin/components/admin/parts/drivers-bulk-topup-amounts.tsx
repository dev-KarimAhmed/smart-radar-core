'use client';

import React from 'react';
import { Clock, DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface DriversBulkTopupAmountsProps {
  bulkTopupType: 'minutes' | 'cash';
  setBulkTopupType: (type: 'minutes' | 'cash') => void;
  bulkMinutes: number;
  setBulkMinutes: (min: number) => void;
  bulkCashAmount: number;
  setBulkCashAmount: (amt: number) => void;
  isArabic: boolean;
  t: (key: string, values?: Record<string, any>) => string;
}

export function DriversBulkTopupAmounts({
  bulkTopupType,
  setBulkTopupType,
  bulkMinutes,
  setBulkMinutes,
  bulkCashAmount,
  setBulkCashAmount,
  isArabic,
  t,
}: DriversBulkTopupAmountsProps) {
  return (
    <div className="space-y-3">
      {/* Topup Type Switch */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-300">{t('topupTypeLabel')}</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setBulkTopupType('minutes')}
            className={cn(
              "p-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 cursor-pointer",
              bulkTopupType === 'minutes'
                ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                : "border-white/10 bg-black/40 text-slate-400 hover:text-white"
            )}
          >
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>{t('radarMinutesType')}</span>
          </button>

          <button
            type="button"
            onClick={() => setBulkTopupType('cash')}
            className={cn(
              "p-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 cursor-pointer",
              bulkTopupType === 'cash'
                ? "bg-amber-500/20 border-amber-500 text-amber-300"
                : "border-white/10 bg-black/40 text-slate-400 hover:text-white"
            )}
          >
            <DollarSign className="w-4 h-4 text-amber-400" />
            <span>{t('cashBalanceType')}</span>
          </button>
        </div>
      </div>

      {/* Minutes inputs */}
      {bulkTopupType === 'minutes' && (
        <div className="space-y-3 bg-white/[0.02] border border-white/10 p-3.5 rounded-2xl">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">{t('chooseMinutesCount')}</label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { m: 30, label: `+30 ${t('minuteUnit')}` },
                { m: 60, label: `+60 ${t('minuteUnit')}` },
                { m: 120, label: `+120 ${t('minuteUnit')}` },
                { m: 300, label: `+300 ${t('minuteUnit')}` },
              ].map((p) => (
                <button
                  key={p.m}
                  type="button"
                  onClick={() => setBulkMinutes(p.m)}
                  className={cn(
                    "py-2 rounded-xl text-xs font-mono font-bold border transition text-center cursor-pointer",
                    bulkMinutes === p.m
                      ? "bg-emerald-500/30 border-emerald-400 text-emerald-200"
                      : "bg-black/50 border-white/10 text-slate-400 hover:text-white"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] text-slate-400 shrink-0">{t('orCustomMinutes')}</span>
              <Input
                type="number"
                min="5"
                step="5"
                value={bulkMinutes}
                onChange={(e) => setBulkMinutes(Math.max(1, Number(e.target.value)))}
                className={cn("bg-black/60 border-white/10 text-white font-mono h-9 rounded-xl focus:border-emerald-500 text-xs", isArabic ? "text-right" : "text-left")}
                placeholder={t('minuteUnit')}
              />
              <span className="text-xs text-slate-400">{t('minuteUnit')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Cash inputs */}
      {bulkTopupType === 'cash' && (
        <div className="space-y-3 bg-white/[0.02] border border-white/10 p-3.5 rounded-2xl">
          <label className="text-xs font-bold text-slate-300">{t('chooseCashDeposit')}</label>
          <div className="grid grid-cols-4 gap-1.5">
            {[5, 10, 20, 50].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setBulkCashAmount(amt)}
                className={cn(
                  "py-2 rounded-xl text-xs font-mono font-bold border transition text-center cursor-pointer",
                  bulkCashAmount === amt
                    ? "bg-amber-500/30 border-amber-400 text-amber-200"
                    : "bg-black/50 border-white/10 text-slate-400 hover:text-white"
                )}
              >
                +{amt}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-2">
            <span className="text-[11px] text-slate-400 shrink-0">{t('orCustomCash')}</span>
            <Input
              type="number"
              min="1"
              value={bulkCashAmount}
              onChange={(e) => setBulkCashAmount(Math.max(1, Number(e.target.value)))}
              className={cn("bg-black/60 border-white/10 text-white font-mono h-9 rounded-xl focus:border-amber-500 text-xs", isArabic ? "text-right" : "text-left")}
              placeholder={isArabic ? 'د.أ / ج.م' : 'JOD / EGP'}
            />
          </div>
        </div>
      )}
    </div>
  );
}

