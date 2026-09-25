'use client';

import React, { useState } from 'react';
import {
  Download,
  Share2,
  PlusSquare,
  Sparkles,
  X,
  Smartphone,
  BatteryCharging,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';

export function PwaInstallBanner() {
  const { isArabic } = useDashboardLanguage();
  const {
    isStandalone,
    isDismissed,
    canPromptNative,
    guidance,
    platformEnv,
    wakeLockActive,
    triggerNativeInstall,
    dismissBanner,
  } = usePwaInstall();

  const [isExpanded, setIsExpanded] = useState(false);

  const isIOS = platformEnv.isIOS;

  // If already standalone (installed) or dismissed by user, do not render banner.
  // Also hide if we can't natively prompt and it's not iOS (meaning it's already installed on Android/PC or unsupported).
  if (isStandalone || isDismissed || (!canPromptNative && !isIOS)) {
    return null;
  }

  return (
    <aside
      aria-label={isArabic ? 'تثبيت التطبيق السيادي' : 'Install Sovereign App'}
      dir={isArabic ? 'rtl' : 'ltr'}
      className="fixed bottom-3 inset-x-3 sm:inset-x-auto sm:right-4 sm:max-w-md z-50 rounded-2xl border border-[#14B8A6]/30 bg-[#0B0F19]/95 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl text-white transition-all duration-300"
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
              {isArabic
                ? 'تطبيق خفيف ومستقل بدون استهلاك للمتجر أو الذاكرة'
                : 'Lightweight standalone app with zero app store bloat'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => dismissBanner(7)}
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
          onClick={() => dismissBanner(3)}
          className="h-11 px-3 rounded-xl text-[11px] font-bold text-slate-400 hover:text-white hover:bg-white/5"
        >
          {isArabic ? 'لاحقاً' : 'Later'}
        </Button>
      </div>

      {/* Expanded Step-by-Step Instructions (Crucial for iOS Safari & Android fallback) */}
      {isExpanded && (
        <div className="mt-3.5 space-y-2 border-t border-white/10 pt-3 animate-in fade-in duration-200">
          <div className="space-y-2">
            {guidance.steps.map((step) => (
              <div
                key={step.number}
                className="flex items-start gap-2.5 rounded-xl bg-black/40 border border-white/5 p-2.5"
              >
                <div className="h-6 w-6 shrink-0 rounded-full bg-[#14B8A6]/20 text-[#14F5D5] flex items-center justify-center text-xs font-black">
                  {step.number}
                </div>
                <div className="space-y-0.5 text-right">
                  <div className="flex items-center gap-1.5 text-xs font-black text-white">
                    <span>{isArabic ? step.titleAr : step.titleEn}</span>
                    {step.iconType === 'share' && <Share2 className="h-3 w-3 text-[#14F5D5]" />}
                    {step.iconType === 'add' && <PlusSquare className="h-3 w-3 text-[#14F5D5]" />}
                    {step.iconType === 'install' && <Download className="h-3 w-3 text-[#14F5D5]" />}
                  </div>
                  <p className="text-[11px] text-slate-300 font-semibold leading-relaxed">
                    {isArabic ? step.instructionAr : step.instructionEn}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Battery Optimization / iOS Web Push Directives */}
          <div className="mt-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 flex items-start gap-2">
            <BatteryCharging className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-200/90 font-bold leading-relaxed">
              {isArabic ? guidance.batteryNoticeAr : guidance.batteryNoticeEn}
            </p>
          </div>

          {guidance.webPushNoticeAr && isIOS && (
            <div className="rounded-xl bg-[#14B8A6]/10 border border-[#14B8A6]/20 p-2.5 flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-[#14F5D5] shrink-0 mt-0.5" />
              <p className="text-[10px] text-emerald-200/90 font-bold leading-relaxed">
                {isArabic ? guidance.webPushNoticeAr : guidance.webPushNoticeEn}
              </p>
            </div>
          )}
        </div>
      )}

      {/* WakeLock status and Sovereign Badge */}
      <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400 font-bold">
        <span className="flex items-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-full ${wakeLockActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}
          />
          <span>
            {wakeLockActive
              ? (isArabic ? 'قفل الشاشة السيادي نشط (WakeLock)' : 'Screen WakeLock Active')
              : (isArabic ? 'وضع الاستعداد' : 'Standby Mode')}
          </span>
        </span>
        <span className="font-mono text-[#14B8A6]">V2.6-Secured</span>
      </div>
    </aside>
  );
}
