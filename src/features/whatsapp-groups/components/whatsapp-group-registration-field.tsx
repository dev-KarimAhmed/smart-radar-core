'use client';

import { useTranslations } from 'next-intl';
import { Link2 } from 'lucide-react';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { useWhatsAppGroupRegistrationField } from '../hooks/use-whatsapp-group-registration-field';
import { WhatsAppGroupErrorBoundary } from './whatsapp-group-error-boundary';

const styles = {
  wrapper: 'space-y-1.5 rounded-2xl border border-white/10 bg-[#0B0F19]/45 p-3.5',
  headerRow: 'flex items-center justify-between gap-2',
  label: 'flex items-center gap-1.5 text-xs font-black text-slate-200',
  icon: 'h-3.5 w-3.5 text-[#14B8A6]',
  badge: 'rounded-full border border-[#14B8A6]/30 bg-[#14B8A6]/10 px-2 py-0.5 text-[10px] font-bold text-[#14F5D5]',
  input: 'min-h-11 w-full rounded-xl border border-white/10 bg-[#0B0F19] px-3.5 text-sm font-semibold text-[#F8FAFC] outline-none transition placeholder:text-[#64748B] focus:border-[#14B8A6]',
  hint: 'text-[11px] font-medium leading-relaxed text-[#94A3B8]',
  error: 'text-[11px] font-bold text-rose-400',
} as const;

function WhatsAppGroupRegistrationFieldInner() {
  const t = useTranslations('whatsappGroupFlow');
  const { isArabic } = useDashboardLanguage();
  const { groupCode, capturedFromLink, hasFormatError, handleChange } =
    useWhatsAppGroupRegistrationField();

  return (
    <div dir={isArabic ? 'rtl' : 'ltr'} className={styles.wrapper}>
      <div className={styles.headerRow}>
        <label htmlFor="whatsapp-group-code-optional" className={styles.label}>
          <Link2 className={styles.icon} aria-hidden="true" />
          <span>{t('fieldLabel')}</span>
        </label>
        {capturedFromLink && !hasFormatError ? (
          <span className={styles.badge}>{t('capturedBadge')}</span>
        ) : null}
      </div>

      <input
        id="whatsapp-group-code-optional"
        type="text"
        dir="ltr"
        value={groupCode}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={t('fieldPlaceholder')}
        className={styles.input}
        autoComplete="off"
      />

      {hasFormatError ? (
        <p className={styles.error}>{t('fieldInvalidFormat')}</p>
      ) : (
        <p className={styles.hint}>{t('fieldHint')}</p>
      )}
    </div>
  );
}

export function WhatsAppGroupRegistrationField() {
  return (
    <WhatsAppGroupErrorBoundary scope="registration_field">
      <WhatsAppGroupRegistrationFieldInner />
    </WhatsAppGroupErrorBoundary>
  );
}
