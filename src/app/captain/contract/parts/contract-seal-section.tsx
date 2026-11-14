'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface ContractSealSectionProps {
  isArabic: boolean;
  formattedAcceptedAt: string;
  contractHash: string;
}

export function ContractSealSection({ isArabic, formattedAcceptedAt, contractHash }: ContractSealSectionProps) {
  return (
    <section className="rounded-2xl border border-teal-500/30 bg-[#070B14] p-5 sm:p-6 print:border-gray-400 print:bg-white text-xs sm:text-sm">
      <h2 className="text-sm sm:text-base font-black text-teal-300 print:text-black mb-3 flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-[#14F5D5] print:text-black" />
        {isArabic
          ? 'ثالثاً: الختم الرقمي المشفر والتوثيق الإلكتروني المعتمد'
          : 'Section 3: Cryptographic Digital Seal & Certified Electronic Verification'}
      </h2>

      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/5">
          <span className="text-slate-400 print:text-gray-600">
            {isArabic ? 'تاريخ ووقت التوثيق والاعتماد:' : 'Certification & Timestamp:'}
          </span>
          <strong className="text-[#14F5D5] print:text-black">{formattedAcceptedAt}</strong>
        </div>

        <div className="flex flex-col gap-1.5 pt-1">
          <span className="text-slate-400 print:text-gray-600">
            {isArabic
              ? 'بصمة التشفير الرقمية السيادية (SHA-256 Sovereign Hash):'
              : 'SHA-256 Sovereign Cryptographic Hash:'}
          </span>
          <code className="text-xs sm:text-sm text-teal-300 font-mono bg-white/5 p-3 rounded-xl break-all print:bg-gray-100 print:text-black border border-white/5 print:border-gray-300 font-bold tracking-wider">
            {contractHash}
          </code>
        </div>

        <div className="pt-3 border-t border-white/5 print:border-gray-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 print:text-gray-600 gap-2">
          <p className="flex items-center gap-1.5 text-emerald-400">
            <span className="text-sm">✓</span>
            {isArabic
              ? 'تم توثيق وقبول الشروط إلكترونياً وحفظ السجل التعاقدي بموجب قانون المعاملات الإلكترونية.'
              : 'Terms electronically certified and contractual record preserved under the Electronic Transactions Law.'}
          </p>
          <span className="text-[#14F5D5] font-bold print:text-black">bynkcom MEDIA SMART © 2026</span>
        </div>
      </div>
    </section>
  );
}
