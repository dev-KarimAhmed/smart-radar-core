'use client';

import React from 'react';
import {
  Zap,
  Clock,
  DollarSign,
  CheckCircle2,
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

interface CaptainBulkTopupDialogProps {
  open: boolean;
  onClose: () => void;
  isArabic: boolean;
  direction: 'rtl' | 'ltr';
  bulkScope: 'all' | 'selected' | 'filtered';
  setBulkScope: (scope: 'all' | 'selected' | 'filtered') => void;
  bulkTopupType: 'minutes' | 'cash';
  setBulkTopupType: (type: 'minutes' | 'cash') => void;
  bulkMinutes: number;
  setBulkMinutes: (m: number) => void;
  bulkCashAmount: number;
  setBulkCashAmount: (amt: number) => void;
  submittingBulkTopup: boolean;
  totalCaptainsCount: number;
  selectedCount: number;
  filteredCount: number;
  onConfirmBulkTopup: () => Promise<void>;
  t: (key: any, values?: any) => string;
}

export function CaptainBulkTopupDialog({
  open,
  onClose,
  isArabic,
  direction,
  bulkScope,
  setBulkScope,
  bulkTopupType,
  setBulkTopupType,
  bulkMinutes,
  setBulkMinutes,
  bulkCashAmount,
  setBulkCashAmount,
  submittingBulkTopup,
  totalCaptainsCount,
  selectedCount,
  filteredCount,
  onConfirmBulkTopup,
  t,
}: CaptainBulkTopupDialogProps) {
  const getTargetCount = (scope: 'all' | 'selected' | 'filtered'): number => {
    if (scope === 'all') return totalCaptainsCount;
    if (scope === 'selected') return selectedCount;
    if (scope === 'filtered') return filteredCount;
    return 0;
  };

  const targetCount = getTargetCount(bulkScope);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className={cn(
          "max-w-lg bg-[#0B0F19] border border-[#14B8A6]/30 text-white rounded-3xl p-6",
          isArabic ? "text-right" : "text-left"
        )}
        dir={direction}
      >
        <div className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#14B8A6]" />
              {t('bulkTopupTitle')}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 mt-1">
              {t('bulkTopupSubtitle')}
            </DialogDescription>
          </DialogHeader>

          {/* Target Scope Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">{t('targetScopeLabel')}</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setBulkScope('all')}
                className={cn(
                  "p-2.5 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-1 cursor-pointer",
                  bulkScope === 'all'
                    ? "bg-[#14B8A6]/20 border-[#14B8A6] text-[#14B8A6] shadow-sm ring-1 ring-[#14B8A6]/40"
                    : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
                )}
              >
                <span>{t('scopeAllCaptains')}</span>
                <span className="text-[11px] font-mono opacity-80">({totalCaptainsCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setBulkScope('selected')}
                className={cn(
                  "p-2.5 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-1 cursor-pointer",
                  bulkScope === 'selected'
                    ? "bg-[#14B8A6]/20 border-[#14B8A6] text-[#14B8A6] shadow-sm ring-1 ring-[#14B8A6]/40"
                    : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
                )}
              >
                <span>{t('scopeSelectedCaptains')}</span>
                <span className="text-[11px] font-mono opacity-80">({selectedCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setBulkScope('filtered')}
                className={cn(
                  "p-2.5 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-1 cursor-pointer",
                  bulkScope === 'filtered'
                    ? "bg-[#14B8A6]/20 border-[#14B8A6] text-[#14B8A6] shadow-sm ring-1 ring-[#14B8A6]/40"
                    : "bg-black/40 border-white/10 text-slate-400 hover:text-white"
                )}
              >
                <span>{t('scopeFilteredCaptains')}</span>
                <span className="text-[11px] font-mono opacity-80">({filteredCount})</span>
              </button>
            </div>

            {bulkScope === 'selected' && selectedCount === 0 && (
              <p className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl mt-1.5">
                {t('noCaptainsSelectedWarning')}
              </p>
            )}
          </div>

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
                    className={cn(
                      "bg-black/60 border-white/10 text-white font-mono h-9 rounded-xl focus:border-emerald-500 text-xs",
                      isArabic ? "text-right" : "text-left"
                    )}
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
                  step="0.5"
                  min="0.5"
                  value={bulkCashAmount}
                  onChange={(e) => setBulkCashAmount(Math.max(0.5, Number(e.target.value)))}
                  className={cn(
                    "bg-black/60 border-white/10 text-white font-mono h-9 rounded-xl focus:border-amber-500 text-xs",
                    isArabic ? "text-right" : "text-left"
                  )}
                  placeholder="0.0"
                />
              </div>
            </div>
          )}

          {/* Impact Summary */}
          <div className="bg-[#14B8A6]/10 border border-[#14B8A6]/30 p-3 rounded-2xl text-xs text-slate-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <CheckCircle2 className="w-4 h-4 text-[#14B8A6]" />
              <span>{t('topupSummaryHeader')}</span>
            </div>
            <p className="text-[11px] text-slate-300">
              {t('topupSummaryText', {
                amount: bulkTopupType === 'minutes' ? `${bulkMinutes} ${t('minuteUnit')}` : `${bulkCashAmount}`,
                count: targetCount,
              })}
            </p>
          </div>

          <DialogFooter className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submittingBulkTopup}
              className="border-white/10 text-slate-300 text-xs h-9 rounded-xl cursor-pointer"
            >
              {t('cancelBtn')}
            </Button>

            <Button
              type="button"
              disabled={
                submittingBulkTopup ||
                targetCount === 0 ||
                (bulkTopupType === 'minutes' ? bulkMinutes <= 0 : bulkCashAmount <= 0)
              }
              onClick={onConfirmBulkTopup}
              className="bg-[#14B8A6] hover:bg-[#2DD4BF] text-[#0B0F19] font-black text-xs h-10 px-6 rounded-xl shadow-lg shadow-[#14B8A6]/20 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              {submittingBulkTopup ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-1" />
                  {t('charging')}
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 ml-1" />
                  {t('confirmBulkTopupBtn', { count: targetCount })}
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
