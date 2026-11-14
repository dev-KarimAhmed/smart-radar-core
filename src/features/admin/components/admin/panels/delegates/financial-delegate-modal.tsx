'use client';

import React from 'react';
import {
  UserCheck,
  Check,
  Loader2,
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
import { cn } from '@/lib/utils';
import type { FinancialDelegate, DelegateFormData, DelegatesCopy } from './financial-delegates-types';

interface FinancialDelegateModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingDelegate: FinancialDelegate | null;
  formData: DelegateFormData;
  setFormData: React.Dispatch<React.SetStateAction<DelegateFormData>>;
  governorates: Array<{ id: number; name_ar: string; country_id: number }>;
  districts: Array<{ id: number; name_ar: string; governorate_id: number }>;
  formGovernorates: Array<{ id: number; name_ar: string; country_id: number }>;
  formDistricts: Array<{ id: number; name_ar: string; governorate_id: number }>;
  saving: boolean;
  onSave: (e: React.FormEvent) => Promise<void>;
  t: DelegatesCopy;
  isArabic: boolean;
  direction: 'rtl' | 'ltr';
}

export function FinancialDelegateModal({
  isOpen,
  onOpenChange,
  editingDelegate,
  formData,
  setFormData,
  governorates,
  districts,
  formGovernorates,
  formDistricts,
  saving,
  onSave,
  t,
  isArabic,
  direction,
}: FinancialDelegateModalProps) {
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
