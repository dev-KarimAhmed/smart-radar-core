'use client';

import React from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { Languages, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getLandingPageUrl } from '@/lib/constants';
import { styles } from './personal-step.styles';
import { type Lang, type AuthMode } from './personal-step.copy';

export function PersonalLanguageToggle({
  isArabic,
  languageAria,
  languageButton,
  onToggle,
}: {
  isArabic: boolean;
  languageAria: string;
  languageButton: string;
  onToggle: () => void;
}) {
  return (
    <header className="absolute top-4 sm:top-6 start-4 sm:start-6 z-20">
      <button
        type="button"
        onClick={onToggle}
        className={styles.style337_3}
        aria-label={languageAria}
      >
        <Languages className={styles.style341_6} />
        <span>{languageButton}</span>
      </button>
    </header>
  );
}

export function PersonalBrandHeader({
  currentLang,
  isArabic,
  brand,
  roleName,
  mode,
  registerTitle,
  loginTitle,
  registerSubtitle,
  loginSubtitle,
}: {
  currentLang: Lang;
  isArabic: boolean;
  brand: string;
  roleName: string;
  mode: AuthMode;
  registerTitle: string;
  loginTitle: string;
  registerSubtitle: string;
  loginSubtitle: string;
}) {
  return (
    <header className={styles.style347_9}>
      <div className={styles.style348_10}>
        <a href={getLandingPageUrl()} className="inline-block transition hover:opacity-90">
          <Image
            src="/logo.png"
            alt={isArabic ? 'شعار بينكم' : 'Bynkcom logo'}
            width={380}
            height={152}
            priority
            className={styles.brandLogoImg}
          />
        </a>
      </div>
      <p className={styles.style351_12}>
        {brand} · {roleName}
      </p>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${mode}-${currentLang}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          <h1 className={styles.style362_13}>
            {mode === 'register' ? registerTitle : loginTitle}
          </h1>
          <p className={styles.style365_14}>
            {mode === 'register' ? registerSubtitle : loginSubtitle}
          </p>
        </motion.div>
      </AnimatePresence>
    </header>
  );
}

export function PersonalModeSwitch({
  role,
  mode,
  hasAccount,
  noAccount,
  switchToLogin,
  switchToRegister,
  createAccountPulseKey,
  onToggleMode,
}: {
  role?: string | null;
  mode: AuthMode;
  hasAccount: string;
  noAccount: string;
  switchToLogin: string;
  switchToRegister: string;
  createAccountPulseKey: number;
  onToggleMode: () => void;
}) {
  if (role === 'admin') return null;

  return (
    <div className={styles.style794_131}>
      <span>{mode === 'register' ? hasAccount : noAccount}</span>{' '}
      <motion.button
        key={mode === 'login' ? createAccountPulseKey : 'static'}
        type="button"
        onClick={onToggleMode}
        className={styles.createAccountLink}
        initial={mode === 'login' ? { scale: 1, color: '#94A3B8' } : false}
        animate={mode === 'login' ? { scale: [1, 1.22, 0.94, 1.06, 1], color: '#14B8A6' } : undefined}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      >
        {mode === 'login' ? <UserPlus className={styles.createAccountIcon} aria-hidden="true" /> : null}
        {mode === 'register' ? switchToLogin : switchToRegister}
      </motion.button>
    </div>
  );
}

export function PersonalTicker({
  tickerItems,
  isArabic,
}: {
  tickerItems: string[];
  isArabic: boolean;
}) {
  return (
    <div className={styles.style871_148}>
      <div
        className={cn(styles.style873_149, isArabic
          ? styles.style875_150
          : styles.style876_151)}
      >
        {tickerItems.map((item, index) => (
          <span key={`${item}-${index}`} className={styles.style880_152}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
