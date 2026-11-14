'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface WalletDirectTopupAmountsProps {
  captainCurrency: string;
  directCashAmount: string;
  setDirectCashAmount: (val: string) => void;
  directMinutes: string;
  setDirectMinutes: (val: string) => void;
  isArabic: boolean;
  t: (key: string, values?: Record<string, any>) => string;
}

export function WalletDirectTopupAmounts({
  captainCurrency,
  directCashAmount,
  setDirectCashAmount,
  directMinutes,
  setDirectMinutes,
  isArabic,
  t,
}: WalletDirectTopupAmountsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* Cash Recharge */}
      <div className="space-y-2.5 p-4 rounded-2xl bg-black/40 border border-white/5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold text-amber-300">
            {t('cashTopupOption', { currency: captainCurrency })}
          </Label>
          <span className="text-[10px] text-slate-500">{t('addedToWallet')}</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {['5', '10', '20', '50'].map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => setDirectCashAmount(amt)}
              className={cn(
                "py-1.5 rounded-xl border text-xs font-mono font-bold transition",
                directCashAmount === amt
                  ? "border-amber-500 bg-amber-500/20 text-amber-300"
                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              )}
            >
              +{amt} {captainCurrency}
            </button>
          ))}
        </div>
        <Input
          type="number"
          step="0.5"
          min="0"
          value={directCashAmount}
          onChange={(e) => setDirectCashAmount(e.target.value)}
          placeholder={t('cashAmountPlaceholder', { currency: captainCurrency })}
          className={cn("bg-black/60 border-white/10 text-white font-mono text-sm h-10 rounded-xl focus:border-amber-500/50", isArabic ? "text-right" : "text-left")}
        />
      </div>

      {/* Radar Minutes Recharge */}
      <div className="space-y-2.5 p-4 rounded-2xl bg-black/40 border border-white/5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold text-teal-300">
            {t('minutesTopupOption')}
          </Label>
          <span className="text-[10px] text-slate-500">{t('directMinutesSubtitle')}</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { m: '60', l: isArabic ? '+1 س' : '+1 hr' },
            { m: '300', l: isArabic ? '+5 س' : '+5 hrs' },
            { m: '600', l: isArabic ? '+10 س' : '+10 hrs' },
            { m: '1440', l: isArabic ? '+24 س' : '+24 hrs' },
          ].map((pkg) => (
            <button
              key={pkg.m}
              type="button"
              onClick={() => setDirectMinutes(pkg.m)}
              className={cn(
                "py-1.5 rounded-xl border text-xs font-mono font-bold transition",
                directMinutes === pkg.m
                  ? "border-teal-500 bg-teal-500/20 text-teal-300"
                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              )}
            >
              {pkg.l}
            </button>
          ))}
        </div>
        <Input
          type="number"
          min="0"
          value={directMinutes}
          onChange={(e) => setDirectMinutes(e.target.value)}
          placeholder={t('minutesPlaceholder')}
          className={cn("bg-black/60 border-white/10 text-white font-mono text-sm h-10 rounded-xl focus:border-teal-500/50", isArabic ? "text-right" : "text-left")}
        />
      </div>
    </div>
  );
}
