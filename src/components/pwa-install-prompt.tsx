'use client';

import React, { useEffect, useState } from 'react';
import { Layers, Phone, Download, MoreVertical, Sparkles, X, Share2, PlusSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';

import { useAuth } from '@/hooks/use-auth';

import { cn } from '@/lib/utils';
const styles = {
  style45_1: "max-w-md bg-[#0A0F1D]/95 border border-white/10 text-white rounded-[28px] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl overflow-hidden focus:outline-none",
  style58_2: "flex flex-col items-center text-center mt-2 space-y-4",
  style60_3: "relative h-20 w-20 flex items-center justify-center rounded-[24px] border border-[#14B8A6]/30 bg-[#14B8A6]/5 shadow-[0_0_20px_rgba(20,184,166,0.1)]",
  style61_4: "absolute inset-0 rounded-[24px] bg-[#14B8A6]/5 blur-md",
  style62_5: "h-10 w-10 flex items-center justify-center rounded-full border border-[#14B8A6]/40 bg-[#0A0F1D] text-[#14B8A6]",
  style63_6: "text-xl",
  style68_7: "flex items-center gap-2 justify-center text-lg sm:text-xl font-black text-white",
  style69_8: "h-5 w-5 text-[#14F5D5] animate-pulse",
  style74_9: "text-xs text-[#94A3B8] leading-relaxed px-2 font-bold",
  style75_10: "text-white font-extrabold",
  style79_11: "w-full flex p-1.5 rounded-2xl bg-black/40 border border-white/5 gap-2 mt-2",
  style82_12: "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all cursor-pointer",
  style84_13: "bg-white/[0.06] border border-white/10 text-white shadow-lg",
  style85_14: "text-slate-400 hover:text-white",
  style88_15: "h-4 w-4",
  style93_16: "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all cursor-pointer",
  style95_17: "bg-white/[0.06] border border-white/10 text-white shadow-lg",
  style96_18: "text-slate-400 hover:text-white",
  style99_19: "h-4 w-4",
  style105_20: "w-full space-y-4 text-right mt-3",
  style109_21: "flex items-start gap-3",
  style110_22: "h-6 w-6 rounded-full bg-[#14B8A6]/20 text-[#14F5D5] flex items-center justify-center text-xs font-black shrink-0 mt-0.5",
  style113_23: "space-y-1",
  style114_24: "text-xs font-black text-white flex items-center gap-1.5",
  style116_25: "inline-flex p-1 rounded-md bg-white/5 border border-white/10",
  style117_26: "h-3 w-3 text-slate-400",
  style120_27: "text-[11px] text-slate-400 font-bold leading-normal",
  style127_28: "flex items-start gap-3",
  style128_29: "h-6 w-6 rounded-full bg-[#14B8A6]/20 text-[#14F5D5] flex items-center justify-center text-xs font-black shrink-0 mt-0.5",
  style131_30: "space-y-1",
  style132_31: "text-xs font-black text-white flex items-center gap-1.5",
  style134_32: "inline-flex p-1 rounded-md bg-white/5 border border-white/10",
  style135_33: "h-3 w-3 text-[#14F5D5]",
  style138_34: "text-[11px] text-slate-400 font-bold leading-normal",
  style145_35: "flex items-start gap-3",
  style146_36: "h-6 w-6 rounded-full bg-[#14B8A6]/20 text-[#14F5D5] flex items-center justify-center text-xs font-black shrink-0 mt-0.5",
  style149_37: "space-y-1",
  style150_38: "text-xs font-black text-white",
  style153_39: "text-[11px] text-slate-400 font-bold leading-normal",
  style162_40: "flex items-start gap-3",
  style163_41: "h-6 w-6 rounded-full bg-[#14B8A6]/20 text-[#14F5D5] flex items-center justify-center text-xs font-black shrink-0 mt-0.5",
  style166_42: "space-y-1",
  style167_43: "text-xs font-black text-white flex items-center gap-1.5",
  style169_44: "inline-flex p-1 rounded-md bg-white/5 border border-white/10",
  style170_45: "h-3 w-3 text-[#14F5D5]",
  style173_46: "text-[11px] text-slate-400 font-bold leading-normal",
  style180_47: "flex items-start gap-3",
  style181_48: "h-6 w-6 rounded-full bg-[#14B8A6]/20 text-[#14F5D5] flex items-center justify-center text-xs font-black shrink-0 mt-0.5",
  style184_49: "space-y-1",
  style185_50: "text-xs font-black text-white flex items-center gap-1.5",
  style187_51: "inline-flex p-1 rounded-md bg-white/5 border border-white/10",
  style188_52: "h-3 w-3 text-slate-400",
  style191_53: "text-[11px] text-slate-400 font-bold leading-normal",
  style198_54: "flex items-start gap-3",
  style199_55: "h-6 w-6 rounded-full bg-[#14B8A6]/20 text-[#14F5D5] flex items-center justify-center text-xs font-black shrink-0 mt-0.5",
  style202_56: "space-y-1",
  style203_57: "text-xs font-black text-white",
  style206_58: "text-[11px] text-slate-400 font-bold leading-normal",
  style218_59: "w-full h-14 rounded-2xl border border-white/10 bg-[#0F172A] hover:bg-[#1E293B] text-slate-300 font-bold text-sm transition-all mt-4 cursor-pointer",
  style224_60: "w-full flex items-center justify-between text-[9px] text-[#64748B] pt-4 border-t border-white/5 font-bold",
  style226_61: "flex items-center gap-1",
  style228_62: "h-2 w-2 rounded-full bg-[#14B8A6] animate-pulse",
} as const;


export function PwaInstallPrompt() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios'>('android');
  const { loading } = useAuth();

  useEffect(() => {
    if (typeof window === 'undefined' || loading) return;

    // Check if running in standalone mode (already installed/added to PWA)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;

    // Check if user has dismissed the prompt
    const isDismissed = localStorage.getItem('pwa_prompt_dismissed') === 'true';

    if (!isStandalone && !isDismissed) {
      setIsOpen(true);
    }
  }, [loading]);

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
      <DialogContent className={styles.style45_1}>
        {/* The title was already hidden-but-present for screen readers; the description was
            missing entirely, which is what Radix warns about — a dialog announced with no
            statement of what it is asking. Hidden visually for the same reason as the title:
            the sighted layout below already says all of this. */}
        <VisuallyHidden>
          <DialogTitle>تثبيت التطبيق</DialogTitle>
          <DialogDescription>
            خطوات تثبيت تطبيق رادار على شاشة هاتفك للوصول السريع والعمل بدون إنترنت.
          </DialogDescription>
        </VisuallyHidden>

        {/* Close Button */}
        {/* <button
          onClick={handleClose}
          className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-white/70 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button> */}

        <div className={styles.style58_2} dir="rtl">
          {/* Circular Glowing Icon container */}
          <div className={styles.style60_3}>
            <div className={styles.style61_4} />
            <div className={styles.style62_5}>
              <span className={styles.style63_6}>★</span>
            </div>
          </div>

          {/* Title */}
          <div className={styles.style68_7}>
            <Sparkles className={styles.style69_8} />
            <h2>بوابة التثبيت السيادي PWA</h2>
          </div>

          {/* Subtitle */}
          <p className={styles.style74_9}>
            قم بإضافة تطبيق <span className={styles.style75_10}>بينكم الدولية</span> لشاشتك الرئيسية للاستمتاع بواجهات أصيلة وسريعة بنسبة 100% ودون الحاجة للمتاجر الاحتكارية.
          </p>

          {/* Tab Selector */}
          <div className={styles.style79_11}>
            <button
              onClick={() => setActiveTab('android')}
              className={cn(styles.style82_12, activeTab === 'android'
                  ? styles.style84_13
                  : styles.style85_14)}
            >
              <Layers className={styles.style88_15} />
              <span>أندرويد / كروم</span>
            </button>
            <button
              onClick={() => setActiveTab('ios')}
              className={cn(styles.style93_16, activeTab === 'ios'
                  ? styles.style95_17
                  : styles.style96_18)}
            >
              <Phone className={styles.style99_19} />
              <span>هواتف آيفون (iOS)</span>
            </button>
          </div>

          {/* Steps list */}
          <div className={styles.style105_20}>
            {activeTab === 'android' ? (
              <>
                {/* Step 1 */}
                <div className={styles.style109_21}>
                  <div className={styles.style110_22}>
                    1
                  </div>
                  <div className={styles.style113_23}>
                    <h4 className={styles.style114_24}>
                      اضغط على خيارات المتصفح
                      <span className={styles.style116_25}>
                        <MoreVertical className={styles.style117_26} />
                      </span>
                    </h4>
                    <p className={styles.style120_27}>
                      (Chrome) اضغط على النقاط الثلاث في أعلى يمين المتصفح.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className={styles.style127_28}>
                  <div className={styles.style128_29}>
                    2
                  </div>
                  <div className={styles.style131_30}>
                    <h4 className={styles.style132_31}>
                      اختر "تثبيت التطبيق" أو "إضافة للرئيسية"
                      <span className={styles.style134_32}>
                        <Download className={styles.style135_33} />
                      </span>
                    </h4>
                    <p className={styles.style138_34}>
                      "Add to Home Screen" أو "Install app" اضغط على خيار.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className={styles.style145_35}>
                  <div className={styles.style146_36}>
                    3
                  </div>
                  <div className={styles.style149_37}>
                    <h4 className={styles.style150_38}>
                      قم بتأكيد التثبيت في النافذة المنبثقة
                    </h4>
                    <p className={styles.style153_39}>
                      سيتم تثبيت التطبيق وتلقي إشعارات النبض بشكل موثوق وسلس.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Step 1 */}
                <div className={styles.style162_40}>
                  <div className={styles.style163_41}>
                    1
                  </div>
                  <div className={styles.style166_42}>
                    <h4 className={styles.style167_43}>
                      اضغط على زر المشاركة
                      <span className={styles.style169_44}>
                        <Share2 className={styles.style170_45} />
                      </span>
                    </h4>
                    <p className={styles.style173_46}>
                      اضغط على زر المشاركة في أسفل متصفح Safari.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className={styles.style180_47}>
                  <div className={styles.style181_48}>
                    2
                  </div>
                  <div className={styles.style184_49}>
                    <h4 className={styles.style185_50}>
                      اختر "إضافة إلى الشاشة الرئيسية"
                      <span className={styles.style187_51}>
                        <PlusSquare className={styles.style188_52} />
                      </span>
                    </h4>
                    <p className={styles.style191_53}>
                      اضغط على خيار "إضافة إلى الشاشة الرئيسية" من القائمة.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className={styles.style198_54}>
                  <div className={styles.style199_55}>
                    3
                  </div>
                  <div className={styles.style202_56}>
                    <h4 className={styles.style203_57}>
                      قم بتأكيد التثبيت
                    </h4>
                    <p className={styles.style206_58}>
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
            className={styles.style218_59}
          >
            سأقوم بالتثبيت لاحقاً
          </Button>

          {/* Footer information */}
          <div className={styles.style224_60}>
            <span>PWA_BUILD: V2.6-Secured</span>
            <div className={styles.style226_61}>
              <span>SOVEREIGN PWA ACTIVE</span>
              <span className={styles.style228_62} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
