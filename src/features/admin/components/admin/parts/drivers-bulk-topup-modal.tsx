'use client';

import React from 'react';
import { Zap, CheckCircle2, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { BulkScope } from '@/features/admin/types/driver-management';
import { DriversBulkScopeSelector } from './drivers-bulk-scope-selector';
import { DriversBulkTopupAmounts } from './drivers-bulk-topup-amounts';

interface DriversBulkTopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  bulkScope: BulkScope;
  setBulkScope: (scope: BulkScope) => void;
  bulkTopupType: 'minutes' | 'cash';
  setBulkTopupType: (type: 'minutes' | 'cash') => void;
  bulkMinutes: number;
  setBulkMinutes: (min: number) => void;
  bulkCashAmount: number;
  setBulkCashAmount: (amt: number) => void;
  totalCaptainsCount: number;
  selectedCount: number;
  filteredCount: number;
  targetCount: number;
  submittingBulkTopup: boolean;
  onConfirm: () => void;
  isArabic: boolean;
  direction: 'rtl' | 'ltr';
  t: (key: string, values?: Record<string, any>) => string;
}

export function DriversBulkTopupModal({
  isOpen,
  onClose,
  bulkScope,
  setBulkScope,
  bulkTopupType,
  setBulkTopupType,
  bulkMinutes,
  setBulkMinutes,
  bulkCashAmount,
  setBulkCashAmount,
  totalCaptainsCount,
  selectedCount,
  filteredCount,
  targetCount,
  submittingBulkTopup,
  onConfirm,
  isArabic,
  direction,
  t,
}: DriversBulkTopupModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={cn("max-w-lg bg-[#0B0F19] border border-[#14B8A6]/30 text-white rounded-3xl p-6", isArabic ? "text-right" : "text-left")} dir={direction}>
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
          <DriversBulkScopeSelector
            bulkScope={bulkScope}
            setBulkScope={setBulkScope}
            totalCaptainsCount={totalCaptainsCount}
            selectedCount={selectedCount}
            filteredCount={filteredCount}
            themeColor="teal"
            t={t}
          />

          {bulkScope === 'selected' && selectedCount === 0 && (
            <p className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl">
              {t('noCaptainsSelectedWarning')}
            </p>
          )}

          {/* Amount / Minutes Selector */}
          <DriversBulkTopupAmounts
            bulkTopupType={bulkTopupType}
            setBulkTopupType={setBulkTopupType}
            bulkMinutes={bulkMinutes}
            setBulkMinutes={setBulkMinutes}
            bulkCashAmount={bulkCashAmount}
            setBulkCashAmount={setBulkCashAmount}
            isArabic={isArabic}
            t={t}
          />

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
              onClick={onConfirm}
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
