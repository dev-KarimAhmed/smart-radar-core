'use client';

import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Info, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { VerificationStatus } from '../hooks/use-captain-verification';

interface CaptainVerificationBadgeProps {
  status: VerificationStatus;
  isArabic?: boolean;
}

export function CaptainVerificationBadge({ status, isArabic = true }: CaptainVerificationBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isApproved = status === 'APPROVED';

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-2xl px-2.5 py-2.5 text-xs font-black transition cursor-pointer shadow-sm sm:px-3.5 sm:py-3",
          isApproved
            ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 ring-1 ring-emerald-400/30"
            : "border border-amber-500/50 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 ring-1 ring-amber-400/30"
        )}
        title={
          isApproved
            ? isArabic
              ? 'كابتن معتمد وموثق رسمياً من الإدارة'
              : 'Officially verified by admin'
            : isArabic
              ? 'قبول تلقائي (غير معتمد يدوياً) - اضغط للتفاصيل'
              : 'Auto-accepted (pending manual verification) - Click for details'
        }
      >
        {isApproved ? (
          <>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>{isArabic ? 'موثق رسمياً' : 'Verified'}</span>
          </>
        ) : (
          <>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
            </span>
            <ShieldAlert className="h-4 w-4 text-amber-400" />
            <span>{isArabic ? 'غير معتمد يدوياً' : 'Auto-Accepted'}</span>
          </>
        )}
      </button>

      {/* Verification Explanation Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
          dir={isArabic ? 'rtl' : 'ltr'}
        >
          <div
            className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0B0F19] p-5 sm:p-6 shadow-2xl space-y-4 text-white animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-inner",
                    isApproved
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                      : "border-amber-500/40 bg-amber-500/10 text-amber-300"
                  )}
                >
                  {isApproved ? (
                    <ShieldCheck className="h-6 w-6 text-emerald-400" />
                  ) : (
                    <ShieldAlert className="h-6 w-6 text-amber-400" />
                  )}
                </div>
                <div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider mb-1 border",
                      isApproved
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                    )}
                  >
                    {isApproved
                      ? isArabic ? 'اعتماد رسمي مكتمل ✓' : 'Officially Verified ✓'
                      : isArabic ? 'نظام القبول التلقائي ⚡' : 'Auto-Accepted System ⚡'}
                  </span>
                  <h3 className="text-base font-black text-white">
                    {isApproved
                      ? isArabic ? 'كابتن معتمد وموثق رسمياً' : 'Verified Captain'
                      : isArabic ? 'حساب مفعّل (غير معتمد يدوياً)' : 'Auto-Accepted Account'}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="space-y-3 text-xs sm:text-sm leading-relaxed text-slate-300">
              {isApproved ? (
                <p>
                  {isArabic
                    ? 'تم التحقق من هويتك الوطنية، ورخصة القيادة، وبيانات المركبة يدوياً من قِبل إدارة المنظومة. حسابك يحمل شارة الثقة الكاملة وجميع الصلاحيات التشغيلية مفعلة.'
                    : 'Your identity, driving license, and vehicle documents have been officially verified by admin. Your account has full verified trust status.'}
                </p>
              ) : (
                <div className="space-y-2.5">
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-amber-200">
                    <p className="font-bold flex items-center gap-1.5 text-xs text-amber-300 mb-1">
                      <Zap className="h-4 w-4 text-amber-400 shrink-0" />
                      <span>{isArabic ? 'أنت مفعل وتستقبل الرحلات فوراً' : 'You are active and receiving trips'}</span>
                    </p>
                    <p className="text-[11px] leading-relaxed text-amber-200/90">
                      {isArabic
                        ? 'في رادار، يتم قبول جميع الكباتن تلقائياً ومباشرة عند التسجيل دون أي انتظار. يمكنك تشغيل الرادار واستقبال الطلبات والمزايدة وإنجاز الرحلات بدون أي قيود.'
                        : 'In Radar, all captains are accepted by default upon registration. You can go online, receive requests, bid, and complete trips with zero blockers.'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3.5 space-y-2">
                    <p className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
                      <Info className="h-3.5 w-3.5 text-[#14F5D5]" />
                      <span>{isArabic ? 'ماذا يعني وسم «غير معتمد يدوياً»؟' : 'What does "Not Manually Verified" mean?'}</span>
                    </p>
                    <p className="text-[11px] leading-relaxed text-slate-400">
                      {isArabic
                        ? 'يعني أن مستنداتك المسجلة قيد المراجعة اليدوية من قِبل المشرفين. بمجرد تدقيقها، ستتحول شارتك تلقائياً إلى «موثق رسمياً ✓» مع إضافة ختم الاعتماد الرسمي لملفك.'
                        : 'It means your documents are queued for manual administrative review. Once verified by the team, your badge will automatically upgrade to "Verified ✓".'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end pt-2 border-t border-white/10">
              <Button
                type="button"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="bg-[#14B8A6] text-[#06111f] hover:bg-[#14F5D5] text-xs font-black cursor-pointer px-5 rounded-xl"
              >
                {isArabic ? 'حسناً، فهمت' : 'Got it'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
