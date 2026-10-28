'use client';

import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';

const styles = {
  root: 'flex min-h-screen items-center justify-center bg-[#0B0F19] p-6 text-center text-white',
  cardTamper: 'max-w-sm space-y-3 rounded-3xl border border-red-500/30 bg-[#170808] p-6',
  iconTamper: 'mx-auto h-10 w-10 text-red-400',
  titleTamper: 'text-lg font-black text-red-200',
  bodyTamper: 'text-sm leading-6 text-red-100/80',
  btnTamper: 'mt-4 inline-flex items-center justify-center rounded-2xl bg-rose-500/20 border border-rose-500/50 px-6 py-2.5 text-xs font-black text-rose-300 hover:bg-rose-500/30 transition shadow-lg',
  cardBanned: 'max-w-md space-y-4 rounded-3xl border border-rose-500/40 bg-[#160808] p-6 text-center text-white shadow-2xl',
  iconBanned: 'mx-auto h-12 w-12 text-rose-500 animate-pulse',
  titleBanned: 'text-xl font-black text-rose-200',
  bodyBanned: 'text-xs leading-6 text-rose-100/80',
  btnWrap: 'pt-2',
  btnBanned: 'inline-flex items-center justify-center rounded-2xl bg-rose-500/20 border border-rose-500/50 px-6 py-2.5 text-xs font-black text-rose-300 hover:bg-rose-500/30 transition shadow-lg cursor-pointer',
  cardSuspended: 'max-w-md space-y-4 rounded-3xl border border-amber-500/40 bg-[#171208] p-6 text-center text-white shadow-2xl',
  iconSuspended: 'mx-auto h-12 w-12 text-amber-500 animate-pulse',
  titleSuspended: 'text-xl font-black text-amber-200',
  bodySuspended: 'text-xs leading-6 text-amber-100/80',
  btnRowSuspended: 'flex items-center justify-center gap-3 pt-2',
  btnRefresh: 'inline-flex items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/50 px-5 py-2.5 text-xs font-black text-amber-300 hover:bg-amber-500/30 transition shadow-lg cursor-pointer',
  btnLogout: 'inline-flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 px-5 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/10 transition cursor-pointer',
} as const;

export interface CaptainSecurityScreensProps {
  isTimeTamperingDetected: boolean;
  accountSecurityStatus?: string | null;
  direction: string;
  onLogout: () => void;
}

export function CaptainSecurityScreens({
  isTimeTamperingDetected,
  accountSecurityStatus,
  direction,
  onLogout,
}: CaptainSecurityScreensProps) {
  const t = useTranslations('captainDashboard');

  if (isTimeTamperingDetected) {
    return (
      <div className={styles.root} dir={direction}>
        <div className={styles.cardTamper}>
          <ShieldAlert className={styles.iconTamper} />
          <h1 className={styles.titleTamper}>{t('timeTamperingTitle')}</h1>
          <p className={styles.bodyTamper}>{t('timeTamperingBody')}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className={styles.btnTamper}
          >
            {direction === 'rtl' ? 'إعادة تحميل الصفحة 🔄' : 'Reload Page 🔄'}
          </button>
        </div>
      </div>
    );
  }

  if (accountSecurityStatus === 'BANNED') {
    return (
      <div className={styles.root} dir={direction}>
        <div className={styles.cardBanned}>
          <ShieldAlert className={styles.iconBanned} />
          <h1 className={styles.titleBanned}>
            {direction === 'rtl' ? 'حساب الكابتن محظور نهائياً 🚫' : 'Captain Account Banned 🚫'}
          </h1>
          <p className={styles.bodyBanned}>
            {direction === 'rtl'
              ? 'تم حظر حسابك نهائياً من قبل إدارة المنظومة لمخالفة المعايير التشغيلية والسيادية. تم إيقاف استقبال الرحلات والاتصال بالرادار.'
              : 'Your account has been permanently banned by platform administration due to policy violations.'}
          </p>
          <div className={styles.btnWrap}>
            <button
              type="button"
              onClick={onLogout}
              className={styles.btnBanned}
            >
              {direction === 'rtl' ? 'تسجيل الخروج' : 'Log Out'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (accountSecurityStatus === 'SUSPENDED') {
    return (
      <div className={styles.root} dir={direction}>
        <div className={styles.cardSuspended}>
          <AlertTriangle className={styles.iconSuspended} />
          <h1 className={styles.titleSuspended}>
            {direction === 'rtl' ? 'حساب الكابتن معلق مؤقتاً ⚠️' : 'Captain Account Suspended ⚠️'}
          </h1>
          <p className={styles.bodySuspended}>
            {direction === 'rtl'
              ? 'تم تعليق حسابك مؤقتاً من قبل إدارة العمليات. يرجى مراجعة إدارة المنظومة أو التواصل مع الدعم لفك التعليق وتنشيط الحساب.'
              : 'Your account is temporarily suspended by platform administration. Please contact support.'}
          </p>
          <div className={styles.btnRowSuspended}>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className={styles.btnRefresh}
            >
              {direction === 'rtl' ? 'تحديث الحالة 🔄' : 'Refresh 🔄'}
            </button>
            <button
              type="button"
              onClick={onLogout}
              className={styles.btnLogout}
            >
              {direction === 'rtl' ? 'تسجيل الخروج' : 'Log Out'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
