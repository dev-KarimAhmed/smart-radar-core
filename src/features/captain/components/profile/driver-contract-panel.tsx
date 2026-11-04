'use client';

import React, { useState, useEffect } from 'react';
import { FileCheck, Download, Printer, ShieldCheck, Eye, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Panel, Field, styles } from './driver-profile-shared';
import { CaptainUnifiedTermsModal } from '@/shared/components/captain-unified-terms-modal';
import { Button } from '@/components/ui/button';

export function DriverContractPanel({ state, user }: { state?: any; user?: any }) {
  const t = useTranslations('captainProfile');
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [captainId, setCaptainId] = useState<string>(
    user?.uid || user?.id || state?.profile?.id || ''
  );
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Sync captain ID from user props or active Supabase session
  useEffect(() => {
    const resolvedId = user?.uid || user?.id || state?.profile?.id;
    if (resolvedId) {
      setCaptainId(String(resolvedId));
      return;
    }

    let isMounted = true;
    import('@/lib/supabase-client').then(({ supabase }) => {
      supabase.auth.getUser().then(({ data }) => {
        if (isMounted && data?.user?.id) {
          setCaptainId(data.user.id);
        }
      });
    });

    return () => {
      isMounted = false;
    };
  }, [user, state?.profile?.id]);

  /**
   * Background silent file download without opening any new browser tab.
   */
  const handleDownloadPdfBackground = async () => {
    let targetId = captainId;

    if (!targetId) {
      setIsDownloadingPdf(true);
      try {
        const { supabase } = await import('@/lib/supabase-client');
        const { data } = await supabase.auth.getUser();
        if (data?.user?.id) {
          targetId = data.user.id;
          setCaptainId(targetId);
        }
      } catch (e) {
        console.warn('Could not retrieve captain session:', e);
      } finally {
        setIsDownloadingPdf(false);
      }
    }

    if (!targetId) {
      setShowTermsModal(true);
      return;
    }

    try {
      setIsDownloadingPdf(true);
      const downloadUrl = `/api/captain/contract?captainId=${encodeURIComponent(targetId)}&download=true`;
      const res = await fetch(downloadUrl);
      if (!res.ok) throw new Error('فشل تحميل وثيقة العقد');

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `Bynkcom_Captain_Contract_${targetId.slice(0, 8).toUpperCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.warn('Background fetch download error, using silent iframe:', err);
      // Fallback: silent hidden iframe (avoids opening new tab)
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = `/api/captain/contract?captainId=${encodeURIComponent(targetId)}&download=true`;
      document.body.appendChild(iframe);
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 5000);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  /**
   * Preview in a new tab for printing and visual reading.
   */
  const handlePreviewPdf = async () => {
    let targetId = captainId;

    if (!targetId) {
      try {
        const { supabase } = await import('@/lib/supabase-client');
        const { data } = await supabase.auth.getUser();
        if (data?.user?.id) {
          targetId = data.user.id;
          setCaptainId(targetId);
        }
      } catch (e) {
        console.warn('Could not retrieve captain session:', e);
      }
    }

    if (!targetId) {
      setShowTermsModal(true);
      return;
    }

    const previewUrl = `/captain/contract?captainId=${encodeURIComponent(targetId)}`;
    window.open(previewUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <Panel
        icon={<FileCheck className={styles.style431_62} />}
        title="الوثائق والعقود المعتمدة (السجل الإلكتروني)"
      >
        <div className="flex items-center justify-between p-3.5 mb-2 rounded-2xl border border-teal-500/20 bg-teal-950/20">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-[#14F5D5] shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-bold text-white">
                عقد اشتراك الكابتن المعلن الموحد (PDF)
              </p>
              <p className="text-[11px] text-teal-300">
                شبكة بينكم للإعلان الرقمي · الإصدار V1.0 (معتمد وساري)
              </p>
            </div>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black bg-[#14B8A6]/20 text-[#14F5D5] border border-[#14B8A6]/30">
            موثق بالسجل
          </span>
        </div>

        <Field label="الصفة التعاقدية" value="كابتن معلن مستقل (صفر عمولة)" />
        <Field label="المرجع القانوني" value="المادة (5) - التخزين والأرشفة الإلكترونية المعتمدة" />

        {/* The 3 Official Action Buttons - Always Visible */}
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => void handleDownloadPdfBackground()}
            disabled={isDownloadingPdf}
            className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 rounded-xl border border-[#14B8A6]/40 bg-[#14B8A6]/15 hover:bg-[#14B8A6]/25 py-2.5 px-3 text-xs font-black text-[#14F5D5] transition-all shadow-lg shadow-teal-500/10 cursor-pointer text-center"
          >
            {isDownloadingPdf ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-[#14F5D5]" />
                جاري التنزيل...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                تحميل PDF
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => void handlePreviewPdf()}
            className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 py-2.5 px-3 text-xs font-bold text-slate-200 hover:text-white transition-all cursor-pointer text-center"
          >
            <Printer className="h-4 w-4 text-slate-300" />
            معاينة وطباعة
          </button>

          <button
            type="button"
            onClick={() => setShowTermsModal(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-800/60 hover:bg-slate-800 py-2.5 px-3.5 text-xs font-bold text-teal-300 hover:text-white transition-all cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5 text-[#14F5D5]" />
            نص الشروط الموحدة
          </button>
        </div>
      </Panel>

      <CaptainUnifiedTermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        readOnly={true}
        captainId={captainId}
        isArabic={true}
      />
    </>
  );
}
