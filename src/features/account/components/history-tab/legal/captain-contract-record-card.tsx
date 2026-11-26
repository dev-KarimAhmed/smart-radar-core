'use client';

import React, { useState, useEffect } from 'react';
import { FileCheck, Download, Printer, ShieldCheck, Eye, Sparkles, Loader2 } from 'lucide-react';
import { getCaptainAdPackage } from '@/features/captain/services/captain-ads-package';
import { CaptainUnifiedTermsModal } from '@/shared/components/captain-unified-terms-modal';
import { downloadPdfInWorker } from '@/shared/utils/background-pdf-download';
import { getClientAccessToken } from '@/shared/services/supabase-auth-headers';

interface CaptainContractRecordCardProps {
  isArabic: boolean;
  captainId: string;
}

export function CaptainContractRecordCard({ isArabic, captainId }: CaptainContractRecordCardProps) {
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isPackageActive, setIsPackageActive] = useState(false);

  useEffect(() => {
    if (!captainId) return;
    const pkg = getCaptainAdPackage(captainId);
    const hasActivated = Boolean(pkg.status === 'ACTIVE' || pkg.status === 'EXPIRED' || pkg.hasActivatedBefore);
    setIsPackageActive(hasActivated);

    const handleUpdate = () => {
      const updated = getCaptainAdPackage(captainId);
      setIsPackageActive(Boolean(updated.status === 'ACTIVE' || updated.status === 'EXPIRED' || updated.hasActivatedBefore));
    };

    window.addEventListener('radar_captain_ad_package_updated', handleUpdate);
    return () => window.removeEventListener('radar_captain_ad_package_updated', handleUpdate);
  }, [captainId]);

  const handleDownloadPdf = async () => {
    if (!captainId) return;
    try {
      setIsDownloadingPdf(true);
      const accessToken = (await getClientAccessToken()) || undefined;
      const downloadUrl = `/api/captain/contract?captainId=${encodeURIComponent(captainId)}&download=true&_t=${Date.now()}`;
      const filename = `Bynkcom_Captain_Contract_${captainId.slice(0, 8).toUpperCase()}.pdf`;
      await downloadPdfInWorker({ url: downloadUrl, filename, accessToken });
    } catch (err) {
      console.warn('PDF download error:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePreviewPdf = () => {
    if (!captainId) return;
    const previewUrl = `/captain/contract?captainId=${encodeURIComponent(captainId)}`;
    window.open(previewUrl, '_blank', 'noopener,noreferrer');
  };

  const handleOpenPackageModal = () => {
    window.dispatchEvent(new CustomEvent('radar_open_package_modal'));
  };

  const serial = `BYNK-CAP-${(captainId || 'DOC').slice(0, 8).toUpperCase()}`;

  if (!isPackageActive) {
    return (
      <div className="rounded-2xl border border-teal-500/20 bg-teal-950/20 p-4 mb-4 text-start">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10 text-[#14F5D5]">
            <FileCheck className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <h4 className="text-xs sm:text-sm font-bold text-white">
              {isArabic ? 'وثيقة التأسيس والتعاقد وشروط اشتراك الكابتن المعلن' : 'Foundational Contract & Captain Subscription Terms'}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isArabic
                ? 'تصبح الوثيقة الرسمية المعتمدة متاحة هنا في السجل القانوني للتحميل والطباعة فور تفعيل الباقة التشغيلية الأولى في غرفة التحكم.'
                : 'The official certified agreement will become available here in the Legal Record for download and printing once the first operational package is activated.'}
            </p>
            <button
              type="button"
              onClick={handleOpenPackageModal}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-400 to-[#14F5D5] px-3.5 py-1.5 text-xs font-black text-slate-950 shadow-md shadow-teal-500/20 hover:brightness-105 active:scale-95 transition cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{isArabic ? 'تفعيل الباقة الآن' : 'Activate Package Now'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#14F5D5]/30 bg-[#0F172A]/90 p-4 sm:p-5 mb-4 shadow-xl text-start">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3 mb-3">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="h-5 w-5 text-[#14F5D5] shrink-0" />
          <div>
            <h4 className="text-xs sm:text-sm font-black text-white">
              {isArabic
                ? 'وثيقة التأسيس والتعاقد وشروط اشتراك الكابتن المعلن'
                : 'Foundational Agreement & Captain Advertiser Subscription Terms'}
            </h4>
            <p className="text-[11px] text-teal-300 font-mono">
              {isArabic ? 'رقم السجل الرقمي:' : 'Digital Serial:'} {serial}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black bg-[#14B8A6]/20 text-[#14F5D5] border border-[#14B8A6]/40">
          {isArabic ? 'وثيقة رسمية معتمدة بالسجل' : 'Certified Official Document'}
        </span>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed mb-4">
        {isArabic
          ? 'تم اعتماد وتوثيق صفتك كـ «كابتن معلن مستقل» بنجاح عند تفعيل الباقة. يمكنك تحميل نسختك الرسمية المعتمدة بصيغة PDF أو طباعتها في أي وقت.'
          : 'Your capacity as an "Independent Captain Advertiser" was certified upon package activation. You can download or print your official PDF copy at any time.'}
      </p>

      <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-white/5">
        <button
          type="button"
          onClick={() => void handleDownloadPdf()}
          disabled={isDownloadingPdf}
          className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 rounded-xl border border-[#14B8A6]/40 bg-[#14B8A6]/15 hover:bg-[#14B8A6]/25 py-2 px-3 text-xs font-black text-[#14F5D5] transition shadow-md shadow-teal-500/10 cursor-pointer"
        >
          {isDownloadingPdf ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {isArabic ? 'جاري التنزيل...' : 'Downloading...'}
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              {isArabic ? 'تحميل الوثيقة الرسمية (PDF)' : 'Download Official PDF'}
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handlePreviewPdf}
          className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 py-2 px-3 text-xs font-bold text-slate-200 hover:text-white transition cursor-pointer"
        >
          <Printer className="h-4 w-4 text-slate-300" />
          {isArabic ? 'معاينة وطباعة' : 'Preview & Print'}
        </button>

        <button
          type="button"
          onClick={() => setShowTermsModal(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-slate-800/60 hover:bg-slate-800 py-2 px-3 text-xs font-bold text-teal-300 hover:text-white transition cursor-pointer"
        >
          <Eye className="h-3.5 w-3.5 text-[#14F5D5]" />
          {isArabic ? 'قراءة نصوص الوثيقة' : 'Read Full Clauses'}
        </button>
      </div>

      <CaptainUnifiedTermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        readOnly={true}
        captainId={captainId}
        isArabic={isArabic}
      />
    </div>
  );
}
