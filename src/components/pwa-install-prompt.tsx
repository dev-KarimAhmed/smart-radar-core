'use client';

import React, { useEffect, useState } from 'react';
import { Layers, Phone, Download, MoreVertical, Sparkles, X, Share2, PlusSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';

export function PwaInstallPrompt() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios'>('android');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if running in standalone mode (already installed/added to PWA)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;

    // Check if user has dismissed the prompt
    const isDismissed = localStorage.getItem('pwa_prompt_dismissed') === 'true';

    if (!isStandalone && !isDismissed) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa_prompt_dismissed', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-md bg-[#0A0F1D]/95 border border-white/10 text-white rounded-[28px] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl overflow-hidden focus:outline-none">
        <VisuallyHidden>
          <DialogTitle>تثبيت التطبيق</DialogTitle>
        </VisuallyHidden>

        {/* Close Button */}
        {/* <button
          onClick={handleClose}
          className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-white/70 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button> */}

        <div className="flex flex-col items-center text-center mt-2 space-y-4" dir="rtl">
          {/* Circular Glowing Icon container */}
          <div className="relative h-20 w-20 flex items-center justify-center rounded-[24px] border border-[#14B8A6]/30 bg-[#14B8A6]/5 shadow-[0_0_20px_rgba(20,184,166,0.1)]">
            <div className="absolute inset-0 rounded-[24px] bg-[#14B8A6]/5 blur-md" />
            <div className="h-10 w-10 flex items-center justify-center rounded-full border border-[#14B8A6]/40 bg-[#0A0F1D] text-[#14B8A6]">
              <span className="text-xl">★</span>
            </div>
          </div>

          {/* Title */}
          <div className="flex items-center gap-2 justify-center text-lg sm:text-xl font-black text-white">
            <Sparkles className="h-5 w-5 text-[#14F5D5] animate-pulse" />
            <h2>بوابة التثبيت السيادي PWA</h2>
          </div>

          {/* Subtitle */}
          <p className="text-xs text-[#94A3B8] leading-relaxed px-2 font-bold">
            قم بإضافة تطبيق <span className="text-white font-extrabold">بينكم الدولية</span> لشاشتك الرئيسية للاستمتاع بواجهات أصيلة وسريعة بنسبة 100% ودون الحاجة للمتاجر الاحتكارية.
          </p>

          {/* Tab Selector */}
          <div className="w-full flex p-1.5 rounded-2xl bg-black/40 border border-white/5 gap-2 mt-2">
            <button
              onClick={() => setActiveTab('android')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'android'
                  ? 'bg-white/[0.06] border border-white/10 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>أندرويد / كروم</span>
            </button>
            <button
              onClick={() => setActiveTab('ios')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'ios'
                  ? 'bg-white/[0.06] border border-white/10 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Phone className="h-4 w-4" />
              <span>هواتف آيفون (iOS)</span>
            </button>
          </div>

          {/* Steps list */}
          <div className="w-full space-y-4 text-right mt-3">
            {activeTab === 'android' ? (
              <>
                {/* Step 1 */}
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-[#14B8A6]/20 text-[#14F5D5] flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                      اضغط على خيارات المتصفح
                      <span className="inline-flex p-1 rounded-md bg-white/5 border border-white/10">
                        <MoreVertical className="h-3 w-3 text-slate-400" />
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400 font-bold leading-normal">
                      (Chrome) اضغط على النقاط الثلاث في أعلى يمين المتصفح.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-[#14B8A6]/20 text-[#14F5D5] flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                      اختر "تثبيت التطبيق" أو "إضافة للرئيسية"
                      <span className="inline-flex p-1 rounded-md bg-white/5 border border-white/10">
                        <Download className="h-3 w-3 text-[#14F5D5]" />
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400 font-bold leading-normal">
                      "Add to Home Screen" أو "Install app" اضغط على خيار.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-[#14B8A6]/20 text-[#14F5D5] flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-white">
                      قم بتأكيد التثبيت في النافذة المنبثقة
                    </h4>
                    <p className="text-[11px] text-slate-400 font-bold leading-normal">
                      سيتم تثبيت التطبيق وتلقي إشعارات النبض بشكل موثوق وسلس.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Step 1 */}
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-[#14B8A6]/20 text-[#14F5D5] flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                      اضغط على زر المشاركة
                      <span className="inline-flex p-1 rounded-md bg-white/5 border border-white/10">
                        <Share2 className="h-3 w-3 text-[#14F5D5]" />
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400 font-bold leading-normal">
                      اضغط على زر المشاركة في أسفل متصفح Safari.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-[#14B8A6]/20 text-[#14F5D5] flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                      اختر "إضافة إلى الشاشة الرئيسية"
                      <span className="inline-flex p-1 rounded-md bg-white/5 border border-white/10">
                        <PlusSquare className="h-3 w-3 text-slate-400" />
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400 font-bold leading-normal">
                      اضغط على خيار "إضافة إلى الشاشة الرئيسية" من القائمة.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-[#14B8A6]/20 text-[#14F5D5] flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-white">
                      قم بتأكيد التثبيت
                    </h4>
                    <p className="text-[11px] text-slate-400 font-bold leading-normal">
                      اضغط على "إضافة" في أعلى اليسار وسيظهر التطبيق على شاشتك.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Dismiss Button */}
          <Button
            onClick={handleDismiss}
            className="w-full h-14 rounded-2xl border border-white/10 bg-[#0F172A] hover:bg-[#1E293B] text-slate-300 font-bold text-sm transition-all mt-4 cursor-pointer"
          >
            سأقوم بالتثبيت لاحقاً
          </Button>

          {/* Footer information */}
          <div className="w-full flex items-center justify-between text-[9px] text-[#64748B] pt-4 border-t border-white/5 font-bold">
            <span>PWA_BUILD: V2.6-Secured</span>
            <div className="flex items-center gap-1">
              <span>SOVEREIGN PWA ACTIVE</span>
              <span className="h-2 w-2 rounded-full bg-[#14B8A6] animate-pulse" />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
