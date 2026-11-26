import React from 'react';
import { FileText, Shield } from 'lucide-react';
import captainContract from '@/shared/data/captain-contract.json';

interface UnifiedTermsArticlesProps {
  isArabic: boolean;
}

export function UnifiedTermsArticles({ isArabic }: UnifiedTermsArticlesProps) {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 text-sm leading-relaxed text-slate-300 space-y-5 font-sans select-text scrollbar-thin scrollbar-thumb-teal-500/20">
      {/* Foundational Preamble Callout */}
      <div className="rounded-2xl border border-[#14B8A6]/25 bg-[#14B8A6]/10 p-4 text-xs sm:text-sm text-teal-200 leading-relaxed">
        <p className="font-bold text-white mb-2 flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#14F5D5]" />
          <span>{captainContract.preamble.title}</span>
        </p>
        <div className="space-y-2 text-slate-300 text-xs sm:text-sm">
          {captainContract.preamble.paragraphs.map((p, idx) => (
            <p key={idx}>{p}</p>
          ))}
        </div>
      </div>

      {/* Structured Sections and Articles from the Master Document */}
      {captainContract.sections.map((section, sIdx) => (
        <div key={section.id || sIdx} className="space-y-3 pt-2">
          <div className="flex items-center gap-2 border-b border-teal-500/20 pb-2">
            <Shield className="h-4 w-4 text-[#14F5D5] shrink-0" />
            <h3 className="font-black text-white text-base text-[#14F5D5]">
              {section.title}
            </h3>
          </div>

          <div className="space-y-3">
            {section.articles.map((art, aIdx) => (
              <div
                key={aIdx}
                className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5 space-y-1.5"
              >
                {art.title ? (
                  <h4 className="font-bold text-white text-sm text-teal-300">
                    {art.title}
                  </h4>
                ) : null}
                <div className="space-y-1.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
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
  );
}
