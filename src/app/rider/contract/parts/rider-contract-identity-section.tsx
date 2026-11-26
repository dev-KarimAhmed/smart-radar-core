'use client';

import React from 'react';
import { FileText } from 'lucide-react';
import type { RiderContractViewData } from './rider-contract-types';

interface RiderContractIdentitySectionProps {
  data: RiderContractViewData;
  isArabic: boolean;
  fullNameDisplay: string;
}

export function RiderContractIdentitySection({ data, isArabic, fullNameDisplay }: RiderContractIdentitySectionProps) {
  return (
    <section className="mb-6 rounded-2xl border border-white/10 bg-[#0F172A]/70 p-5 print:border-gray-300 print:bg-white">
      <h2 className="text-sm sm:text-base font-black text-teal-300 print:text-black mb-4 flex items-center gap-2 border-b border-white/5 pb-2 print:border-gray-200">
        <FileText className="h-4 w-4 text-[#14F5D5] print:text-black" />
        {isArabic
          ? 'أولاً: بيانات المستخدم والطرف المستفيد (السجل الإلكتروني الرسمي)'
          : 'Section 1: User & Beneficiary Details (Official Electronic Registry)'}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-xs sm:text-sm">
        <div className="flex justify-between items-center py-2 border-b border-white/5 print:border-gray-200 sm:col-span-2">
          <span className="text-slate-400 print:text-gray-600 whitespace-nowrap me-2">
            {isArabic ? 'الاسم الكامل:' : 'Full Name:'}
          </span>
          <strong className="text-white print:text-black text-end" dir="auto">
            {fullNameDisplay}
          </strong>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-white/5 print:border-gray-200">
          <span className="text-slate-400 print:text-gray-600 whitespace-nowrap me-2">
            {isArabic ? 'رقم الهاتف:' : 'Phone Number:'}
          </span>
          <span className="text-white print:text-black font-mono text-end" dir="ltr">
            {data.phone}
          </span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-white/5 print:border-gray-200">
          <span className="text-slate-400 print:text-gray-600 whitespace-nowrap me-2">
            {isArabic ? 'البريد الإلكتروني:' : 'Email Address:'}
          </span>
          <span className="text-white print:text-black font-mono text-end" dir="ltr">
            {data.email}
          </span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-white/5 print:border-gray-200 sm:col-span-2">
          <span className="text-slate-400 print:text-gray-600 whitespace-nowrap me-2">
            {isArabic ? 'النطاق الجغرافي المسجل:' : 'Registered Location:'}
          </span>
          <span className="text-white print:text-black text-end" dir="auto">
            {data.governorate} - {data.district}
          </span>
        </div>
      </div>
    </section>
  );
}
