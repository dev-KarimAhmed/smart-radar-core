'use client';

import React from 'react';
import { Shield } from 'lucide-react';

interface RiderContractClausesSectionProps {
  isArabic: boolean;
}

export function RiderContractClausesSection({ isArabic }: RiderContractClausesSectionProps) {
  const clauses = isArabic
    ? [
        {
          num: '1',
          title: 'التمهيد وتوصيف المنصة',
          body: 'تُعد شبكة بينكم للإعلان الرقمي منصة تقنية نسيجية وبوابة إعلانية وسيطة تربط بين الكباتن المعلنين المستقلين والمستخدمين. لا تقدم المنصة أي خدمات نقل أو شحن أو تأجير مركبات مباشرة، ولا تمتلك أي أسطول مركبات، وإنما توفر مساحة إعلانية رقمية تفاعلية تخضع للقوانين السارية.',
        },
        {
          num: '2',
          title: 'طبيعة البيانات المحفوظة والمعالجة',
          body: 'تقتصر البيانات الشخصية المحفوظة في خوادم المنصة على بيانات الحساب الأساسية (الاسم، رقم الهاتف، البريد الإلكتروني، واللواء/المحافظة) لغايات التوثيق الأمني وإتمام المصادقة الثنائية وتسهيل التواصل بين أطراف المعاملة الإعلانية وفق قانون المعاملات الإلكترونية.',
        },
        {
          num: '3',
          title: 'أذونات الموقع الجغرافي والنسيج الحافة',
          body: 'يتم استخدام إحداثيات الموقع الجغرافي (GPS) حصراً وبصورة مشفرة على حافة الشبكة داخل معالج هاتف المستخدم لحساب خلايا H3 النسيجية ومسافات التوجيه التقديرية عبر محرك OSRM المستقل. لا يتم تخزين مسارات التنقل التاريخية للمستخدم في قواعد بيانات مركزية دائمة.',
        },
        {
          num: '4',
          title: 'أذونات التخزين والذاكرة الحافة',
          body: 'يستخدم التطبيق ذاكرة التخزين المحلية المؤقتة (IndexedDB و Cache Storage) لحفظ المواد الإعلانية ووثيقة الخصوصية المعتمدة لتمكين وضع دون اتصال أولاً (Offline-First). تخضع المواد الإعلانية المحفوظة لقانون السقوط الحتمي والإعدام التلقائي كل 30 يوماً.',
        },
        {
          num: '5',
          title: 'شبكة الإعلانات المركزية والتفاعلية',
          body: 'تتضمن واجهة المنصة نهراً إعلانياً تفاعلياً يعرض حملات إعلانية وتجارية محلية. تلتزم الشبكة بالمعايير الأخلاقية والقانونية الأردنية بعدم عرض أي محتوى مضلل أو خادش للحياء أو مخالف للنظام العام والآداب.',
        },
        {
          num: '6',
          title: 'استقلالية الكباتن والخدمات الإعلانية',
          body: 'يقر المستخدم بعلمه وإدراكه التام بأن الكباتن المعلنين هم متعاقدون ومزودو خدمات مستقلون تماماً يعملون لحسابهم الخاص. وتطبق الشبكة مبدأ صفر عمولة (0.00% Comm) وتقتصر مسؤوليتها على البث الإعلاني والوساطة التقنية الرقمية.',
        },
        {
          num: '7',
          title: 'سرية وأمن البيانات وحماية الخصوصية',
          body: 'تطبق المنصة أعلى بروتوكولات الأمان الرقمي والتشفير النسيجي الحافة (TLS/HTTPS و AES-256) لحماية بيانات المستخدم من الاختراق أو التسريب، ولا يتم بيع أو مشاركة بيانات المستخدم مع أي طرف ثالث لأغراض تسويقية غير مصرح بها.',
        },
        {
          num: '8',
          title: 'إشعار التغييرات وتعديل السياسة',
          body: 'يحق للمنصة تحديث وتطوير بنود سياسة الخصوصية بما يتوافق مع التحديثات التقنية والتشريعية. يتم إشعار المستخدم بأي تعديل جوهري عبر التطبيق أو البريد الإلكتروني، ويُعد استمرار استخدام الخدمة قبولاً للنسخة المحدثة.',
        },
        {
          num: '9',
          title: 'القانون الحاكم وتسوية النزاعات',
          body: 'تخضع هذه السياسة وتُفسر وفقاً لأحكام وتشريعات المملكة الأردنية الهاشمية، وخاصة قانون المعاملات الإلكترونية وقانون حماية البيانات الشخصية. وتختص محاكم عمان (قصر العدل) حصرياً بالفصل في أي نزاع ينشأ عنها.',
        },
      ]
    : [
        {
          num: '1',
          title: 'Preamble & Platform Characterization',
          body: 'Bynkcom is an ad-tech protocol connecting independent captain advertisers with users. The platform does not operate transportation services or fleets; it strictly provides an interactive ad space under applicable laws.',
        },
        {
          num: '2',
          title: 'Data Collection & Edge Processing',
          body: 'Collected personal data is limited to core account information (Name, Phone, Email, Location) for verification, authentication, and ad transaction coordination under the Electronic Transactions Law.',
        },
        {
          num: '3',
          title: 'Location Permissions & Edge Geometry',
          body: 'GPS coordinates are processed on device edge using H3 hexagonal grids and self-hosted OSRM routing. Historical user movement tracking is never permanently retained on central servers.',
        },
        {
          num: '4',
          title: 'Storage Permissions & Cache Retention',
          body: 'Local storage (IndexedDB / Cache) powers offline-first delivery. Cached advertising materials are subject to mechanical auto-purging after 30 days.',
        },
        {
          num: '5',
          title: 'Central & Interactive Advertising Stream',
          body: 'The platform hosts local advertising campaigns adhering strictly to public order, decency, and legal standards in the Hashemite Kingdom of Jordan.',
        },
        {
          num: '6',
          title: 'Captain Independence & Zero Commission',
          body: 'User acknowledges that captain advertisers are independent third parties. The network enforces a 0% commission model and acts solely as an ad-tech mediator.',
        },
        {
          num: '7',
          title: 'Data Confidentiality & Encryption',
          body: 'State-of-the-art encryption protocols (TLS/HTTPS, AES-256) safeguard user data. Information is never sold or disclosed to unauthorized third parties.',
        },
        {
          num: '8',
          title: 'Policy Modifications & Notices',
          body: 'The platform may update its privacy policy to reflect regulatory or technical changes. Continued use of the platform constitutes acceptance.',
        },
        {
          num: '9',
          title: 'Governing Law & Dispute Resolution',
          body: 'This policy is governed by the laws of the Hashemite Kingdom of Jordan. The Courts of Amman (Palace of Justice) hold exclusive jurisdiction.',
        },
      ];

  return (
    <section className="rounded-2xl border border-white/10 bg-[#0F172A]/70 p-5 print:border-gray-300 print:bg-white">
      <h2 className="text-sm sm:text-base font-black text-teal-300 print:text-black mb-4 flex items-center gap-2 border-b border-white/5 pb-2 print:border-gray-200">
        <Shield className="h-4 w-4 text-[#14F5D5] print:text-black" />
        {isArabic
          ? 'ثانياً: بنود سياسة الخصوصية واستخدام الإعلانات المعتمدة'
          : 'Section 2: Certified User Privacy & Advertising Terms'}
      </h2>

      <div className="space-y-4 text-xs sm:text-sm text-slate-300 print:text-gray-800 leading-relaxed">
        {clauses.map((clause) => (
          <div key={clause.num} className="border-b border-white/5 print:border-gray-200 pb-3 last:border-none">
            <h3 className="font-bold text-white print:text-black mb-1 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-500/20 text-[#14F5D5] print:bg-gray-200 print:text-black text-xs font-black">
                {clause.num}
              </span>
              {clause.title}
            </h3>
            <p className="ps-7 text-slate-400 print:text-gray-700 leading-relaxed">{clause.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
