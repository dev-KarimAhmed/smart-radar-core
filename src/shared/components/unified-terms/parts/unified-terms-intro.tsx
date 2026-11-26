'use client';

import React from 'react';
import { Shield, Sparkles } from 'lucide-react';

interface UnifiedTermsIntroProps {
  isArabic: boolean;
}

export function UnifiedTermsIntro({ isArabic }: UnifiedTermsIntroProps) {
  return (
    <div className="rounded-2xl border border-teal-500/20 bg-gradient-to-br from-[#0F172A] to-[#0A0F1D] p-5 shadow-lg">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/20 text-[#14F5D5]">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-black text-base text-white">
            {isArabic
              ? 'التمهيد والأساس القانوني والتوصيف التقني'
              : 'Preamble, Legal Basis & Technical Framework'}
          </h3>
          <p className="text-xs text-teal-300">
            {isArabic ? 'شبكة بينكم للإعلان الرقمي · المملكة الأردنية الهاشمية' : 'Bynkcom Ad-Tech Network · Hashemite Kingdom of Jordan'}
          </p>
        </div>
      </div>

      <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
        <p>
          {isArabic
            ? 'تُعد شبكة بينكم للإعلان الرقمي منصة تقنية نسيجية وبوابة إعلانية وسيطة قائمة على الحافة (Edge-First Protocol). توفر المنصة مساحة بث إعلاني تفاعلي تجمع بين الكباتن المعلنين المستقلين والمستخدمين، وتخضع لأحكام قانون المعاملات الإلكترونية وقوانين المملكة الأردنية الهاشمية.'
            : 'Bynkcom Ad-Tech Network is an edge-first ad-tech protocol connecting independent captain advertisers with users. The platform operates as an interactive digital ad space under the Jordanian Electronic Transactions Law.'}
        </p>

        <div className="flex items-start gap-2 rounded-xl bg-teal-500/10 border border-teal-500/20 p-3 text-xs text-teal-200">
          <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-[#14F5D5]" />
          <span>
            {isArabic
              ? 'تنويه سيادي: المنصة لا تقدم خدمات نقل مباشر أو شحن أو تأجير مركبات، وتطبق مبدأ صفر عمولة (0.00% Comm) على تعاملات الكباتن المستقلين.'
              : 'Legal Notice: The platform does not operate direct transport services or fleet rentals, enforcing a 0.00% commission policy for independent advertisers.'}
          </span>
        </div>
      </div>
    </div>
  );
}
