'use client';

import React, { useState, useEffect } from 'react';
import {
  Download,
  Share2,
  Sparkles,
  X,
  Smartphone,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { PwaInstallStepsList } from './pwa-install-steps-list';

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
  const {
    canPromptNative,
    guidance,
    platformEnv,
    triggerNativeInstall,
    dismissBanner,
  } = usePwaInstall(role);

  const [isExpanded, setIsExpanded] = useState(false);
  const isIOS = platformEnv.isIOS;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isOpen) {
      window.dispatchEvent(new CustomEvent('pwa-install-modal-open'));
    } else {
      window.dispatchEvent(new CustomEvent('pwa-install-modal-close'));
    }
    return () => {
      window.dispatchEvent(new CustomEvent('pwa-install-modal-close'));
    };
  }, [isOpen]);

  const handleDismiss = () => {
    dismissBanner(1);
    onClose();
  };

  const handleNativeInstall = async () => {
    const installed = await triggerNativeInstall();
    if (installed) {
      onClose();
    }
  };

  const subtitle = role === 'captain'
    ? (isArabic
        ? 'تطبيق كابتن معلن مستقل وخفيف دون استهلاك للمتجر والذاكرة'
        : 'Standalone lightweight Captain PWA with zero app store bloat')
    : (isArabic
        ? 'تطبيق خفيف ومستقل بدون استهلاك للمتجر أو الذاكرة'
        : 'Lightweight standalone app with zero app store bloat');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleDismiss(); }}>
      <DialogContent
        dir={isArabic ? 'rtl' : 'ltr'}
        className="max-w-[460px] w-[calc(100%-1.5rem)] rounded-2xl border border-[#14B8A6]/35 bg-[#0B0F19]/95 p-4 sm:p-5 text-white shadow-[0_25px_60px_rgba(0,0,0,0.85)] backdrop-blur-xl [&>button:last-child]:hidden"
      >
        {/* Top bar: Icon, Title + PWA badge, Subtitle, and Close button */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-10 w-10 shrink-0 rounded-xl border border-[#14B8A6]/40 bg-[#14B8A6]/10 flex items-center justify-center text-[#14F5D5]">
              <Smartphone className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <DialogTitle className="text-xs sm:text-sm font-black tracking-wide text-white">
                  {isArabic ? guidance.titleAr : guidance.titleEn}
                </DialogTitle>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#14B8A6]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#14F5D5]">
                  <Sparkles className="h-2.5 w-2.5" />
                  PWA
                </span>
              </div>
              <DialogDescription className="text-[11px] font-semibold text-slate-300 leading-tight mt-0.5">
                {subtitle}
              </DialogDescription>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label={isArabic ? 'إغلاق الإشعار' : 'Dismiss notice'}
            className="h-11 w-11 shrink-0 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Primary Action Row */}
        <div className="mt-3 flex items-center gap-2">
          {canPromptNative ? (
            <Button
              type="button"
              onClick={() => void handleNativeInstall()}
              className="flex-1 h-11 rounded-xl bg-gradient-to-r from-[#14B8A6] to-[#0D9488] hover:from-[#2DD4BF] hover:to-[#14B8A6] text-[#041215] font-black text-xs sm:text-sm shadow-lg shadow-[#14B8A6]/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>{isArabic ? 'تثبيت التطبيق بنقرة واحدة' : '1-Click Install App'}</span>
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              variant="outline"
              className="flex-1 h-11 rounded-xl border-[#14B8A6]/40 bg-[#14B8A6]/15 hover:bg-[#14B8A6]/25 text-white font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
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
            onClick={handleDismiss}
            className="h-11 px-3 rounded-xl text-[11px] sm:text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer"
          >
            {isArabic ? 'لاحقاً' : 'Later'}
          </Button>
        </div>

        {/* Expandable Step-by-Step Instructions (iOS Safari / Manual Fallback) */}
        {isExpanded && (
          <PwaInstallStepsList guidance={guidance} isArabic={isArabic} isIOS={isIOS} scrollable />
        )}

        {/* Sovereign Engine Footer */}
        <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400 font-bold">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>
              {isArabic ? 'منظومة الـ PWA المستقلة' : 'Sovereign Standalone PWA'}
            </span>
          </span>
          <span className="font-mono text-[#14B8A6]">V2.6-Secured</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
