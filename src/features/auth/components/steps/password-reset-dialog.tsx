'use client';

import React from 'react';
import { Mail, Phone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { styles } from './personal-step-constants';

interface PasswordResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isArabic: boolean;
  resetPhone: string;
  setResetPhone: (phone: string) => void;
  resetEmail: string;
  setResetEmail: (email: string) => void;
  resetSubmitting: boolean;
  resetMessage: string;
  resetError: string;
  onSubmit: () => Promise<void>;
  title: string;
  phoneLabel: string;
}

export function PasswordResetDialog({
  open,
  onOpenChange,
  isArabic,
  resetPhone,
  setResetPhone,
  resetEmail,
  setResetEmail,
  resetSubmitting,
  resetMessage,
  resetError,
  onSubmit,
  title,
  phoneLabel,
}: PasswordResetDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir={isArabic ? 'rtl' : 'ltr'}
        className={styles.style818_134}
      >
        <DialogHeader className={isArabic ? styles.style820_135 : styles.style820_136}>
          <DialogTitle className={styles.style824_139}>{title}</DialogTitle>
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

          <label className={styles.style900_153}>
            <span className={styles.style901_154}>
              <span className={styles.style902_155}>
                <Phone className={styles.style839_143} />
              </span>
              {phoneLabel}
            </span>
            <input
              type="tel"
              dir="ltr"
              inputMode="tel"
              autoComplete="tel"
              placeholder={isArabic ? 'رقم هاتفك (مثال: 07XXXXXXXX)' : '07XXXXXXXX'}
              value={resetPhone}
              onChange={(event) => setResetPhone(event.target.value)}
              className={cn(styles.input, styles.style847_144)}
            />
          </label>

          <label className={styles.style900_153}>
            <span className={styles.style901_154}>
              <span className={styles.style902_155}>
                <Mail className={styles.style839_143} />
              </span>
              {isArabic ? 'البريد الإلكتروني المربوط بهذا الرقم' : 'Email linked to this phone number'}
            </span>
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
          </label>

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
            onClick={() => void onSubmit()}
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
