'use client';

import React from 'react';
import { Zap, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CaptainOption } from '@/features/admin/types/admin-wallet';
import { WalletDirectTopupAmounts } from './wallet-direct-topup-amounts';

interface WalletDirectTopupSubtabProps {
  captainsList: CaptainOption[];
  loadingCaptains: boolean;
  selectedCaptain: CaptainOption | null;
  onSelectCaptain: (captain: CaptainOption | null) => void;
  directCashAmount: string;
  setDirectCashAmount: (val: string) => void;
  directMinutes: string;
  setDirectMinutes: (val: string) => void;
  directExtendDays: number;
  setDirectExtendDays: (days: number) => void;
  directNote: string;
  setDirectNote: (val: string) => void;
  submittingDirectTopup: boolean;
  onSubmit: (e: React.FormEvent) => void;
  isArabic: boolean;
  t: (key: string, values?: Record<string, any>) => string;
}

export function WalletDirectTopupSubtab({
  captainsList,
  loadingCaptains,
  selectedCaptain,
  onSelectCaptain,
  directCashAmount,
  setDirectCashAmount,
  directMinutes,
  setDirectMinutes,
  directExtendDays,
  setDirectExtendDays,
  directNote,
  setDirectNote,
  submittingDirectTopup,
  onSubmit,
  isArabic,
  t,
}: WalletDirectTopupSubtabProps) {
  const captainCurrency = selectedCaptain
    ? (selectedCaptain.currency || (selectedCaptain.phone?.startsWith('+20') ? (isArabic ? 'ج.م' : 'EGP') : (isArabic ? 'د.أ' : 'JOD')))
    : (isArabic ? 'د.أ' : 'JOD');

  return (
    <Card className={cn("bg-[#0B0F19]/90 border border-teal-500/20 rounded-3xl p-6 text-white shadow-2xl", isArabic ? "text-right" : "text-left")}>
      <CardHeader className="p-0 mb-6">
        <div className="flex items-center gap-2.5 text-teal-400">
          <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-black text-white">
              {t('directTopupHeading')}
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs mt-0.5">
              {t('directTopupSubheading')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Step 1: Select Captain */}
        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-300">
            {t('selectCaptainLabel')}
          </Label>
          <div className="relative">
            <select
              value={selectedCaptain?.id || ''}
              onChange={(e) => {
                const cap = captainsList.find(c => c.id === e.target.value) || null;
                onSelectCaptain(cap);
              }}
              className={cn("w-full h-11 bg-black/60 border border-white/10 focus:border-teal-500/50 rounded-xl px-3 text-white text-xs outline-none cursor-pointer", isArabic ? "text-right" : "text-left")}
              required
            >
              <option value="" disabled className="bg-[#0B0F19] text-slate-400">
                {loadingCaptains ? t('loadingCaptainsText') : t('chooseCaptainOption')}
              </option>
              {captainsList.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#0B0F19] text-white">
                  {c.full_name} ({c.phone}) - {c.serial_id}
                </option>
              ))}
            </select>
          </div>

          {selectedCaptain && (
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-black/40 border border-teal-500/20 text-xs mt-2">
              <div>
                <span className="text-slate-400 text-[11px] block">{t('currentCashBalance')}</span>
                <span className="font-mono text-base font-black text-amber-400">
                  {selectedCaptain.wallet?.balance?.toFixed(2) || '0.00'} {captainCurrency}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">{t('currentFlightMinutes')}</span>
                <span className="font-mono text-base font-black text-teal-400">
                  {t('minutesWithHours', {
                    minutes: selectedCaptain.wallet?.total_minutes || 0,
                    hours: (((selectedCaptain.wallet?.total_minutes || 0) / 60).toFixed(1)),
                  })}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Recharge Amounts */}
        <WalletDirectTopupAmounts
          captainCurrency={captainCurrency}
          directCashAmount={directCashAmount}
          setDirectCashAmount={setDirectCashAmount}
          directMinutes={directMinutes}
          setDirectMinutes={setDirectMinutes}
          isArabic={isArabic}
          t={t}
        />

        {/* Step 3: Validity extension & Note */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-300">
              {t('extendValidityLabel')}
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { days: 30, l: t('daysUnit', { days: 30 }) },
                { days: 60, l: t('daysUnit', { days: 60 }) },
                { days: 90, l: t('daysUnit', { days: 90 }) },
              ].map((opt) => (
                <button
                  key={opt.days}
                  type="button"
                  onClick={() => setDirectExtendDays(opt.days)}
                  className={cn(
                    "py-2 rounded-xl border text-xs font-bold transition",
                    directExtendDays === opt.days
                      ? "border-teal-500 bg-teal-500/15 text-teal-300"
                      : "border-white/10 bg-black/40 text-slate-400 hover:text-white"
                  )}
                >
                  {opt.l}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-300">
              {t('adminNoteLabel')}
            </Label>
            <Input
              value={directNote}
              onChange={(e) => setDirectNote(e.target.value)}
              placeholder={t('adminNotePlaceholder')}
              className={cn("bg-black/60 border-white/10 text-white text-xs h-10 rounded-xl", isArabic ? "text-right" : "text-left")}
            />
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={submittingDirectTopup || !selectedCaptain}
          className="w-full bg-teal-500 hover:bg-teal-600 text-[#0B0F19] font-black text-sm h-11 rounded-xl shadow-lg transition-all"
        >
          {submittingDirectTopup ? (
            <>
              <Loader2 className={cn("w-4 h-4 animate-spin", isArabic ? "ml-2" : "mr-2")} />
              {t('processingTopup')}
            </>
          ) : (
            <>
              <Zap className={cn("w-4 h-4", isArabic ? "ml-1.5" : "mr-1.5")} />
              {t('confirmDirectTopupBtn')}
            </>
          )}
        </Button>
      </form>
    </Card>
  );
}
