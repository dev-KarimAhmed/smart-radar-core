'use client';

import React from 'react';
import { Radio, Eye, Layers } from 'lucide-react';

interface UnifiedTermsSystemPolicyProps {
  isArabic: boolean;
}

export function UnifiedTermsSystemPolicy({ isArabic }: UnifiedTermsSystemPolicyProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0F172A]/70 p-5 space-y-4">
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <Radio className="h-4 w-4 text-[#14F5D5]" />
        <h3 className="font-bold text-sm sm:text-base text-white">
          {isArabic
            ? 'الباب الثاني: شبكة الإعلانات المركزية والنهر التفاعلي'
            : 'Part II: Central Ad Network & Interactive Stream'}
        </h3>
      </div>

      <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
        <div>
          <h4 className="font-bold text-teal-300 mb-1 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-teal-400" />
            {isArabic ? '1. طبيعة النهر الإعلاني وضوابط العرض' : '1. Ad Stream Standards & Decency'}
          </h4>
          <p className="ps-3 text-slate-400">
            {isArabic
              ? 'تلتزم المنصة بعرض حملات إعلانية وتجارية محلية تخضع للضوابط الشرعية والقانونية الأردنية الصارمة، مع حظر قاطع لأي محتوى مضلل أو خادش للحياء أو مخالف للنظام العام.'
              : 'Ad campaigns displayed across the platform comply strictly with Jordanian legal and ethical guidelines, prohibiting deceptive, inappropriate, or harmful content.'}
          </p>
        </div>

        <div>
          <h4 className="font-bold text-teal-300 mb-1 flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5 text-teal-400" />
            {isArabic ? '2. التفاعل وعدم التتبع التطفلي' : '2. Fair Interaction & Non-Intrusive Analytics'}
          </h4>
          <p className="ps-3 text-slate-400">
            {isArabic
              ? 'يتم احتساب مرات التفاعل والمشاهدة بصورة مجردة وإحصائية دون تتبع سلوك المستخدم خارج نطاق التطبيق أو بناء ملفات تعريفية تطفلية.'
              : 'Ad impressions and interactions are tallied statistically in the aggregate without cross-site tracking or intrusive user profiling.'}
          </p>
        </div>
      </div>
    </div>
  );
}
