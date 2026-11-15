'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { downloadPdfInWorker } from '@/shared/utils/background-pdf-download';
import { getClientAccessToken } from '@/shared/services/supabase-auth-headers';
import { UnifiedTermsArticles } from './unified-terms/unified-terms-articles';
import { UnifiedTermsFooter } from './unified-terms/unified-terms-footer';

export * from './unified-terms/unified-terms-articles';
export * from './unified-terms/unified-terms-footer';

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
        <UnifiedTermsArticles isArabic={isArabic} />

        {/* Modal Footer / Acceptance Controls */}
        <UnifiedTermsFooter
          isArabic={isArabic}
          readOnly={readOnly}
          captainId={captainId}
          hasAgreed={hasAgreed}
          setHasAgreed={setHasAgreed}
          isDownloading={isDownloading}
          handleDownloadPdf={() => void handleDownloadPdf()}
          onClose={onClose}
          onAccept={onAccept}
        />
      </div>
    </div>
  );
}
