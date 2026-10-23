'use client';

import React, { useState, useEffect } from 'react';
import {
  Share,
  PlusSquare,
  Smartphone,
  ShieldCheck,
  Zap,
  MoreHorizontal,
  Apple,
  CheckCircle2,
  Compass,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { detectPlatform, PlatformEnvironment } from '@/lib/pwaGuidance';

const styles = {
  content: 'max-w-[440px] rounded-2xl border border-[#14B8A6]/30 bg-[#0A0F1D] text-white p-5 sm:p-6 shadow-2xl backdrop-blur-xl',
  headerRtl: 'text-right',
  headerLtr: 'text-left',
  title: 'text-lg sm:text-xl font-black text-white flex items-center gap-2',
  titleIcon: 'h-5 w-5 text-[#14F5D5]',
  description: 'text-xs leading-relaxed text-slate-300 mt-1',
  iosBadge: 'inline-flex items-center gap-1.5 rounded-full border border-sky-400/30 bg-sky-500/10 px-2.5 py-1 text-[11px] font-bold text-sky-300 mb-2',
  tabContainer: 'grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/10 my-3',
  tabBtn: 'flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer',
  tabActive: 'bg-[#14B8A6] text-[#0A0F1D] shadow-md font-black',
  tabIdle: 'text-slate-400 hover:text-white hover:bg-white/[0.05]',
  stepList: 'my-3 space-y-2.5',
  stepCard: 'flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.06]',
  stepBadge: 'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#14B8A6]/20 font-mono text-xs font-black text-[#14F5D5]',
  stepContent: 'space-y-0.5 min-w-0 flex-1',
  stepHeader: 'flex items-center gap-1.5',
  stepIcon: 'h-4 w-4 text-[#14F5D5] shrink-0',
  stepTitle: 'text-xs font-bold text-slate-200',
  stepDesc: 'text-[11px] text-slate-400 leading-normal',
  tipBox: 'rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5 my-3 text-[11px] font-medium text-emerald-200 leading-relaxed flex items-start gap-2',
  tipIcon: 'h-4 w-4 text-emerald-400 shrink-0 mt-0.5',
  closeButton: 'h-11 w-full rounded-xl bg-[#14B8A6] font-bold text-[#0A0F1D] hover:bg-[#2DD4BF] transition-all active:scale-[0.98]',
} as const;

export interface SovereignPwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isArabic?: boolean;
  role?: 'rider' | 'captain';
}

export function SovereignPwaInstallModal({
  isOpen,
  onClose,
  isArabic = true,
  role = 'rider',
}: SovereignPwaInstallModalProps) {
  const t = useTranslations('pwaInstall');
  const isCaptain = role === 'captain';
  const [platform, setPlatform] = useState<PlatformEnvironment>(() => detectPlatform());
  const [activeIosBrowser, setActiveIosBrowser] = useState<'safari' | 'chrome'>('safari');

  useEffect(() => {
    const current = detectPlatform();
    setPlatform(current);
    if (current.isChrome) {
      setActiveIosBrowser('chrome');
    } else {
      setActiveIosBrowser('safari');
    }
  }, []);

  const isIOS = platform.isIOS;

  const getSteps = () => {
    if (isIOS) {
      if (activeIosBrowser === 'chrome') {
        return [
          {
            num: 1,
            Icon: MoreHorizontal,
            title: t('chromeStep1Title'),
            desc: t('chromeStep1Desc'),
          },
          {
            num: 2,
            Icon: PlusSquare,
            title: t('chromeStep2Title'),
            desc: t('chromeStep2Desc'),
          },
          {
            num: 3,
            Icon: isCaptain ? Zap : Smartphone,
            title: t('chromeStep3Title'),
            desc: t('chromeStep3Desc'),
          },
        ];
      }

      // Safari on iOS
      return [
        {
          num: 1,
          Icon: Share,
          title: t('safariStep1Title'),
          desc: t('safariStep1Desc'),
        },
        {
          num: 2,
          Icon: PlusSquare,
          title: t('safariStep2Title'),
          desc: t('safariStep2Desc'),
        },
        {
          num: 3,
          Icon: isCaptain ? Zap : Smartphone,
          title: t('safariStep3Title'),
          desc: t('safariStep3Desc'),
        },
      ];
    }

    // Android / Desktop fallback
    return [
      {
        num: 1,
        Icon: MoreHorizontal,
        title: t('otherStep1Title'),
        desc: t('otherStep1Desc'),
      },
      {
        num: 2,
        Icon: PlusSquare,
        title: t('otherStep2Title'),
        desc: t('otherStep2Desc'),
      },
      {
        num: 3,
        Icon: isCaptain ? Zap : Smartphone,
        title: t('otherStep3Title'),
        desc: t('otherStep3Desc'),
      },
    ];
  };

  const steps = getSteps();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className={styles.content} dir={isArabic ? 'rtl' : 'ltr'}>
        <DialogHeader className={cn(isArabic ? styles.headerRtl : styles.headerLtr)}>
          {isIOS && (
            <div className={styles.iosBadge}>
              <Apple className="h-3.5 w-3.5" />
              <span>{t('iosBadge')}</span>
            </div>
          )}
          <DialogTitle className={styles.title}>
            <ShieldCheck className={styles.titleIcon} />
            <span>{isCaptain ? t('titleCaptain') : t('titleRider')}</span>
          </DialogTitle>
          <DialogDescription className={styles.description}>
            {isIOS ? t('descIos') : isCaptain ? t('descCaptain') : t('descRider')}
          </DialogDescription>
        </DialogHeader>

        {isIOS && (
          <div className={styles.tabContainer}>
            <button
              type="button"
              onClick={() => setActiveIosBrowser('safari')}
              className={cn(styles.tabBtn, activeIosBrowser === 'safari' ? styles.tabActive : styles.tabIdle)}
            >
              <Compass className="h-3.5 w-3.5" />
              <span>{t('tabSafari')}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveIosBrowser('chrome')}
              className={cn(styles.tabBtn, activeIosBrowser === 'chrome' ? styles.tabActive : styles.tabIdle)}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
              <span>{t('tabChrome')}</span>
            </button>
          </div>
        )}

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

        <div className={styles.tipBox}>
          <CheckCircle2 className={styles.tipIcon} />
          <span>{t('tip')}</span>
        </div>

        <Button
          type="button"
          onClick={onClose}
          className={styles.closeButton}
        >
          {t('confirmBtn')}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
