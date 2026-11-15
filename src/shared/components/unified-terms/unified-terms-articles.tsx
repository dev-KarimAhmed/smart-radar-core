import React from 'react';
import { FileText } from 'lucide-react';

interface UnifiedTermsArticlesProps {
  isArabic: boolean;
}

export function UnifiedTermsArticles({ isArabic }: UnifiedTermsArticlesProps) {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 text-sm leading-relaxed text-slate-300 space-y-4 font-sans select-text scrollbar-thin scrollbar-thumb-teal-500/20">
      {/* Key Legal Notice Callout */}
      <div className="rounded-2xl border border-[#14B8A6]/25 bg-[#14B8A6]/10 p-4 text-xs sm:text-sm text-teal-200 leading-relaxed">
        <p className="font-bold text-white mb-1 flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#14F5D5]" />
          {isArabic
            ? 'البند التأسيسي لشبكة بينكم للإعلان الرقمي:'
            : 'Foundational Clause of Bynkcom Digital Ad Network:'}
        </p>
        {isArabic
          ? 'تعد مركبة الكابتن وسيلة إعلانية مستقلة لبث المحتوى الإعلاني. وتقتصر شبكة بينكم على توفير البنية التقنية ومساحة الإعلان الرقمية، ولا تقدم خدمات نقل أو توصيل، ولا تتقاضى أي عمولة أو نسبة (0%) من أجور المعاملات المستقلة.'
          : 'The captain’s vehicle serves as an independent advertising medium for broadcasting promotional content. Bynkcom Network solely provides technical infrastructure and digital ad space; it does not provide transport or delivery services and charges zero commission (0%) on independent transactions.'}
      </div>

      <div>
        <h3 className="font-black text-white text-base mb-1 text-[#14F5D5]">
          {isArabic
            ? 'المادة (1): الهوية التقنية واستقلال الكابتن المعلن'
            : 'Article (1): Technical Identity & Independence of the Advertiser Captain'}
        </h3>
        <p>
          {isArabic
            ? 'شبكة بينكم منصة إعلانية تفاعلية تعمل عبر موقع تقدمي (PWA). يزاول الكابتن نشاطه لحسابه الخاص وباستقلال مهني وإداري ومالي، ولا ينشأ عن اشتراكه عقد عمل أو وكالة أو تبعية تشغيلية للشبكة، ويبقى مسؤولاً عن مشروعيته وتراخيصه.'
            : 'Bynkcom Network is an interactive digital advertising platform operating as a Progressive Web App (PWA). The captain operates independently on their own behalf with full professional, administrative, and financial autonomy. No employment, agency, or operational subordination relationship is created, and the captain remains solely responsible for their legal standing and permits.'}
        </p>
      </div>

      <div>
        <h3 className="font-black text-white text-base mb-1 text-[#14F5D5]">
          {isArabic
            ? 'المادة (3): مؤشر السوق الاسترشادي (Market Index)'
            : 'Article (3): Indicative Market Index'}
        </h3>
        <p>
          {isArabic
            ? 'مؤشر السوق معلومة إحصائية استرشادية تستند إلى بيانات مجمعة ومجهلة الهوية لمساعدة الكابتن في اتخاذ قراراته التجارية، ولا يعد سعراً ملزماً أو تسعيرة مفروضة، ولا تؤثر مخالفته بذاتها في ظهوره الإعلاني أو استحقاقاته.'
            : 'The Market Index is a non-binding statistical benchmark derived from anonymized aggregate data to assist captains in business decisions. It is neither a mandatory fare nor an imposed tariff, and deviating from it does not in itself penalize ad visibility or entitlements.'}
        </p>
      </div>

      <div>
        <h3 className="font-black text-white text-base mb-1 text-[#14F5D5]">
          {isArabic
            ? 'المادة (5): تسليم الوثيقة وحفظ نسخ PDF في الملف الشخصي'
            : 'Article (5): Document Delivery & Archiving PDF Copies in Profile'}
        </h3>
        <p>
          {isArabic
            ? 'عند توثيق موافقة الكابتن على هذه الوثيقة، يُنشئ النظام آلياً نسخة رسمية معتمدة بصيغة PDF يثبت فيها رقم الإصدار وبصمة الختم الرقمي، وتُرسل فوراً إلى بريده الإلكتروني وتُحفظ نسخة مطابقة في ملفه الشخصي داخل التطبيق للاطلاع والتحميل والطباعة في أي وقت.'
            : 'Upon verifying the captain’s acceptance of this document, the system automatically generates an official certified PDF bearing the version number and cryptographic digital seal, sends it via email, and stores an identical copy in the in-app profile for viewing, downloading, and printing anytime.'}
        </p>
      </div>

      <div>
        <h3 className="font-black text-white text-base mb-1 text-[#14F5D5]">
          {isArabic
            ? 'الباب الثاني: أذونات وموارد الجهاز والرتب الإعلانية الخمسة'
            : 'Part II: Device Resource Permissions & Five Advertising Tiers'}
        </h3>
        <p>
          {isArabic
            ? 'يمنح الكابتن موافقة إلكترونية صريحة ومحددة على استخدام موارد الجهاز (GPS، الإنترنت، الشاشة، البطارية) بالقدر الضروري فقط لتقديم الخدمة الإعلانية. وتتدرج الرتب الإعلانية إلى 5 مستويات تأهيلية: (البرونزية التأسيسية، الفضية المتقدمة، الذهبية على مستوى اللواء، البلاتينية على مستوى المحافظة، والماسية على مستوى الدولة وبث الشاشات)، بناءً على تقييمات المستخدمين الموثقة وقوائم المفضلة الفريدة.'
            : 'The captain grants explicit, scoped electronic consent to access device resources (GPS, internet, screen, battery) strictly as needed to deliver the advertising service. Advertising tiers advance across 5 levels (Foundational Bronze, Advanced Silver, District Gold, Governorate Platinum, and National Diamond with screen broadcasts) based on verified user ratings and unique favorites lists.'}
        </p>
      </div>

      <div>
        <h3 className="font-black text-white text-base mb-1 text-[#14F5D5]">
          {isArabic
            ? 'كتالوج الخدمات والإنهاء الفوري للتتبع (الخدمة 11)'
            : 'Service Catalog & Instant Tracking Termination (Service 11)'}
        </h3>
        <p>
          {isArabic
            ? 'تتيح خدمة مشاركة التتبع المباشر طمأنة الأقارب برابط فوري. ولا يتم بأي شكل من الأشكال حفظ أي مسار أو نقاط تتبع جغرافي دقيق في النظام بعد انتهاء الرحلة؛ إذ ينتهي التتبع كلياً وفوراً بمجرد إغلاق الرحلة.'
            : 'Live tracking sharing lets riders reassure family members via an instant link. No route breadcrumbs or precise geolocation points are persisted in the system after trip completion; tracking terminates completely and immediately once the trip is closed.'}
        </p>
      </div>

      <div>
        <h3 className="font-black text-white text-base mb-1 text-[#14F5D5]">
          {isArabic
            ? 'التدقيق الآلي بالذكاء الاصطناعي وإسقاط الأجل (72h Ledger)'
            : 'Automated AI Ad Review & 72-Hour Purge Policy'}
        </h3>
        <p>
          {isArabic
            ? 'تخضع المواد الإعلانية للتدقيق الآلي بالذكاء الاصطناعي لضمان المشروعية، كما تُمسح سجلات الرحلات دورياً كل 72 ساعة حتمية من السيرفر حمايةً لخصوصية المستخدمين.'
            : 'All advertising materials undergo automated AI compliance moderation, and trip logs are systematically purged from the server every 72 hours to protect user privacy.'}
        </p>
      </div>
    </div>
  );
}
