'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle2, Languages, ShieldCheck } from 'lucide-react';
import { navigateAuth } from '@/lib/auth-routing';
import { cn } from '@/lib/utils';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import type { AffiliationType } from '@/core/types';
import { CaptainPersonalStep, type CaptainPersonalValues } from './captain-personal-step';
import { CaptainAffiliationStep } from './captain-affiliation-step';
import { CaptainVehicleStep, type CaptainVehicleValues } from './captain-vehicle-step';

const REMEMBER_ME_STORAGE_KEY = 'radar_captain_remember_me';

type OnboardingStep = 1 | 2 | 3 | 'done';

const emptyPersonal: CaptainPersonalValues = {
  name: '',
  phone: '',
  password: '',
  country: '',
  countryIso: '',
  governorate: '',
  district: '',
};
const emptyVehicle: CaptainVehicleValues = {
  officeName: '',
  officePhone: '',
  sideId: '',
  companyName: '',
  make: '',
  color: '#14b8a6',
  plate: '',
  year: '',
};

function readStoredRememberMe(): boolean {
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem(REMEMBER_ME_STORAGE_KEY) !== 'false';
}

const styles = {
  main: 'relative min-h-screen overflow-hidden bg-[#0B0F19] text-slate-100',
  glow: 'pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_18%_12%,rgba(20,184,166,0.20),transparent_30%),radial-gradient(circle_at_82%_22%,rgba(45,212,191,0.08),transparent_28%)]',
  langButton:
    'fixed top-4 z-30 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-[#161F30]/70 px-4 text-sm font-bold text-slate-100 shadow-2xl backdrop-blur-xl transition hover:border-[#14B8A6] hover:shadow-[0_0_20px_rgba(20,184,166,0.15)]',
  langButtonAr: 'left-4',
  langButtonEn: 'right-4',
  langIcon: 'h-4 w-4 text-[#14B8A6]',
  wrap: 'relative z-10 flex min-h-screen w-full items-center justify-center px-0 py-0 sm:px-6 sm:py-10',
  card: 'flex min-h-screen w-full max-w-md flex-col justify-center rounded-none border border-white/5 bg-[#161F30]/70 p-6 shadow-2xl backdrop-blur-xl sm:my-12 sm:min-h-0 sm:rounded-3xl sm:p-8',
  header: 'mb-6 text-center',
  badge: 'mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 text-[#14B8A6] shadow-[0_0_30px_rgba(20,184,166,0.18)]',
  badgeIcon: 'h-7 w-7',
  brand: 'text-sm font-bold text-[#14B8A6]',
  title: 'mt-3 text-2xl font-black tracking-normal text-[#F8FAFC]',
  subtitle: 'mt-2 text-sm font-medium leading-6 text-[#94A3B8]',
  stepRow: 'flex justify-between items-center text-xs text-slate-400 mb-4 bg-white/5 border border-white/10 rounded-2xl p-3',
  stepLabel: 'font-bold text-[#14B8A6]',
  stepName: 'font-bold text-[#94A3B8]',
  backLink: 'mt-6 w-full text-xs font-bold text-[#94A3B8]/70 transition hover:text-white',
  doneWrap: 'flex flex-col items-center text-center gap-3 py-6',
  doneIcon: 'h-14 w-14 text-[#14B8A6]',
  doneTitle: 'text-lg font-black text-[#F8FAFC]',
  doneText: 'text-sm font-medium leading-6 text-[#94A3B8]',
} as const;

export function CaptainOnboarding() {
  const t = useTranslations('captainOnboarding');
  const { isArabic, setLanguage } = useDashboardLanguage();
  const [step, setStep] = React.useState<OnboardingStep>(1);
  const [personal, setPersonal] = React.useState<CaptainPersonalValues>(emptyPersonal);
  const [rememberMe, setRememberMe] = React.useState<boolean>(readStoredRememberMe);
  const [affiliation, setAffiliation] = React.useState<AffiliationType | null>(null);
  const [vehicle, setVehicle] = React.useState<CaptainVehicleValues>(emptyVehicle);
  const [licenseImage, setLicenseImage] = React.useState('');

  const handleRememberMeChange = (value: boolean) => {
    setRememberMe(value);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(REMEMBER_ME_STORAGE_KEY, value ? 'true' : 'false');
    }
  };

  return (
    <main dir={isArabic ? 'rtl' : 'ltr'} className={styles.main}>
      <div className={styles.glow} />

      <button
        type="button"
        onClick={() => setLanguage(isArabic ? 'en' : 'ar')}
        className={cn(styles.langButton, isArabic ? styles.langButtonAr : styles.langButtonEn)}
      >
        <Languages className={styles.langIcon} aria-hidden="true" />
        {t('languageButton')}
      </button>

      <section className={styles.wrap}>
        <div className={styles.card}>
          <header className={styles.header}>
            <div className={styles.badge}>
              <ShieldCheck className={styles.badgeIcon} aria-hidden="true" />
            </div>
            <p className={styles.brand}>{t('brand')}</p>
            <h1 className={styles.title}>{t('title')}</h1>
            <p className={styles.subtitle}>{t('subtitle')}</p>
          </header>

          {step !== 'done' ? (
            <div className={styles.stepRow}>
              <span className={styles.stepLabel}>{t('stepOf', { step })}</span>
              <span className={styles.stepName}>{t(`steps.${step}`)}</span>
            </div>
          ) : null}

          {step === 1 ? (
            <CaptainPersonalStep
              values={personal}
              onChange={setPersonal}
              rememberMe={rememberMe}
              onRememberMeChange={handleRememberMeChange}
              onNext={() => setStep(2)}
            />
          ) : step === 2 ? (
            <CaptainAffiliationStep
              onSelect={(type) => {
                setAffiliation(type);
                setStep(3);
              }}
              onBack={() => setStep(1)}
            />
          ) : step === 3 ? (
            <CaptainVehicleStep
              affiliation={affiliation}
              vehicle={vehicle}
              setVehicle={setVehicle}
              licenseImage={licenseImage}
              onLicenseChange={setLicenseImage}
              onBack={() => setStep(2)}
              onSubmit={() => setStep('done')}
              country={personal.countryIso}
            />
          ) : (
            <div className={styles.doneWrap}>
              <CheckCircle2 className={styles.doneIcon} aria-hidden="true" />
              <h2 className={styles.doneTitle}>{t('doneTitle')}</h2>
              <p className={styles.doneText}>{t('doneText')}</p>
            </div>
          )}

          <button type="button" className={styles.backLink} onClick={() => navigateAuth('role')}>
            {t('backToRole')}
          </button>
        </div>
      </section>
    </main>
  );
}
