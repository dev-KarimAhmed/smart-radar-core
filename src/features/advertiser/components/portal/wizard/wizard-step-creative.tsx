import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WizardCopyType } from './wizard-copy';

interface WizardStepCreativeProps {
  t: WizardCopyType;
  posterUrl: string;
  setPosterUrl: (val: string) => void;
  whatsapp: string;
  setWhatsapp: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  geoLoc: string;
  setGeoLoc: (val: string) => void;
  buttonText: string;
  setButtonText: (val: string) => void;
  targetImpressions: number;
  setTargetImpressions: (val: number) => void;
  calculatedCost: number;
  advertiserBalance: number;
  onBack: () => void;
  onLaunchAudit: () => void;
}

export function WizardStepCreative({
  t,
  posterUrl,
  setPosterUrl,
  whatsapp,
  setWhatsapp,
  phone,
  setPhone,
  geoLoc,
  setGeoLoc,
  buttonText,
  setButtonText,
  targetImpressions,
  setTargetImpressions,
  calculatedCost,
  advertiserBalance,
  onBack,
  onLaunchAudit,
}: WizardStepCreativeProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-slate-300">{t.posterUrlLabel}</Label>
        <Input
          value={posterUrl}
          onChange={(e) => setPosterUrl(e.target.value)}
          placeholder={t.posterUrlPh}
          className="h-11 rounded-xl border-white/10 bg-black/40 text-sm font-bold text-white placeholder-slate-500 font-mono text-left"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-300">{t.whatsappLabel}</Label>
          <Input
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="962798888888"
            className="h-11 rounded-xl border-white/10 bg-black/40 text-sm font-bold text-white placeholder-slate-500 font-mono text-left"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-300">{t.phoneLabel}</Label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0798888888"
            className="h-11 rounded-xl border-white/10 bg-black/40 text-sm font-bold text-white placeholder-slate-500 font-mono text-left"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-300">{t.geoLocLabel}</Label>
          <Input
            value={geoLoc}
            onChange={(e) => setGeoLoc(e.target.value)}
            placeholder="https://maps.google.com/..."
            className="h-11 rounded-xl border-white/10 bg-black/40 text-sm font-bold text-white placeholder-slate-500 font-mono text-left"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-300">{t.buttonTextLabel}</Label>
          <Input
            value={buttonText}
            onChange={(e) => setButtonText(e.target.value)}
            placeholder={t.buttonTextPh}
            className="h-11 rounded-xl border-white/10 bg-black/40 text-sm font-bold text-white placeholder-slate-500"
          />
        </div>
      </div>

      <div className="space-y-1.5 pt-2">
        <Label className="text-xs font-bold text-slate-300">{t.targetImpressionsLabel}</Label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="1000"
            max="50000"
            step="1000"
            value={targetImpressions}
            onChange={(e) => setTargetImpressions(Number(e.target.value))}
            className="flex-1 accent-emerald-500"
          />
          <span className="w-24 text-center font-mono font-black text-emerald-400 bg-black/50 p-2 rounded-xl border border-white/10 text-xs">
            {targetImpressions.toLocaleString()} {t.impressionsUnit}
          </span>
        </div>
      </div>

      {/* Cost Summary Preview */}
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/30 p-3.5 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 font-bold">{t.totalCost}</p>
          <p className="text-xl font-black text-emerald-300 font-mono">
            {calculatedCost.toFixed(2)} {t.currency}
          </p>
        </div>
        <div className="text-left text-[11px] font-bold text-slate-400 font-mono">
          {t.currentBalance} {advertiserBalance.toFixed(2)} {t.currency}
        </div>
      </div>

      <div className="pt-2 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="h-11 rounded-xl text-slate-400 hover:text-white"
        >
          {t.backStep}
        </Button>
        <Button
          type="button"
          onClick={onLaunchAudit}
          className="h-11 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs shadow-lg shadow-emerald-500/20"
        >
          {t.launchAuditBtn}
        </Button>
      </div>
    </div>
  );
}
