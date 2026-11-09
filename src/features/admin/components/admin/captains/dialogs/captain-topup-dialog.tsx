'use client';

import React from 'react';
import {
  Zap,
  Clock,
  DollarSign,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { CaptainUser, getCaptainCurrency } from '../captains-types';

interface CaptainTopupDialogProps {
  captain: CaptainUser | null;
  open?: boolean;
  onClose: () => void;
  isArabic: boolean;
  direction: 'rtl' | 'ltr';
  topupMode: 'minutes' | 'cash';
  setTopupMode: (mode: 'minutes' | 'cash') => void;
  minutesToAdd: number;
  setMinutesToAdd: (m: number) => void;
  cashBalanceToAdd: number;
  setCashBalanceToAdd: (c: number) => void;
  extendDays: number;
  setExtendDays?: (d: number) => void;
  submittingAction: boolean;
  executeAdminAction?: (payload: Record<string, any>, successMsg: string) => Promise<boolean>;
  onTopupMinutes?: (captainId: string, minutes: number, extendDays: number) => Promise<boolean>;
  onTopupCash?: (captainId: string, amount: number, currency: string) => Promise<boolean>;
  t: (key: any, values?: any) => string;
}

export function CaptainTopupDialog({
  captain,
  open,
  onClose,
  isArabic,
  direction,
  topupMode,
  setTopupMode,
  minutesToAdd,
  setMinutesToAdd,
  cashBalanceToAdd,
  setCashBalanceToAdd,
  extendDays,
  setExtendDays,
  submittingAction,
  executeAdminAction,
  onTopupMinutes,
  onTopupCash,
  t,
}: CaptainTopupDialogProps) {
  if (!captain) return null;
  const capCurr = getCaptainCurrency(captain, isArabic);

  return (
    <Dialog open={open ?? Boolean(captain)} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className={cn(
          "max-w-md bg-[#0B0F19] border border-[#14B8A6]/40 text-white rounded-3xl p-6",
          isArabic ? "text-right" : "text-left"
        )}
        dir={direction}
      >
        <div className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#14B8A6]" />
              {t('topupTitle', { name: captain.full_name })}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 mt-1">
              {t('topupDesc')}
            </DialogDescription>
          </DialogHeader>

          {/* Current Wallet status */}
          <div className="bg-black/60 border border-white/10 p-3.5 rounded-2xl grid grid-cols-2 gap-3 text-xs font-mono">
            <div>
              <span className="text-slate-500 text-[10px] block">{t('remainingRadarMinutes')}</span>
              <span className="text-base font-black text-[#14B8A6]">
                {captain.wallet.total_minutes} {t('minuteUnit')}
              </span>
              <span className="text-[10px] text-slate-400 block">
                ≈ {((captain.wallet.total_minutes || 0) / 60).toFixed(1)} {isArabic ? 'س' : 'h'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">{t('currentCashBalance')}</span>
              <span className="text-base font-black text-amber-400">
                {(captain.wallet.balance || 0).toFixed(2)} {capCurr}
              </span>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTopupMode('minutes')}
              className={cn(
                "py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer",
                topupMode === 'minutes'
                  ? "border-[#14B8A6] bg-[#14B8A6]/20 text-[#14B8A6]"
                  : "border-white/10 bg-black/40 text-slate-400 hover:text-white"
              )}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{t('minutesMode')}</span>
            </button>

            <button
              type="button"
              onClick={() => setTopupMode('cash')}
              className={cn(
                "py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer",
                topupMode === 'cash'
                  ? "border-amber-500 bg-amber-500/20 text-amber-300"
                  : "border-white/10 bg-black/40 text-slate-400 hover:text-white"
              )}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>{t('cashMode')} ({capCurr})</span>
            </button>
          </div>

          {/* Topup Mode: Minutes */}
          {topupMode === 'minutes' ? (
            <>
              {/* Quick Packages */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">{t('quickMinutesPackLabel')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { m: 60, label: `+60 ${t('minuteUnit')}`, sub: isArabic ? 'ساعة رادار' : '1 Flight Hour' },
                    { m: 300, label: `+300 ${t('minuteUnit')}`, sub: isArabic ? '5 ساعات' : '5 Flight Hours' },
                    { m: 600, label: `+600 ${t('minuteUnit')}`, sub: isArabic ? '10 ساعات' : '10 Flight Hours' },
                    { m: 1440, label: `+1440 ${t('minuteUnit')}`, sub: isArabic ? '24 ساعة (يوم)' : '24 Hours (Full Day)' },
                  ].map((pkg) => (
                    <button
                      key={pkg.m}
                      type="button"
                      onClick={() => setMinutesToAdd(pkg.m)}
                      className={cn(
                        "p-2.5 rounded-xl border transition cursor-pointer flex flex-col justify-between",
                        isArabic ? "text-right" : "text-left",
                        minutesToAdd === pkg.m
                          ? "border-[#14B8A6] bg-[#14B8A6]/10 text-white"
                          : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                      )}
                    >
                      <span className="font-mono font-black text-sm">{pkg.label}</span>
                      <span className="text-[10px] text-slate-400">{pkg.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Minutes Input */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">{t('orEnterMinutesManually')}</label>
                <Input
                  type="number"
                  min="1"
                  value={minutesToAdd}
                  onChange={(e) => setMinutesToAdd(Number(e.target.value))}
                  className={cn(
                    "bg-black/60 border-white/10 text-white font-mono h-10 rounded-xl focus:border-[#14B8A6]",
                    isArabic ? "text-right" : "text-left"
                  )}
                />
              </div>
            </>
          ) : (
            /* Topup Mode: Cash */
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300 block">
                {t('quickCashPackLabel', { currency: capCurr })}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 20, 50].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCashBalanceToAdd(amt)}
                    className={cn(
                      "py-2 rounded-xl border text-xs font-mono font-bold transition cursor-pointer",
                      cashBalanceToAdd === amt
                        ? "border-amber-500 bg-amber-500/20 text-amber-300"
                        : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                    )}
                  >
                    +{amt} {capCurr}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  {t('orEnterCashManually', { currency: capCurr })}
                </label>
                <Input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={cashBalanceToAdd}
                  onChange={(e) => setCashBalanceToAdd(Number(e.target.value))}
                  className={cn(
                    "bg-black/60 border-white/10 text-white font-mono h-10 rounded-xl focus:border-amber-500",
                    isArabic ? "text-right" : "text-left"
                  )}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-white/10 text-slate-300 text-xs h-9 rounded-xl cursor-pointer"
            >
              {t('cancelBtn')}
            </Button>

            <Button
              type="button"
              disabled={submittingAction || (topupMode === 'minutes' ? minutesToAdd <= 0 : cashBalanceToAdd <= 0)}
              onClick={async () => {
                if (topupMode === 'minutes') {
                  if (onTopupMinutes) {
                    const ok = await onTopupMinutes(captain.id, minutesToAdd, extendDays);
                    if (ok) onClose();
                  } else if (executeAdminAction) {
                    const ok = await executeAdminAction(
                      { action: 'TOPUP_HOURS', captainId: captain.id, minutesToAdd, extendDays },
                      t('topupSuccess') || 'تم الشحن بنجاح'
                    );
                    if (ok) onClose();
                  }
                } else {
                  if (onTopupCash) {
                    const ok = await onTopupCash(captain.id, cashBalanceToAdd, capCurr);
                    if (ok) onClose();
                  } else if (executeAdminAction) {
                    const ok = await executeAdminAction(
                      { action: 'TOPUP_CASH', captainId: captain.id, cashAmount: cashBalanceToAdd, currency: capCurr },
                      t('topupSuccess') || 'تم الشحن بنجاح'
                    );
                    if (ok) onClose();
                  }
                }
              }}
              className={cn(
                "font-black text-xs h-10 px-5 rounded-xl shadow-lg transition-all cursor-pointer",
                topupMode === 'minutes'
                  ? "bg-[#14B8A6] hover:bg-[#2DD4BF] text-[#0B0F19] shadow-[#14B8A6]/20"
                  : "bg-amber-500 hover:bg-amber-600 text-black shadow-amber-500/20"
              )}
            >
              {submittingAction ? (
                <Loader2 className="h-4 w-4 animate-spin ml-1" />
              ) : (
                <Zap className="h-4 w-4 ml-1" />
              )}
              {topupMode === 'minutes' ? t('confirmMinutesTopup') : t('confirmCashDeposit')}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
