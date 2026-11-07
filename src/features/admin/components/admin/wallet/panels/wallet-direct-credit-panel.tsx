'use client';

import React from 'react';
import { Zap, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { CaptainOption } from '../wallet-types';

interface WalletDirectCreditPanelProps {
  captainsList: CaptainOption[];
  loadingCaptains: boolean;
  selectedCaptain: CaptainOption | null;
  setSelectedCaptain: (c: CaptainOption | null) => void;
  directCashAmount: string;
  setDirectCashAmount: (v: string) => void;
  directMinutes: string;
  setDirectMinutes: (v: string) => void;
  directExtendDays: number;
  setDirectExtendDays: (days: number) => void;
  directNote: string;
  setDirectNote: (note: string) => void;
  submittingDirectTopup: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isArabic: boolean;
  t: (key: any, values?: any) => string;
}

export function WalletDirectCreditPanel({
  captainsList,
  loadingCaptains,
  selectedCaptain,
  setSelectedCaptain,
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
}: WalletDirectCreditPanelProps) {
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
                const cap = captainsList.find((c) => c.id === e.target.value) || null;
                setSelectedCaptain(cap);
              }}
              className={cn(
                "w-full h-11 bg-black/60 border border-white/10 focus:border-teal-500/50 rounded-xl px-3 text-white text-xs outline-none cursor-pointer",
                isArabic ? "text-right" : "text-left"
              )}
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

          {/* Selected Captain Balance Preview */}
          {selectedCaptain && (
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-black/40 border border-teal-500/20 text-xs mt-2">
              <div>
                <span className="text-slate-400 text-[11px] block">{t('currentCashBalance')}</span>
                <span className="font-mono text-base font-black text-amber-400">
                  {selectedCaptain.wallet?.balance?.toFixed(2) || '0.00'}{' '}
                  {selectedCaptain.currency ||
                    (selectedCaptain.phone?.startsWith('+20')
                      ? isArabic
                        ? 'ج.م'
                        : 'EGP'
                      : isArabic
                      ? 'د.أ'
                      : 'JOD')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">{t('currentFlightMinutes')}</span>
                <span className="font-mono text-base font-black text-teal-400">
                  {t('minutesWithHours', {
                    minutes: selectedCaptain.wallet?.total_minutes || 0,
                    hours: ((selectedCaptain.wallet?.total_minutes || 0) / 60).toFixed(1),
                  })}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Recharge Amounts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Cash Recharge */}
          <div className="space-y-2.5 p-4 rounded-2xl bg-black/40 border border-white/5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-amber-300">
                {t('cashTopupOption', {
                  currency: selectedCaptain
                    ? selectedCaptain.currency ||
                      (selectedCaptain.phone?.startsWith('+20')
                        ? isArabic
                          ? 'ج.م'
                          : 'EGP'
                        : isArabic
                        ? 'د.أ'
                        : 'JOD')
                    : isArabic
                    ? 'العملة المحلية'
                    : 'Local Currency',
                })}
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
                    "py-1.5 rounded-xl border text-xs font-mono font-bold transition cursor-pointer",
                    directCashAmount === amt
                      ? "border-amber-500 bg-amber-500/20 text-amber-300"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  )}
                >
                  +{amt}{' '}
                  {selectedCaptain
                    ? selectedCaptain.currency ||
                      (selectedCaptain.phone?.startsWith('+20')
                        ? isArabic
                          ? 'ج.م'
                          : 'EGP'
                        : isArabic
                        ? 'د.أ'
                        : 'JOD')
                    : isArabic
                    ? 'د.أ'
                    : 'JOD'}
                </button>
              ))}
            </div>
            <Input
              type="number"
              step="0.5"
              min="0"
              value={directCashAmount}
              onChange={(e) => setDirectCashAmount(e.target.value)}
              placeholder={t('cashAmountPlaceholder', {
                currency: selectedCaptain
                  ? selectedCaptain.currency ||
                    (selectedCaptain.phone?.startsWith('+20')
                      ? isArabic
                        ? 'الجنيه'
                        : 'EGP'
                      : isArabic
                      ? 'الدينار'
                      : 'JOD')
                  : isArabic
                  ? 'العملة'
                  : 'Currency',
              })}
              className={cn(
                "bg-black/60 border-white/10 text-white font-mono text-sm h-10 rounded-xl focus:border-amber-500/50",
                isArabic ? "text-right" : "text-left"
              )}
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
                    "py-1.5 rounded-xl border text-xs font-mono font-bold transition cursor-pointer",
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
              className={cn(
                "bg-black/60 border-white/10 text-white font-mono text-sm h-10 rounded-xl focus:border-teal-500/50",
                isArabic ? "text-right" : "text-left"
              )}
            />
          </div>
        </div>

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
                    "py-2 rounded-xl border text-xs font-bold transition cursor-pointer",
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
          className="w-full bg-teal-500 hover:bg-teal-600 text-[#0B0F19] font-black text-sm h-11 rounded-xl shadow-lg transition-all cursor-pointer"
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
