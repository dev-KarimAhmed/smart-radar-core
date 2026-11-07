'use client';

import React from 'react';
import {
  CreditCard,
  Check,
  Loader2,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { PaymentTransferChannel } from '@/features/admin/types/wallet-directory';
import type { TransferChannelsCopy } from './transfer-channels-copy';
import { cn } from '@/lib/utils';

interface TransferChannelFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingChannel: PaymentTransferChannel | null;
  formData: {
    nameAr: string;
    nameEn: string;
    accountNumber: string;
    accountHolder: string;
    descriptionAr: string;
    descriptionEn: string;
    countryId: string;
    isActive: boolean;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    nameAr: string;
    nameEn: string;
    accountNumber: string;
    accountHolder: string;
    descriptionAr: string;
    descriptionEn: string;
    countryId: string;
    isActive: boolean;
  }>>;
  onSave: (e: React.FormEvent) => Promise<void>;
  saving: boolean;
  isArabic: boolean;
  t: TransferChannelsCopy;
}

export function TransferChannelFormDialog({
  isOpen,
  onOpenChange,
  editingChannel,
  formData,
  setFormData,
  onSave,
  saving,
  isArabic,
  t,
}: TransferChannelFormDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-[#0B0F19] border border-white/10 text-white p-6 rounded-3xl" dir={isArabic ? "rtl" : "ltr"}>
        <DialogHeader className={isArabic ? "text-right" : "text-left"}>
          <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <span>{editingChannel ? t.editTitle : t.addTitle}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400 mt-1">
            {t.modalDesc}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSave} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-300">{t.channelNameAr}</Label>
            <Input
              required
              value={formData.nameAr}
              onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
              placeholder={t.channelNameArPh}
              className="bg-black/40 border-white/10 text-white placeholder:text-slate-600 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-300">{t.channelNameEn}</Label>
            <Input
              value={formData.nameEn}
              onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
              placeholder={t.channelNameEnPh}
              dir="ltr"
              className="bg-black/40 border-white/10 text-white placeholder:text-slate-600 rounded-xl font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-300">{t.accountNumber}</Label>
            <Input
              required
              value={formData.accountNumber}
              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
              placeholder={t.accountNumberPh}
              dir="ltr"
              className="bg-black/40 border-white/10 text-emerald-400 placeholder:text-slate-600 rounded-xl font-mono font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-300">{t.beneficiaryLabel}</Label>
            <Input
              value={formData.accountHolder}
              onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
              placeholder={t.beneficiaryPh}
              className="bg-black/40 border-white/10 text-white placeholder:text-slate-600 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-300">{t.targetCountry}</Label>
            <select
              value={formData.countryId}
              onChange={(e) => setFormData({ ...formData, countryId: e.target.value })}
              className="w-full h-10 px-3 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
            >
              <option value="">{t.allCountriesOption}</option>
              <option value="1">{t.jordanOption}</option>
              <option value="2">{t.egyptOption}</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-300">{t.instructionsLabel}</Label>
            <Input
              value={formData.descriptionAr}
              onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
              placeholder={t.instructionsPh}
              className="bg-black/40 border-white/10 text-white placeholder:text-slate-600 rounded-xl text-xs"
            />
          </div>

          <div className="flex items-center justify-between border border-white/10 bg-white/[0.03] p-3 rounded-xl">
            <span className="text-xs font-bold text-slate-200">{t.activateNow}</span>
            <Switch
              checked={formData.isActive}
              onCheckedChange={(val) => setFormData({ ...formData, isActive: val })}
            />
          </div>

          <DialogFooter className="gap-2 sm:justify-start pt-2">
            <Button
              type="submit"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs h-10 px-6 rounded-xl flex items-center gap-1.5"
            >
              {saving ? <Loader2 className={cn("w-4 h-4 animate-spin", isArabic ? "ml-1" : "mr-1")} /> : <Check className={cn("w-4 h-4", isArabic ? "ml-1" : "mr-1")} />}
              <span>{editingChannel ? t.updateSave : t.addChannel}</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-slate-400 hover:text-white text-xs h-10 rounded-xl"
            >
              {t.cancel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface TransferChannelDeleteDialogProps {
  deleteTarget: PaymentTransferChannel | null;
  onOpenChange: (open: boolean) => void;
  onDelete: () => Promise<void>;
  isDeleting: boolean;
  isArabic: boolean;
  t: TransferChannelsCopy;
}

export function TransferChannelDeleteDialog({
  deleteTarget,
  onOpenChange,
  onDelete,
  isDeleting,
  isArabic,
  t,
}: TransferChannelDeleteDialogProps) {
  return (
    <Dialog open={Boolean(deleteTarget)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-[#0B0F19] border border-rose-500/30 text-white p-6 rounded-3xl" dir={isArabic ? "rtl" : "ltr"}>
        <DialogHeader className={isArabic ? "text-right" : "text-left"}>
          <DialogTitle className="text-base font-black text-rose-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{t.confirmDeleteTitle}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-300 leading-relaxed mt-2">
            {t.confirmDeleteDesc(deleteTarget?.nameAr || '', deleteTarget?.accountNumber || '')}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:justify-start pt-4">
          <Button
            type="button"
            disabled={isDeleting}
            onClick={onDelete}
            className="bg-rose-600 hover:bg-rose-500 text-white font-black text-xs h-10 px-5 rounded-xl flex items-center gap-1.5"
          >
            {isDeleting ? <Loader2 className={cn("w-4 h-4 animate-spin", isArabic ? "ml-1" : "mr-1")} /> : <Trash2 className={cn("w-4 h-4", isArabic ? "ml-1" : "mr-1")} />}
            <span>{t.confirmDeleteBtn}</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={isDeleting}
            onClick={() => onOpenChange(false)}
            className="text-slate-400 hover:text-white text-xs h-10 rounded-xl"
          >
            {t.back}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
