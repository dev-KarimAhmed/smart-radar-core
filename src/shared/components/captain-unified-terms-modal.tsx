'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileText, CheckCircle2, X, Download, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { downloadPdfInWorker } from '@/shared/utils/background-pdf-download';
import { getClientAccessToken } from '@/shared/services/supabase-auth-headers';

export interface CaptainUnifiedTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
  isArabic?: boolean;
  readOnly?: boolean;
  captainId?: string;
}

export function CaptainUnifiedTermsModal({
  isOpen,
  onClose,
  onAccept,
  isArabic = true,
  readOnly = false,
  captainId,
}: CaptainUnifiedTermsModalProps) {
  const [hasAgreed, setHasAgreed] = useState(readOnly);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    if (!captainId) return;
    try {
      setIsDownloading(true);
      const accessToken = (await getClientAccessToken()) || undefined;
      const downloadUrl = `/api/captain/contract?captainId=${encodeURIComponent(captainId)}&download=true&_t=${Date.now()}`;
      const filename = `bynkcom_contract_${captainId.slice(0, 8).toUpperCase()}.pdf`;
      await downloadPdfInWorker({ url: downloadUrl, filename, accessToken });
    } catch (err) {
      console.error('Error downloading contract PDF in background worker:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  // Lock background scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <div
        className="fixed inset-0 bg-transparent cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={cn(
          'relative z-10 flex flex-col w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl border border-[#14B8A6]/40',
          'bg-gradient-to-b from-[#0F172A] via-[#0B0F19] to-[#060913] shadow-2xl shadow-black/80',
          'animate-in zoom-in-95 duration-200 text-slate-100'
        )}
      >
        {/* Glowing Top Ambient Accent */}
        <div className="pointer-events-none absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#14F5D5] to-transparent shadow-[0_0_15px_rgba(20,245,213,0.8)]" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-[#161F30]/70 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#14B8A6]/15 border border-[#14B8A6]/30 text-[#14F5D5]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                {isArabic
                  ? 'وثيقة شروط وخصوصية اشتراك الكابتن المعلن'
                  : 'Advertiser Captain Subscription Terms & Privacy Document'}
              </h2>
              <p className="text-xs font-semibold text-[#14B8A6]">
                {isArabic
                  ? 'شبكة بينكم للإعلان الرقمي · النسخة النهائية الموحدة V1.0'
                  : 'Bynkcom Digital Ad Network · Unified Final Edition V1.0'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Document Text Content */}
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

        {/* Modal Footer / Acceptance Controls */}
        {(!readOnly || captainId) && (
          <div className="border-t border-white/10 px-6 py-4 bg-[#161F30]/90 backdrop-blur-xl flex flex-col gap-3">
            {!readOnly && (
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={hasAgreed}
                  onChange={(e) => setHasAgreed(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded-md border-white/20 bg-slate-800 text-[#14B8A6] focus:ring-[#14B8A6] focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-xs sm:text-sm font-semibold text-slate-200 group-hover:text-white transition">
                  {isArabic
                    ? 'أقر بأنني اطلعت ووافقت بصفتي كابتناً معلناً على كافة بنود وثيقة الشروط والخصوصية الموحدة لشبكة بينكم للإعلان الرقمي، وأطلب تفعيل خدمة التوثيق والأرشفة واستلام نسخة العقد بصيغة PDF.'
                    : 'I confirm that I have read and agreed as an Advertiser Captain to all clauses of Bynkcom Digital Ad Network’s Unified Terms & Privacy Document, and request digital notarization, archiving, and a PDF contract copy.'}
                </span>
              </label>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              {captainId && (
                <button
                  type="button"
                  onClick={() => void handleDownloadPdf()}
                  disabled={isDownloading}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:border-[#14B8A6] hover:bg-white/10 px-4 py-2.5 text-xs font-bold text-slate-200 hover:text-white transition cursor-pointer"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-[#14F5D5]" />
                      {isArabic ? 'جاري التنزيل...' : 'Downloading...'}
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 text-[#14F5D5]" />
                      {isArabic ? 'تحميل نسخة PDF' : 'Download PDF Copy'}
                    </>
                  )}
                </button>
              )}

              {!readOnly && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold py-2.5 px-4"
                >
                  {isArabic ? 'رجوع' : 'Back'}
                </Button>
              )}

              {!readOnly && onAccept && (
                <Button
                  type="button"
                  disabled={!hasAgreed}
                  onClick={() => {
                    if (hasAgreed) {
                      onAccept();
                      onClose();
                    }
                  }}
                  className={cn(
                    'rounded-xl text-xs sm:text-sm font-black py-2.5 px-6 transition-all',
                    hasAgreed
                      ? 'bg-[#14B8A6] hover:bg-[#2DD4BF] text-[#04140F] shadow-lg shadow-[#14B8A6]/25 cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  )}
                >
                  {isArabic ? 'موافق وتأكيد الاشتراك ⚡' : 'Agree & Confirm Subscription ⚡'}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

