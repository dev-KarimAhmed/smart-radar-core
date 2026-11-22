import React from 'react';
import { CAPTAIN_AD_PACKAGE_FEATURES } from '../../../config/captain-ad-package-features';

interface CaptainAdPackageFeaturesListProps {
  isArabic: boolean;
}

export function CaptainAdPackageFeaturesList({ isArabic }: CaptainAdPackageFeaturesListProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-slate-300">
          {isArabic ? 'المميزات المشمولة في الباقة الافتتاحية:' : 'Features included in Launch Package:'}
        </span>
        <span className="text-[11px] font-mono text-[#00ffcc]">
          {CAPTAIN_AD_PACKAGE_FEATURES.length} {isArabic ? 'ميزة كاملة' : 'Total'}
        </span>
      </div>

      {CAPTAIN_AD_PACKAGE_FEATURES.map((feat) => {
        const Icon = feat.icon;
        return (
          <div
            key={feat.id}
            className="flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-teal-400/30 hover:bg-white/[0.06] transition-all"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10 text-[#00ffcc] font-black text-xs font-mono shadow-[0_0_10px_rgba(0,255,204,0.1)]">
                {feat.id < 10 ? `0${feat.id}` : feat.id}
              </div>
              <span className="text-white font-bold text-xs sm:text-sm truncate">
                {isArabic ? feat.titleAr : feat.titleEn}
              </span>
            </div>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl bg-slate-800/60 border border-white/5 text-teal-300">
              <Icon className="h-4 w-4" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
