'use client';

import React from 'react';
import { Scale, Users, ShieldAlert } from 'lucide-react';

interface UnifiedTermsAdvertiserPolicyProps {
  isArabic: boolean;
}

export function UnifiedTermsAdvertiserPolicy({ isArabic }: UnifiedTermsAdvertiserPolicyProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0F172A]/70 p-5 space-y-4">
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <Scale className="h-4 w-4 text-[#14F5D5]" />
        <h3 className="font-bold text-sm sm:text-base text-white">
          {isArabic
            ? 'الباب الثالث: الكباتن المعلنون المستقلون والقانون الحاكم'
            : 'Part III: Independent Captain Advertisers & Governing Law'}
        </h3>
      </div>

      <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
        <div>
          <h4 className="font-bold text-teal-300 mb-1 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-teal-400" />
            {isArabic ? '1. الاستقلالية التعاقدية وصفر عمولة (0%)' : '1. Contractual Independence & 0% Commission'}
          </h4>
          <p className="ps-3 text-slate-400">
            {isArabic
              ? 'يقر المستخدم بعلمه بأن الكباتن المعلنين هم أطراف مستقلة تماماً ومسؤولون عن التزاماتهم المباشرة. المنصة توفر بروتوكول التقنية والإعلان دون أي عمولة تشغيلية.'
              : 'User acknowledges that captain advertisers operate independently. The platform provides software infrastructure with zero transactional commission.'}
          </p>
        </div>

        <div>
          <h4 className="font-bold text-teal-300 mb-1 flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-teal-400" />
            {isArabic ? '2. القانون الحاكم وتسوية النزاعات' : '2. Governing Law & Dispute Resolution'}
          </h4>
          <p className="ps-3 text-slate-400">
            {isArabic
              ? 'تخضع هذه السياسة لأحكام تشريعات وقوانين المملكة الأردنية الهاشمية وخاصة قانون المعاملات الإلكترونية وقانون حماية البيانات الشخصية. وتختص محاكم عمان (قصر العدل) بنظر أي نزاع.'
              : 'This agreement is governed by the laws of the Hashemite Kingdom of Jordan. The Courts of Amman (Palace of Justice) hold exclusive jurisdiction.'}
          </p>
        </div>
      </div>
    </div>
  );
}
