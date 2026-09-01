'use client';

import React from 'react';
import { Loader2, Mail, ShieldCheck } from 'lucide-react';

import { useDashboardLanguage } from '@/shared/hooks/use-dashboard-language';
import { useRecoveryEmail } from '../hooks/use-recovery-email';

const styles = {
  block: 'rounded-2xl border border-white/10 bg-black/20 p-3.5',
  head: 'flex items-center gap-2',
  icon: 'h-3.5 w-3.5 text-[#5eead4]',
  label: 'text-xs font-black text-slate-200',
  hint: 'mt-1 text-[10px] leading-relaxed text-slate-500',
  row: 'mt-2.5 flex flex-wrap items-center gap-2',
  input: 'min-w-0 flex-1 rounded-xl border border-slate-800 bg-black/50 px-3 py-2 text-xs text-white outline-none transition focus:border-[#14B8A6]',
  save: 'shrink-0 rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-3 py-2 text-[11px] font-bold text-emerald-300 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-40',
  pending: 'mt-2 flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[10px] font-bold leading-relaxed text-amber-200',
  active: 'mt-2 flex items-start gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-[10px] font-bold leading-relaxed text-emerald-200',
  error: 'mt-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-[10px] font-bold leading-relaxed text-rose-200',
  statusIcon: 'mt-0.5 h-3 w-3 shrink-0',
} as const;

const copy = {
  ar: {
    label: 'إيميل استرجاع (اختياري)',
    hint: 'لو ضفت إيميل، تقدر ترجّع كلمة المرور بنفسك من غير ما تستنى الدعم. من غيره، الاسترجاع هيتطلب موافقة الإدارة.',
    placeholder: 'you@example.com',
    save: 'حفظ',
    saving: 'جاري الحفظ…',
    pending: 'بعتنالك رسالة تأكيد. لازم تفتحها عشان الإيميل يتفعّل — لحد ساعتها الاسترجاع لسه محتاج الدعم.',
    active: 'الاسترجاع الذاتي مفعّل على هذا الإيميل.',
    failed: 'تعذّر حفظ الإيميل.',
  },
  en: {
    label: 'Recovery email (optional)',
    hint: 'With an email on file you can reset your own password without waiting for support. Without one, recovery needs an admin to approve it.',
    placeholder: 'you@example.com',
    save: 'Save',
    saving: 'Saving…',
    pending: 'A confirmation email is on its way. You must open it before the address is active — until then recovery still needs support.',
    active: 'Self-service recovery is active on this address.',
    failed: 'Could not save the email.',
  },
} as const;

/**
 * One recovery-email editor, used by every profile screen. Written once because the same
 * "an unconfirmed address is not yet a working recovery route" caveat has to be told
 * identically everywhere, and three hand-written copies would not stay identical.
 */
export function RecoveryEmailField() {
  const { language } = useDashboardLanguage();
  const t = copy[language === 'en' ? 'en' : 'ar'];
  const { status, currentEmail, isSaving, save } = useRecoveryEmail();

  const [draft, setDraft] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => { setDraft(currentEmail); }, [currentEmail]);

  const handleSave = async () => {
    setError('');
    try {
      await save(draft);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t.failed);
    }
  };

  return (
    <div className={styles.block}>
      <div className={styles.head}>
        <Mail className={styles.icon} />
        <span className={styles.label}>{t.label}</span>
      </div>
      <p className={styles.hint}>{t.hint}</p>

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
          disabled={isSaving || !draft.includes('@') || draft.trim() === currentEmail}
          className={styles.save}
        >
          {isSaving ? t.saving : t.save}
        </button>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      {status === 'pending' ? (
        <p className={styles.pending}>
          <Loader2 className={styles.statusIcon} />
          {t.pending}
        </p>
      ) : status === 'set' ? (
        <p className={styles.active}>
          <ShieldCheck className={styles.statusIcon} />
          {t.active}
        </p>
      ) : null}
    </div>
  );
}
