'use client';

import React from 'react';
import {
  CheckCircle2,
  Car,
  FileText,
  ExternalLink,
  Loader2,
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
import { CaptainUser } from '../captains-types';

interface CaptainInspectDialogProps {
  captain: CaptainUser | null;
  open?: boolean;
  onClose: () => void;
  isArabic: boolean;
  direction: 'rtl' | 'ltr';
  getVerificationBadge?: (status: string) => React.ReactNode;
  submittingAction?: boolean;
  onApproveCaptain?: (captainId: string) => Promise<boolean>;
  executeAdminAction?: (payload: Record<string, any>, successMsg: string) => Promise<boolean>;
  t: (key: any, values?: any) => string;
}

export function CaptainInspectDialog({
  captain,
  open,
  onClose,
  isArabic,
  direction,
  getVerificationBadge,
  submittingAction = false,
  onApproveCaptain,
  executeAdminAction,
  t,
}: CaptainInspectDialogProps) {
  if (!captain) return null;

  return (
    <Dialog open={open ?? Boolean(captain)} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className={cn(
          "max-w-2xl bg-[#0B0F19] border border-[#14B8A6]/30 text-white rounded-3xl p-6",
          isArabic ? "text-right" : "text-left"
        )}
        dir={direction}
      >
        <div className="space-y-5">
          <DialogHeader>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border border-[#14B8A6]/40 rounded-2xl">
                  <AvatarFallback className="bg-[#14B8A6]/20 text-[#14B8A6] font-black text-sm">
                    {captain.full_name.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
                    {captain.full_name}
                    <Badge className="font-mono text-xs bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                      {captain.serial_id}
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-400 mt-0.5">
                    {t('joinedDate', {
                      date: new Date(captain.created_at).toLocaleDateString(isArabic ? 'ar-JO' : 'en-US'),
                    })}
                  </DialogDescription>
                </div>
              </div>
              <div>{getVerificationBadge ? getVerificationBadge(captain.verification_status) : null}</div>
            </div>
          </DialogHeader>

          {/* Identity & Contact Details */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-black/40 border border-white/5 p-3.5 rounded-2xl text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] font-bold">{t('phoneLabel')}</span>
              <span className="font-mono font-bold text-white block mt-0.5" dir="ltr">
                {captain.phone}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-bold">{t('locationLabel')}</span>
              <span className="font-bold text-white block mt-0.5">
                {captain.governorate} - {captain.district}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-bold">{t('emailLabel')}</span>
              <span className="font-mono text-slate-300 block mt-0.5 truncate">{captain.email || '-'}</span>
            </div>
          </div>

          {/* Vehicle Specs */}
          <div className="border border-white/10 bg-[#161F30]/40 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-white flex items-center gap-2">
                <Car className="h-4 w-4 text-[#14B8A6]" />
                {t('vehicleSpecsTitle')}
              </h4>
              <span className="text-[10px] bg-black/60 px-2.5 py-0.5 rounded border border-white/10 text-cyan-400 font-bold">
                {captain.vehicle.affiliation_type === 'office-taxi'
                  ? t('officeTaxi')
                  : captain.vehicle.affiliation_type === 'smart-app'
                  ? t('smartApp')
                  : t('independent')}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                <span className="text-slate-500 block text-[10px]">{t('vehicleLabel')}</span>
                <span className="font-bold text-white">
                  {captain.vehicle.brand} {captain.vehicle.model}
                </span>
              </div>
              <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                <span className="text-slate-500 block text-[10px]">{t('manufacturingYear')}</span>
                <span className="font-mono font-bold text-white">{captain.vehicle.year || '-'}</span>
              </div>
              <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                <span className="text-slate-500 block text-[10px]">{t('plateNumber')}</span>
                <span className="font-mono font-bold text-amber-300">{captain.vehicle.plate || '-'}</span>
              </div>
              <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                <span className="text-slate-500 block text-[10px]">{t('vehicleColor')}</span>
                <span className="font-bold text-white">{captain.vehicle.color || '-'}</span>
              </div>
            </div>
          </div>

          {/* Document verification items */}
          <div className="border border-white/10 bg-black/30 p-4 rounded-2xl space-y-3">
            <h4 className="text-xs font-black text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-cyan-400" />
              {t('documentsTitle')}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Identity Document */}
              <div className="border border-white/10 bg-[#0B0F19] p-3 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">{t('idCard')}</p>
                  <p className="text-[10px] text-slate-500">
                    {captain.documents.identity_url ? t('docUploaded') : t('docNotUploaded')}
                  </p>
                </div>
                {captain.documents.identity_url ? (
                  <a
                    href={captain.documents.identity_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#14B8A6] hover:underline"
                  >
                    {t('docPreview')} <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-[10px] text-slate-600">{t('docUnavailable')}</span>
                )}
              </div>

              {/* Driving License */}
              <div className="border border-white/10 bg-[#0B0F19] p-3 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">{t('driverLicense')}</p>
                  <p className="text-[10px] text-slate-500">
                    {captain.documents.driving_license_url ? t('docUploaded') : t('docNotUploaded')}
                  </p>
                </div>
                {captain.documents.driving_license_url ? (
                  <a
                    href={captain.documents.driving_license_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#14B8A6] hover:underline"
                  >
                    {t('docPreview')} <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-[10px] text-slate-600">{t('docUnavailable')}</span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons in Modal Footer */}
          <DialogFooter className="flex flex-row items-center justify-end gap-3 border-t border-white/10 pt-4">
            <Button
              type="button"
              disabled={submittingAction}
              onClick={async () => {
                if (onApproveCaptain) {
                  const ok = await onApproveCaptain(captain.id);
                  if (ok) onClose();
                } else if (executeAdminAction) {
                  const ok = await executeAdminAction(
                    { action: 'APPROVE_VERIFICATION', captainId: captain.id },
                    t('captainApprovedSuccess') || 'تمت الموافقة بنجاح'
                  );
                  if (ok) onClose();
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs h-9 rounded-xl px-5 shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              {submittingAction ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 ml-1" />
              )}
              {t('approveCaptainFull')}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
