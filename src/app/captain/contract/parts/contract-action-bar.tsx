'use client';

import React from 'react';
import { ArrowLeft, ArrowRight, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ContractActionBarProps {
  isArabic: boolean;
  onBack: () => void;
  onDownloadPdf: () => void;
  downloading: boolean;
  onPrint: () => void;
}

export function ContractActionBar({
  isArabic,
  onBack,
  onDownloadPdf,
  downloading,
  onPrint,
}: ContractActionBarProps) {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-white/10 bg-[#0B0F19]/90 px-4 py-3 shadow-xl backdrop-blur-xl print:hidden">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
        >
          {isArabic ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
          {isArabic ? 'العودة للحساب' : 'Back to Account'}
        </button>
        <span className="hidden sm:inline-block text-xs font-bold text-teal-400 border-s border-white/10 ps-3 ms-1">
          {isArabic ? 'السجل الإلكتروني المعتمد · بينكم' : 'Certified Electronic Log · Bynkcom'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={onDownloadPdf}
          disabled={downloading}
          className="bg-[#14B8A6] hover:bg-[#2DD4BF] text-[#04140F] font-black text-xs sm:text-sm py-2 px-4 rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-2 cursor-pointer"
        >
          <Download className="h-4 w-4" />
          {downloading
            ? isArabic
              ? 'جاري التحميل...'
              : 'Downloading...'
            : isArabic
            ? 'تحميل نسخة PDF'
            : 'Download PDF'}
        </Button>

        <Button
          onClick={onPrint}
          variant="outline"
          className="border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white font-bold text-xs sm:text-sm py-2 px-3 rounded-xl flex items-center gap-1.5 cursor-pointer"
        >
          <Printer className="h-4 w-4 text-slate-300" />
          {isArabic ? 'طباعة' : 'Print'}
        </Button>
      </div>
    </header>
  );
}
