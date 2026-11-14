'use client';

import React from 'react';
import { Check, Mail, Phone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { styles } from './personal-step.styles';
import { PersonalStepField } from './personal-step-field';

interface PasswordResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isArabic: boolean;
  resetTitle: string;
  resetPhoneLabel?: string;
  resetPhone: string;
  setResetPhone: (value: string) => void;
  resetEmail: string;
  setResetEmail: (value: string) => void;
  resetSubmitting: boolean;
  resetMessage: string;
  resetError: string;
  onSubmit: () => void;
  isResetPhoneValid: boolean;
  resetPhoneValidationMessage?: string;
  phoneValidationHint: string;
}

export function PasswordResetDialog({
  open,
  onOpenChange,
  isArabic,
  resetTitle,
  resetPhoneLabel,
  resetPhone,
  setResetPhone,
  resetEmail,
  setResetEmail,
  resetSubmitting,
  resetMessage,
  resetError,
  onSubmit,
  isResetPhoneValid,
  resetPhoneValidationMessage,
  phoneValidationHint,
}: PasswordResetDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir={isArabic ? 'rtl' : 'ltr'}
        className={styles.style818_134}
      >
        <DialogHeader className={isArabic ? styles.style820_135 : styles.style820_136}>
          <DialogTitle className={styles.style824_139}>{resetTitle}</DialogTitle>
          <DialogDescription className={styles.style825_140}>
            {isArabic
              ? 'استرجاع فوري لكلمة المرور عبر البريد الإلكتروني (Gmail)'
              : 'Instant password recovery via email (Gmail)'}
          </DialogDescription>
        </DialogHeader>

        <div className={styles.style832_141}>
          <div className={styles.style833_142}>
            {isArabic
              ? 'أدخل رقم هاتفك والبريد الإلكتروني المربوط به للتحقق وإرسال رابط استرجاع كلمة المرور.'
              : 'Enter your phone number and the email linked to it to verify and receive the password reset link.'}
          </div>

          <PersonalStepField
            label={resetPhoneLabel || (isArabic ? 'رقم الهاتف المسجل' : 'Registered phone number')}
            icon={<Phone className={styles.style839_143} />}
          >
            <div className="relative">
              <input
                type="tel"
                dir="ltr"
                inputMode="tel"
                autoComplete="tel"
                placeholder={isArabic ? 'رقم هاتفك (مثال: 07XXXXXXXX)' : '07XXXXXXXX'}
                value={resetPhone}
                onChange={(event) => setResetPhone(event.target.value)}
                className={cn(
                  styles.input,
                  styles.style847_144,
                  isResetPhoneValid && '!border-emerald-500/70 focus:!border-emerald-500 ring-1 ring-emerald-500/20',
                  !isResetPhoneValid && resetPhone.trim() && '!border-amber-500/60 focus:!border-amber-500'
                )}
              />
              {isResetPhoneValid ? (
                <span className="absolute end-3 top-1/2 -translate-y-1/2 text-emerald-400 flex items-center pointer-events-none">
                  <Check className="h-4 w-4 stroke-[2.5]" />
                </span>
              ) : null}
            </div>
            {!isResetPhoneValid ? (
              <p className={cn(isArabic ? styles.style646_84 : styles.style646_85, styles.style646_86, resetPhone.trim() && 'text-amber-400/90 font-medium')}>
                {resetPhone.trim()
                  ? (resetPhoneValidationMessage || phoneValidationHint)
                  : (isArabic ? 'اكتب رقم هاتفك المسجل بالصيغة المحلية أو الدولية' : 'Enter your registered phone number in local or international format')}
              </p>
            ) : null}
          </PersonalStepField>

          <PersonalStepField
            label={isArabic ? 'البريد الإلكتروني المربوط بهذا الرقم' : 'Email linked to this phone number'}
            icon={<Mail className={styles.style839_143} />}
          >
            <input
              type="email"
              dir="ltr"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={resetEmail}
              onChange={(event) => setResetEmail(event.target.value)}
              className={cn(styles.input, styles.style847_144)}
            />
          </PersonalStepField>
          <p className={styles.resetEmailNote}>
            {isArabic
              ? 'سيتم التحقق من تطابق البريد الإلكتروني مع رقم الهاتف المسجل قبل إرسال رابط الاسترجاع.'
              : 'Email will be verified against the registered phone number before dispatching the recovery link.'}
          </p>

          {resetMessage ? (
            <p className={styles.resetSuccess}>{resetMessage}</p>
          ) : null}
          {resetError ? <p className={styles.resetError}>{resetError}</p> : null}

          <button
            type="button"
            onClick={onSubmit}
            disabled={
              resetSubmitting ||
              !resetEmail.trim().includes('@') ||
              resetPhone.replace(/\D/g, '').length < 8
            }
            className={styles.resetSubmit}
          >
            {resetSubmitting
              ? (isArabic ? 'جاري التحقق والإرسال…' : 'Verifying & Sending…')
              : (isArabic ? 'إرسال رابط الاسترجاع' : 'Send recovery link')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function buildSupportWhatsappUrl(phone: string, fallbackLabel = 'غير محدد') {
  const supportPhone = getSupportPhone();
  const message = `طلب إعادة تعيين كلمة مرور المستخدم. رقم الحساب: ${phone || fallbackLabel}`;

  if (!supportPhone) {
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  }

  return `https://wa.me/${supportPhone}?text=${encodeURIComponent(message)}`;
}

export function buildSupportTelUrl() {
  const supportPhone = getSupportPhone();
  return supportPhone ? `tel:+${supportPhone}` : '#';
}

export function getSupportPhone() {
  const rawPhone = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP
    || process.env.NEXT_PUBLIC_SUPPORT_PHONE
    || '';
  return rawPhone.replace(/\D/g, '');
}

