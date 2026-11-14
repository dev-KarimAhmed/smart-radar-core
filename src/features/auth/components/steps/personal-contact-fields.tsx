'use client';

import React from 'react';
import { Check, Mail, Phone, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { styles } from './personal-step.styles';
import { PersonalStepField } from './personal-step-field';

interface PersonalContactFieldsProps {
  mode: 'register' | 'login';
  isArabic: boolean;
  fullNameLabel: string;
  fullNamePlaceholder: string;
  name: string;
  setName: (name: string) => void;
  phoneLabel: string;
  phonePlaceholder?: string;
  phone: string;
  setPhone: (phone: string) => void;
  isPhoneValid: boolean;
  phoneValidationMessage?: string;
  phoneValidationHint: string;
  emailLabel: string;
  emailPlaceholder: string;
  email: string;
  setEmail: (email: string) => void;
  emailError: string;
  setEmailError: (error: string) => void;
}

export function PersonalContactFields({
  mode,
  isArabic,
  fullNameLabel,
  fullNamePlaceholder,
  name,
  setName,
  phoneLabel,
  phonePlaceholder,
  phone,
  setPhone,
  isPhoneValid,
  phoneValidationMessage,
  phoneValidationHint,
  emailLabel,
  emailPlaceholder,
  email,
  setEmail,
  emailError,
  setEmailError,
}: PersonalContactFieldsProps) {
  return (
    <>
      {mode === 'register' ? (
        <PersonalStepField label={fullNameLabel} icon={<UserRound className={styles.style621_79} />}>
          <input
            type="text"
            placeholder={fullNamePlaceholder}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={cn(styles.input, isArabic ? styles.style627_80 : styles.style627_81)}
            autoComplete="name"
            required
          />
        </PersonalStepField>
      ) : null}

      <PersonalStepField label={phoneLabel} icon={<Phone className={styles.style634_82} />}>
        <div className="relative">
          <input
            type="tel"
            dir="ltr"
            inputMode="tel"
            placeholder={phonePlaceholder}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className={cn(
              styles.input,
              styles.style642_83,
              isPhoneValid && '!border-emerald-500/70 focus:!border-emerald-500 ring-1 ring-emerald-500/20',
              !isPhoneValid && phone.trim() && '!border-amber-500/60 focus:!border-amber-500'
            )}
            autoComplete="tel"
            required
          />
          {isPhoneValid ? (
            <span className="absolute end-3 top-1/2 -translate-y-1/2 text-emerald-400 flex items-center pointer-events-none">
              <Check className="h-4 w-4 stroke-[2.5]" />
            </span>
          ) : null}
        </div>
        {!isPhoneValid ? (
          <p
            className={cn(
              isArabic ? styles.style646_84 : styles.style646_85,
              styles.style646_86,
              phone.trim() && 'text-amber-400/90 font-medium'
            )}
          >
            {phone.trim() ? (phoneValidationMessage || phoneValidationHint) : phoneValidationHint}
          </p>
        ) : null}
      </PersonalStepField>

      {mode === 'register' ? (
        <PersonalStepField label={emailLabel} icon={<Mail className={styles.style634_82} />}>
          <input
            type="email"
            dir="ltr"
            inputMode="email"
            placeholder={emailPlaceholder}
            value={email}
            onChange={(event) => {
              const val = event.target.value;
              setEmail(val);
              const cleanVal = val.trim();
              if (!cleanVal) {
                setEmailError(isArabic ? 'البريد الإلكتروني مطلوب لتفعيل الحساب' : 'Email is required');
              } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanVal)) {
                setEmailError(isArabic ? 'يرجى إدخال بريد إلكتروني صحيح (مثل: name@example.com)' : 'Please enter a valid email address');
              } else {
                setEmailError('');
              }
            }}
            className={cn(
              styles.input,
              styles.style642_83,
              emailError
                ? '!border-rose-500/70 focus:!border-rose-500'
                : email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
                  ? '!border-emerald-500/70 focus:!border-emerald-500'
                  : ''
            )}
            autoComplete="email"
          />
          {emailError ? (
            <p className={cn(isArabic ? styles.style646_84 : styles.style646_85, 'text-rose-400 mt-1 font-bold text-[10px] animate-in fade-in duration-150')}>
              {emailError}
            </p>
          ) : email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? (
            <p className={cn(isArabic ? styles.style646_84 : styles.style646_85, 'text-emerald-400 mt-1 font-bold text-[10px] animate-in fade-in duration-150 flex items-center gap-1')}>
              <Check className="h-3 w-3 inline stroke-[2.5]" />
              <span>{isArabic ? 'صيغة البريد الإلكتروني صحيحة' : 'Valid email format'}</span>
            </p>
          ) : null}
        </PersonalStepField>
      ) : null}
    </>
  );
}
