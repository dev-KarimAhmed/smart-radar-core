'use client';

import React from 'react';
import { Share, PlusSquare, Smartphone, ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const styles = {
  content: 'max-w-[420px] rounded-2xl border border-[#14B8A6]/30 bg-[#0A0F1D] text-white p-6 shadow-2xl backdrop-blur-xl',
  headerRtl: 'text-right',
  headerLtr: 'text-left',
  title: 'text-xl font-black text-white flex items-center gap-2',
  titleIcon: 'h-5 w-5 text-[#14F5D5]',
  description: 'text-xs leading-relaxed text-slate-300 mt-1',
  stepList: 'my-4 space-y-2.5',
  stepCard: 'flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.06]',
  stepBadge: 'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#14B8A6]/20 font-mono text-xs font-black text-[#14F5D5]',
  stepContent: 'space-y-0.5',
  stepHeader: 'flex items-center gap-1.5',
  stepIcon: 'h-4 w-4 text-[#14F5D5]',
  stepTitle: 'text-xs font-bold text-slate-200',
  stepDesc: 'text-[11px] text-slate-400 leading-normal',
  closeButton: 'h-11 w-full rounded-xl bg-[#14B8A6] font-bold text-[#0A0F1D] hover:bg-[#2DD4BF] transition-all active:scale-[0.98]',
} as const;

export interface RiderPwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isArabic: boolean;
}

export function RiderPwaInstallModal({
  isOpen,
  onClose,
  isArabic,
}: RiderPwaInstallModalProps) {
  const steps = [
    {
      num: 1,
      Icon: Share,
      title: isArabic ? 'اضغط على زر المشاركة (Share)' : 'Tap the Share Button',
      desc: isArabic ? 'في أسفل شاشة Safari أو قائمة متصفحك.' : 'Located at the bottom of Safari or browser menu.',
    },
    {
      num: 2,
      Icon: PlusSquare,
      title: isArabic ? 'إضافة إلى الشاشة الرئيسية' : 'Add to Home Screen',
      desc: isArabic ? 'مرر لأسفل القائمة واختر "Add to Home Screen".' : 'Scroll through options and select "Add to Home Screen".',
    },
    {
      num: 3,
      Icon: Smartphone,
      title: isArabic ? 'تشغيل كتطبيق مستقل' : 'Launch as Standalone App',
      desc: isArabic ? 'افتح التطبيق من شاشتك للتشغيل الفوري بكامل الشاشة.' : 'Open from your home screen for full offline-first experience.',
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className={styles.content} dir={isArabic ? 'rtl' : 'ltr'}>
        <DialogHeader className={cn(isArabic ? styles.headerRtl : styles.headerLtr)}>
          <DialogTitle className={styles.title}>
            <ShieldCheck className={styles.titleIcon} />
            <span>{isArabic ? 'تثبيت التطبيق على جهازك' : 'Install Standalone App'}</span>
          </DialogTitle>
          <DialogDescription className={styles.description}>
            {isArabic
              ? 'احصل على سرعة إقلاع فورية وإشعارات حية دون استهلاك باقة الإنترنت.'
              : 'Fast instant launch, live offers radar, and standalone full-screen experience.'}
          </DialogDescription>
        </DialogHeader>

        <div className={styles.stepList}>
          {steps.map((stg) => {
            const StepIcon = stg.Icon;
            return (
              <div key={stg.num} className={styles.stepCard}>
                <div className={styles.stepBadge}>
                  {stg.num}
                </div>
                <div className={styles.stepContent}>
                  <div className={styles.stepHeader}>
                    <StepIcon className={styles.stepIcon} />
                    <span className={styles.stepTitle}>{stg.title}</span>
                  </div>
                  <p className={styles.stepDesc}>{stg.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <Button
          type="button"
          onClick={onClose}
          className={styles.closeButton}
        >
          {isArabic ? 'حسناً، فهمت' : 'Got it'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
