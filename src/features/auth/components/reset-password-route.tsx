'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyRound, Loader2, ShieldCheck } from 'lucide-react';

import { useDashboardLanguage } from '@/shared/hooks/use-dashboard-language';
import {
  completeEmailRecovery,
  completePasswordReset,
  hasRecoverySession,
} from '../services/password-recovery';

const styles = {
  page: 'flex min-h-screen items-center justify-center bg-[#0A0F1D] px-4 py-10',
  card: 'w-full max-w-md rounded-3xl border border-white/10 bg-[#0B0F19] p-6 shadow-2xl shadow-black/40',
  iconWrap: 'mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#14B8A6]/15 text-[#14F5D5]',
  icon: 'h-6 w-6',
  title: 'mt-4 text-center text-lg font-black text-white',
  subtitle: 'mt-2 text-center text-xs leading-relaxed text-slate-400',
  form: 'mt-6 space-y-4',
  label: 'block text-xs font-bold text-slate-300',
  input: 'mt-1.5 w-full rounded-2xl border border-slate-800 bg-black/50 px-4 py-3 text-white outline-none transition focus:border-[#14B8A6]',
  hint: 'mt-1.5 text-[10px] text-slate-500',
  submit: 'flex w-full items-center justify-center gap-2 rounded-2xl bg-[#14B8A6] px-4 py-3 text-sm font-black text-[#04140F] transition hover:bg-[#0fa596] disabled:cursor-not-allowed disabled:opacity-50',
  spinner: 'h-4 w-4 animate-spin',
  error: 'rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs font-bold leading-relaxed text-rose-200',
  success: 'rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-xs font-bold leading-relaxed text-emerald-200',
  link: 'mt-4 block w-full text-center text-xs font-bold text-slate-400 transition hover:text-slate-200',
} as const;

const MIN_PASSWORD_LENGTH = 8;

const copy = {
  ar: {
    title: 'كلمة مرور جديدة',
    tokenSubtitle: 'اكتب كلمة المرور الجديدة لحسابك.',
    emailSubtitle: 'تم التحقق من الرابط. اكتب كلمة المرور الجديدة.',
    missing: 'الرابط ناقص أو منتهي الصلاحية. اطلب استرجاع كلمة المرور من جديد.',
    password: 'كلمة المرور الجديدة',
    confirm: 'تأكيد كلمة المرور',
    hint: `${MIN_PASSWORD_LENGTH} أحرف على الأقل.`,
    mismatch: 'كلمتا المرور غير متطابقتين.',
    tooShort: `كلمة المرور لازم تكون ${MIN_PASSWORD_LENGTH} أحرف على الأقل.`,
    submit: 'حفظ كلمة المرور',
    done: 'تم تغيير كلمة المرور. تقدر تسجّل الدخول دلوقتي.',
    backToLogin: 'رجوع لتسجيل الدخول',
    checking: 'جاري التحقق من الرابط…',
  },
  en: {
    title: 'New password',
    tokenSubtitle: 'Enter the new password for your account.',
    emailSubtitle: 'Link verified. Enter your new password.',
    missing: 'This link is incomplete or has expired. Request password recovery again.',
    password: 'New password',
    confirm: 'Confirm password',
    hint: `At least ${MIN_PASSWORD_LENGTH} characters.`,
    mismatch: 'The two passwords do not match.',
    tooShort: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    submit: 'Save password',
    done: 'Your password has been changed. You can sign in now.',
    backToLogin: 'Back to sign in',
    checking: 'Verifying the link…',
  },
} as const;

/**
 * One page for both recovery routes:
 *
 *   ?token=…   an admin-issued one-time token. No session; the server verifies the token.
 *   (no token) Supabase's own email link, which lands here having already created a recovery
 *              session, so the password change is an ordinary authenticated update.
 *
 * Keeping them on one page matters: the captain is told "open this link and set a password"
 * either way, and a second page would be a second thing to get wrong.
 */
export function ResetPasswordRoute() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, direction } = useDashboardLanguage();
  const t = copy[language === 'en' ? 'en' : 'ar'];

  const token = searchParams.get('token')?.trim() || '';

  const [checkingSession, setCheckingSession] = React.useState(!token);
  const [hasSession, setHasSession] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [isDone, setIsDone] = React.useState(false);

  React.useEffect(() => {
    if (token) return;
    let active = true;
    // Supabase parses the recovery fragment and establishes the session asynchronously, so
    // a synchronous check here races it and would report "no session" on a valid link.
    void hasRecoverySession().then((value) => {
      if (!active) return;
      setHasSession(value);
      setCheckingSession(false);
    });
    return () => { active = false; };
  }, [token]);

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
        await completeEmailRecovery(password);
      }
      setIsDone(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t.missing);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canUseForm = Boolean(token) || hasSession;

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
            <p className={styles.error}>{t.missing}</p>
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

              {error ? <p className={styles.error}>{error}</p> : null}

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
