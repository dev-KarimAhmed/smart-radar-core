'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface ContractClausesSectionProps {
  isArabic: boolean;
}

export function ContractClausesSection({ isArabic }: ContractClausesSectionProps) {
  return (
    <section className="mb-6 rounded-2xl border border-white/10 bg-[#0F172A]/70 p-5 sm:p-6 print:border-gray-300 print:bg-white text-xs sm:text-sm leading-relaxed space-y-4">
      <h2 className="text-sm sm:text-base font-black text-teal-300 print:text-black mb-4 flex items-center gap-2 border-b border-white/5 pb-2 print:border-gray-200">
        <ShieldCheck className="h-4 w-4 text-[#14F5D5] print:text-black" />
        {isArabic
          ? 'ثانياً: الضوابط والاشتراطات التأسيسية المعتمدة (المواد الحاكمة من وثيقة الشروط الموحدة)'
          : 'Section 2: Approved Foundational Principles (Governing Clauses of the Unified Terms)'}
      </h2>

      <div className="space-y-3.5 text-slate-300 print:text-gray-800 leading-loose">
        <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 print:border-none print:p-0">
          <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-teal-500/15 text-[#14F5D5] font-black text-xs border border-teal-500/30 print:text-black">
            1
          </span>
          <p className="text-slate-300 print:text-black leading-relaxed">
            {isArabic ? (
              <>
                <strong className="text-white print:text-black font-bold">صفة الكابتن:</strong> يزاول الكابتن نشاطه
                كمعلن مستقل لحسابه الخاص، وتعد المركبة وسيلة إعلانية شخصية له، ولا ينشأ أي عقد عمل أو تبعية مع
                الشبكة بأي شكل.
              </>
            ) : (
              <>
                <strong className="text-white print:text-black font-bold">Captain Status:</strong> The Captain operates
                solely as an independent advertiser on their own account. The vehicle serves as their personal
                advertising medium, and no employment contract or subordination exists with the Network.
              </>
            )}
          </p>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 print:border-none print:p-0">
          <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-teal-500/15 text-[#14F5D5] font-black text-xs border border-teal-500/30 print:text-black">
            2
          </span>
          <p className="text-slate-300 print:text-black leading-relaxed">
            {isArabic ? (
              <>
                <strong className="text-white print:text-black font-bold">طبيعة الشبكة:</strong> شبكة بينكم منصة
                تقنية للإعلانات الرقمية والتسويق، ولا تقدم أي خدمات نقل أو توجيه أو توصيل ركاب إطلاقاً.
              </>
            ) : (
              <>
                <strong className="text-white print:text-black font-bold">Nature of the Network:</strong> Bynkcom is
                strictly a digital advertising and marketing technology platform and provides zero transportation,
                dispatch, or passenger delivery services.
              </>
            )}
          </p>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 print:border-none print:p-0">
          <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-teal-500/15 text-[#14F5D5] font-black text-xs border border-teal-500/30 print:text-black">
            3
          </span>
          <p className="text-slate-300 print:text-black leading-relaxed">
            {isArabic ? (
              <>
                <strong className="text-white print:text-black font-bold">صفر عمولة (0%):</strong> لا تتقاضى الشبكة
                أي عمولة أو نسبة مئوية من أجور الرحلات أو الصفقات المباشرة بين الكابتن والمستخدمين في أي وقت.
              </>
            ) : (
              <>
                <strong className="text-white print:text-black font-bold">Zero Commission (0%):</strong> The Network
                charges zero commission or percentage from direct trip fares or agreements concluded between the Captain
                and users at any time.
              </>
            )}
          </p>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 print:border-none print:p-0">
          <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-teal-500/15 text-[#14F5D5] font-black text-xs border border-teal-500/30 print:text-black">
            4
          </span>
          <p className="text-slate-300 print:text-black leading-relaxed">
            {isArabic ? (
              <>
                <strong className="text-white print:text-black font-bold">مؤشر السوق الاسترشادي:</strong> مؤشر
                إحصائي استرشادي غير إلزامي محسوب محلياً، ولا يعد بأي حال تسعيرة إجبارية على الكابتن.
              </>
            ) : (
              <>
                <strong className="text-white print:text-black font-bold">Indicative Market Index:</strong> A
                non-binding statistical guide computed locally on the device, never constituting mandatory pricing for
                the Captain.
              </>
            )}
          </p>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 print:border-none print:p-0">
          <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-teal-500/15 text-[#14F5D5] font-black text-xs border border-teal-500/30 print:text-black">
            5
          </span>
          <p className="text-slate-300 print:text-black leading-relaxed">
            {isArabic ? (
              <>
                <strong className="text-white print:text-black font-bold">أذونات موارد الجهاز:</strong> يمنح الكابتن
                إذناً صريحاً ومحدداً للموقع والإنترنت والشاشة بالقدر الضروري لتشغيل التطبيق وبث الإعلانات فقط.
              </>
            ) : (
              <>
                <strong className="text-white print:text-black font-bold">Device Resource Permissions:</strong> The
                Captain grants explicit, scoped permission for location, internet, and display solely as needed to run
                the app and broadcast ads.
              </>
            )}
          </p>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 print:border-none print:p-0">
          <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-teal-500/15 text-[#14F5D5] font-black text-xs border border-teal-500/30 print:text-black">
            6
          </span>
          <p className="text-slate-300 print:text-black leading-relaxed">
            {isArabic ? (
              <>
                <strong className="text-white print:text-black font-bold">زر مشاركة التتبع المباشر:</strong> ميزة
                تتبع لحظية طارئة تنتهي فورياً بإغلاق الرحلة، دون حفظ أي مسار أو سجل في خوادم النظام حفاظاً على السرية.
              </>
            ) : (
              <>
                <strong className="text-white print:text-black font-bold">Live Tracking Share Button:</strong> An
                emergency real-time tracking feature that terminates immediately when the trip ends, with no route
                history retained on servers.
              </>
            )}
          </p>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 print:border-none print:p-0">
          <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-teal-500/15 text-[#14F5D5] font-black text-xs border border-teal-500/30 print:text-black">
            7
          </span>
          <p className="text-slate-300 print:text-black leading-relaxed">
            {isArabic ? (
              <>
                <strong className="text-white print:text-black font-bold">
                  إسقاط الأجل ومسح السجلات (72 ساعة):
                </strong>{' '}
                تخضع سجلات التحركات لمسح وتطهير آلي دوري كل 72 ساعة حتمية لحماية الخصوصية المطلقة.
              </>
            ) : (
              <>
                <strong className="text-white print:text-black font-bold">
                  Statute Purge & Log Wipe (72 Hours):
                </strong>{' '}
                Movement records undergo automatic deterministic deletion every 72 hours to guarantee absolute
                privacy.
              </>
            )}
          </p>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 print:border-none print:p-0">
          <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-teal-500/15 text-[#14F5D5] font-black text-xs border border-teal-500/30 print:text-black">
            8
          </span>
          <p className="text-slate-300 print:text-black leading-relaxed">
            {isArabic ? (
              <>
                <strong className="text-white print:text-black font-bold">نظام الرتب الخمسة:</strong> يخضع الكابتن
                للتصنيف الآلي المعتمد (برونزي، فضي، ذهبي، بلاتيني، ماسي) حسب ساعات التواجد وجودة الأداء والتقييم.
              </>
            ) : (
              <>
                <strong className="text-white print:text-black font-bold">Five-Tier Rank System:</strong> The Captain
                is automatically classified into approved tiers (Bronze, Silver, Gold, Platinum, Diamond) based on
                presence hours, performance, and ratings.
              </>
            )}
          </p>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 print:border-none print:p-0">
          <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-teal-500/15 text-[#14F5D5] font-black text-xs border border-teal-500/30 print:text-black">
            9
          </span>
          <p className="text-slate-300 print:text-black leading-relaxed">
            {isArabic ? (
              <>
                <strong className="text-white print:text-black font-bold">التدقيق الآلي للإعلانات:</strong> تخضع كافة
                المواد الإعلانية للفرز المسبق بالذكاء الاصطناعي لضمان الامتثال للقوانين والآداب العامة وسيادة القانون.
              </>
            ) : (
              <>
                <strong className="text-white print:text-black font-bold">Automated Ad Moderation:</strong> All
                advertising materials undergo automated AI pre-screening to ensure compliance with applicable laws,
                public morals, and rule of law.
              </>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
