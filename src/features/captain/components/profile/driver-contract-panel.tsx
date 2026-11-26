'use client';

import React, { useState, useEffect } from 'react';
import { FileCheck, Download, Printer, ShieldCheck, Eye, Loader2 } from 'lucide-react';
import { useDashboardLanguage } from '@/shared/hooks/use-dashboard-language';
import { Panel, Field, styles } from './driver-profile-shared';
import { UserPrivacyModal } from '@/shared/components/user-privacy-policy/user-privacy-modal';
import { downloadPdfInWorker } from '@/shared/utils/background-pdf-download';
import { getClientAccessToken } from '@/shared/services/supabase-auth-headers';

export function DriverContractPanel({
  state,
  user,
  language,
}: {
  state?: any;
  user?: any;
  language?: 'ar' | 'en';
}) {
  const { isArabic: storedIsArabic } = useDashboardLanguage();
  const isArabic = language ? language === 'ar' : storedIsArabic;
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [userId, setUserId] = useState<string>(
    user?.uid || user?.id || state?.profile?.id || ''
  );
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  useEffect(() => {
    const resolvedId = user?.uid || user?.id || state?.profile?.id;
    if (resolvedId) {
      setUserId(String(resolvedId));
      return;
    }

    let isMounted = true;
    import('@/lib/supabase-client').then(({ supabase }) => {
      supabase.auth.getUser().then(({ data }) => {
        if (isMounted && data?.user?.id) {
          setUserId(data.user.id);
        }
      });
    });

    return () => {
      isMounted = false;
    };
  }, [user, state?.profile?.id]);

  const handleDownloadPdfBackground = async () => {
    let targetId = userId;
    if (!targetId) {
      setIsDownloadingPdf(true);
      try {
        const { supabase } = await import('@/lib/supabase-client');
        const { data } = await supabase.auth.getUser();
        if (data?.user?.id) {
          targetId = data.user.id;
          setUserId(targetId);
        }
      } catch (e) {
        console.warn('Could not retrieve user session:', e);
      } finally {
        setIsDownloadingPdf(false);
      }
    }

    if (!targetId) {
      setShowPrivacyModal(true);
      return;
    }

    try {
      setIsDownloadingPdf(true);
      const accessToken = (await getClientAccessToken()) || undefined;
      const downloadUrl = `/api/rider/contract?userId=${encodeURIComponent(targetId)}&download=true&_t=${Date.now()}`;
      const filename = `Bynkcom_User_Privacy_${targetId.slice(0, 8).toUpperCase()}.pdf`;
      await downloadPdfInWorker({ url: downloadUrl, filename, accessToken });
    } catch (err) {
      console.warn('PDF Worker download error:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePreviewPdf = async () => {
    let targetId = userId;
    if (!targetId) {
      try {
        const { supabase } = await import('@/lib/supabase-client');
        const { data } = await supabase.auth.getUser();
        if (data?.user?.id) {
          targetId = data.user.id;
          setUserId(targetId);
        }
      } catch (e) {
        console.warn('Could not retrieve session:', e);
      }
    }

    if (!targetId) {
      setShowPrivacyModal(true);
      return;
    }

    const previewUrl = `/rider/contract?userId=${encodeURIComponent(targetId)}`;
    window.open(previewUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <Panel
        icon={<FileCheck className={styles.style431_62} />}
        title={isArabic ? 'سياسة الخصوصية المعتمدة (السجل الإلكتروني)' : 'Certified Privacy Policy (Electronic Log)'}
      >
        <div className="flex items-center justify-between gap-2 p-3.5 mb-2 rounded-2xl border border-teal-500/20 bg-teal-950/20">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-[#14F5D5] shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-bold text-white">
                {isArabic
                  ? 'سياسة خصوصية المستخدم والإعلانات (PDF)'
                  : 'User Privacy & Advertising Policy (PDF)'}
              </p>
              <p className="text-[11px] text-teal-300">
                {isArabic
                  ? 'شبكة بينكم للإعلان الرقمي · الإصدار V1.0-Unified (معتمدة وسارية)'
                  : 'Bynkcom Ad-Tech Network · Version V1.0-Unified (Active)'}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black bg-[#14B8A6]/20 text-[#14F5D5] border border-[#14B8A6]/30">
            {isArabic ? 'موثقة بالسجل' : 'Verified in Log'}
          </span>
        </div>

        <Field
          label={isArabic ? 'الصفة القانونية' : 'Legal Capacity'}
          value={isArabic ? 'مستخدم ومُعلن معتمد (خصوصية وأمان نسيجي)' : 'Verified User & Advertiser (Edge Privacy)'}
        />
        <Field
          label={isArabic ? 'المرجع القانوني' : 'Legal Reference'}
          value={
            isArabic
              ? 'قانون المعاملات الإلكترونية وقانون حماية البيانات الشخصية'
              : 'Electronic Transactions Law & Personal Data Protection Law'
          }
        />

        {/* The 3 Official Action Buttons */}
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
                {isArabic ? 'جاري التنزيل...' : 'Downloading...'}
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                {isArabic ? 'تحميل PDF' : 'Download PDF'}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => void handlePreviewPdf()}
            className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 py-2.5 px-3 text-xs font-bold text-slate-200 hover:text-white transition-all cursor-pointer text-center"
          >
            <Printer className="h-4 w-4 text-slate-300" />
            {isArabic ? 'معاينة وطباعة' : 'Preview & Print'}
          </button>

          <button
            type="button"
            onClick={() => setShowPrivacyModal(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-800/60 hover:bg-slate-800 py-2.5 px-3.5 text-xs font-bold text-teal-300 hover:text-white transition-all cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5 text-[#14F5D5]" />
            {isArabic ? 'نص سياسة الخصوصية' : 'View Privacy Text'}
          </button>
        </div>
      </Panel>

      <UserPrivacyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        readOnly={true}
        userId={userId || user?.id || state?.profile?.id}
        isArabic={isArabic}
      />
    </>
  );
}
