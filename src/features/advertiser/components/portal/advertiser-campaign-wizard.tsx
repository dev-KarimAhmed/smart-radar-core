'use client';

import React from 'react';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { cn } from '@/lib/utils';
import { wizardCopy } from './wizard/wizard-copy';
import { WizardStepTargeting } from './wizard/wizard-step-targeting';
import { WizardStepCreative } from './wizard/wizard-step-creative';
import { WizardStepAudit } from './wizard/wizard-step-audit';

interface AdvertiserCampaignWizardProps {
  step: number;
  setStep: (step: number) => void;
  title: string;
  setTitle: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  governorate: string;
  setGovernorate: (val: string) => void;
  district: string;
  setDistrict: (val: string) => void;
  jordanGovernorates?: string[];
  districts: string[];
  getDistrictsByGovernorate?: (gov: string) => string[];
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
  currentPackage?: any;
  calculatedCost: number;
  advertiserBalance: number;
  isSimulatingAudit: boolean;
  auditProgress: number;
  auditLogs: string[];
  auditApproved: boolean;
  onLaunchAudit: () => void;
  onReset: () => void;
}

export function AdvertiserCampaignWizard({
  step,
  setStep,
  title,
  setTitle,
  description,
  setDescription,
  governorate,
  setGovernorate,
  district,
  setDistrict,
  jordanGovernorates = ['عمّان', 'إربد', 'الزرقاء', 'البلقاء', 'العقبة', 'مادبا', 'جرش', 'عجلون', 'المفرق', 'الكرك', 'الطفيلة', 'معان'],
  districts,
  getDistrictsByGovernorate = () => [],
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
  isSimulatingAudit,
  auditProgress,
  auditLogs,
  auditApproved,
  onLaunchAudit,
  onReset,
}: AdvertiserCampaignWizardProps) {
  const { isArabic, direction } = useDashboardLanguage();
  const t = wizardCopy[isArabic ? 'ar' : 'en'];

  return (
    <div className={cn("rounded-2xl border border-emerald-500/20 bg-[#070b14] p-5 space-y-5 font-sans", isArabic ? "text-right" : "text-left")} dir={direction}>
      {/* Wizard Progress Steps Indicator */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        {t.steps.map((s) => (
          <div
            key={s.num}
            className={`flex items-center gap-2 ${
              step === s.num
                ? 'text-emerald-400 font-black'
                : step > s.num
                ? 'text-white/80 font-bold'
                : 'text-slate-500 font-semibold'
            }`}
          >
            <span
              className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-black ${
                step === s.num
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30'
                  : step > s.num
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              {step > s.num ? '✓' : s.num}
            </span>
            <span className="text-xs hidden sm:inline">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Step 1: Basic Info & Targeting */}
      {step === 1 && (
        <WizardStepTargeting
          t={t}
          title={title}
          setTitle={setTitle}
          description={description}
          setDescription={setDescription}
          governorate={governorate}
          setGovernorate={setGovernorate}
          district={district}
          setDistrict={setDistrict}
          jordanGovernorates={jordanGovernorates}
          districts={districts}
          getDistrictsByGovernorate={getDistrictsByGovernorate}
          onNext={() => {
            if (!title) {
              alert(t.titleRequiredAlert);
              return;
            }
            setStep(2);
          }}
        />
      )}

      {/* Step 2: Creative & Direct Links */}
      {step === 2 && (
        <WizardStepCreative
          t={t}
          posterUrl={posterUrl}
          setPosterUrl={setPosterUrl}
          whatsapp={whatsapp}
          setWhatsapp={setWhatsapp}
          phone={phone}
          setPhone={setPhone}
          geoLoc={geoLoc}
          setGeoLoc={setGeoLoc}
          buttonText={buttonText}
          setButtonText={setButtonText}
          targetImpressions={targetImpressions}
          setTargetImpressions={setTargetImpressions}
          calculatedCost={calculatedCost}
          advertiserBalance={advertiserBalance}
          onBack={() => setStep(1)}
          onLaunchAudit={onLaunchAudit}
        />
      )}

      {/* Step 3: Forensic AI Audit Simulation & Status */}
      {step === 3 && (
        <WizardStepAudit
          t={t}
          auditProgress={auditProgress}
          auditLogs={auditLogs}
          isSimulatingAudit={isSimulatingAudit}
          auditApproved={auditApproved}
          district={district}
          onReset={onReset}
        />
      )}
    </div>
  );
}
