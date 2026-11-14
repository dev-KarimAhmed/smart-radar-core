import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WizardCopyType } from './wizard-copy';

interface WizardStepTargetingProps {
  t: WizardCopyType;
  title: string;
  setTitle: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  governorate: string;
  setGovernorate: (val: string) => void;
  district: string;
  setDistrict: (val: string) => void;
  jordanGovernorates: string[];
  districts: string[];
  getDistrictsByGovernorate: (gov: string) => string[];
  onNext: () => void;
}

export function WizardStepTargeting({
  t,
  title,
  setTitle,
  description,
  setDescription,
  governorate,
  setGovernorate,
  district,
  setDistrict,
  jordanGovernorates,
  districts,
  getDistrictsByGovernorate,
  onNext,
}: WizardStepTargetingProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-slate-300">{t.campaignTitle}</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t.campaignTitlePh}
          className="h-11 rounded-xl border-white/10 bg-black/40 text-sm font-bold text-white placeholder-slate-500"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-slate-300">{t.descriptionLabel}</Label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder={t.descriptionPh}
          className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-sm font-bold text-white placeholder-slate-500 outline-none focus:border-emerald-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-300">{t.targetGov}</Label>
          <select
            value={governorate}
            onChange={(e) => {
              setGovernorate(e.target.value);
              const dists = getDistrictsByGovernorate(e.target.value);
              if (dists.length > 0) setDistrict(dists[0]);
            }}
            className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-xs font-bold text-white outline-none focus:border-emerald-500"
          >
            {jordanGovernorates.map((gov) => (
              <option key={gov} value={gov}>
                {gov}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-300">{t.targetDistrict}</Label>
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-xs font-bold text-white outline-none focus:border-emerald-500"
          >
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <Button
          type="button"
          onClick={onNext}
          className="h-11 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs"
        >
          {t.nextToMedia}
        </Button>
      </div>
    </div>
  );
}
