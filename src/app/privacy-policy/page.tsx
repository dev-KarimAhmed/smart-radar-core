'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Download, Printer, ArrowRight, Loader2 } from 'lucide-react';
import privacyData from '@/shared/data/privacy-policy.json';
import { downloadPdfInWorker } from '@/shared/utils/background-pdf-download';

export default function PrivacyPolicyPage() {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await downloadPdfInWorker({
        url: `/api/privacy-policy/pdf?download=true&_t=${Date.now()}`,
        filename: 'Bynkcom_Privacy_Policy.pdf',
      });
    } catch (e) {
      console.warn('PDF download error:', e);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 p-4 sm:p-8 print:p-0 print:bg-white print:text-black" dir="rtl">
      {/* Top Bar - Hidden in print */}
      <header className="max-w-4xl mx-auto mb-6 flex items-center justify-between gap-3 p-4 rounded-2xl border border-white/10 bg-[#0B0F19]/80 backdrop-blur-md print:hidden">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-teal-400 hover:text-teal-300 transition-colors"
        >
          <ArrowRight className="h-4 w-4" />
          <span>العودة للرئيسية</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-teal-500/40 bg-teal-500/15 hover:bg-teal-500/25 text-[#14F5D5] text-xs font-bold transition-all cursor-pointer"
          >
            {isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            <span>تحميل PDF</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 text-slate-400" />
            <span>طباعة</span>
          </button>
        </div>
      </header>

      {/* Main Document Content */}
      <main className="max-w-4xl mx-auto rounded-3xl border border-teal-500/30 bg-[#0B0F19] p-6 sm:p-10 shadow-2xl space-y-6 print:border-none print:shadow-none print:p-0 print:bg-transparent">
        {/* Document Header */}
        <div className="border-b border-teal-500/20 pb-5">
          <div className="inline-block px-3 py-1 rounded-full bg-teal-500/15 border border-teal-500/30 text-[#14F5D5] text-xs font-bold mb-3">
            وثيقة رسمية معتمدة · قانون حماية البيانات الشخصية والمعاملات الإلكترونية
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#14F5D5] print:text-black">
            {privacyData.title}
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-300 print:text-gray-700 mt-1">
            {privacyData.subtitle} · الإصدار المعتمد {privacyData.version}
          </p>
        </div>

        {/* Preamble */}
        <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 print:border-gray-300 print:bg-gray-50 text-teal-200 print:text-black space-y-2">
          <h2 className="font-bold text-white print:text-black text-sm sm:text-base">
            {privacyData.preamble.title}
          </h2>
          <div className="space-y-1.5 text-xs sm:text-sm text-slate-300 print:text-gray-800 leading-relaxed">
            {privacyData.preamble.paragraphs.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>
        </div>

        {/* Sections & Articles */}
        <div className="space-y-6">
          {privacyData.sections.map((section, sIdx) => (
            <section key={section.id || sIdx} className="space-y-3">
              <h2 className="text-base sm:text-lg font-black text-[#14F5D5] print:text-black border-b border-white/10 print:border-gray-200 pb-2">
                {section.title}
              </h2>
              <div className="space-y-3">
                {section.articles.map((art, aIdx) => (
                  <div key={aIdx} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 print:border-gray-200 print:bg-transparent space-y-1">
                    {art.title ? (
                      <h3 className="font-bold text-white print:text-black text-xs sm:text-sm text-teal-300">
                        {art.title}
                      </h3>
                    ) : null}
                    <div className="space-y-1 text-slate-300 print:text-gray-800 text-xs sm:text-sm leading-relaxed">
                      {art.paragraphs.map((p, pIdx) => (
                        <p key={pIdx}>{p}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Footer Note */}
        <div className="pt-6 border-t border-teal-500/20 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 print:text-gray-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>معتمد وموثق بالسجل الإلكتروني لشبكة بينكم للإعلان الرقمي © 2026</span>
          </div>
          <span className="font-mono text-[#14F5D5]">BYNKCOM-PRIVACY-{privacyData.version}</span>
        </div>
      </main>
    </div>
  );
}
