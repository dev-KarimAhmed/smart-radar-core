'use client';

import React from 'react';
import { ShieldAlert, X } from 'lucide-react';

import { useDashboardLanguage } from '@/shared/hooks/use-dashboard-language';
import { useRecoveryEmail } from '../hooks/use-recovery-email';

const styles = {
  banner: 'relative flex flex-col gap-2.5 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3.5',
  head: 'flex items-start gap-2 pe-6',
  icon: 'mt-0.5 h-4 w-4 shrink-0 text-amber-300',
  text: 'text-xs font-bold leading-relaxed text-amber-100',
  row: 'flex flex-wrap items-center gap-2',
  input: 'min-w-0 flex-1 rounded-xl border border-amber-500/30 bg-black/40 px-3 py-2 text-xs text-white outline-none transition focus:border-amber-300',
  save: 'shrink-0 rounded-xl bg-amber-400 px-3 py-2 text-[11px] font-black text-[#231603] transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50',
  dismiss: 'absolute end-2 top-2 grid h-6 w-6 place-items-center rounded-lg text-amber-200/70 transition hover:bg-white/10 hover:text-amber-100',
  dismissIcon: 'h-3.5 w-3.5',
  done: 'text-xs font-bold leading-relaxed text-emerald-200',
  error: 'text-[10px] font-bold text-rose-200',
} as const;

const DISMISS_KEY = 'radar_recovery_email_prompt_dismissed';

const copy = {
  ar: {
    message: 'حسابك مالوش إيميل استرجاع. لو نسيت كلمة المرور، هتحتاج تستنى الإدارة تتحقق من هويتك. ضيف إيميل دلوقتي وترجّعها بنفسك في ثانية.',
    placeholder: 'you@example.com',
    save: 'إضافة',
    saving: 'جاري الحفظ…',
    done: 'بعتنالك رسالة تأكيد على الإيميل. افتحها عشان يتفعّل.',
    dismiss: 'إخفاء',
    failed: 'تعذّر حفظ الإيميل.',
  },
  en: {
    message: 'Your account has no recovery email. If you forget your password you will have to wait for an admin to verify you. Add one now and you can reset it yourself.',
    placeholder: 'you@example.com',
    save: 'Add',
    saving: 'Saving…',
    done: 'A confirmation email is on its way. Open it to activate the address.',
    dismiss: 'Dismiss',
    failed: 'Could not save the email.',
  },
} as const;

/**
 * Shown to accounts that predate the recovery email, which is most of them.
 *
 * The gap it closes: an email can only be added while signed IN, so someone who is already
 * locked out can never add one. Asking before that happens is the only moment the offer is
 * useful at all.
 *
 * Saves inline rather than linking to the profile — a prompt that costs three navigations to
 * act on is a prompt that gets dismissed.
 */
export function RecoveryEmailBanner() {
  const { language } = useDashboardLanguage();
  const t = copy[language === 'en' ? 'en' : 'ar'];
  const { status, isSaving, save } = useRecoveryEmail();

  const [draft, setDraft] = React.useState('');
  const [error, setError] = React.useState('');
  const [isDismissed, setIsDismissed] = React.useState(true);

  React.useEffect(() => {
    // Read in an effect, not during render: localStorage does not exist on the server, and
    // it throws outright in some privacy modes.
    try {
      setIsDismissed(window.localStorage.getItem(DISMISS_KEY) === '1');
    } catch {
      setIsDismissed(false);
    }
  }, []);

  const dismiss = () => {
    setIsDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // A viewer who blocks storage just sees the prompt again next session. Not worth
      // failing over.
    }
  };

  const handleSave = async () => {
    setError('');
    try {
      await save(draft);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t.failed);
    }
  };

  // 'loading' is deliberately silent: flashing a security warning at someone who already has
  // an email, for the moment before the session resolves, teaches them to ignore it.
  if (status === 'loading' || status === 'set') return null;
  if (status === 'missing' && isDismissed) return null;

  return (
    <div className={styles.banner}>
      <button type="button" onClick={dismiss} aria-label={t.dismiss} className={styles.dismiss}>
        <X className={styles.dismissIcon} />
      </button>

      {status === 'pending' ? (
        <p className={styles.done}>{t.done}</p>
      ) : (
        <>
          <div className={styles.head}>
            <ShieldAlert className={styles.icon} />
            <p className={styles.text}>{t.message}</p>
          </div>
          <div className={styles.row}>
            <input
              type="email"
              dir="ltr"
              inputMode="email"
              autoComplete="email"
              placeholder={t.placeholder}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className={styles.input}
            />
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving || !draft.includes('@')}
              className={styles.save}
            >
              {isSaving ? t.saving : t.save}
            </button>
          </div>
          {error ? <p className={styles.error}>{error}</p> : null}
        </>
      )}
    </div>
  );
}
