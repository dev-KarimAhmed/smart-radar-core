'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileText, CheckCircle2, X, Download, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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
      const timestamp = Date.now();
      const downloadUrl = `/api/captain/contract?captainId=${encodeURIComponent(captainId)}&download=true&fresh=true&_t=${timestamp}`;
      const response = await fetch(downloadUrl, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('فشل جلب ملف العقد');
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const tempLink = document.createElement('a');
      tempLink.href = blobUrl;
      tempLink.download = `bynkcom_contract_${captainId}.pdf`;
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Error downloading contract PDF in background:', err);
      window.location.href = `/api/captain/contract?captainId=${encodeURIComponent(captainId)}&download=true&fresh=true&_t=${Date.now()}`;
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
                وثيقة شروط وخصوصية اشتراك الكابتن المعلن
              </h2>
              <p className="text-xs font-semibold text-[#14B8A6]">
                شبكة بينكم للإعلان الرقمي · النسخة النهائية الموحدة V1.0
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
              البند التأسيسي لشبكة بينكم للإعلان الرقمي:
            </p>
            تعد مركبة الكابتن وسيلة إعلانية مستقلة لبث المحتوى الإعلاني. وتقتصر شبكة بينكم على توفير البنية التقنية ومساحة الإعلان الرقمية، 
            ولا تقدم خدمات نقل أو توصيل، ولا تتقاضى أي عمولة أو نسبة (0%) من أجور المعاملات المستقلة.
          </div>

          <div>
            <h3 className="font-black text-white text-base mb-1 text-[#14F5D5]">
              المادة (1): الهوية التقنية واستقلال الكابتن المعلن
            </h3>
            <p>
              شبكة بينكم منصة إعلانية تفاعلية تعمل عبر موقع تقدمي (PWA). يزاول الكابتن نشاطه لحسابه الخاص وباستقلال مهني وإداري ومالي، 
              ولا ينشأ عن اشتراكه عقد عمل أو وكالة أو تبعية تشغيلية للشبكة، ويبقى مسؤولاً عن مشروعيته وتراخيصه.
            </p>
          </div>

          <div>
            <h3 className="font-black text-white text-base mb-1 text-[#14F5D5]">
              المادة (3): مؤشر السوق الاسترشادي (Market Index)
            </h3>
            <p>
              مؤشر السوق معلومة إحصائية استرشادية تستند إلى بيانات مجمعة ومجهلة الهوية لمساعدة الكابتن في اتخاذ قراراته التجارية، 
              ولا يعد سعراً ملزماً أو تسعيرة مفروضة، ولا تؤثر مخالفته بذاتها في ظهوره الإعلاني أو استحقاقاته.
            </p>
          </div>

          <div>
            <h3 className="font-black text-white text-base mb-1 text-[#14F5D5]">
              المادة (5): تسليم الوثيقة وحفظ نسخ PDF في الملف الشخصي
            </h3>
            <p>
              عند توثيق موافقة الكابتن على هذه الوثيقة، يُنشئ النظام آلياً نسخة رسمية معتمدة بصيغة PDF يثبت فيها رقم الإصدار وبصمة الختم الرقمي، 
              وتُرسل فوراً إلى بريده الإلكتروني وتُحفظ نسخة مطابقة في ملفه الشخصي داخل التطبيق للاطلاع والتحميل والطباعة في أي وقت.
            </p>
          </div>

          <div>
            <h3 className="font-black text-white text-base mb-1 text-[#14F5D5]">
              الباب الثاني: أذونات وموارد الجهاز والرتب الإعلانية الخمسة
            </h3>
            <p>
              يمنح الكابتن موافقة إلكترونية صريحة ومحددة على استخدام موارد الجهاز (GPS، الإنترنت، الشاشة، البطارية) بالقدر الضروري فقط لتقديم الخدمة الإعلانية.
              وتتدرج الرتب الإعلانية إلى 5 مستويات تأهيلية: (البرونزية التأسيسية، الفضية المتقدمة، الذهبية على مستوى اللواء، البلاتينية على مستوى المحافظة، والماسية على مستوى الدولة وبث الشاشات)، 
              بناءً على تقييمات المستخدمين الموثقة وقوائم المفضلة الفريدة.
            </p>
          </div>

          <div>
            <h3 className="font-black text-white text-base mb-1 text-[#14F5D5]">
              كتالوج الخدمات والإنهاء الفوري للتتبع (الخدمة 11)
            </h3>
            <p>
              تتيح خدمة مشاركة التتبع المباشر طمأنة الأقارب برابط فوري. ولا يتم بأي شكل من الأشكال حفظ أي مسار أو نقاط تتبع جغرافي دقيق في النظام بعد انتهاء الرحلة؛ إذ ينتهي التتبع كلياً وفوراً بمجرد إغلاق الرحلة.
            </p>
          </div>

          <div>
            <h3 className="font-black text-white text-base mb-1 text-[#14F5D5]">
              التدقيق الآلي بالذكاء الاصطناعي وإسقاط الأجل (72h Ledger)
            </h3>
            <p>
              تخضع المواد الإعلانية للتدقيق الآلي بالذكاء الاصطناعي لضمان المشروعية، كما تُمسح سجلات الرحلات دورياً كل 72 ساعة حتمية من السيرفر حمايةً لخصوصية المستخدمين.
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
                  أقر بأنني اطلعت ووافقت بصفتي كابتناً معلناً على كافة بنود وثيقة الشروط والخصوصية الموحدة لشبكة بينكم للإعلان الرقمي، وأطلب تفعيل خدمة التوثيق والأرشفة واستلام نسخة العقد بصيغة PDF.
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
                      جاري التنزيل...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 text-[#14F5D5]" />
                      تحميل نسخة PDF
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
                  رجوع
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
                  موافق وتأكيد الاشتراك ⚡
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

