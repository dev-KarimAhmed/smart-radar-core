'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowRight, Languages } from 'lucide-react';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { cn } from '@/lib/utils';
import { getLandingPageUrl } from '@/lib/constants';
import { normalizePhoneForCountry } from '../utils/registration-helpers';
import { styles } from './register/register-styles';
import { RegisterField } from './register/register-field';
import { RegisterForm } from './register/register-form';
import {
  copy,
  governorates,
  roleLabels,
  type AuthType,
  type GovernorateKey,
} from './register/register-constants';

export { RegisterField as Field } from './register/register-field';
export { styles as registerRouteStyles } from './register/register-styles';
export type { AuthType, GovernorateKey } from './register/register-constants';

export function RegisterRoute({
  initialLanguage,
  initialRole = 'rider',
}: {
  initialLanguage?: string;
  initialRole?: string;
}) {
  const router = useRouter();
  const { language, setLanguage } = useDashboardLanguage();
  const [authType, setAuthType] = useState<AuthType>('register');
  const [governorate, setGovernorate] = useState<GovernorateKey>('cairo');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const phoneValidation = useMemo(() => {
    const val = phone.trim();
    if (!val) return { ok: false, message: '' };
    return normalizePhoneForCountry(val, null);
  }, [phone]);
  const isPhoneValid = phoneValidation.ok;

  // Honor a ?lang= deep link once on mount by driving the shared locale.
  useEffect(() => {
    const requestedLang = initialLanguage;
    if ((requestedLang === 'ar' || requestedLang === 'en') && requestedLang !== language) {
      setLanguage(requestedLang);
    }
  }, [initialLanguage, language, setLanguage]);

  const selectedRole = initialRole;
  const role = selectedRole in roleLabels ? selectedRole : 'rider';
  const isArabic = language === 'ar';
  const t = copy[language];
  const roleName = roleLabels[role as keyof typeof roleLabels][language];
  const districtOptions = governorates[governorate].districts;

  const tickerItems = useMemo(() => [...t.ticker, ...t.ticker, ...t.ticker], [t.ticker]);

  const submitMockAuth = () => {
    router.push('/rider');
  };

  return (
    <main dir={isArabic ? 'rtl' : 'ltr'} className={styles.style161_1}>
      <div className={styles.style163_2} />

      <section className={styles.style177_7}>
        <div className={styles.style178_8}>
          {/* Top navigation row: Back & Language switcher */}
          <div className="flex w-full items-center justify-between mb-3">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#94A3B8] transition-colors hover:text-white cursor-pointer"
              onClick={() => router.push('/auth')}
            >
              <ArrowRight className={cn('h-3.5 w-3.5 text-[#14B8A6]', isArabic ? '' : 'rotate-180')} />
              <span>{isArabic ? 'رجوع' : 'Back'}</span>
            </button>

            <button
              type="button"
              aria-label={t.languageAria}
              onClick={() => setLanguage(isArabic ? 'en' : 'ar')}
              className={styles.style169_3}
            >
              <Languages className={styles.style173_6} aria-hidden="true" />
              <span>{t.languageButton}</span>
            </button>
          </div>

          <header className={styles.style179_9}>
            <div className={styles.style180_10}>
              <a
                href={getLandingPageUrl()}
                className="inline-flex items-center cursor-pointer hover:opacity-90 transition-opacity"
              >
                <Image
                  src="/icons/logo-header.png"
                  alt="Radar"
                  width={585}
                  height={152}
                  priority
                  className={styles.brandLogoImg}
                />
              </a>
            </div>
            <p className={styles.style183_12}>
              {t.brand} · {roleName || t.riderContext}
            </p>
            <div key={`${authType}-${language}`}>
              <h1 className={styles.style194_13}>
                {authType === 'register' ? t.registerTitle : t.loginTitle}
              </h1>
              {authType === 'register' && t.registerSubtitle ? (
                <p className={styles.style197_14}>
                  {t.registerSubtitle}
                </p>
              ) : null}
            </div>
          </header>

          <div className={styles.style204_15}>
            {(['register', 'login'] as AuthType[]).map((mode) => {
              const active = authType === mode;

              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setAuthType(mode)}
                  className={styles.style213_16}
                >
                  {active ? <span className={styles.style218_17} /> : null}
                  <span className={cn(styles.style222_18, active ? styles.style222_19 : styles.style222_20)}>
                    {mode === 'register' ? t.register : t.login}
                  </span>
                </button>
              );
            })}
          </div>

          <RegisterForm
            authType={authType}
            language={language}
            isArabic={isArabic}
            t={t}
            phone={phone}
            setPhone={setPhone}
            isPhoneValid={isPhoneValid}
            phoneValidation={phoneValidation}
            governorate={governorate}
            setGovernorate={setGovernorate}
            districtOptions={districtOptions}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            onSubmit={submitMockAuth}
          />

          <div className={styles.style332_40}>
            <span>{authType === 'register' ? t.hasAccount : t.noAccount}</span>{' '}
            <button
              type="button"
              onClick={() => setAuthType((current) => (current === 'register' ? 'login' : 'register'))}
              className={styles.style337_41}
            >
              {authType === 'register' ? t.switchToLogin : t.switchToRegister}
            </button>
          </div>
        </div>
      </section>

      <div className={styles.style345_42}>
        <div className={cn(styles.style347_43, isArabic ? styles.style349_44 : styles.style350_45)}>
          {tickerItems.map((item, index) => (
            <span key={`${item}-${index}`} className={styles.style354_46}>
              {item}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}
