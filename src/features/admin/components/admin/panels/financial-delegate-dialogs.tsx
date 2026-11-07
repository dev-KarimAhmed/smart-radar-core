'use client';

import React from 'react';
import {
  UserCheck,
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
import type { FinancialDelegate, FinancialDelegatesCopy } from './financial-delegates-copy';
import { cn } from '@/lib/utils';

interface Governorate {
  id: number;
  country_id: number;
  name_ar: string;
}

interface District {
  id: number;
  governorate_id: number;
  name_ar: string;
}

interface FinancialDelegateFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingDelegate: FinancialDelegate | null;
  formData: {
    name: string;
    phone: string;
    whatsapp: string;
    countryId: string;
    governorateId: string;
    governorateName: string;
    districtId: string;
    districtName: string;
    notes: string;
    isActive: boolean;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    name: string;
    phone: string;
    whatsapp: string;
    countryId: string;
    governorateId: string;
    governorateName: string;
    districtId: string;
    districtName: string;
    notes: string;
    isActive: boolean;
  }>>;
  onSave: (e: React.FormEvent) => Promise<void>;
  saving: boolean;
  governorates: Governorate[];
  districts: District[];
  isArabic: boolean;
  direction: 'rtl' | 'ltr';
  t: FinancialDelegatesCopy;
}

export function FinancialDelegateFormDialog({
  isOpen,
  onOpenChange,
  editingDelegate,
  formData,
  setFormData,
  onSave,
  saving,
  governorates,
  districts,
  isArabic,
  direction,
  t,
}: FinancialDelegateFormDialogProps) {
  const formGovernorates = governorates.filter((g) => String(g.country_id) === formData.countryId);
  const formDistricts = districts.filter((d) => String(d.governorate_id) === formData.governorateId);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#080E1C] border border-slate-800 text-white p-6 rounded-3xl" dir={direction}>
        <DialogHeader className={isArabic ? "text-right" : "text-left"}>
          <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            <span>{editingDelegate ? t.editModalTitle : t.addModalTitle}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            {t.modalDesc}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSave} className="space-y-4 mt-3">
          <div className={cn("space-y-1.5", isArabic ? "text-right" : "text-left")}>
            <Label className="text-xs font-bold text-slate-300">{t.delegateName}</Label>
            <Input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t.delegateNamePh}
              className="bg-black/60 border-slate-700 text-white text-xs h-10 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={cn("space-y-1.5", isArabic ? "text-right" : "text-left")}>
              <Label className="text-xs font-bold text-slate-300">{t.phoneInput}</Label>
              <Input
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="962790000001"
                className="bg-black/60 border-slate-700 text-amber-300 font-mono text-xs h-10 rounded-xl"
                dir="ltr"
              />
            </div>

            <div className={cn("space-y-1.5", isArabic ? "text-right" : "text-left")}>
              <Label className="text-xs font-bold text-slate-300">{t.whatsappInput}</Label>
              <Input
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                placeholder={t.whatsappPh}
                className="bg-black/60 border-slate-700 text-white font-mono text-xs h-10 rounded-xl"
                dir="ltr"
              />
            </div>
          </div>

          <div className={cn("space-y-1.5", isArabic ? "text-right" : "text-left")}>
            <Label className="text-xs font-bold text-slate-300">{t.country}</Label>
            <select
              value={formData.countryId}
              onChange={(e) => {
                const newCId = e.target.value;
                setFormData({
                  ...formData,
                  countryId: newCId,
                  governorateId: '',
                  governorateName: '',
                  districtId: '',
                  districtName: '',
                });
              }}
              className="w-full bg-black/60 border border-slate-700 text-white text-xs h-10 rounded-xl px-3 outline-none"
            >
              <option value="1">{t.jordanOption}</option>
              <option value="2">{t.egyptOption}</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={cn("space-y-1.5", isArabic ? "text-right" : "text-left")}>
              <Label className="text-xs font-bold text-slate-300">{t.gov}</Label>
              <select
                value={formData.governorateId}
                onChange={(e) => {
                  const gId = e.target.value;
                  const found = governorates.find((g) => String(g.id) === gId);
                  setFormData({
                    ...formData,
                    governorateId: gId,
                    governorateName: found ? found.name_ar : '',
                    districtId: '',
                    districtName: '',
                  });
                }}
                className="w-full bg-black/60 border border-slate-700 text-white text-xs h-10 rounded-xl px-3 outline-none"
              >
                <option value="">{t.allGovsOption}</option>
                {formGovernorates.map((g) => (
                  <option key={g.id} value={String(g.id)}>
                    {g.name_ar}
                  </option>
                ))}
              </select>
            </div>

            <div className={cn("space-y-1.5", isArabic ? "text-right" : "text-left")}>
              <Label className="text-xs font-bold text-slate-300">{t.district}</Label>
              <select
                value={formData.districtId}
                disabled={!formData.governorateId}
                onChange={(e) => {
                  const dId = e.target.value;
                  const found = districts.find((d) => String(d.id) === dId);
                  setFormData({
                    ...formData,
                    districtId: dId,
                    districtName: found ? found.name_ar : '',
                  });
                }}
                className="w-full bg-black/60 border border-slate-700 text-white text-xs h-10 rounded-xl px-3 outline-none disabled:opacity-40"
              >
                <option value="">{t.wholeGovOption}</option>
                {formDistricts.map((d) => (
                  <option key={d.id} value={String(d.id)}>
                    {d.name_ar}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={cn("space-y-1.5", isArabic ? "text-right" : "text-left")}>
            <Label className="text-xs font-bold text-slate-300">{t.notesLabel}</Label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={t.notesPh}
              className="w-full bg-black/60 border border-slate-700 text-white text-xs p-3 rounded-xl outline-none"
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
              <span>{editingDelegate ? t.saveUpdate : t.addDelegate}</span>
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

interface FinancialDelegateDeleteDialogProps {
  deleteTarget: FinancialDelegate | null;
  onOpenChange: (open: boolean) => void;
  onDelete: () => Promise<void>;
  isDeleting: boolean;
  isArabic: boolean;
  direction: 'rtl' | 'ltr';
  t: FinancialDelegatesCopy;
}

export function FinancialDelegateDeleteDialog({
  deleteTarget,
  onOpenChange,
  onDelete,
  isDeleting,
  isArabic,
  direction,
  t,
}: FinancialDelegateDeleteDialogProps) {
  return (
    <Dialog open={Boolean(deleteTarget)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-[#0B0F19] border border-rose-500/30 text-white p-6 rounded-3xl" dir={direction}>
        <DialogHeader className={isArabic ? "text-right" : "text-left"}>
          <DialogTitle className="text-base font-black text-rose-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{t.confirmDeleteTitle}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-300 leading-relaxed mt-2">
            {t.confirmDeleteDesc(deleteTarget?.name || '')}
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
