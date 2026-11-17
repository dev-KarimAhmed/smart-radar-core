'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  Download,
  Share2,
  Sparkles,
  X,
  Smartphone,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { cn } from '@/lib/utils';
import { PwaInstallStepsList } from './pwa-install-steps-list';

export interface PwaInstallBannerProps {
  role?: 'rider' | 'captain';
}

export function PwaInstallBanner({ role: propRole }: PwaInstallBannerProps = {}) {
  const pathname = usePathname();
  const role: 'rider' | 'captain' = propRole || (pathname?.startsWith('/captain') ? 'captain' : 'rider');
  const { isArabic } = useDashboardLanguage();
  const {
    isStandalone,
    isInstalled,
    isDismissed,
    canPromptNative,
    guidance,
    platformEnv,
    triggerNativeInstall,
    dismissBanner,
    resetDismissal,
  } = usePwaInstall(role);

  const [isExpanded, setIsExpanded] = useState(false);
  const [isRideFlowActive, setIsRideFlowActive] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  const isIOS = platformEnv.isIOS;

  // Listen to ride flow state to prevent blocking order flow
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleActive = () => setIsRideFlowActive(true);
    const handleInactive = () => setIsRideFlowActive(false);
    const handleModalOpen = () => setIsInstallModalOpen(true);
    const handleModalClose = () => setIsInstallModalOpen(false);

    window.addEventListener('rider-flow-active', handleActive);
    window.addEventListener('rider-flow-inactive', handleInactive);
    window.addEventListener('rider-open-destination', handleActive);
    window.addEventListener('exit-request-flow', handleInactive);
    window.addEventListener('pwa-install-modal-open', handleModalOpen);
    window.addEventListener('pwa-install-modal-close', handleModalClose);

    const checkActive = () => {
      const isFlowActive =
        document.body.getAttribute('data-rider-flow') === 'active' ||
        Boolean(document.querySelector('[data-rider-panel="true"]'));
      if (isFlowActive) {
        setIsRideFlowActive(true);
      }
    };
    checkActive();

    return () => {
      window.removeEventListener('rider-flow-active', handleActive);
      window.removeEventListener('rider-flow-inactive', handleInactive);
      window.removeEventListener('rider-open-destination', handleActive);
      window.removeEventListener('exit-request-flow', handleInactive);
      window.removeEventListener('pwa-install-modal-open', handleModalOpen);
      window.removeEventListener('pwa-install-modal-close', handleModalClose);
    };
  }, []);

  // [ACT-PWA-08] Exit Intent Listener for uninstalled users
  useEffect(() => {
    if (isInstalled || typeof window === 'undefined') return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 10 && isDismissed) {
        // User moves mouse to exit/close tab -> offer install one last time
        resetDismissal();
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [isInstalled, isDismissed, resetDismissal]);

  // If already installed or dismissed by user, do not render banner.
  // Also hide if we can't natively prompt and it's not iOS (meaning it's already installed on Android/PC or unsupported).
  // CRITICAL: NEVER render banner while rider is in active ride flow (destination selection, offers, active trip)
  if (isInstalled || isDismissed || isInstallModalOpen || (!canPromptNative && !isIOS) || isRideFlowActive || pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <aside
      aria-label={isArabic ? 'تثبيت التطبيق السيادي' : 'Install Sovereign App'}
      dir={isArabic ? 'rtl' : 'ltr'}
      className={cn(
        "fixed bottom-20 lg:bottom-6 z-[160] rounded-2xl border border-[#14B8A6]/30 bg-[#0B0F19]/95 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl text-white transition-all duration-300",
        "inset-x-3 sm:inset-x-auto sm:max-w-md",
        role === 'captain' ? "sm:end-6 sm:start-auto" : "lg:start-[312px] lg:end-auto"
      )}
      style={{
        zIndex: 160,
      }}
    >
      {/* Top bar: Title and Close button */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 shrink-0 rounded-xl border border-[#14B8A6]/40 bg-[#14B8A6]/10 flex items-center justify-center text-[#14F5D5]">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-wide text-white">
                {isArabic ? guidance.titleAr : guidance.titleEn}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#14B8A6]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#14F5D5]">
                <Sparkles className="h-2.5 w-2.5" />
                PWA
              </span>
            </div>
            <p className="text-[11px] font-semibold text-slate-300 leading-tight">
              {role === 'captain'
                ? (isArabic
                    ? 'تطبيق كابتن معلن مستقل وخفيف دون استهلاك للمتجر والذاكرة'
                    : 'Standalone lightweight Captain PWA with zero app store bloat')
                : (isArabic
                    ? 'تطبيق خفيف ومستقل بدون استهلاك للمتجر أو الذاكرة'
                    : 'Lightweight standalone app with zero app store bloat')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => dismissBanner(1)}
          aria-label={isArabic ? 'إغلاق الإشعار' : 'Dismiss notice'}
          className="h-11 w-11 shrink-0 flex items-center justify-center rounded-xl border border-white/5 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Primary Action Button */}
      <div className="mt-3 flex items-center gap-2">
        {canPromptNative ? (
          <Button
            type="button"
            onClick={() => void triggerNativeInstall()}
            className="flex-1 h-11 rounded-xl bg-gradient-to-r from-[#14B8A6] to-[#0D9488] hover:from-[#2DD4BF] hover:to-[#14B8A6] text-[#041215] font-black text-xs shadow-lg shadow-[#14B8A6]/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Download className="h-4 w-4" />
            <span>{isArabic ? 'تثبيت التطبيق بنقرة واحدة' : '1-Click Install App'}</span>
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => setIsExpanded(prev => !prev)}
            variant="outline"
            className="flex-1 h-11 rounded-xl border-[#14B8A6]/40 bg-[#14B8A6]/10 hover:bg-[#14B8A6]/20 text-white font-black text-xs flex items-center justify-center gap-2 transition-all"
          >
            {isIOS ? <Share2 className="h-4 w-4 text-[#14F5D5]" /> : <Download className="h-4 w-4 text-[#14F5D5]" />}
            <span>
              {isArabic
                ? isExpanded ? 'إخفاء خطوات التثبيت' : 'عرض خطوات التثبيت السريع'
                : isExpanded ? 'Hide Steps' : 'View Install Steps'}
            </span>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        )}

        <Button
          type="button"
          variant="ghost"
          onClick={() => dismissBanner(1)}
          className="h-11 px-3 rounded-xl text-[11px] font-bold text-slate-400 hover:text-white hover:bg-white/5"
        >
          {isArabic ? 'لاحقاً' : 'Later'}
        </Button>
      </div>

      {/* Expanded Step-by-Step Instructions (Crucial for iOS Safari & Android fallback) */}
      {isExpanded && (
        <PwaInstallStepsList guidance={guidance} isArabic={isArabic} isIOS={isIOS} />
      )}

      {/* Sovereign Engine Badge */}
      <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400 font-bold">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span>
            {isArabic ? 'منظومة الـ PWA المستقلة' : 'Sovereign Standalone PWA'}
          </span>
        </span>
        <span className="font-mono text-[#14B8A6]">V2.6-Secured</span>
      </div>
    </aside>
  );
}
