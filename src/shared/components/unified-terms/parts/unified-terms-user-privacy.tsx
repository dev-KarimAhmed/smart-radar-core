'use client';

import React from 'react';
import { MapPin, Lock, HardDrive } from 'lucide-react';

interface UnifiedTermsUserPrivacyProps {
  isArabic: boolean;
}

export function UnifiedTermsUserPrivacy({ isArabic }: UnifiedTermsUserPrivacyProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0F172A]/70 p-5 space-y-4">
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <MapPin className="h-4 w-4 text-[#14F5D5]" />
        <h3 className="font-bold text-sm sm:text-base text-white">
          {isArabic
            ? 'الباب الأول: خصوصية المستخدم والبيانات الجغرافية والحافة'
            : 'Part I: User Privacy, Geodata & Edge Computing'}
        </h3>
      </div>

      <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
        <div>
          <h4 className="font-bold text-teal-300 mb-1 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
            {isArabic ? '1. حماية الموقع الجغرافي ومعالجة الحافة' : '1. Location Privacy & Edge Processing'}
          </h4>
          <p className="ps-3 text-slate-400">
            {isArabic
              ? 'تتم معالجة إحداثيات الموقع (GPS) حصرياً داخل معالج هاتف المستخدم لتحويلها إلى خلايا سداسية H3 (Resolution 9) ومسافات شوارع OSRM. لا يتم تتبع أو تخزين سجل التحركات التاريخية للمستخدم في قواعد بيانات مركزية دائمة.'
              : 'GPS coordinates are processed locally on the user device to resolve H3 hexagonal grids (Res 9) and OSRM routing. Historical movement logs are never retained centrally.'}
          </p>
        </div>

        <div>
          <h4 className="font-bold text-teal-300 mb-1 flex items-center gap-1.5">
            <HardDrive className="h-3.5 w-3.5 text-teal-400" />
            {isArabic ? '2. أذونات التخزين والذاكرة المؤقتة (Offline-First)' : '2. Local Cache & Offline-First Storage'}
          </h4>
          <p className="ps-3 text-slate-400">
            {isArabic
              ? 'تستخدم المنصة تقنيات التخزين المحلي (IndexedDB) لحفظ المواد الإعلانية مؤقتاً لتمكين التصفح دون اتصال، وتخضع المحتويات لقانون الإعدام التلقائي كل 30 يوماً لحماية ذاكرة الجهاز.'
              : 'Local storage (IndexedDB) caches ad assets temporarily for offline browsing, with mechanical purging after 30 days to protect device resources.'}
          </p>
        </div>

        <div>
          <h4 className="font-bold text-teal-300 mb-1 flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-teal-400" />
            {isArabic ? '3. تشفير البيانات وسرية الهوية' : '3. Encryption & Identity Confidentiality'}
          </h4>
          <p className="ps-3 text-slate-400">
            {isArabic
              ? 'تخضع كافة قنوات الاتصال للتشفير السيادي (TLS/HTTPS و AES-256). لا يتم بيع بيانات المستخدم أو مشاركتها مع أطراف ثالثة لأغراض تجارية غير مصرح بها.'
              : 'All communication channels use sovereign TLS/HTTPS and AES-256 encryption. User data is never sold or shared with third parties for unauthorized commercial use.'}
          </p>
        </div>
      </div>
    </div>
  );
}
