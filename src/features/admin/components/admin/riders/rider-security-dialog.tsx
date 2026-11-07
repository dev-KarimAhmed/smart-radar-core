'use client';

import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { RiderUser } from './riders-types';

interface RiderSecurityDialogProps {
  rider: RiderUser | null;
  open: boolean;
  onClose: () => void;
  isArabic: boolean;
  direction: 'rtl' | 'ltr';
  targetStatus: string;
  setTargetStatus: (st: string) => void;
  submittingAction: boolean;
  onResetPenalties: (riderId: string) => Promise<boolean>;
  onUpdateStatus: (riderId: string, status: string) => Promise<boolean>;
  t: (key: any, values?: any) => string;
}

export function RiderSecurityDialog({
  rider,
  open,
  onClose,
  isArabic,
  direction,
  targetStatus,
  setTargetStatus,
  submittingAction,
  onResetPenalties,
  onUpdateStatus,
  t,
}: RiderSecurityDialogProps) {
  if (!rider) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className={cn(
          "max-w-md bg-[#0B0F19] border border-amber-500/40 text-white rounded-3xl p-6",
          isArabic ? "text-right" : "text-left"
        )}
        dir={direction}
      >
        <div className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-amber-400 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-400" />
              {t('securityManageTitle')}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 mt-1">
              {t('securityManageDesc', { name: rider.full_name })}
            </DialogDescription>
          </DialogHeader>

          {/* Status Change Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">{t('changeAccountStatus')}</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { st: 'ACTIVE', label: t('statusInstantActive'), cl: 'text-emerald-400 border-emerald-500/30' },
                { st: 'IDLE', label: t('statusIdleOpt'), cl: 'text-slate-300 border-slate-500/30' },
                { st: 'SUSPENDED', label: t('statusSuspendOpt'), cl: 'text-amber-400 border-amber-500/30' },
                { st: 'BANNED', label: t('statusBanOpt'), cl: 'text-rose-400 border-rose-500/30' },
              ].map((s) => (
                <button
                  key={s.st}
                  type="button"
                  onClick={() => setTargetStatus(s.st)}
                  className={cn(
                    "p-2.5 rounded-xl border text-center font-bold transition",
                    targetStatus === s.st
                      ? `bg-white/10 ${s.cl} font-black ring-1 ring-white/20`
                      : "border-white/5 bg-black/40 text-slate-500 hover:text-white"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* One-click Behavioral Immunity Reset */}
          <div className="bg-[#14B8A6]/10 border border-[#14B8A6]/30 p-3.5 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black text-[#14B8A6] flex items-center gap-1.5">
                <RotateCcw className="h-4 w-4" />
                {t('resetPenaltiesTitle')}
              </p>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">{t('resetPenaltiesDesc')}</p>
            <Button
              type="button"
              size="sm"
              disabled={submittingAction}
              onClick={async () => {
                const ok = await onResetPenalties(rider.id);
                if (ok) onClose();
              }}
              className="w-full bg-[#14B8A6] hover:bg-[#2DD4BF] text-[#0B0F19] text-xs font-black h-9 rounded-xl shadow-md shadow-[#14B8A6]/20 cursor-pointer"
            >
              {submittingAction ? (
                <Loader2 className={cn("h-4 w-4 animate-spin", isArabic ? "ml-1" : "mr-1")} />
              ) : (
                <RotateCcw className={cn("h-4 w-4", isArabic ? "ml-1" : "mr-1")} />
              )}
              {t('resetPenaltiesBtn')}
            </Button>
          </div>

          <DialogFooter className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-white/10 text-slate-300 text-xs h-9 rounded-xl"
            >
              {t('cancelBtn')}
            </Button>

            <Button
              type="button"
              disabled={submittingAction}
              onClick={async () => {
                const ok = await onUpdateStatus(rider.id, targetStatus);
                if (ok) onClose();
              }}
              className="bg-amber-500 hover:bg-amber-400 text-black font-black text-xs h-10 px-5 rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              {submittingAction ? (
                <Loader2 className={cn("h-4 w-4 animate-spin", isArabic ? "ml-1" : "mr-1")} />
              ) : (
                <ShieldCheck className={cn("h-4 w-4", isArabic ? "ml-1" : "mr-1")} />
              )}
              {t('confirmStatusChange')}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
