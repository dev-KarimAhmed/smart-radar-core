'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, Download, Printer, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import privacyData from '@/shared/data/privacy-policy.json';
import { downloadPdfInWorker } from '@/shared/utils/background-pdf-download';

export interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  isArabic?: boolean;
}

export function PrivacyPolicyModal({
  isOpen,
  onClose,
  isArabic = true,
}: PrivacyPolicyModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownloadPdf = async () => {
    try {
      setIsDownloading(true);
      await downloadPdfInWorker({
        url: `/api/privacy-policy/pdf?download=true&_t=${Date.now()}`,
        filename: 'Bynkcom_Privacy_Policy.pdf',
      });
    } catch (err) {
      console.warn('PDF download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.open('/privacy-policy', '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <div className="fixed inset-0 bg-transparent cursor-pointer" onClick={onClose} aria-hidden="true" />

      <div
        className={cn(
          'relative z-10 flex flex-col w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-3xl border border-[#14B8A6]/40',
          'bg-gradient-to-b from-[#0F172A] via-[#0B0F19] to-[#060913] shadow-2xl shadow-black/80',
          'animate-in zoom-in-95 duration-200 text-slate-100'
        )}
      >
        <div className="pointer-events-none absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#14F5D5] to-transparent shadow-[0_0_15px_rgba(20,245,213,0.8)]" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 sm:px-6 py-4 bg-[#161F30]/70 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#14B8A6]/15 border border-[#14B8A6]/30 text-[#14F5D5]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-black text-white truncate">
                {privacyData.title}
              </h2>
              <p className="text-[11px] font-semibold text-[#14B8A6] truncate">
                {privacyData.subtitle} · الإصدار المعتمد {privacyData.version}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 text-xs sm:text-sm leading-relaxed text-slate-300 space-y-4 font-sans select-text scrollbar-thin scrollbar-thumb-teal-500/20">
          {/* Preamble */}
          <div className="rounded-2xl border border-[#14B8A6]/25 bg-[#14B8A6]/10 p-4 text-xs sm:text-sm text-teal-200 leading-relaxed space-y-2">
            <p className="font-bold text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#14F5D5]" />
              <span>{privacyData.preamble.title}</span>
            </p>
            {privacyData.preamble.paragraphs.map((p, idx) => (
              <p key={idx} className="text-slate-300">{p}</p>
            ))}
          </div>

          {/* Sections & Articles */}
          {privacyData.sections.map((section, sIdx) => (
            <div key={section.id || sIdx} className="space-y-3 pt-2">
              <h3 className="font-black text-white text-sm sm:text-base text-[#14F5D5] border-b border-teal-500/20 pb-1.5">
                {section.title}
              </h3>
              <div className="space-y-2.5">
                {section.articles.map((art, aIdx) => (
                  <div key={aIdx} className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5 space-y-1">
                    {art.title ? (
                      <h4 className="font-bold text-white text-xs sm:text-sm text-teal-300">{art.title}</h4>
                    ) : null}
                    <div className="space-y-1 text-slate-300 leading-relaxed text-xs sm:text-sm">
                      {art.paragraphs.map((p, pIdx) => (
                        <p key={pIdx}>{p}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-5 sm:px-6 py-3 bg-[#0B0F19] flex items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#14B8A6]/40 bg-[#14B8A6]/15 hover:bg-[#14B8A6]/25 text-[#14F5D5] text-xs font-bold transition-all cursor-pointer"
            >
              {isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              <span>{isArabic ? 'تحميل PDF' : 'Download PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-bold transition-all cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5 text-slate-400" />
              <span>{isArabic ? 'معاينة وطباعة' : 'Preview & Print'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all cursor-pointer"
          >
            {isArabic ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
