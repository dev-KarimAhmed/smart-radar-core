import React from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface UnifiedTermsFooterProps {
  isArabic: boolean;
  readOnly: boolean;
  captainId?: string;
  hasAgreed: boolean;
  setHasAgreed: (val: boolean) => void;
  isDownloading: boolean;
  handleDownloadPdf: () => void;
  onClose: () => void;
  onAccept?: () => void;
}

export function UnifiedTermsFooter({
  isArabic,
  readOnly,
  captainId,
  hasAgreed,
  setHasAgreed,
  isDownloading,
  handleDownloadPdf,
  onClose,
  onAccept,
}: UnifiedTermsFooterProps) {
  if (readOnly && !captainId) return null;

  return (
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
            onClick={handleDownloadPdf}
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
  );
}
