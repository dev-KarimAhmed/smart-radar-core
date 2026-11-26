'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, FileText, ArrowRight, ArrowLeft, Sparkles, X } from 'lucide-react';

interface CaptainPackageActivatedModalProps {
  isOpen: boolean;
  isArabic: boolean;
  onClose: () => void;
  onNavigateToLegalRecord: () => void;
}

export function CaptainPackageActivatedModal({
  isOpen,
  isArabic,
  onClose,
  onNavigateToLegalRecord,
}: CaptainPackageActivatedModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200"
      dir={isArabic ? 'rtl' : 'ltr'}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative flex flex-col w-full max-w-md rounded-3xl border border-[#00ffcc]/40 bg-[#070D19] p-6 text-center shadow-2xl shadow-[#00ffcc]/10">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 end-4 rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-teal-500/40 bg-teal-500/10 text-[#00ffcc] shadow-[0_0_25px_rgba(0,255,204,0.25)] mb-4">
          <Sparkles className="h-8 w-8 text-[#00ffcc]" />
        </div>

        <h3 className="text-lg sm:text-xl font-black text-white mb-2">
          {isArabic ? 'تهانينا! تم تفعيل الباقة بنجاح' : 'Congratulations! Package Activated'}
        </h3>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-5">
          {isArabic
            ? 'تم اعتماد وتوثيق اشتراكك كـ «كابتن معلن مستقل» بنجاح، وإرسال نسختك الرسمية المعتمدة إلى بريدك الإلكتروني. وثيقة التأسيس والتعاقد أصبحت جاهزة الآن في «سجلاتي» داخل «السجل القانوني».'
            : 'Your subscription as an "Independent Captain Advertiser" has been certified, and your copy was emailed. Your official Foundational Contract is now available in "My Records" under "Legal Record".'}
        </p>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onNavigateToLegalRecord}
            className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-400 via-[#00ffcc] to-emerald-400 px-4 text-xs sm:text-sm font-black text-slate-950 shadow-lg shadow-teal-500/25 hover:shadow-[0_0_25px_rgba(0,255,204,0.4)] hover:brightness-105 active:scale-[0.99] transition cursor-pointer"
          >
            <FileText className="h-4 w-4 text-slate-950 shrink-0" />
            <span>
              {isArabic ? 'الانتقال إلى السجل القانوني وتحميل الوثيقة' : 'Go to Legal Record & Download Document'}
            </span>
            {isArabic ? <ArrowLeft className="h-4 w-4 text-slate-950 ms-1" /> : <ArrowRight className="h-4 w-4 text-slate-950 ms-1" />}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full h-11 inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer"
          >
            {isArabic ? 'المتابعة إلى غرفة التحكم' : 'Continue to Dashboard'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
