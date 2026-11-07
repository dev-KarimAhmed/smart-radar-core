'use client';

import React from 'react';
import {
  ShieldCheck,
  AlertOctagon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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

interface RiderInspectDialogProps {
  rider: RiderUser | null;
  open: boolean;
  onClose: () => void;
  isArabic: boolean;
  direction: 'rtl' | 'ltr';
  getStatusBadge: (status: string) => React.ReactNode;
  t: (key: any, values?: any) => string;
}

export function RiderInspectDialog({
  rider,
  open,
  onClose,
  isArabic,
  direction,
  getStatusBadge,
  t,
}: RiderInspectDialogProps) {
  if (!rider) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className={cn(
          "max-w-lg bg-[#0B0F19] border border-cyan-500/30 text-white rounded-3xl p-6",
          isArabic ? "text-right" : "text-left"
        )}
        dir={direction}
      >
        <div className="space-y-5">
          <DialogHeader>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border border-cyan-500/40 rounded-2xl">
                  <AvatarFallback className="bg-cyan-500/20 text-cyan-300 font-black text-sm">
                    {rider.full_name ? rider.full_name.substring(0, 2) : 'R'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
                    {rider.full_name}
                    <Badge className="font-mono text-xs bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                      {rider.serial_id}
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-400 mt-0.5">
                    {t('registeredDate', {
                      date: new Date(rider.created_at).toLocaleDateString(isArabic ? 'ar-JO' : 'en-US'),
                    })}
                  </DialogDescription>
                </div>
              </div>
              <div>{getStatusBadge(rider.status)}</div>
            </div>
          </DialogHeader>

          {/* Identity & Location */}
          <div className="grid grid-cols-2 gap-3 bg-black/40 border border-white/5 p-3.5 rounded-2xl text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] font-bold">{t('officialPhone')}</span>
              <span className="font-mono font-bold text-white block mt-0.5" dir="ltr">
                {rider.phone}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-bold">{t('governorateDistrict')}</span>
              <span className="font-bold text-white block mt-0.5">
                {rider.governorate} - {rider.district}
              </span>
            </div>
          </div>

          {/* Behavioral Immunity Breakdown (AGENTS.md V2.6) */}
          <div className="border border-white/10 bg-[#161F30]/40 p-4 rounded-2xl space-y-3">
            <h4 className="text-xs font-black text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
              {t('behavioralImmunityTitle')}
            </h4>

            <div className="grid grid-cols-3 gap-2.5 text-xs">
              <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                <span className="text-slate-500 block text-[10px]">{t('successfulTrips')}</span>
                <span className="text-lg font-black text-emerald-400 font-mono mt-0.5 block">
                  {t('tripsCount', { count: rider.completed_trips_count ?? 0 })}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  {(rider.completed_trips_count ?? 0) > 0 ? t('hasTripHistory') : t('noTripHistory')}
                </span>
              </div>

              <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                <span className="text-slate-500 block text-[10px]">{t('trustScoreTitle')}</span>
                <span className="text-lg font-black text-white font-mono mt-0.5 block">
                  {rider.trust_score.toFixed(1)} / 5.0
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  {rider.trust_score < 4.2 ? t('trustAtRisk') : t('trustHealthy')}
                </span>
              </div>

              <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                <span className="text-slate-500 block text-[10px]">{t('consecutiveCancellationsLabel')}</span>
                <span className="text-lg font-black text-amber-400 font-mono mt-0.5 block">
                  {t('ordersUnit', { count: rider.consecutive_cancellations })}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">{t('pulseBrakeHint')}</span>
              </div>
            </div>

            {rider.trust_score < 4.2 && (
              <div className="p-3 bg-red-950/30 border border-red-500/30 rounded-xl text-xs text-rose-300 font-bold flex items-start gap-2">
                <AlertOctagon className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{t('criticalImmunityAlert')}</span>
              </div>
            )}
          </div>

          <DialogFooter className="flex items-center justify-end border-t border-white/10 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-white/10 text-slate-300 text-xs h-9 rounded-xl"
            >
              {t('close')}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
