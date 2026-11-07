'use client';

import React from 'react';
import { ExternalLink, ReceiptText, X } from 'lucide-react';
import type { CaptainReceiptItem } from './wallet-types';

interface ReceiptLightboxModalProps {
  previewReceipt: CaptainReceiptItem | null;
  onClose: () => void;
  language: 'ar' | 'en';
  t: (key: string) => string;
}

export function ReceiptLightboxModal({
  previewReceipt,
  onClose,
  language,
  t,
}: ReceiptLightboxModalProps) {
  if (!previewReceipt) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-[#070c18] px-5 py-3.5">
          <div className="flex items-center gap-2">
            <ReceiptText className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-black text-white">{t('previewReceiptImage')}</span>
            <span className="text-xs text-slate-400 font-mono">({previewReceipt.channel})</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            aria-label={t('closePreview')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body / Image */}
        <div className="relative flex max-h-[65vh] items-center justify-center overflow-auto bg-black/90 p-4">
          {previewReceipt.signedImageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={previewReceipt.signedImageUrl}
              alt="Receipt Preview"
              className="max-h-[60vh] w-auto rounded-xl object-contain shadow-lg"
            />
          ) : (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm">{language === 'ar' ? 'الصورة غير متوفرة' : 'Image unavailable'}</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-[#070c18] px-5 py-3.5 text-xs">
          <div className="font-mono font-bold text-slate-300">
            <span>{previewReceipt.amount.toFixed(2)} {previewReceipt.currencyAr}</span>
          </div>
          <div className="flex items-center gap-2">
            {previewReceipt.signedImageUrl && (
              <a
                href={previewReceipt.signedImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-bold text-slate-200 transition"
              >
                <ExternalLink className="h-3.5 w-3.5 text-cyan-400" />
                <span>{t('openOriginal')}</span>
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-1.5 font-bold text-white transition"
            >
              {t('closePreview')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
