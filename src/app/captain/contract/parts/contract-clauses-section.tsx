'use client';

import React from 'react';
import { ShieldCheck, FileText } from 'lucide-react';
import captainContract from '@/shared/data/captain-contract.json';

interface ContractClausesSectionProps {
  isArabic: boolean;
}

export function ContractClausesSection({ isArabic }: ContractClausesSectionProps) {
  return (
    <section className="mb-6 rounded-2xl border border-white/10 bg-[#0F172A]/70 p-5 sm:p-6 print:border-gray-300 print:bg-white text-xs sm:text-sm leading-relaxed space-y-4">
      <h2 className="text-sm sm:text-base font-black text-teal-300 print:text-black mb-4 flex items-center gap-2 border-b border-white/5 pb-2 print:border-gray-200">
        <ShieldCheck className="h-4 w-4 text-[#14F5D5] print:text-black shrink-0" />
        <span>
          {isArabic
            ? 'ثانياً: الضوابط والاشتراطات التأسيسية المعتمدة (وثيقة التأسيس والتعاقد وشروط اشتراك الكابتن)'
            : 'Section 2: Approved Foundational Terms (Foundational Contract & Captain Subscription Document)'}
        </span>
      </h2>

      {/* Preamble Callout */}
      <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/20 print:border-gray-300 print:bg-gray-50 text-teal-200 print:text-black space-y-2">
        <div className="flex items-center gap-2 font-bold text-white print:text-black">
          <FileText className="h-4 w-4 text-[#14F5D5] print:text-black shrink-0" />
          <span>{captainContract.preamble.title}</span>
        </div>
        <div className="space-y-1.5 text-slate-300 print:text-gray-800 text-xs sm:text-sm">
          {captainContract.preamble.paragraphs.map((p, idx) => (
            <p key={idx}>{p}</p>
          ))}
        </div>
      </div>

      {/* Sections and Articles */}
      <div className="space-y-4 text-slate-300 print:text-gray-800 leading-relaxed">
        {captainContract.sections.map((sec, sIdx) => (
          <div key={sec.id || sIdx} className="space-y-2.5 pt-2">
            <h3 className="font-black text-white print:text-black text-sm text-[#14F5D5] border-b border-white/5 print:border-gray-200 pb-1">
              {sec.title}
            </h3>

            <div className="space-y-2.5">
              {sec.articles.map((art, aIdx) => (
                <div
                  key={aIdx}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/5 print:border-gray-200 print:bg-transparent space-y-1"
                >
                  {art.title ? (
                    <div className="font-bold text-white print:text-black text-xs sm:text-sm">
                      {art.title}
                    </div>
                  ) : null}
                  <div className="space-y-1 text-slate-300 print:text-gray-800 text-xs sm:text-sm leading-relaxed">
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
    </section>
  );
}
