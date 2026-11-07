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
import { CaptainUser } from '../captains-types';

interface CaptainSecurityDialogProps {
  captain: CaptainUser | null;
  open: boolean;
  onClose: () => void;
  isArabic: boolean;
  direction: 'rtl' | 'ltr';
  targetStatus: string;
  setTargetStatus: (s: string) => void;
  targetTier: string;
  setTargetTier: (tier: string) => void;
  submittingAction: boolean;
  onResetPenalties: (captainId: string) => Promise<boolean>;
  onForceClearTrip: (captainId: string) => Promise<boolean>;
  onSaveSecuritySettings: (captainId: string, status: string, tier: string) => Promise<boolean>;
  t: (key: any, values?: any) => string;
}

export function CaptainSecurityDialog({
  captain,
  open,
  onClose,
  isArabic,
  direction,
  targetStatus,
  setTargetStatus,
  targetTier,
  setTargetTier,
  submittingAction,
  onResetPenalties,
  onForceClearTrip,
  onSaveSecuritySettings,
  t,
}: CaptainSecurityDialogProps) {
  if (!captain) return null;

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
              {t('securityModalTitle')}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 mt-1">
              {t('securityModalDesc', { name: captain.full_name })}
            </DialogDescription>
          </DialogHeader>

          {/* Status Change Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">{t('changeOperationalStatus')}</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { st: 'ACTIVE', label: t('activateNow'), cl: 'text-emerald-400 border-emerald-500/30' },
                { st: 'IDLE', label: t('statusIdle'), cl: 'text-slate-300 border-slate-500/30' },
                { st: 'SUSPENDED', label: t('freezeAction'), cl: 'text-amber-400 border-amber-500/30' },
                { st: 'BANNED', label: t('banAction'), cl: 'text-rose-400 border-rose-500/30' },
              ].map((s) => (
                <button
                  key={s.st}
                  type="button"
                  onClick={() => setTargetStatus(s.st)}
                  className={cn(
                    "p-2.5 rounded-xl border text-center font-bold transition cursor-pointer",
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

          {/* Change Sovereign Rank Tier */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">{t('sovereignTier')}</label>
            <div className="grid grid-cols-4 gap-1.5 text-xs font-mono">
              {['PLATINUM', 'GOLD', 'BRONZE', 'SILVER'].map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setTargetTier(tier)}
                  className={cn(
                    "py-2 rounded-xl border font-bold text-center transition cursor-pointer",
                    targetTier === tier
                      ? "border-[#14B8A6] bg-[#14B8A6]/20 text-[#14B8A6]"
                      : "border-white/10 bg-black/40 text-slate-400 hover:text-white"
                  )}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>

          {/* One-click Reset Penalties */}
          <div className="bg-red-950/20 border border-red-500/20 p-3 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-rose-300">{t('penaltiesRecord')}</p>
              <p className="text-[10px] text-slate-400">
                {t('currentlyRecorded')}{' '}
                <span className="font-bold text-amber-400 font-mono">
                  {t('penaltiesLogged', { count: captain.penalty_count })}
                </span>
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              disabled={submittingAction}
              onClick={async () => {
                await onResetPenalties(captain.id);
              }}
              className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[11px] h-8 rounded-xl font-bold cursor-pointer"
            >
              <RotateCcw className="h-3 w-3 ml-1" />
              {t('resetPenaltiesBtn')}
            </Button>
          </div>

          {/* Stuck trip release button */}
          {captain.status === 'BUSY' && (
            <div className="bg-amber-950/20 border border-amber-500/30 p-3 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-amber-300">{t('releaseStuckTripTitle')}</p>
                <p className="text-[10px] text-slate-400">{t('releaseStuckTripDesc')}</p>
              </div>
              <Button
                type="button"
                size="sm"
                disabled={submittingAction}
                onClick={async () => {
                  await onForceClearTrip(captain.id);
                }}
                className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] h-8 rounded-xl font-bold cursor-pointer"
              >
                {t('releaseStuckTripBtn')}
              </Button>
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
              disabled={submittingAction}
              onClick={async () => {
                const ok = await onSaveSecuritySettings(captain.id, targetStatus, targetTier);
                if (ok) onClose();
              }}
              className="bg-amber-500 hover:bg-amber-400 text-black font-black text-xs h-10 px-5 rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              {submittingAction ? (
                <Loader2 className="h-4 w-4 animate-spin ml-1" />
              ) : (
                <ShieldCheck className="h-4 w-4 ml-1" />
              )}
              {t('saveSecurityActions')}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
