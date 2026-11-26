'use client';

import React from 'react';
import { Download, Printer, CheckCircle } from 'lucide-react';

interface UserPrivacyFooterProps {
  isArabic: boolean;
  readOnly: boolean;
  hasAccepted: boolean;
  onAcceptAndClose?: () => void;
  onClose: () => void;
  onDownloadPdf: () => void;
  onPreviewPdf: () => void;
  isDownloadingPdf: boolean;
}

export function UserPrivacyFooter({
  isArabic,
  readOnly,
  hasAccepted,
  onAcceptAndClose,
  onClose,
  onDownloadPdf,
  onPreviewPdf,
  isDownloadingPdf,
}: UserPrivacyFooterProps) {
  return (
    <div className="border-t border-white/10 bg-[#0B0F19] px-6 py-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onDownloadPdf}
          disabled={isDownloadingPdf}
          className="inline-flex items-center gap-1.5 rounded-xl border border-teal-500/40 bg-teal-500/10 hover:bg-teal-500/20 px-3.5 py-2 text-xs font-bold text-[#14F5D5] transition cursor-pointer"
        >
          <Download className="h-4 w-4" />
          {isDownloadingPdf
            ? isArabic
              ? 'جاري التحميل...'
              : 'Downloading...'
            : isArabic
            ? 'تحميل PDF'
            : 'Download PDF'}
        </button>

        <button
          type="button"
          onClick={onPreviewPdf}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer"
        >
          <Printer className="h-4 w-4" />
          {isArabic ? 'معاينة وطباعة' : 'Preview & Print'}
        </button>
      </div>

      <div className="flex items-center gap-2">
        {!readOnly && onAcceptAndClose ? (
          <button
            type="button"
            onClick={onAcceptAndClose}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-[#14F5D5] px-5 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-teal-500/20 hover:brightness-105 active:scale-95 transition cursor-pointer"
          >
            <CheckCircle className="h-4 w-4" />
            {isArabic ? 'أوافق وأقر بالسياسة' : 'I Agree & Acknowledge'}
          </button>
        ) : null}

        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer"
        >
          {isArabic ? 'إغلاق' : 'Close'}
        </button>
      </div>
    </div>
  );
}
