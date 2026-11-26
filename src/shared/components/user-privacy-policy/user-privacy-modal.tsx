'use client';

import React, { useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { UserPrivacyArticles } from './user-privacy-articles';
import { UserPrivacyFooter } from './user-privacy-footer';
import { downloadPdfInWorker } from '@/shared/utils/background-pdf-download';
import { getClientAccessToken } from '@/shared/services/supabase-auth-headers';

export interface UserPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  isArabic?: boolean;
  readOnly?: boolean;
  onAccept?: () => void;
}

export function UserPrivacyModal({
  isOpen,
  onClose,
  userId = '',
  isArabic = true,
  readOnly = false,
  onAccept,
}: UserPrivacyModalProps) {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);

  if (!isOpen) return null;

  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      const accessToken = (await getClientAccessToken()) || undefined;
      const downloadUrl = `/api/privacy-policy/pdf?download=true&_t=${Date.now()}`;
      const filename = 'Bynkcom_Privacy_Policy.pdf';
      await downloadPdfInWorker({ url: downloadUrl, filename, accessToken });
    } catch (e) {
      console.warn('PDF download error:', e);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePreviewPdf = () => {
    window.open('/privacy-policy', '_blank', 'noopener,noreferrer');
  };

  const handleAcceptAndClose = () => {
    setHasAccepted(true);
    if (onAccept) onAccept();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-200"
      dir={isArabic ? 'rtl' : 'ltr'}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative flex flex-col h-[90vh] max-h-[850px] w-full max-w-3xl rounded-3xl border border-teal-500/30 bg-[#0B0F19] text-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-[#0B0F19]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-teal-500/30 bg-teal-500/10 text-[#14F5D5]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-black text-sm sm:text-base text-white">
                {isArabic
                  ? 'سياسة خصوصية المستخدم والإعلانات المركزية والمستقلة'
                  : 'User Privacy Policy & Central and Independent Advertising'}
              </h2>
              <p className="text-xs text-teal-300">
                {isArabic
                  ? 'شبكة بينكم للإعلان الرقمي · النسخة المعتمدة V2.6'
                  : 'Bynkcom Ad-Tech Network · Certified Version V2.6'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <UserPrivacyArticles isArabic={isArabic} />

        {/* Footer */}
        <UserPrivacyFooter
          isArabic={isArabic}
          readOnly={readOnly}
          hasAccepted={hasAccepted}
          onAcceptAndClose={handleAcceptAndClose}
          onClose={onClose}
          onDownloadPdf={handleDownloadPdf}
          onPreviewPdf={handlePreviewPdf}
          isDownloadingPdf={isDownloadingPdf}
        />
      </div>
    </div>
  );
}
