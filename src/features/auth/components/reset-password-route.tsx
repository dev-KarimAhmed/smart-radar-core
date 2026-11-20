'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyRound, Loader2, Mail, ShieldCheck } from 'lucide-react';

import { useDashboardLanguage } from '@/shared/hooks/use-dashboard-language';
import {
  completeEmailRecovery,
  completePasswordReset,
} from '../services/password-recovery';
import {
  styles,
  MIN_PASSWORD_LENGTH,
  resetPasswordCopy,
} from './reset-password/reset-password-copy';
import { useResetPasswordSession } from './reset-password/use-reset-password-session';

export function ResetPasswordRoute() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, direction } = useDashboardLanguage();
  const t = resetPasswordCopy[language === 'en' ? 'en' : 'ar'];

  const token = searchParams.get('token')?.trim() || '';

  const {
    checkingSession,
    sessionError,
    capturedToken,
    canUseForm,
  } = useResetPasswordSession({
    token,
    language,
    missingMessage: t.missing,
  });

  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [isDone, setIsDone] = React.useState(false);

  React.useEffect(() => {
    if (isDone) {
      const timer = setTimeout(() => {
        router.replace('/');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isDone, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(t.tooShort);
      return;
    }
    if (password !== confirmPassword) {
      setError(t.mismatch);
      return;
    }

    setIsSubmitting(true);
    try {
      if (token) {
        await completePasswordReset(token, password);
      } else {
        await completeEmailRecovery(password, capturedToken);
      }
      setIsDone(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t.missing);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeError = error || sessionError;

  return (
    <main dir={direction} className={styles.page}>
      <div className={styles.card}>
        <span className={styles.iconWrap}>
          {isDone ? <ShieldCheck className={styles.icon} /> : <KeyRound className={styles.icon} />}
        </span>
        <h1 className={styles.title}>{t.title}</h1>

        {isDone ? (
          <>
            <p className={styles.subtitle}>{t.done}</p>
            <button type="button" onClick={() => router.replace('/')} className={styles.link}>
              {t.backToLogin}
            </button>
          </>
        ) : checkingSession ? (
          <p className={styles.subtitle}>{t.checking}</p>
        ) : !canUseForm ? (
          <>
            <p className={styles.error}>{activeError || t.missing}</p>
            <div className="mt-4 text-center">
              <a
                href="mailto:Bynkcominfo@gmail.com?subject=طلب مساعدة استرجاع كلمة المرور"
                className="inline-flex items-center gap-1.5 text-xs text-[#14F5D5] hover:underline"
              >
                <Mail className="h-3.5 w-3.5" />
                <span>{language === 'ar' ? 'تواصل مع الدعم:' : 'Contact Support:'}</span>
                <span className="font-mono text-white underline">Bynkcominfo@gmail.com</span>
              </a>
            </div>
            <button type="button" onClick={() => router.replace('/')} className={styles.link}>
              {t.backToLogin}
            </button>
          </>
        ) : (
          <>
            <p className={styles.subtitle}>{token ? t.tokenSubtitle : t.emailSubtitle}</p>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div>
                <label htmlFor="new-password" className={styles.label}>{t.password}</label>
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={styles.input}
                />
                <p className={styles.hint}>{t.hint}</p>
              </div>

              <div>
                <label htmlFor="confirm-password" className={styles.label}>{t.confirm}</label>
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className={styles.input}
                />
              </div>

              {activeError ? <p className={styles.error}>{activeError}</p> : null}

              <button type="submit" disabled={isSubmitting} className={styles.submit}>
                {isSubmitting ? <Loader2 className={styles.spinner} /> : null}
                {t.submit}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
